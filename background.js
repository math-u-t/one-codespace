/**
 * バックグラウンド処理
 * Service Worker として動作し、Codespace の監視と自動管理を実行
 */

// ==================== Storage Module ====================
// デフォルト設定
const DEFAULT_SETTINGS = {
  githubToken: '',
  autoStopEnabled: true,
  maxCodespaces: 1,
  autoStopMinutes: 30,
  excludedRepos: [],
  darkMode: false,
  language: 'ja' // 'ja' or 'en'
};

/**
 * 設定を取得
 * @returns {Promise<Object>} 設定オブジェクト
 */
async function getSettings() {
  try {
    const result = await chrome.storage.local.get('settings');
    return { ...DEFAULT_SETTINGS, ...result.settings };
  } catch (error) {
    console.error('設定の取得に失敗しました:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Codespace の最終アクセス時刻を取得
 * @param {string} codespaceName - Codespace名
 * @returns {Promise<number>} タイムスタンプ（ミリ秒）
 */
async function getCodespaceLastAccess(codespaceName) {
  try {
    const key = `codespace_access_${codespaceName}`;
    const result = await chrome.storage.local.get(key);
    return result[key] || Date.now();
  } catch (error) {
    console.error('最終アクセス時刻の取得に失敗しました:', error);
    return Date.now();
  }
}

/**
 * Codespace の最終アクセス時刻を更新
 * @param {string} codespaceName - Codespace名
 * @param {number} timestamp - タイムスタンプ（ミリ秒）
 * @returns {Promise<boolean>} 成功した場合true
 */
async function updateCodespaceLastAccess(codespaceName, timestamp = Date.now()) {
  try {
    const key = `codespace_access_${codespaceName}`;
    await chrome.storage.local.set({ [key]: timestamp });
    return true;
  } catch (error) {
    console.error('最終アクセス時刻の更新に失敗しました:', error);
    return false;
  }
}

/**
 * Codespace の最終アクセス時刻を削除
 * @param {string} codespaceName - Codespace名
 * @returns {Promise<boolean>} 成功した場合true
 */
async function removeCodespaceAccess(codespaceName) {
  try {
    const key = `codespace_access_${codespaceName}`;
    await chrome.storage.local.remove(key);
    return true;
  } catch (error) {
    console.error('最終アクセス時刻の削除に失敗しました:', error);
    return false;
  }
}

// ==================== API Module ====================
const GITHUB_API_BASE_URL = 'https://api.github.com';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * API リクエストのエラークラス
 */
class APIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
  }
}

/**
 * スリープ
 * @param {number} ms - ミリ秒
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 指数バックオフでリトライを実行
 * @param {Function} fn - 実行する関数
 * @param {number} maxAttempts - 最大試行回数
 * @returns {Promise<any>} 関数の戻り値
 */
async function retryWithBackoff(fn, maxAttempts = MAX_RETRY_ATTEMPTS) {
  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // レート制限エラーの場合は特別な処理
      if (error.status === 429) {
        const retryAfter = error.response?.headers?.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`レート制限に達しました。${delay}ms 後にリトライします...`);
        await sleep(delay);
        continue;
      }

      // リトライ不可能なエラーの場合は即座に失敗
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        throw error;
      }

      // その他のエラーは指数バックオフでリトライ
      if (attempt < maxAttempts - 1) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt);
        console.warn(`APIリクエストが失敗しました。${delay}ms 後にリトライします... (試行 ${attempt + 1}/${maxAttempts})`);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/**
 * GitHub API にリクエストを送信
 * @param {string} endpoint - APIエンドポイント
 * @param {string} token - GitHub Personal Access Token
 * @param {Object} options - fetchオプション
 * @returns {Promise<Object>} レスポンスデータ
 */
async function makeAPIRequest(endpoint, token, options = {}) {
  const url = `${GITHUB_API_BASE_URL}${endpoint}`;

  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // レスポンスボディを取得
    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new APIError(
        responseData.message || `APIリクエストが失敗しました: ${response.status}`,
        response.status,
        { headers: response.headers, data: responseData }
      );
    }

    return responseData;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `ネットワークエラー: ${error.message}`,
      0,
      null
    );
  }
}

/**
 * すべての Codespace を取得
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Array>} Codespace の配列
 */
async function getAllCodespaces(token) {
  if (!token) {
    throw new APIError('GitHub Personal Access Token が設定されていません', 401, null);
  }

  return retryWithBackoff(async () => {
    const data = await makeAPIRequest('/user/codespaces', token);
    return data.codespaces || [];
  });
}

/**
 * Codespace を停止
 * @param {string} codespaceName - Codespace名
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Object>} 停止後の Codespace の詳細
 */
