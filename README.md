# TL-Generator README

Princess Connect Re:Dive のクランバトルで使用するタイムラインの作成を補助するツール

## 使い方

### テンプレートファイルの作成

1. あらかじめ空のテキストファイルを作成して開いておく。
2. `F1` を押してコマンドパレットを開いて `TL-Generator: Create Timeline Template` を実行する。

### ライムライン抽出

1. あらかじめ作成したテンプレートにUBタイミングに合わせたキャラ名を書いておく。
2. `F1` を押してコマンドパレットを開いて `TL-Generator: Extract Timeline` を実行する。


### ボスUBの挿入

1. ボスUBを挿入したい時間の行にカーソルを合わせる。
2. `F1` を押してコマンドパレットを開いて `TL-Generator: Insert Boss UB` を実行する。

### 止めポイントの挿入

1. 止めポイントを挿入したいところにカーソルを合わせる。
2. `F1` を押してコマンドパレットを開いて `TL-Generator: Insert Stop Point` を実行する。

### 秒数の調整

1. 秒数を調整したい行にカーソルを合わせる
2. 秒数を増やす場合には `TL-Generator: Add Time`、秒数を減らしたい場合には`TL-Generator: Subtract Time`を実行する。

### キャラ名の自動入力

テンプレートファイルを作成してキャラを入力したい箇所にカーソルを合わせたら `Ctrl + Alt + 数字[1-5]` を押す。数字は入力したキャラの順番に対応。


## ショートカット

デフォルトでは上記のコマンドが以下のショートカットキーで登録されています。

| コマンド | ショートカットキー| 機能 |
| ---- | ---- | ---- |
| `Create Timeline Template` | `Ctrl + Alt + T` | TLのテンプレートを作成する |
| `Extract Timeline` | `Ctrl + Alt + E` | テンプレートからTLを抽出する |
| `Insert Boss UB` | `Ctrl + Alt + B`| ボスUBを挿入する |
| `Insert Stop Point` | `Ctrl + Alt + S`| 止めポイントを挿入する|
| `Add Time` | `Ctrl + Alt + A` | 秒数を増やす |
| `Subtract Time` | `Ctrl + Alt + Z` |　秒数を減らす |
| | `Ctrl + Alt + 数字[1-5]` | 対応した番号のキャラを自動入力する |
