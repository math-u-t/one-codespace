# 開発者向けドキュメント

One Codespace の開発に参加するための情報をまとめています。

## 目次

- [開発環境のセットアップ](#開発環境のセットアップ)
- [プロジェクト構成](#プロジェクト構成)
- [コーディング規約](#コーディング規約)
- [開発ワークフロー](#開発ワークフロー)
- [テスト](#テスト)
- [デバッグ](#デバッグ)
- [ビルドとリリース](#ビルドとリリース)
- [コントリビューションガイドライン](#コントリビューションガイドライン)

## 開発環境のセットアップ

### 必要なツール

- **Google Chrome**: 最新版
- **テキストエディタ**: VS Code、Sublime Text など
- **Git**: バージョン管理
- **GitHub アカウント**: コントリビューション用

### リポジトリのクローン

```bash
git clone https://github.com/your-username/one-codespace.git
cd one-codespace
```

### 拡張機能の読み込み

1. Chrome で `chrome://extensions/` を開く
2. 「デベロッパーモード」をON
3. 「パッケージ化されていない拡張機能を読み込む」
4. プロジェクトフォルダを選択

### 開発用トークンの設定

1. GitHub で開発用 Personal Access Token を生成
2. 拡張機能の設定画面でトークンを入力
3. テスト用のリポジトリで Codespace を作成

## プロジェクト構成

### ディレクトリ構造

```
one-codespace/
├── manifest.json          # 拡張機能のマニフェスト
├── popup.html            # ポップアップUI
├── popup.js              # ポップアップのロジック
├── options.html          # 設定画面
├── options.js            # 設定画面のロジック
├── background.js         # バックグラウンド処理（Service Worker）
├── api.js                # GitHub API モジュール
├── storage.js            # ストレージ管理モジュール
├── styles.css            # 共通スタイル
├── icons/                # アイコンディレクトリ
│   └── README.md         # アイコン設定手順
└── docs/                 # ドキュメント
    ├── README.md
    ├── INSTALLATION.md
    ├── USAGE.md
    ├── CONFIGURATION.md
    ├── API.md
    ├── TROUBLESHOOTING.md
    └── DEVELOPMENT.md    # このファイル
```

### ファイルの役割

#### manifest.json
Chrome 拡張機能の設定ファイル。

- 名前、バージョン、説明
- 必要な権限
- バックグラウンドスクリプト
- アイコン、ポップアップ設定

#### popup.html / popup.js
拡張機能のメインUI。

- Codespace の一覧表示
- 手動停止ボタン
- 設定画面へのリンク

#### options.html / options.js
設定画面。

- GitHub トークンの設定
- 自動停止設定
- 除外リポジトリ管理
- インポート/エクスポート

#### background.js
Service Worker として動作するバックグラウンドプロセス。

- 定期チェック（5分ごと）
- タブのアクティビティ監視
- 自動停止ロジック
- 通知送信

#### api.js
GitHub API との通信を管理。

- Codespace の取得
- Codespace の停止
- トークンの検証
- エラーハンドリング
- リトライロジック

#### storage.js
Chrome Storage API を使用したデータ管理。

- 設定の保存/読み込み
- Codespace の最終アクセス時刻管理
- インポート/エクスポート

#### styles.css
Material Design に基づく共通スタイル。

- CSS 変数（カラー、スペーシング）
- ダークモード対応
- レスポンシブデザイン

## コーディング規約

### JavaScript

#### 命名規則

```javascript
// 変数・関数: キャメルケース
const codespaceList = [];
function getCodespaces() {}

// 定数: UPPER_SNAKE_CASE
const MAX_RETRY_ATTEMPTS = 3;
const GITHUB_API_BASE_URL = 'https://api.github.com';

// クラス: パスカルケース
class APIError extends Error {}
```

#### コメント

すべてのコメントは**日本語**で記述：

```javascript
/**
 * Codespace を停止
 * @param {string} codespaceName - Codespace名
 * @param {string} token - GitHub Personal Access Token
 * @returns {Promise<Object>} 停止後の Codespace の詳細
 */
async function stopCodespace(codespaceName, token) {
  // トークンの検証
  if (!token) {
    throw new APIError('トークンが設定されていません', 401, null);
  }

  // API リクエスト
  return await makeAPIRequest(/* ... */);
}
```

#### 関数

- JSDoc スタイルのコメントを必ず記述
- 引数と戻り値の型を明記
- エラーハンドリングを適切に行う

```javascript
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
```

#### 非同期処理

- `async/await` を使用（Promise チェーンは避ける）
- エラーハンドリングは `try/catch` で行う

```javascript
// Good
async function loadData() {
  try {
    const data = await fetchData();
    return processData(data);
  } catch (error) {
    console.error('データの読み込みに失敗:', error);
    throw error;
  }
}

// Bad
function loadData() {
  return fetchData()
    .then(data => processData(data))
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

### HTML

- セマンティックなタグを使用
- アクセシビリティを考慮（aria-label など）
- Material Icons を使用

```html
<!-- Good -->
<button class="btn btn-primary" aria-label="更新">
  <span class="material-icons">refresh</span>
  更新
</button>

<!-- Bad -->
<div onclick="refresh()">更新</div>
```

### CSS

- Material Design ガイドラインに従う
- CSS 変数を活用
- ダークモード対応

```css
/* Good: CSS 変数を使用 */
.button {
  background-color: var(--primary-color);
  padding: var(--spacing-md);
}

/* Bad: ハードコーディング */
.button {
  background-color: #1976d2;
  padding: 16px;
}
```

### Git コミットメッセージ

日本語または英語で記述：

```bash
# 機能追加
git commit -m "feat: 自動停止機能を追加"
git commit -m "feat: Add auto-stop functionality"

# バグ修正
git commit -m "fix: トークン検証のバグを修正"
git commit -m "fix: Fix token validation bug"

# ドキュメント
git commit -m "docs: インストールガイドを更新"
git commit -m "docs: Update installation guide"

# スタイル
git commit -m "style: ダークモードのカラーを調整"
git commit -m "style: Adjust dark mode colors"
```

プレフィックス：
- `feat`: 新機能
- `fix`: バグ修正
- `docs`: ドキュメント
- `style`: スタイル変更
- `refactor`: リファクタリング
- `test`: テスト追加
- `chore`: その他の変更

## 開発ワークフロー

### 1. Issue の作成

新機能やバグ修正を始める前に Issue を作成：

```markdown
## 概要
[機能の説明]

## 動機
[なぜこの機能が必要か]

## 提案
[実装方法の提案]

## チェックリスト
- [ ] 実装
- [ ] テスト
- [ ] ドキュメント更新
```

### 2. ブランチの作成

```bash
# 機能追加
git checkout -b feature/auto-stop-enhancement

# バグ修正
git checkout -b fix/token-validation-bug

# ドキュメント
git checkout -b docs/update-readme
```

### 3. 開発

1. コードを書く
2. 拡張機能を再読み込み（`chrome://extensions/`）
3. 動作確認
4. デバッグ

### 4. コミット

```bash
git add .
git commit -m "feat: 自動停止時間の設定範囲を拡大"
```

### 5. プッシュ

```bash
git push origin feature/auto-stop-enhancement
```

### 6. Pull Request

GitHub で Pull Request を作成：

```markdown
## 変更内容
[変更の説明]

## 関連 Issue
Closes #123

## テスト
- [x] ローカルでテスト済み
- [x] 複数のブラウザでテスト
- [x] ドキュメント更新

## スクリーンショット
[必要に応じて画像を添付]
```

## テスト

### 手動テスト

#### ポップアップのテスト

1. Codespace を複数起動
2. ポップアップを開く
3. リストが正しく表示されるか確認
4. 停止ボタンが機能するか確認

#### 自動停止のテスト

1. 設定で自動停止時間を5分に設定
2. Codespace を開く
3. タブを切り替える
4. 5分後に定期チェックが実行されるか確認
5. 通知が表示されるか確認

#### 設定のテスト

1. 各設定項目を変更
2. 保存ボタンをクリック
3. ポップアップを閉じて再度開く
4. 設定が保持されているか確認

### デバッグログ

開発中はコンソールログを活用：

```javascript
console.log('Codespace を取得中...');
console.log('取得した Codespace:', codespaces);
console.error('エラーが発生しました:', error);
```

本番環境では削除または条件付きに：

```javascript
if (DEBUG) {
  console.log('デバッグ情報:', data);
}
```

### エラーハンドリングのテスト

1. 無効なトークンを設定
2. ネットワークを切断
3. GitHub API のレート制限に達する
4. エラーメッセージが適切に表示されるか確認

## デバッグ

### 開発者ツールの使用

#### ポップアップ

1. ポップアップを右クリック → 「検証」
2. Console タブでログを確認
3. Sources タブでブレークポイントを設定

#### バックグラウンドページ

1. `chrome://extensions/` を開く
2. 「Service Worker を検証」をクリック
3. Console タブでログを確認

#### 設定画面

1. 設定画面を右クリック → 「検証」
2. Console タブでログを確認

### よくあるデバッグシナリオ

#### Codespace が表示されない

1. Network タブで API リクエストを確認
2. ステータスコード、レスポンスを確認
3. トークンが正しく送信されているか確認

#### 自動停止が動作しない

1. バックグラウンドページのコンソールを確認
2. 定期チェックのログを確認
3. 最終アクセス時刻を確認（ストレージ）

```javascript
chrome.storage.local.get(null, (data) => {
  console.log('すべてのストレージデータ:', data);
});
```

#### UI が崩れている

1. Elements タブでHTML構造を確認
2. Computed タブでスタイルを確認
3. Console でCSSエラーを確認

## ビルドとリリース

### バージョンの更新

`manifest.json` のバージョンを更新：

```json
{
  "version": "1.1.0"
}
```

セマンティックバージョニング：
- **メジャー**: 後方互換性のない変更（例: 2.0.0）
- **マイナー**: 後方互換性のある機能追加（例: 1.1.0）
- **パッチ**: バグ修正（例: 1.0.1）

### リリースノートの作成

```markdown
## Version 1.1.0 (2025-12-01)

### 新機能
- 自動停止時間の設定範囲を拡大（5-120分）
- 除外リポジトリの部分一致サポート

### 改善
- ポップアップの表示速度を改善
- エラーメッセージをより詳細に

### バグ修正
- トークン検証時のエラーハンドリングを修正
- ダークモードの色の調整
```

### Chrome Web Store への公開

（将来的に対応予定）

1. Chrome Developer Dashboard にログイン
2. 新しいアイテムをアップロード
3. スクリーンショット、説明を追加
4. レビューを待つ

## コントリビューションガイドライン

### プルリクエストの基準

- [ ] コーディング規約に従っている
- [ ] 適切なコメントが記述されている
- [ ] ローカルでテスト済み
- [ ] 関連するドキュメントを更新
- [ ] コミットメッセージが明確

### レビュープロセス

1. Pull Request を作成
2. 自動チェック（将来的に導入）
3. コードレビュー
4. フィードバックへの対応
5. マージ

### コミュニティガイドライン

- 敬意を持って対応する
- 建設的なフィードバックを提供する
- 初心者にも優しく
- 多様性を尊重する

## 今後の開発計画

### 短期（1-3ヶ月）

- [ ] ユニットテストの追加
- [ ] 自動化されたテスト環境
- [ ] パフォーマンスの最適化
- [ ] バグ修正

### 中期（3-6ヶ月）

- [ ] Chrome Web Store への公開
- [ ] 多言語対応（英語優先）
- [ ] より詳細な統計情報
- [ ] カスタマイズ可能な通知

### 長期（6ヶ月以上）

- [ ] Firefox 対応
- [ ] Edge 対応
- [ ] 高度なフィルタリング機能
- [ ] チーム向け機能

## リソース

### 公式ドキュメント

- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)
- [GitHub REST API](https://docs.github.com/ja/rest)
- [Material Design](https://material.io/design)

### 参考資料

- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome Alarms API](https://developer.chrome.com/docs/extensions/reference/alarms/)

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

詳細は [LICENSE](../LICENSE) ファイルを参照してください。

---

開発に関する質問は、GitHub Discussions または Issues で受け付けています。
