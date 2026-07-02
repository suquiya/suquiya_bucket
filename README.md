# suquiya's bucket

[![Tests](https://github.com/suquiya/suquiya_bucket/actions/workflows/ci.yml/badge.svg)](https://github.com/suquiya/suquiya_bucket/actions/workflows/ci.yml)
[![Excavator](https://github.com/suquiya/suquiya_bucket/actions/workflows/excavator.yml/badge.svg)](https://github.com/suquiya/suquiya_bucket/actions/workflows/excavator.yml)

Suquiya's bucket. This bucket contains manifests for various fonts and some tools that suquiya personally use.

This bucket is not limited to suquiya's use only. Anyone can use this bucket. But please use it at your own risk.

数寄屋の自作ツール・個人的にscoopパッケージにしておきたいフォント(プログラミングフォント等)を入れたbucketです。

数寄屋専用ではありませんので、ほかの方が使ってもおそらく大丈夫だとは思いますが、使用する場合は自己責任でお願いいたします。

## 収録しているManifestの概要(Overview of manifests that this bucket contains)

All manifests of this bucket: [here](https://scoop.sh/#/apps?q=%22https%3A%2F%2Fgithub.com%2Fsuquiya%2Fsuquiya_bucket%22&o=false)

収録Manifestの全リストは[こちら](https://scoop.sh/#/apps?q=%22https%3A%2F%2Fgithub.com%2Fsuquiya%2Fsuquiya_bucket%22&o=false)で確認できます。

### プログラミング用フォント(Programming Font)
以下のプログラミング用フォントを収録しています。

+ [たわらさん](https://github.com/yuru7)の作成した合成フォント（主にプログラミング向け）群
+ [Cica](https://github.com/miiton/Cica)
+ [monaspace](https://github.com/githubnext/monaspace)ファミリー

以上3種類のフォント群に対して、インストール可能なmanifestを作成してbucketに収録しています。
詳細はscoop bucketに追加後searchいただくか、前述したリストをご確認ください。
自動更新になっているはずなので、最新のものがインストールできると思います。

※Manifestの作成スクリプトは[こちら](https://github.com/suquiya/suquiya_bucket/tree/main/scripts/tool)から確認可能です。

### 数寄屋作ユーティリティ(Application created by suquiya)
#### PowerShellスクリプト(PowerShell Script)
以下の（主に自分用ですが、おおよそ汎用の）スクリプトを置いています。

+ zipdu: URLからzipファイルをダウンロードし、解凍する
    + 注: 解凍後エクスプローラーで解凍先を開くので、解凍先が行方不明になることはありません。
+ zipduif: zipduと同じ動作をしたのち、解凍したものの中にフォントがあればそのフォントを開く
    + フォントについては、一括インストールにするとセキュリティ上懸念があるので、インストールするフォントをユーザーが選べるようにするためこのような動作にしています

スクリプトは[こちら](https://github.com/suquiya/psutil)で管理しています。

#### バイナリアプリケーション(binary application)
現在は以下の1つのみです。

+ [rara](https://github.com/suquiya/rara): パスワードジェネレータ

## bucket追加方法(How to add this bucket)

```
scoop bucket add suquiya_bucket https://github.com/suquiya/suquiya_bucket
```
