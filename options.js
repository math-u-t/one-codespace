/**
 * 設定画面のロジック
 * ユーザー設定の管理とUI操作
 */

// storage.js から必要な関数をインポート
import {
  getSettings,
  saveSettings,
  exportSettings,
  importSettings
} from './storage.js';

// api.js から必要な関数をインポート
import {
  validateToken
} from './api.js';

let currentSettings = null;
let excludedRepos = [];

/**
 * 初期化
 */
document.addEventListener('DOMContentLoaded', async () => {
  // 設定を読み込み
  await loadSettings();

  // イベントリスナーを設定
  setupEventListeners();
});

/**
 * 設定を読み込み
 */
async function loadSettings() {
  try {
    currentSettings = await getSettings();

    // GitHub トークン
    document.getElementById('githubToken').value = currentSettings.githubToken || '';

    // 自動停止設定
    document.getElementById('autoStopEnabled').checked = currentSettings.autoStopEnabled;
    document.getElementById('maxCodespaces').value = currentSettings.maxCodespaces;
    document.getElementById('maxCodespacesValue').textContent = currentSettings.maxCodespaces;
    document.getElementById('autoStopMinutes').value = currentSettings.autoStopMinutes;
    document.getElementById('autoStopMinutesValue').textContent = `${currentSettings.autoStopMinutes} 分`;

    // 除外リポジトリ
    excludedRepos = currentSettings.excludedRepos || [];
    renderChips();

    // ダークモード
    document.getElementById('darkMode').checked = currentSettings.darkMode;
    applyDarkMode(currentSettings.darkMode);

  } catch (error) {
    console.error('設定の読み込みに失敗しました:', error);
    showSnackbar('設定の読み込みに失敗しました', 'error');
  }
}

/**
 * イベントリスナーを設定
 */
function setupEventListeners() {
  // トークンの表示/非表示切り替え
  document.getElementById('toggleTokenVisibility').addEventListener('click', toggleTokenVisibility);

  // トークン検証ボタン
  document.getElementById('validateTokenBtn').addEventListener('click', validateTokenHandler);

  // スライダーの値変更
  document.getElementById('maxCodespaces').addEventListener('input', (e) => {
    document.getElementById('maxCodespacesValue').textContent = e.target.value;
  });

  document.getElementById('autoStopMinutes').addEventListener('input', (e) => {
    document.getElementById('autoStopMinutesValue').textContent = `${e.target.value} 分`;
  });

  // 除外リポジトリの追加
  document.getElementById('addRepoBtn').addEventListener('click', addRepo);
  document.getElementById('repoInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addRepo();
    }
  });

  // ダークモード切り替え
  document.getElementById('darkMode').addEventListener('change', (e) => {
    applyDarkMode(e.target.checked);
  });

  // エクスポート
  document.getElementById('exportBtn').addEventListener('click', exportSettingsHandler);

  // インポート
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', importSettingsHandler);

  // 保存ボタン
  document.getElementById('saveBtn').addEventListener('click', saveSettingsHandler);
}

/**
 * トークンの表示/非表示を切り替え
 */
function toggleTokenVisibility() {
  const input = document.getElementById('githubToken');
  const icon = document.querySelector('#toggleTokenVisibility .material-icons');

  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    icon.textContent = 'visibility';
  }
}

/**
 * トークンを検証
 */
async function validateTokenHandler() {
  const token = document.getElementById('githubToken').value.trim();
  const statusDiv = document.getElementById('tokenStatus');
  const validateBtn = document.getElementById('validateTokenBtn');

  if (!token) {
    statusDiv.className = 'token-status invalid';
    statusDiv.innerHTML = '<span class="material-icons md-18">error</span> トークンを入力してください';
    statusDiv.classList.remove('hidden');
    return;
  }

  try {
    // ボタンを無効化
    validateBtn.disabled = true;
    validateBtn.innerHTML = '<div class="spinner"></div> 検証中...';

    // トークンを検証
    const result = await validateToken(token);

    if (result.valid) {
      statusDiv.className = 'token-status valid';

      if (result.hasCodespaceScope) {
        statusDiv.innerHTML = `
          <span class="material-icons md-18">check_circle</span>
          トークンは有効です（スコープ: ${result.scopes.join(', ')}）
        `;
      } else {
        statusDiv.className = 'token-status invalid';
        statusDiv.innerHTML = `
          <span class="material-icons md-18">warning</span>
          トークンは有効ですが、codespace スコープがありません
        `;
      }
    } else {
      statusDiv.className = 'token-status invalid';
      statusDiv.innerHTML = `
        <span class="material-icons md-18">error</span>
        ${result.error}
      `;
    }

    statusDiv.classList.remove('hidden');

  } catch (error) {
    console.error('トークンの検証に失敗しました:', error);
    statusDiv.className = 'token-status invalid';
    statusDiv.innerHTML = `
      <span class="material-icons md-18">error</span>
      検証に失敗しました: ${error.message}
    `;
    statusDiv.classList.remove('hidden');

  } finally {
    // ボタンを再度有効化
    validateBtn.disabled = false;
    validateBtn.innerHTML = '<span class="material-icons md-18">check_circle</span> トークンを検証';
  }
}

