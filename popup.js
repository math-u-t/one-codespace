/**
 * ポップアップUIのロジック
 * Codespace の一覧表示と操作を管理
 */

// storage.js から必要な関数をインポート
import {
  getSettings,
  removeCodespaceAccess
} from './storage.js';

// api.js から必要な関数をインポート
import {
  getAllCodespaces,
  stopCodespace
} from './api.js';

let currentSettings = null;
let codespaces = [];

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
  // イベントリスナーを設定
  setupEventListeners();

  // ダークモードの適用
  await applyDarkMode();

  // Codespace を読み込み
  await loadCodespaces();
});

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
  // 更新ボタン
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadCodespaces();
  });

  // 設定ボタン
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // 再試行ボタン
  document.getElementById('retryBtn').addEventListener('click', async () => {
    await loadCodespaces();
  });
}

/**
 * ダークモードを適用
 */
async function applyDarkMode() {
  const settings = await getSettings();
  if (settings.darkMode) {
    document.body.classList.add('dark-mode');
  }
}

/**
 * Codespace を読み込み
 */
async function loadCodespaces() {
  try {
    // ローディング状態を表示
    showLoadingState();

    // 設定を取得
    currentSettings = await getSettings();

    if (!currentSettings.githubToken) {
      showError('GitHub Personal Access Token が設定されていません。設定画面で登録してください。');
      updateStatus('error', '未設定');
      return;
    }

    // Codespace を取得
    codespaces = await getAllCodespaces(currentSettings.githubToken);

    // アクティブな Codespace のみフィルタリング
    const activeCodespaces = codespaces.filter(cs => cs.state === 'Available');

    // UI を更新
    renderCodespaces(activeCodespaces);
    updateStatus('connected', `${activeCodespaces.length} 個のアクティブな Codespace`);

  } catch (error) {
    console.error('Codespace の読み込みに失敗しました:', error);

    let errorMessage = 'Codespace の読み込みに失敗しました';

    if (error.status === 401) {
      errorMessage = 'GitHub トークンが無効です。設定を確認してください。';
    } else if (error.status === 403) {
      errorMessage = 'アクセスが拒否されました。トークンのスコープを確認してください。';
    } else if (error.status === 0) {
      errorMessage = 'ネットワークエラーが発生しました。';
    }

    showError(errorMessage);
    updateStatus('error', 'エラー');
  }
}

/**
 * ローディング状態を表示
 */
function showLoadingState() {
  document.getElementById('loadingState').classList.remove('hidden');
  document.getElementById('errorState').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');

  // 既存のアイテムを削除
  const existingItems = document.querySelectorAll('.codespace-item');
  existingItems.forEach(item => item.remove());
}

/**
 * エラーを表示
 * @param {string} message - エラーメッセージ
 */
function showError(message) {
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('errorState').classList.remove('hidden');
  document.getElementById('errorMessage').textContent = message;
}

/**
 * Codespace を描画
 * @param {Array} codespaces - Codespace の配列
 */
function renderCodespaces(codespaces) {
  // ローディングとエラー状態を非表示
  document.getElementById('loadingState').classList.add('hidden');
  document.getElementById('errorState').classList.add('hidden');

  const listContainer = document.getElementById('codespaceList');

  // 既存のアイテムを削除
  const existingItems = document.querySelectorAll('.codespace-item');
  existingItems.forEach(item => item.remove());

  if (codespaces.length === 0) {
    document.getElementById('emptyState').classList.remove('hidden');
    document.getElementById('codespaceCount').textContent = '0 個の Codespace';
    return;
  }

  document.getElementById('emptyState').classList.add('hidden');
  document.getElementById('codespaceCount').textContent = `${codespaces.length} 個の Codespace`;

  // Codespace アイテムを作成
  codespaces.forEach(codespace => {
    const item = createCodespaceItem(codespace);
    listContainer.appendChild(item);
  });
}

/**
 * Codespace アイテムを作成
 * @param {Object} codespace - Codespace オブジェクト
 * @returns {HTMLElement} Codespace アイテム要素
 */
