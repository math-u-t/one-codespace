/**
 * バックグラウンド処理
 * Service Worker として動作し、Codespace の監視と自動管理を実行
 */

// storage.js から必要な関数をインポート
import {
  getSettings,
  getCodespaceLastAccess,
  updateCodespaceLastAccess,
  removeCodespaceAccess
} from './storage.js';

// api.js から必要な関数をインポート
import {
  getAllCodespaces,
  getActiveCodespaces,
  stopCodespace,
  filterCodespacesByRepo
} from './api.js';

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