async function stopCodespace(codespaceName, token) {
  if (!token) {
    throw new APIError('GitHub Personal Access Token が設定されていません', 401, null);
  }

  return retryWithBackoff(async () => {
    return await makeAPIRequest(
      `/user/codespaces/${codespaceName}/stop`,
      token,
      { method: 'POST' }
    );
  });
}

/**
 * アクティブな Codespace を取得
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Array>} アクティブな Codespace の配列
 */
async function getActiveCodespaces(token) {
  const allCodespaces = await getAllCodespaces(token);
  return allCodespaces.filter(cs => cs.state === 'Available');
}

/**
 * リポジトリ名から Codespace をフィルタリング
 * @param {Array} codespaces - Codespace の配列
 * @param {Array} excludedRepos - 除外するリポジトリ名の配列
 * @returns {Array} フィルタリングされた Codespace の配列
 */
function filterCodespacesByRepo(codespaces, excludedRepos) {
  if (!excludedRepos || excludedRepos.length === 0) {
    return codespaces;
  }

  return codespaces.filter(cs => {
    const repoFullName = cs.repository?.full_name || '';
    return !excludedRepos.some(excluded => {
      // 完全一致または部分一致をサポート
      return repoFullName === excluded || repoFullName.includes(excluded);
    });
  });
}

// ==================== Background Script ====================

// 定期チェックの間隔（分）
const CHECK_INTERVAL_MINUTES = 5;
const ALARM_NAME = 'codespaceCheck';

// Codespace URL パターン
const CODESPACE_URL_PATTERN = /https:\/\/([^.]+)\.github\.dev/;

/**
 * 拡張機能インストール時の初期化
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('One Codespace 拡張機能がインストールされました');

  // 定期チェックのアラームを設定
  await setupAlarm();

  // デフォルト設定を保存
  const settings = await getSettings();
  if (!settings.githubToken) {
    await showNotification(
      'One Codespace',
      '設定画面で GitHub Personal Access Token を登録してください',
      'settings'
    );
  }
});

/**
 * アラームを設定
 */
async function setupAlarm() {
  // 既存のアラームをクリア
  await chrome.alarms.clear(ALARM_NAME);

  // 新しいアラームを作成
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL_MINUTES
  });

  console.log(`定期チェックを ${CHECK_INTERVAL_MINUTES} 分ごとに設定しました`);
}

/**
 * アラームのトリガー
 */
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('定期チェックを実行します...');
    await performCodespaceCheck();
  }
});

/**
 * タブのアクティブ化を監視
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    await handleTabActivity(tab);
  } catch (error) {
    console.error('タブアクティブ化の処理に失敗しました:', error);
  }
});

/**
 * タブの更新を監視
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    await handleTabActivity(tab);
  }
});

/**
 * タブのアクティビティを処理
 * @param {Object} tab - タブオブジェクト
 */
async function handleTabActivity(tab) {
  if (!tab.url) return;

  const match = tab.url.match(CODESPACE_URL_PATTERN);
  if (match) {
    const codespaceName = match[1];
    console.log(`Codespace がアクティブになりました: ${codespaceName}`);

    // 最終アクセス時刻を更新
    await updateCodespaceLastAccess(codespaceName);

    // 自動管理を実行
    await enforceMaxCodespaces();
  }
}

/**
 * Codespace の定期チェックを実行
 */
async function performCodespaceCheck() {
  try {
    const settings = await getSettings();

    if (!settings.githubToken) {
      console.log('GitHub トークンが設定されていません');
      return;
    }

    if (!settings.autoStopEnabled) {
      console.log('自動停止が無効になっています');
      return;
    }

    // アクティブな Codespace を取得
    const codespaces = await getActiveCodespaces(settings.githubToken);
    console.log(`アクティブな Codespace: ${codespaces.length} 個`);

    // 除外リポジトリでフィルタリング
    const filteredCodespaces = filterCodespacesByRepo(codespaces, settings.excludedRepos);

    // 自動停止の対象をチェック
    await checkAndStopInactiveCodespaces(filteredCodespaces, settings);

  } catch (error) {
    console.error('定期チェック中にエラーが発生しました:', error);

    if (error.status === 401) {
      await showNotification(
        'One Codespace エラー',
        'GitHub トークンが無効です。設定を確認してください。',
        'error'
      );
    }
  }
}

/**
 * 非アクティブな Codespace を自動停止
 * @param {Array} codespaces - Codespace の配列
 * @param {Object} settings - 設定
 */
