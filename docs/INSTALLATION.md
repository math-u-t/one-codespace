# インストールガイド

One Codespace を Chrome にインストールする手順を説明します。

## 前提条件

- Google Chrome（最新版推奨）
- GitHub アカウント
- GitHub Personal Access Token（インストール後に取得可能）

## インストール手順

### ステップ 1: プロジェクトの入手

#### オプション A: Git でクローン

```bash
git clone https://github.com/your-username/one-codespace.git
cd one-codespace
```

#### オプション B: ZIP ファイルでダウンロード

1. GitHub リポジトリページで「Code」ボタンをクリック
2. 「Download ZIP」を選択
3. ダウンロードした ZIP ファイルを解凍
4. 解凍したフォルダを適切な場所に配置

### ステップ 2: Chrome 拡張機能として読み込む

1. **Chrome を開く**

2. **拡張機能管理ページを開く**
   - アドレスバーに `chrome://extensions/` と入力
   - または、メニュー（⋮）→「拡張機能」→「拡張機能を管理」

3. **デベロッパーモードを有効化**
   - ページ右上の「デベロッパーモード」トグルをONにする

4. **拡張機能を読み込む**
   - 「パッケージ化されていない拡張機能を読み込む」をクリック
   - プロジェクトフォルダ（`one-codespace`）を選択
   - 「フォルダの選択」をクリック

5. **インストール完了**
   - 拡張機能リストに「One Codespace」が表示されます
   - ツールバーにアイコンが表示されます（アイコン設定後）

### ステップ 3: アイコンのセットアップ（オプション）

拡張機能は動作しますが、アイコンを設定すると見栄えが良くなります。

#### 3.1 アイコンファイルの準備

詳細は [icons/README.md](../icons/README.md) を参照してください。

必要なアイコンサイズ：
- `icon16.png` (16×16 px)
- `icon48.png` (48×48 px)
- `icon128.png` (128×128 px)

#### 3.2 アイコンファイルの配置

```
one-codespace/
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

#### 3.3 manifest.json の更新

`manifest.json` ファイルを開き、以下のセクションを追加/更新：

```json
{
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup.html",
    "default_title": "One Codespace",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  }
}
```

#### 3.4 拡張機能を再読み込み

1. `chrome://extensions/` を開く
2. One Codespace の「再読み込み」ボタン（🔄）をクリック
3. ツールバーにアイコンが表示されます

### ステップ 4: 初期設定

#### 4.1 GitHub Personal Access Token の取得

詳細は [API.md](API.md) を参照してください。

1. GitHub にログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. 「Generate new token (classic)」をクリック
4. トークンに名前を付ける（例: "One Codespace"）
5. `codespace` スコープを選択
6. 「Generate token」をクリック
7. **生成されたトークンをコピー**（再表示できないため注意）

#### 4.2 拡張機能の設定

1. **設定画面を開く**
   - ツールバーの One Codespace アイコンをクリック
   - 設定アイコン（⚙️）をクリック
   - または、右クリック → 「オプション」

2. **GitHub トークンを入力**
   - 「GitHub Personal Access Token」フィールドにトークンを貼り付け
   - 「トークンを検証」ボタンをクリックして有効性を確認

3. **自動停止設定を調整**（オプション）
   - 最大同時起動 Codespace 数（デフォルト: 1）
   - 自動停止までの時間（デフォルト: 30分）
   - 除外リポジトリの追加（必要に応じて）

4. **保存**
   - 「保存」ボタンをクリック
   - 成功メッセージが表示されます

### ステップ 5: 動作確認

1. **ポップアップを開く**
   - ツールバーの One Codespace アイコンをクリック

2. **Codespace リストを確認**
   - アクティブな Codespace が表示されます
   - ステータスが「接続中」になっていることを確認

3. **自動停止をテスト**（オプション）
   - GitHub で新しい Codespace を起動
   - 5分後に定期チェックが実行されます
   - 通知が表示されることを確認

## トラブルシューティング

### 拡張機能が表示されない

**原因**: デベロッパーモードが無効になっている

**解決策**:
1. `chrome://extensions/` を開く
2. 「デベロッパーモード」をONにする
3. ページを再読み込み

### アイコンが表示されない

**原因**: アイコンファイルが配置されていない、またはパスが間違っている

**解決策**:
1. `icons/` ディレクトリにアイコンファイルがあることを確認
2. ファイル名が正しいことを確認（`icon16.png`, `icon48.png`, `icon128.png`）
3. `manifest.json` のパスが正しいことを確認
4. 拡張機能を再読み込み

### エラー: "Manifest file is missing or unreadable"

**原因**: `manifest.json` の形式が不正

**解決策**:
1. `manifest.json` を JSON バリデーターで確認
2. 余分なカンマや括弧がないか確認
3. ファイルの文字コードが UTF-8 であることを確認

### Codespace が表示されない

**原因**: GitHub トークンが設定されていない、または無効

**解決策**:
1. 設定画面でトークンを確認
2. 「トークンを検証」をクリック
3. エラーメッセージを確認して対処
4. 必要に応じてトークンを再生成

## アップデート手順

新しいバージョンへのアップデート方法：

### Git を使用している場合

```bash
cd one-codespace
git pull origin main
```

### ZIP でダウンロードした場合

1. 新しい ZIP ファイルをダウンロード
2. 既存のフォルダを上書き（設定は保持されます）

### 拡張機能の再読み込み

1. `chrome://extensions/` を開く
2. One Codespace の「再読み込み」ボタンをクリック

**注意**: 設定データは `chrome.storage` に保存されているため、拡張機能を再読み込みしても失われません。

## アンインストール

One Codespace をアンインストールする場合：

1. `chrome://extensions/` を開く
2. One Codespace の「削除」ボタンをクリック
3. 確認ダイアログで「削除」をクリック

**注意**: アンインストールすると、保存されている設定（GitHub トークンを含む）も削除されます。必要に応じて事前に設定をエクスポートしてください。

## セキュリティに関する注意事項

### GitHub Personal Access Token の保管

- トークンはブラウザのローカルストレージ（`chrome.storage.local`）に保存されます
- 外部サーバーには送信されません
- ブラウザを共有している場合は、他のユーザーもアクセスできる可能性があります

### 推奨事項

1. **専用トークンを使用**: One Codespace 専用のトークンを生成
2. **最小権限の原則**: `codespace` スコープのみを付与
3. **定期的な更新**: トークンを定期的に再生成
4. **共有しない**: トークンを他人と共有しない

## 次のステップ

インストールが完了したら：

1. [USAGE.md](USAGE.md) で基本的な使い方を学ぶ
2. [CONFIGURATION.md](CONFIGURATION.md) で詳細な設定を行う
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) で問題が発生した場合の対処法を確認

---

インストールに関する質問や問題がある場合は、[TROUBLESHOOTING.md](TROUBLESHOOTING.md) を参照するか、GitHub Issues で報告してください。