/**
 * 除外リポジトリを追加
 */
function addRepo() {
  const input = document.getElementById('repoInput');
  const repo = input.value.trim();

  if (!repo) return;

  // 既に追加されているかチェック
  if (excludedRepos.includes(repo)) {
    showSnackbar('このリポジトリは既に追加されています', 'error');
    return;
  }

  // リポジトリ名の形式を簡単にチェック
  if (!repo.includes('/')) {
    showSnackbar('リポジトリ名は "owner/repository" 形式で入力してください', 'error');
    return;
  }

  excludedRepos.push(repo);
  renderChips();

  // 入力をクリア
  input.value = '';
}

/**
 * 除外リポジトリを削除
 * @param {string} repo - リポジトリ名
 */
function removeRepo(repo) {
  excludedRepos = excludedRepos.filter(r => r !== repo);
  renderChips();
}

/**
 * チップを描画
 */
function renderChips() {
  const container = document.getElementById('chipsDisplay');
  container.innerHTML = '';

  if (excludedRepos.length === 0) {
    container.innerHTML = '<span class="text-muted" style="font-size: var(--font-size-sm);">除外リポジトリなし</span>';
    return;
  }

  excludedRepos.forEach(repo => {
    const chip = document.createElement('div');
    chip.className = 'chip';
    chip.innerHTML = `
      ${repo}
      <span class="material-icons md-18 remove-icon" data-repo="${repo}">close</span>
    `;

    // 削除アイコンのイベントリスナー
    chip.querySelector('.remove-icon').addEventListener('click', () => {
      removeRepo(repo);
    });

    container.appendChild(chip);
  });
}

/**
 * ダークモードを適用
 * @param {boolean} enabled - ダークモード有効
 */
function applyDarkMode(enabled) {
  if (enabled) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
}

/**
 * 設定を保存
 */
async function saveSettingsHandler() {
  try {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<div class="spinner"></div> 保存中...';

    // 設定を取得
    const settings = {
      githubToken: document.getElementById('githubToken').value.trim(),
      autoStopEnabled: document.getElementById('autoStopEnabled').checked,
      maxCodespaces: parseInt(document.getElementById('maxCodespaces').value),
      autoStopMinutes: parseInt(document.getElementById('autoStopMinutes').value),
      excludedRepos: excludedRepos,
      darkMode: document.getElementById('darkMode').checked,
      language: currentSettings.language || 'ja'
    };

    // 保存
    const success = await saveSettings(settings);

    if (success) {
      currentSettings = settings;
      showSnackbar('設定を保存しました', 'success');
    } else {
      showSnackbar('設定の保存に失敗しました', 'error');
    }

  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    showSnackbar('設定の保存に失敗しました', 'error');

  } finally {
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<span class="material-icons md-18">save</span> 保存';
  }
}

/**
 * 設定をエクスポート
 */
async function exportSettingsHandler() {
  try {
    const data = await exportSettings();

    // JSON ファイルとしてダウンロード
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `one-codespace-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showSnackbar('設定をエクスポートしました', 'success');

  } catch (error) {
    console.error('設定のエクスポートに失敗しました:', error);
    showSnackbar('設定のエクスポートに失敗しました', 'error');
  }
}

/**
 * 設定をインポート
 */
async function importSettingsHandler(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // 設定をインポート
    const success = await importSettings(data);

    if (success) {
      // UI を更新
      await loadSettings();
      showSnackbar('設定をインポートしました', 'success');
    } else {
      showSnackbar('設定のインポートに失敗しました', 'error');
    }

  } catch (error) {
    console.error('設定のインポートに失敗しました:', error);
    showSnackbar('設定のインポートに失敗しました（無効なファイル形式）', 'error');

  } finally {
    // ファイル入力をリセット
    event.target.value = '';
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
