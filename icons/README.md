# アイコンのセットアップ

One Codespace 拡張機能を使用するには、アイコンファイルを手動で配置する必要があります。

## 必要なアイコンサイズ

Chrome 拡張機能には以下のサイズのアイコンが必要です：

- **16x16 px** - ツールバーアイコン（小）
- **48x48 px** - 拡張機能管理ページ
- **128x128 px** - Chrome Web Store、インストール時

## ファイル形式

- **推奨形式**: PNG
- **透過**: 推奨（背景を透明にする）
- **カラー**: フルカラー対応

## ファイル配置

以下のファイルをこの `icons/` ディレクトリに配置してください：

```
icons/
├── icon16.png   (16x16 px)
├── icon48.png   (48x48 px)
└── icon128.png  (128x128 px)
```

## アイコンデザインガイドライン

### コンセプト
- GitHub Codespaces を象徴するデザイン
- シンプルで認識しやすい
- ブランドカラーとの調和

### デザイン要素
1. **メインシンボル**
   - クラウドアイコン
   - コードブラケット `{}`
   - またはその組み合わせ

2. **カラーパレット**
   - プライマリ: `#1976d2` (青)
   - アクセント: `#4caf50` (緑)
   - 背景: 透明または白

3. **スタイル**
   - フラットデザイン
   - Material Design に準拠
   - 適度なパディング（アイコンサイズの10-15%）

### デザインツール

アイコンを作成するには、以下のツールが推奨されます：

- **オンラインツール**
  - [Figma](https://www.figma.com/) - 無料プラン有り
  - [Canva](https://www.canva.com/) - 簡単なデザイン
  - [Photopea](https://www.photopea.com/) - オンライン画像編集

- **デスクトップツール**
  - Adobe Illustrator
  - GIMP（無料）
  - Inkscape（無料）

### 既存アイコンの活用

Material Icons をベースにする場合：

1. [Material Icons](https://fonts.google.com/icons) から `storage` または `cloud` アイコンを選択
2. SVG でダウンロード
3. 適切なサイズ（16x16, 48x48, 128x128）にリサイズ
4. PNG としてエクスポート
5. このディレクトリに配置

## manifest.json の更新

アイコンファイルを配置したら、`manifest.json` を更新してください：

```json
{
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png"
    }
  }
}
```

現在、`manifest.json` の `icons` セクションはコメントアウトされています。
アイコンファイルを配置後、コメントを解除して上記の内容に置き換えてください。

## アイコンのテスト

アイコンを配置したら、以下の手順でテストしてください：

1. Chrome の拡張機能管理ページ（`chrome://extensions/`）を開く
2. 拡張機能を再読み込み
3. ツールバーとポップアップでアイコンが正しく表示されることを確認

## サンプルアイコン（テキストベース）

アイコンを作成するまでの間、以下のような簡易的なアイコンでテストできます：

1. シンプルな色付き正方形
2. 背景色: `#1976d2`（プライマリカラー）
3. 中央に白い文字 "1C" や "OC"

## トラブルシューティング

### アイコンが表示されない
- ファイル名が正しいか確認
- ファイルパスが `icons/icon16.png` などになっているか確認
- manifest.json のパスが正しいか確認
- 拡張機能を再読み込み

### アイコンがぼやける
- 高解像度版のアイコンを作成
- 各サイズで個別に最適化（自動リサイズに頼らない）
- PNG の圧縮設定を確認

### アイコンの縁が切れる
- アイコン周辺に適切なパディングを追加
- セーフエリア（全体の85-90%）内にデザインを配置

## 参考リンク

- [Chrome Extensions - Icon Design](https://developer.chrome.com/docs/extensions/mv3/user_interface/#icons)
- [Material Design Icons](https://fonts.google.com/icons)
- [Chrome Web Store のアイコンベストプラクティス](https://developer.chrome.com/docs/webstore/images/)