async function checkAndStopInactiveCodespaces(codespaces, settings) {
  const now = Date.now();
  const inactiveThreshold = settings.autoStopMinutes * 60 * 1000; // ミリ秒に変換

  for (const codespace of codespaces) {
    const lastAccess = await getCodespaceLastAccess(codespace.name);
    const inactiveDuration = now - lastAccess;

    if (inactiveDuration > inactiveThreshold) {
      console.log(`Codespace ${codespace.name} が ${settings.autoStopMinutes} 分以上非アクティブです。停止します...`);

      try {
        await stopCodespace(codespace.name, settings.githubToken);

        await showNotification(
          'Codespace を自動停止しました',
          `${codespace.repository?.full_name || codespace.name} (${settings.autoStopMinutes}分非アクティブ)`,
          'stop'
        );

        // アクセス履歴を削除
        await removeCodespaceAccess(codespace.name);

      } catch (error) {
        console.error(`Codespace ${codespace.name} の停止に失敗しました:`, error);
      }
    }
  }
}

/**
 * 最大 Codespace 数を強制
 */
async function enforceMaxCodespaces() {
  try {
    const settings = await getSettings();

    if (!settings.githubToken || !settings.autoStopEnabled) {
      return;
    }

    // アクティブな Codespace を取得
    const codespaces = await getActiveCodespaces(settings.githubToken);

    // 除外リポジトリでフィルタリング
    const filteredCodespaces = filterCodespacesByRepo(codespaces, settings.excludedRepos);

    if (filteredCodespaces.length <= settings.maxCodespaces) {
      return; // 制限内
    }

    // 最終アクセス時刻を取得
    const codespacesWithAccess = await Promise.all(
      filteredCodespaces.map(async (cs) => ({
        ...cs,
        lastAccess: await getCodespaceLastAccess(cs.name)
      }))
    );

    // 最終アクセス時刻でソート（古い順）
    codespacesWithAccess.sort((a, b) => a.lastAccess - b.lastAccess);

    // 超過分を停止
    const excessCount = codespacesWithAccess.length - settings.maxCodespaces;
    const codespacesToStop = codespacesWithAccess.slice(0, excessCount);

    for (const codespace of codespacesToStop) {
      console.log(`最大数を超えているため、Codespace ${codespace.name} を停止します...`);

      try {
        await stopCodespace(codespace.name, settings.githubToken);

        await showNotification(
          'Codespace を自動停止しました',
          `${codespace.repository?.full_name || codespace.name} (最大数: ${settings.maxCodespaces})`,
          'stop'
        );

        // アクセス履歴を削除
        await removeCodespaceAccess(codespace.name);

      } catch (error) {
        console.error(`Codespace ${codespace.name} の停止に失敗しました:`, error);
      }
    }

  } catch (error) {
    console.error('最大 Codespace 数の強制に失敗しました:', error);
  }
}

/**
 * 通知を表示
 * @param {string} title - タイトル
 * @param {string} message - メッセージ
 * @param {string} iconType - アイコンタイプ
 */
async function showNotification(title, message, iconType = 'info') {
  try {
    await chrome.notifications.create({
      type: 'basic',
      title: title,
      message: message,
      iconUrl: getNotificationIcon(iconType),
      priority: 2
    });
  } catch (error) {
    console.error('通知の表示に失敗しました:', error);
  }
}

/**
 * 通知アイコンを取得
 * @param {string} iconType - アイコンタイプ
 * @returns {string} アイコンURL（Material Icons を使用できないため、デフォルトアイコンへのパスを返す）
 */
function getNotificationIcon(iconType) {
  // Chrome 拡張機能の通知では画像ファイルが必要
  // アイコンファイルが配置されている場合のパスを返す
  // 未配置の場合はデフォルトで空文字列
  const iconMap = {
    'info': 'icons/icon48.png',
    'error': 'icons/icon48.png',
    'stop': 'icons/icon48.png',
    'settings': 'icons/icon48.png'
  };

  return iconMap[iconType] || 'icons/icon48.png';
}

/**
 * メッセージリスナー（ポップアップや設定画面からの要求に応答）
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      if (request.action === 'getCodespaces') {
        const settings = await getSettings();
        const codespaces = await getAllCodespaces(settings.githubToken);
        sendResponse({ success: true, data: codespaces });

      } else if (request.action === 'stopCodespace') {
        const settings = await getSettings();
        await stopCodespace(request.codespaceName, settings.githubToken);
        await removeCodespaceAccess(request.codespaceName);

        await showNotification(
          'Codespace を停止しました',
          request.codespaceName,
          'stop'
        );

        sendResponse({ success: true });

      } else if (request.action === 'refreshCheck') {
        await performCodespaceCheck();
        sendResponse({ success: true });

      } else {
        sendResponse({ success: false, error: '不明なアクション' });
      }
    } catch (error) {
      console.error('メッセージ処理中にエラーが発生しました:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();

  // 非同期処理のため true を返す
  return true;
});
