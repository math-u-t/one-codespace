# One Codespace

**GitHub Codespaces を効率的に管理し、1つの Codespace のみをアクティブに保つ Chrome 拡張機能**

## 概要

One Codespace は、GitHub Codespaces の管理を自動化し、コストを最適化するための Chrome 拡張機能です。複数の Codespace が同時に起動している状態を防ぎ、非アクティブな Codespace を自動的に停止することで、無駄なリソース消費を削減します。

### 主な特徴

- **自動停止機能**: 指定時間非アクティブな Codespace を自動停止
- **最大同時起動数の制限**: 設定した数を超える Codespace を自動的に停止
- **リアルタイム監視**: アクティブな Codespace を常に監視
- **除外リポジトリ設定**: 特定のリポジトリを自動停止の対象外に
- **Material Design UI**: 美しく使いやすいインターフェース
- **ダークモード対応**: 目に優しいダークテーマ
- **設定のインポート/エクスポート**: 簡単に設定を共有・バックアップ

## なぜ One Codespace が必要なのか

GitHub Codespaces は強力な開発環境ですが、以下のような課題があります：

1. **コスト管理**: 複数の Codespace が起動したままだと、想定以上のコストが発生
2. **リソースの無駄**: 使っていない Codespace が動き続けることがある
3. **手動管理の煩雑さ**: 各 Codespace を個別に停止するのは手間

One Codespace は、これらの課題を自動化で解決します。

## クイックスタート

### 1. インストール

詳細は [INSTALLATION.md](INSTALLATION.md) を参照してください。

```
1. リポジトリをクローンまたはダウンロード
2. Chrome で chrome://extensions/ を開く
3. 「デベロッパーモード」を有効化
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. プロジェクトフォルダを選択
```

### 2. GitHub トークンの取得

詳細は [API.md](API.md) を参照してください。

```
1. GitHub Settings → Developer settings → Personal access tokens
2. 「Generate new token (classic)」をクリック
3. "codespace" スコープを選択
4. トークンを生成してコピー
```

### 3. 初期設定

詳細は [CONFIGURATION.md](CONFIGURATION.md) を参照してください。

```
1. 拡張機能のアイコンをクリック
2. 設定アイコン（⚙️）をクリック
3. GitHub Personal Access Token を入力
4. 自動停止設定を調整
5. 保存ボタンをクリック
```

## 主要機能

### 1. Codespace の一覧表示

ポップアップ画面で、現在アクティブなすべての Codespace を確認できます：

- リポジトリ名
- 起動状態
- 稼働時間
- 手動停止ボタン

### 2. 自動停止機能

以下の2つの方法で Codespace を自動停止します：

#### a) 最大同時起動数による制限
- デフォルト: 1つ
- 新しい Codespace を開くと、最も古いものが自動停止
- 設定で1〜10個まで調整可能

#### b) 非アクティブ時間による自動停止
- デフォルト: 30分
- タブがバックグラウンドになってから指定時間経過で停止
- 設定で5〜120分まで調整可能

### 3. 除外リポジトリ設定

特定のリポジトリを自動停止の対象外にできます：

```
例:
- owner/important-project
- company/production-app
```

### 4. 通知機能

Codespace が自動停止された際に、Chrome 通知でお知らせします：

- 停止理由（最大数超過/非アクティブ）
- リポジトリ名
- 停止時刻

### 5. ダークモード

目に優しいダークテーマに切り替えられます：

- 設定画面で切り替え
- Material Design に準拠したカラーパレット

## ドキュメント

より詳しい情報は、以下のドキュメントを参照してください：

| ドキュメント | 内容 |
|------------|------|
| [INSTALLATION.md](INSTALLATION.md) | インストール手順とアイコンのセットアップ |
| [USAGE.md](USAGE.md) | 基本的な使い方と各機能の詳細 |
| [CONFIGURATION.md](CONFIGURATION.md) | 設定項目の詳細と推奨設定 |
| [API.md](API.md) | GitHub Personal Access Token の取得方法 |
| [TROUBLESHOOTING.md](TROUBLESHOOTING.md) | よくある問題と解決方法 |
| [DEVELOPMENT.md](DEVELOPMENT.md) | 開発者向けドキュメント |

## 技術仕様

- **Manifest Version**: 3
- **対応ブラウザ**: Google Chrome (最新版推奨)
- **必要な権限**: storage, alarms, notifications, tabs
- **使用API**: GitHub REST API v3
- **デザインシステム**: Material Design

## セキュリティ

- GitHub Personal Access Token はブラウザのローカルストレージに保存されます
- トークンは外部サーバーに送信されません
- すべての API 通信は HTTPS で暗号化されています
- 設定のエクスポートにはトークンは含まれません

## プライバシー

One Codespace は以下の情報のみを使用します：

- GitHub Personal Access Token（ローカルストレージに保存）
- Codespace のアクティビティ情報（最終アクセス時刻）
- ユーザー設定（ローカルストレージに保存）

**外部サーバーへのデータ送信は一切行いません。**

## ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## サポート

問題が発生した場合：

1. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) を確認
2. GitHub Issues で報告
3. 開発者コンソールのエラーログを確認

## コントリビューション

プロジェクトへの貢献を歓迎します！

詳細は [DEVELOPMENT.md](DEVELOPMENT.md) を参照してください。

## 更新履歴

### Version 1.0.0 (2025-11-12)
- 初回リリース
- 基本的な Codespace 管理機能
- 自動停止機能
- Material Design UI
- ダークモード対応
- 設定のインポート/エクスポート

## よくある質問 (FAQ)

### Q: Codespace が自動停止されるタイミングは？
A: 以下の2つの条件で自動停止されます：
1. 設定した最大同時起動数を超えた場合（最も古いものから停止）
2. 指定時間（デフォルト30分）非アクティブな場合

### Q: GitHub トークンは安全ですか？
A: はい。トークンはブラウザのローカルストレージにのみ保存され、外部に送信されることはありません。

### Q: 複数のブラウザで使用できますか？
A: 各ブラウザで個別にインストールと設定が必要です。設定のエクスポート/インポート機能で設定を共有できます。

### Q: Codespace が停止されるのを防ぐには？
A: 除外リポジトリに追加するか、自動停止機能を無効にしてください。

### Q: どのくらいのコスト削減効果がありますか？
A: 使用パターンによりますが、複数の Codespace を同時起動していた場合、50%以上のコスト削減が期待できます。

## リンク

- [GitHub Codespaces 公式ドキュメント](https://docs.github.com/ja/codespaces)
- [GitHub REST API](https://docs.github.com/ja/rest)
- [Material Design](https://material.io/design)
- [Chrome Extensions Documentation](https://developer.chrome.com/docs/extensions/)

## 作者

One Codespace プロジェクトチーム

---

**One Codespace で、賢く Codespace を管理しましょう！**
