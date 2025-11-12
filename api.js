/**
 * GitHub API 呼び出しモジュール
 * GitHub Codespaces API とのやり取りを管理
 */

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
 * スリープ
 * @param {number} ms - ミリ秒
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
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
 * 特定の Codespace の詳細を取得
 * @param {string} codespaceName - Codespace名
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Object>} Codespace の詳細
 */
async function getCodespace(codespaceName, token) {
  if (!token) {
    throw new APIError('GitHub Personal Access Token が設定されていません', 401, null);
  }

  return retryWithBackoff(async () => {
    return await makeAPIRequest(`/user/codespaces/${codespaceName}`, token);
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

/**
 * トークンの有効性を検証
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Object>} 検証結果 { valid: boolean, scopes: Array, error: string }
 */
async function validateToken(token) {
  if (!token) {
    return { valid: false, scopes: [], error: 'トークンが空です' };
  }

  try {
    const response = await fetch(`${GITHUB_API_BASE_URL}/user`, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });

    if (!response.ok) {
      return {
        valid: false,
        scopes: [],
        error: response.status === 401 ? '認証に失敗しました' : `エラー: ${response.status}`
      };
    }

    // スコープを取得
    const scopesHeader = response.headers.get('X-OAuth-Scopes') || '';
    const scopes = scopesHeader.split(',').map(s => s.trim()).filter(s => s);

    // codespace スコープの確認
    const hasCodespaceScope = scopes.includes('codespace');

    return {
      valid: true,
      scopes,
      hasCodespaceScope,
      error: hasCodespaceScope ? '' : 'codespace スコープが必要です'
    };
  } catch (error) {
    return {
      valid: false,
      scopes: [],
      error: `ネットワークエラー: ${error.message}`
    };
  }
}