function createCodespaceItem(codespace) {
  const item = document.createElement('div');
  item.className = 'codespace-item';

  // 起動時間を計算
  const uptime = calculateUptime(codespace.created_at);

  // リポジトリ名
  const repoName = codespace.repository?.full_name || codespace.name;

  item.innerHTML = `
    <div class="codespace-info">
      <div class="codespace-name">
        <span class="material-icons md-18">code</span>
        ${codespace.display_name || codespace.name}
      </div>
      <div class="codespace-repo">${repoName}</div>
      <div class="codespace-meta">
        <div class="status status-active">
          <span class="material-icons md-18">play_arrow</span>
          アクティブ
        </div>
        <div class="codespace-uptime">
          <span class="material-icons md-18">schedule</span>
          ${uptime}
        </div>
      </div>
    </div>
    <div class="codespace-actions">
      <button class="btn btn-error btn-small stop-btn" data-name="${codespace.name}">
        <span class="material-icons md-18">stop</span>
        停止
      </button>
    </div>
  `;

  // 停止ボタンのイベントリスナー
  const stopBtn = item.querySelector('.stop-btn');
  stopBtn.addEventListener('click', async () => {
    await stopCodespaceHandler(codespace.name, stopBtn);
  });

  return item;
}

/**
 * 起動時間を計算
 * @param {string} createdAt - 作成日時
 * @returns {string} 起動時間の文字列
 */
function calculateUptime(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now - created;

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}日前`;
  } else if (diffHours > 0) {
    return `${diffHours}時間前`;
  } else if (diffMins > 0) {
    return `${diffMins}分前`;
  } else {
    return '1分未満';
  }
}

/**
 * Codespace を停止
 * @param {string} codespaceName - Codespace名
 * @param {HTMLElement} button - 停止ボタン要素
 */
async function stopCodespaceHandler(codespaceName, button) {
  try {
    // ボタンを無効化
    button.disabled = true;
    button.innerHTML = '<div class="spinner"></div>';

    // ローディングオーバーレイを表示
    document.getElementById('loadingOverlay').classList.add('active');

    // Codespace を停止
    await stopCodespace(codespaceName, currentSettings.githubToken);

    // アクセス履歴を削除
    await removeCodespaceAccess(codespaceName);

    // Codespace を再読み込み
    await loadCodespaces();

    // 成功通知
    showSnackbar('Codespace を停止しました', 'success');

  } catch (error) {
    console.error('Codespace の停止に失敗しました:', error);

    // エラー通知
    let errorMessage = 'Codespace の停止に失敗しました';

    if (error.status === 401) {
      errorMessage = 'GitHub トークンが無効です';
    } else if (error.status === 404) {
      errorMessage = 'Codespace が見つかりません';
    }

    showSnackbar(errorMessage, 'error');

    // ボタンを再度有効化
    button.disabled = false;
    button.innerHTML = '<span class="material-icons md-18">stop</span> 停止';

  } finally {
    // ローディングオーバーレイを非表示
    document.getElementById('loadingOverlay').classList.remove('active');
  }
}

/**
 * ステータスを更新
 * @param {string} status - ステータス（'connected' または 'error'）
 * @param {string} text - ステータステキスト
 */
function updateStatus(status, text) {
  const indicator = document.getElementById('statusIndicator');
  const statusText = document.getElementById('statusText');

  if (status === 'connected') {
    indicator.classList.remove('error');
    statusText.textContent = text;
  } else {
    indicator.classList.add('error');
    statusText.textContent = text;
  }
}

/**
 * スナックバー（トースト通知）を表示
 * @param {string} message - メッセージ
 * @param {string} type - タイプ（'success' または 'error'）
 */
function showSnackbar(message, type = 'info') {
  // 既存のスナックバーを削除
  const existingSnackbar = document.querySelector('.snackbar');
  if (existingSnackbar) {
    existingSnackbar.remove();
  }

  // 新しいスナックバーを作成
  const snackbar = document.createElement('div');
  snackbar.className = `snackbar ${type}`;
  snackbar.textContent = message;

  document.body.appendChild(snackbar);

  // 3秒後に自動的に削除
  setTimeout(() => {
    snackbar.remove();
  }, 3000);
}
