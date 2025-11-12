/**
 * ストレージ管理モジュール
 * Chrome Storage API を使用してデータを管理
 */

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
 * 設定を保存
 * @param {Object} settings - 保存する設定
 * @returns {Promise<boolean>} 成功した場合true
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.local.set({ settings });
    return true;
  } catch (error) {
    console.error('設定の保存に失敗しました:', error);
    return false;
  }
}

/**
 * GitHub Personal Access Token を取得
 * @returns {Promise<string>} トークン
 */
async function getGitHubToken() {
  try {
    const settings = await getSettings();
    return settings.githubToken || '';
  } catch (error) {
    console.error('トークンの取得に失敗しました:', error);
    return '';
  }
}

/**
 * GitHub Personal Access Token を保存
 * @param {string} token - トークン
 * @returns {Promise<boolean>} 成功した場合true
 */
async function saveGitHubToken(token) {
  try {
    const settings = await getSettings();
    settings.githubToken = token;
    return await saveSettings(settings);
  } catch (error) {
    console.error('トークンの保存に失敗しました:', error);
    return false;
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
 * すべての Codespace の最終アクセス時刻を取得
 * @returns {Promise<Object>} キーがCodespace名、値がタイムスタンプのオブジェクト
 */
async function getAllCodespaceAccess() {
  try {
    const allData = await chrome.storage.local.get(null);
    const accessData = {};

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('codespace_access_')) {
        const codespaceName = key.replace('codespace_access_', '');
        accessData[codespaceName] = value;
      }
    }

    return accessData;
  } catch (error) {
    console.error('すべての最終アクセス時刻の取得に失敗しました:', error);
    return {};
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

/**
 * 設定をエクスポート
 * @returns {Promise<Object>} エクスポートデータ
 */
async function exportSettings() {
  try {
    const settings = await getSettings();
    // トークンは除外する（セキュリティのため）
    const exportData = { ...settings };
    delete exportData.githubToken;
    return exportData;
  } catch (error) {
    console.error('設定のエクスポートに失敗しました:', error);
    return {};
  }
}

/**
 * 設定をインポート
 * @param {Object} settings - インポートする設定
 * @returns {Promise<boolean>} 成功した場合true
 */
async function importSettings(settings) {
  try {
    const currentSettings = await getSettings();
    // トークンは保持する
    const newSettings = {
      ...currentSettings,
      ...settings,
      githubToken: currentSettings.githubToken
    };
    return await saveSettings(newSettings);
  } catch (error) {
    console.error('設定のインポートに失敗しました:', error);
    return false;
  }
}

/**
 * すべてのデータをクリア（デバッグ用）
 * @returns {Promise<boolean>} 成功した場合true
 */
async function clearAllData() {
  try {
    await chrome.storage.local.clear();
    return true;
  } catch (error) {
    console.error('データのクリアに失敗しました:', error);
    return false;
  }
}
