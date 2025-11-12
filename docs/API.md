# GitHub API 設定ガイド

One Codespace で使用する GitHub Personal Access Token の取得と設定方法を説明します。

## GitHub Personal Access Token とは

Personal Access Token（PAT）は、GitHub API にアクセスするための認証情報です。パスワードの代わりに使用され、より安全で細かい権限制御が可能です。

### なぜトークンが必要か

One Codespace は以下の操作を行うため、GitHub API へのアクセスが必要です：

- Codespace の一覧取得
- Codespace の詳細情報取得
- Codespace の停止

これらの操作には、適切な権限を持つトークンが必要です。

## トークンの取得方法

### ステップ 1: GitHub にログイン

1. [GitHub.com](https://github.com) にアクセス
2. アカウントにログイン

### ステップ 2: Settings を開く

1. 画面右上のプロフィールアイコンをクリック
2. ドロップダウンメニューから「Settings」を選択

### ステップ 3: Developer settings を開く

1. 左側のサイドバーを一番下までスクロール
2. 「Developer settings」をクリック

### ステップ 4: Personal access tokens を開く

1. 「Personal access tokens」を展開
2. 「Tokens (classic)」をクリック

**注意**: Fine-grained tokens ではなく、Classic tokens を使用してください。

### ステップ 5: 新しいトークンを生成

1. 「Generate new token」をクリック
2. 「Generate new token (classic)」を選択
3. GitHub パスワードの入力を求められる場合は入力

### ステップ 6: トークンの設定

#### Note（名前）

トークンの用途を記入します。

**例**:
```
One Codespace Extension
```

#### Expiration（有効期限）

トークンの有効期限を設定します。

**推奨**:
- `90 days`（90日）
- または `No expiration`（無期限、ただしセキュリティリスクあり）

**注意**: 有効期限が切れたら、新しいトークンを生成して設定し直す必要があります。

#### Select scopes（権限の選択）

**必須スコープ**:

✅ `codespace`

このスコープは以下の権限を含みます：
- Codespace の作成
- Codespace の読み取り
- Codespace の更新
- Codespace の削除

**その他のスコープ（オプション）**:

必要に応じて以下も選択できますが、One Codespace の基本機能には不要です：

- `repo`: リポジトリへのフルアクセス（不要）
- `user`: ユーザー情報へのアクセス（不要）

**セキュリティのベストプラクティス**: 必要最小限のスコープのみを選択してください。

### ステップ 7: トークンの生成

1. ページ下部の「Generate token」ボタンをクリック
2. トークンが表示されます

### ステップ 8: トークンをコピー

⚠️ **重要**: トークンは一度しか表示されません！

1. 表示されたトークンをクリックしてコピー
2. または、コピーアイコン（📋）をクリック
3. 安全な場所に保存（パスワードマネージャー推奨）

**トークンの形式**:
```
ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

トークンは `ghp_` で始まる40文字の文字列です。

## トークンの設定（One Codespace）

### ステップ 1: 設定画面を開く

1. Chrome ツールバーの One Codespace アイコンをクリック
2. 設定アイコン（⚙️）をクリック

### ステップ 2: トークンを入力

1. 「GitHub Personal Access Token」フィールドをクリック
2. コピーしたトークンを貼り付け
3. 👁️ アイコンで表示/非表示を切り替え可能

### ステップ 3: トークンを検証

1. 「トークンを検証」ボタンをクリック
2. 検証結果を確認

**成功の場合**:
```
✓ トークンは有効です（スコープ: codespace）
```

**失敗の場合**:
```
✗ 認証に失敗しました
または
✗ codespace スコープがありません
```

### ステップ 4: 保存

1. 「保存」ボタンをクリック
2. 成功メッセージを確認

## トークンの管理

### トークンの更新

トークンの有効期限が切れた場合、または新しいトークンが必要な場合：

1. GitHub で新しいトークンを生成（上記手順を繰り返し）
2. One Codespace の設定画面でトークンを更新
3. 保存

### トークンの削除

トークンを削除する場合：

**GitHub側**:
1. GitHub Settings → Developer settings → Personal access tokens
2. 削除したいトークンを見つける
3. 「Delete」をクリック

**One Codespace側**:
1. 設定画面でトークンフィールドを空にする
2. 保存

### トークンの再生成

定期的にトークンを再生成することを推奨します（セキュリティのため）：

1. GitHub で既存のトークンを削除
2. 新しいトークンを生成
3. One Codespace の設定を更新

## セキュリティのベストプラクティス

### 1. トークンの保管

✅ **推奨**:
- パスワードマネージャーに保存
- 暗号化されたファイルに保存

❌ **非推奨**:
- プレーンテキストファイル
- メモ帳やデスクトップ
- メールやチャット

### 2. トークンの共有

❌ **絶対にしない**:
- 他人とトークンを共有
- 公開リポジトリにコミット
- スクリーンショットで共有

### 3. トークンの権限

✅ **最小権限の原則**:
- 必要なスコープのみを付与
- One Codespace には `codespace` のみ

### 4. トークンの定期更新

✅ **推奨**:
- 3ヶ月ごとに更新
- 有効期限を設定
- 使わなくなったトークンは削除

### 5. トークンの漏洩時の対応

トークンが漏洩した可能性がある場合：

1. **即座に**GitHub でトークンを削除
2. 新しいトークンを生成
3. One Codespace の設定を更新
4. GitHub のセキュリティログを確認

## GitHub API の制限

### レート制限

GitHub API には以下のレート制限があります：

- **認証済みリクエスト**: 5,000 リクエスト/時間
- **未認証リクエスト**: 60 リクエスト/時間

One Codespace の使用頻度：
- **定期チェック**: 12 リクエスト/時間（5分ごと）
- **手動操作**: 使用時のみ

通常の使用では、レート制限に達することはありません。

### レート制限の確認

レート制限の状態を確認するには：

```bash
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/rate_limit
```

### レート制限に達した場合

One Codespace は以下の対応を自動で行います：

1. エラーを検知
2. `Retry-After` ヘッダーを確認
3. 指定時間待機
4. 自動的にリトライ

## トラブルシューティング

### トークンが無効と表示される

**原因**:
- トークンが間違っている
- トークンの有効期限が切れている
- トークンが削除されている

**解決策**:
1. トークンをコピーし直す
2. GitHub でトークンが有効か確認
3. 必要に応じて新しいトークンを生成

### codespace スコープがないと表示される

**原因**:
- トークン生成時に `codespace` スコープを選択していない

**解決策**:
1. GitHub で新しいトークンを生成
2. `codespace` スコープを選択
3. One Codespace の設定を更新

### 認証に失敗したと表示される

**原因**:
- ネットワークエラー
- GitHub API のダウン
- トークンの形式が不正

**解決策**:
1. インターネット接続を確認
2. [GitHub Status](https://www.githubstatus.com/) を確認
3. トークンの形式を確認（`ghp_` で始まる40文字）

### Codespace が表示されない

**原因**:
- トークンの権限が不足
- アカウントに Codespace がない

**解決策**:
1. トークンを検証
2. GitHub で Codespace を確認
3. 開発者コンソールでエラーログを確認

## 参考リンク

- [GitHub: Personal Access Tokens](https://docs.github.com/ja/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [GitHub: OAuth Scopes](https://docs.github.com/ja/developers/apps/building-oauth-apps/scopes-for-oauth-apps)
- [GitHub API: Codespaces](https://docs.github.com/ja/rest/codespaces)
- [GitHub API: Rate Limiting](https://docs.github.com/ja/rest/overview/resources-in-the-rest-api#rate-limiting)

---

トークンに関する質問は、GitHub Issues で報告してください。
