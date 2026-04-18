PRML（パターン認識と機械学習：Pattern Recognition and Machine Learning）は，機械学習の基礎知識を身につけるのに非常にオススメな書籍です．

本記事では，PRMLの第1章にて紹介されている**<font color="red">「多項式曲線フィッティング」</font>**について細部まで説明し，これを**<font color="red">Julia</font>**で実装してみます．


# 多項式曲線フィッティング
GitHubのリポジトリ→[こちら](https://github.com/koba-jon/prml_julia)
ソースコード（.jl，.ipynb）→[こちら](https://github.com/koba-jon/prml_julia/tree/master/1_Introduction/1-1_Polynomial_Curve_Fitting)


## 概要

パターン認識のゴールは，**<font color="red">観測されたデータをもとに，今後観測されるであろうデータを予測する</font>**ことです．
その際に，観測されるデータがある関数によって生成されていると仮定し，**<font color="red">その関数を多項式で近似することを考える</font>**のが多項式曲線フィッティングです．

以下に，例を示します．
x=0のときに0.07，0.125のときに0.32，0.25のときに0.19...のようにデータが得られ，以下のようにデータ点がプロットできたとしましょう．

![graph1-1.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/e99ea2e7-3578-3d44-99bd-937caa68157b.jpeg)

これらの点が**ある関数によって生成されている**と仮定したとき，その関数の一つとして<font color="red">「f(x)=x」</font>を予想することができます．

さて，実際に，関数「f(x)=x」がこれらのデータに対して近似できているかどうかを試すために，関数「f(x)=x」をプロットしてみます．

![graph1-2.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/90f4ae8d-c927-ee13-f3b1-e1fd97b6fbe9.jpeg)

データ点の大半が**「f(x)=x」**に近い値を取っていることがわかります．
ここで，データにはノイズが存在していることに注意しましょう．
観測対象が持っている真実の値は**<font color="red">真値</font>**ですが，私達が観測して得た値の多くは何らかのノイズが入っており，**<font color="red">真値＋ノイズ</font>**となっています．

したがって，ノイズが入っていることを考慮したとして，関数**「f(x)=x」**は大方予測できていると考えられます．

実際に，**このデータは「f(x)=x」にノイズを加えて生成したもの**です．
つまり，**データを生成する関数を正しく予測できた**ことがわかります．

本例では，1次関数による近似を試みましたが，**実際に自然界に存在するデータはこれほどまでに直線的で単純なデータ点を取るものは非常に少ない**ため，多項式による適切な曲線フィッティングが求められます．


## 理論

概要では，生成したデータが**「f(x)=x」**で近似できるときの話をしました．

しかし，その関数は**予想して選んだ関数**です．
数学的な根拠に基づいて傾きと切片を選んだのではなく，予想して選んだその関数は，たまたま近似できていたに過ぎなく，別の観測データ群を近似する際にも適用できるとは限りません．

そこで，**ある基準（客観的な指標）を設定し，その基準に基づき，数学的に関数を近似する**ことを考えます．

例として，データ点と近似関数との**<font color="red">「二乗誤差の最小化」</font>**がよく使われます．
データ点と近似関数の誤差（残差）が大きいほど二乗誤差が大きく，誤差（残差）が小さいほど二乗誤差が小さくなるので，**二乗誤差の最小化は近似関数が正しいことを示す一つの指標として適切である**ことがわかります．

![graph1-3.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/6e94abcf-5e9d-64db-6b0e-1f23e86a7c52.jpeg)

以下，二乗誤差の最小化をもとに，近似関数の設計方法を説明していきます．


### 1次関数による近似

さて，まずは一番単純な関数「1次関数」による近似を試みます．
以下のようなデータが与えられたとしましょう．
<font color="red">※小数第3位までの概数として表示しています．</font>


<table>
  <tr>
    <th></th>
    <th>1</th>
    <th>2</th>
    <th>3</th>
    <th>4</th>
    <th>5</th>
    <th>6</th>
    <th>7</th>
    <th>8</th>
    <th>9</th>
  </tr>
  <tr>
    <th>x</th>
    <td>0.000</td>
    <td>0.125</td>
    <td>0.250</td>
    <td>0.375</td>
    <td>0.500</td>
    <td>0.625</td>
    <td>0.750</td>
    <td>0.875</td>
    <td>1.000</td>
  </tr>
  <tr>
    <th>y</th>
    <td>0.099</td>
    <td>-0.077</td>
    <td>0.260</td>
    <td>0.446</td>
    <td>0.416</td>
    <td>0.616</td>
    <td>0.890</td>
    <td>1.035</td>
    <td>1.050</td>
  </tr>
</table>


グラフで表すと以下のようになります．

![graph1-4.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/3ab8a729-b2d9-fb7e-1d93-1c6269d12b6a.jpeg)

近似する1次関数を「f(x)=ax+b」，入力データをx，xに対する観測データをy，観測データ数をm，二乗和誤差をEとすると，二乗和誤差Eは以下の式で表すことができます．

```math
E=\sum_{i=1}^{m}\{y_i-f(x_i)\}^2　...(1)
```

最終的に求めたいのは，**Eが最小となるf(x)のパラメータ（a, b）**です．
したがって，まずは**Eを最小化する**ことを考えます．

ここで，(1)式のf(x)に値を代入すると(2)式になります．

```math
E=\sum_{i=1}^{m}(y_i-ax_i-b)^2　...(2)
```

ただし，入力データxと観測データyは既知であり，定数aとbは未知であることを確認しておきましょう．
ゆえに，二乗和誤差Eは，aとbを変数とする2変数関数E(a, b)となります．

まず，問題を簡単化するために，変数bを固定（b=0）し，二乗和誤差Eが変数aの関数E(a)であると仮定します．
すると，以下のようなグラフを描くことができます．

![graph1-5.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/ffdbdd90-26da-0740-95e0-340171337ed9.jpeg)

グラフより，E(a)は**<font color="red">下に凸の2次関数</font>**となることがわかります．
つまり，**<font color="red">グラフの頂点（極小値）がE(a)の最小値</font>**となります．

E(a)が下に凸の2次関数であることは，数式で示すこともできます．

```math
\begin{eqnarray}
E &=& \sum_{i=1}^{m}(y_i-ax_i-b)^2 \\
&=& \sum_{i=1}^{m}\{x_i^2a^2+2x_i(b-y_i)a+(b-y_i)^2\} \\
&=& (x_1^2+x_2^2+\cdots+x_m^2)a^2+\sum_{i=1}^{m}\{2x_i(b-y_i)a+(b-y_i)^2\}　...(3)
\end{eqnarray}
```

(3)式より，a^2の係数が実数の二乗和となることから，**a^2の係数は正である**ことがわかります．
つまり，E(a)は下に凸の2次関数です．

二乗和誤差Eが変数aの関数E(a)である場合において，**<font color="red">グラフの頂点（極小値）がE(a)の最小値</font>**であることはわかりました．
では，二乗和誤差Eが変数bの関数E(b)である場合はどうでしょうか．これも同様です．

```math
\begin{eqnarray}
E &=& \sum_{i=1}^{m}(y_i-ax_i-b)^2 \\
&=& \sum_{i=1}^{m}\{b^2+2(x_ia-y_i)b+(x_ia-y_i)^2\} \\
&=& mb^2+\sum_{i=1}^{m}\{2(x_ia-y_i)b+(x_ia-y_i)^2\}　...(4)
\end{eqnarray}
```

(4)式より，b^2の係数はm(>0)であることから，E(b)も下に凸の2次関数であることがわかります．
したがって，二乗和誤差Eが変数bの関数E(b)である場合において，**<font color="red">グラフの頂点（極小値）がE(b)の最小値</font>**であることがわかりました．

さて，本来の目的は，aとbを変数とする2変数関数E(a, b)の最小値を求めることでした．
E(a, b)は，a, bの各々について下に凸の2次関数であることから，以下のように，**大域的に見てグラフの頂点（極小値）が存在し，それがE(a, b)の最小値**になります．

![graph1-6.gif](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/fea8ec07-99d0-b8d0-855a-c63f1db9cc0f.gif)

つまり，**<font color="red">E(a, b)の最小値を求めること＝E(a, b)の頂点（極小値）を求めること</font>**です．

さて，ここでは，**<font color="red">E(a, b)の極小値を求めることに注目</font>**します．

多変数関数の極小値は，各変数についての微分が0となる位置に存在します．
つまり，E(a, b)のaについての偏微分，bについての偏微分がともに0の点です．

これを計算式で表すと，(5), (6)式のようになります．

```math
E = \sum_{i=1}^{m}(y_i-ax_i-b)^2 \\
\left\{\begin{array}{ll}
\frac{\partial E}{\partial a} &=& \sum_{i=1}^{m}-2(y_i-ax_i-b)x_i &=& 0　...(5) \\
\frac{\partial E}{\partial b} &=& \sum_{i=1}^{m}-2(y_i-ax_i-b) &=& 0　...(6)
\end{array}\right.
```

さらに，(5), (6)式を変形すると，

```math

\left\{\begin{array}{ll}
(\sum_{i=1}^{m}x_i^2)a &+&(\sum_{i=1}^{m}x_i)b &=& \sum_{i=1}^{m}y_ix_i \\
(\sum_{i=1}^{m}x_i^2)a &+&mb &=& \sum_{i=1}^{m}y_i
\end{array}\right.
```

これを行列にすると，

```math
\begin{eqnarray}

\begin{pmatrix}
\sum_{i=1}^{m}x_i^2 & \sum_{i=1}^{m}x_i \\
\sum_{i=1}^{m}x_i & m
\end{pmatrix}

\begin{pmatrix}
a \\
b
\end{pmatrix}
&=&
\begin{pmatrix}
\sum_{i=1}^{m}y_ix_i \\
\sum_{i=1}^{m}y_i
\end{pmatrix} \\


\begin{pmatrix}
x_1 & x_2 & \cdots & x_m \\
1 & 1 & \cdots & 1
\end{pmatrix}

\begin{pmatrix}
x_1 & 1 \\
x_2 & 1 \\
\vdots & \vdots \\
x_m & 1
\end{pmatrix}

\begin{pmatrix}
a \\
b
\end{pmatrix}
&=&
\begin{pmatrix}
x_1 & x_2 & \cdots & x_m \\
1 & 1 & \cdots & 1
\end{pmatrix}

\begin{pmatrix}
y_1 \\
y_2 \\
\vdots \\
y_m
\end{pmatrix}

\end{eqnarray}
```

ここで，

```math
\boldsymbol{X} = \begin{pmatrix}
x_1 & 1 \\
x_2 & 1 \\
\vdots & \vdots \\
x_m & 1
\end{pmatrix}
,
\boldsymbol{w} = \begin{pmatrix}
a \\
b
\end{pmatrix}
,
\boldsymbol{y} = \begin{pmatrix}
y_1 \\
y_2 \\
\vdots \\
y_m
\end{pmatrix}
```

とおくと，

```math
\boldsymbol{X}^T \boldsymbol{X} \boldsymbol{w} = \boldsymbol{X}^T \boldsymbol{y}　...(7)
```

となります．

さらに，X^T×Xは，入力データ数に問わず正方行列（正則行列であると仮定）であるため，逆行列(X^T×X)^-1を持ちます．
つまり，(7)式の両辺に，左から(X^T×X)^-1をかけることによって，(8)式に変形させることができます．

```math
\boldsymbol{w} = (\boldsymbol{X}^T \boldsymbol{X})^{-1} \boldsymbol{X}^T \boldsymbol{y}　...(8)
```

あとは右辺の式に値を代入するだけで，E(a, b)の最小値をとる一次関数のパラメータa, bを求めることができます．

このように，残差平方和を利用して近似関数を求める方法を**<font color="red">最小二乗法</font>**と言います．<br><br>


さて，(8)式に先程のデータに当てはめてみましょう．
すると，以下のような解が得られます．

```math
\begin{eqnarray}

\begin{pmatrix}
a \\
b
\end{pmatrix}
&=&
\begin{pmatrix}
\begin{pmatrix}
0.000 & 0.125 & \cdots & 1.000 \\
1 & 1 & \cdots & 1
\end{pmatrix}
\begin{pmatrix}
0.000 & 1 \\
0.125 & 1 \\
\vdots & 1 \\
1.000 & 1
\end{pmatrix}
\end{pmatrix}
^{-1}

\begin{pmatrix}
0.000 & 0.125 & \cdots & 1.000 \\
1 & 1 & \cdots & 1
\end{pmatrix}

\begin{pmatrix}
0.099 \\
-0.077 \\
\vdots \\
1.050
\end{pmatrix} \\

&=&

\begin{pmatrix}
1.143 \\
-0.045
\end{pmatrix}

\end{eqnarray}
```

ゆえに，近似関数は以下のように定まります．

```math
f(x) = 1.143x - 0.045
```

これを観測データと比較してみましょう．
ほとんど誤差がないことがわかります．

<table>
  <tr>
    <th></th>
    <th>1</th>
    <th>2</th>
    <th>3</th>
    <th>4</th>
    <th>5</th>
    <th>6</th>
    <th>7</th>
    <th>8</th>
    <th>9</th>
  </tr>
  <tr>
    <th>x</th>
    <td>0.000</td>
    <td>0.125</td>
    <td>0.250</td>
    <td>0.375</td>
    <td>0.500</td>
    <td>0.625</td>
    <td>0.750</td>
    <td>0.875</td>
    <td>1.000</td>
  </tr>
  <tr>
    <th>y</th>
    <td>0.099</td>
    <td>-0.077</td>
    <td>0.260</td>
    <td>0.446</td>
    <td>0.416</td>
    <td>0.616</td>
    <td>0.890</td>
    <td>1.035</td>
    <td>1.050</td>
  </tr>
  <tr>
    <th>f(x)</th>
    <td>-0.045</td>
    <td>0.097</td>
    <td>0.240</td>
    <td>0.383</td>
    <td>0.526</td>
    <td>0.669</td>
    <td>0.812</td>
    <td>0.955</td>
    <td>1.098</td>
  </tr>
</table>

次にグラフです．
なんとなく，バランス良くデータの中央を通っていることがわかります．

![graph1-7.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/0074d383-3624-4e4a-fc47-5630fb030961.jpeg)

もし，新たに入力データxが与えられた場合，xをf(x)に入力することによりその予測値yを得ることができるようになりました．


### n次関数による近似

さて，1次関数による近似を一般化し，今度はn次関数による近似を試みます．

```math
f(x) = w_0 + w_1x + w_2x^2 + \cdots + w_nx^n = \sum_{j=0}^{n}w_jx^j
```

観測データyとf(x)の二乗和誤差Eは，以下のように表すことができます．

```math
\begin{eqnarray}

E &=& \sum_{i=1}^{m}(y_i-w_0-w_1x_i-w_2x_i^2-\cdots-w_nx_i^n)^2 \\
&=& \sum_{i=1}^{m}(x_i^{2l} w_l^2 + Bw_l + C) \\
&=& (x_1^{2l} + x_2^{2l} + \cdots + x_m^{2l})w_l^2 + \sum_{i=1}^{m}(Bw_l + C) \\

\end{eqnarray}
```

ただし，l（0≦l≦n かつ 整数）は任意のwを表す数，BまたはCはw_lを含まない定数とします．
この式からわかるように，x^2lは正になるため，それらの和であるw_l^2の係数は正になります．

このことから，二乗和誤差Eが変数w_lの関数E(w_l)である場合において，**<font color="red">グラフの頂点（極小値）がE(w_l)の最小値</font>**であることがわかり，これが**全てのwに適用できる**ことがわかります．
したがって，**大域的に見てグラフの頂点（極小値）が存在し，それがE(w)の最小値**になります．

これで，最小二乗法により近似関数を求めることができます．

1次関数の場合と同様に，極小値が0となる点を求め，wを決定します．

```math
\left\{\begin{array}{ll}

\frac{\partial E}{\partial w_0} &=& \sum_{i=1}^{m}-2(y_i-w_0-w_1x_i-w_2x_i^2-\cdots-w_nx_i^n) &=& 0 \\

\frac{\partial E}{\partial w_1} &=& \sum_{i=1}^{m}-2(y_i-w_0-w_1x_i-w_2x_i^2-\cdots-w_nx_i^n)x_i &=& 0 \\

\frac{\partial E}{\partial w_2} &=& \sum_{i=1}^{m}-2(y_i-w_0-w_1x_i-w_2x_i^2-\cdots-w_nx_i^n)x_i^2 &=& 0 \\

&& 　　　　　　　　\vdots \\

\frac{\partial E}{\partial w_n} &=& \sum_{i=1}^{m}-2(y_i-w_0-w_1x_i-w_2x_i^2-\cdots-w_nx_i^n)x_i^n &=& 0

\end{array}\right.
```

```math
\begin{eqnarray}

\sum_{i=1}^{m}w_0 + \sum_{i=1}^{m}w_1x_i + \sum_{i=1}^{m}w_2x_i^2 + \cdots + \sum_{i=1}^{m}w_nx_i^n &=& \sum_{i=1}^{m}y_i \\

\sum_{i=1}^{m}w_0x_i + \sum_{i=1}^{m}w_1x_i^2 + \sum_{i=1}^{m}w_2x_i^3 + \cdots + \sum_{i=1}^{m}w_nx_i^{n+1} &=& \sum_{i=1}^{m}y_ix_i \\

\sum_{i=1}^{m}w_0x_i^2 + \sum_{i=1}^{m}w_1x_i^3 + \sum_{i=1}^{m}w_2x_i^4 + \cdots + \sum_{i=1}^{m}w_nx_i^{n+2} &=& \sum_{i=1}^{m}y_ix_i^2 \\

\vdots　　　　　　　　　　 \\

\sum_{i=1}^{m}w_0x_i^n + \sum_{i=1}^{m}w_1x_i^{n+1} + \sum_{i=1}^{m}w_2x_i^{n+2} + \cdots + \sum_{i=1}^{m}w_nx_i^{2n} &=& \sum_{i=1}^{m}y_ix_i^n

\end{eqnarray}
```

これを行列にすると，

```math
\begin{eqnarray}

\begin{pmatrix}
m & \sum_{i=1}^{m}x_i & \sum_{i=1}^{m}x_i^2 & \cdots & \sum_{i=1}^{m}x_i^{n} \\
\sum_{i=1}^{m}x_i & \sum_{i=1}^{m}x_i^2 & \sum_{i=1}^{m}x_i^3 & \cdots & \sum_{i=1}^{m}x_i^{n+1} \\
\sum_{i=1}^{m}x_i^2 & \sum_{i=1}^{m}x_i^3 & \sum_{i=1}^{m}x_i^4 & \cdots & \sum_{i=1}^{m}x_i^{n+2} \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
\sum_{i=1}^{m}x_i^{n} & \sum_{i=1}^{m}x_i^{n+1} & \sum_{i=1}^{m}x_i^{n+2} & \cdots & \sum_{i=1}^{m}x_i^{2n} \\
\end{pmatrix}

\begin{pmatrix}
w_0 \\
w_1 \\
w_2 \\
\vdots \\
w_n
\end{pmatrix}
&=&
\begin{pmatrix}
\sum_{i=1}^{m}y_i \\
\sum_{i=1}^{m}y_ix_i \\
\sum_{i=1}^{m}y_ix_i^2 \\
\vdots \\
\sum_{i=1}^{m}y_ix_i^n
\end{pmatrix} \\


\begin{pmatrix}
1 & 1 & 1 & \cdots & 1 \\
x_1 & x_2 & x_3 & \cdots & x_m \\
x_1^2 & x_2^2 & x_3^2 & \cdots & x_m^2 \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
x_1^n & x_2^n & x_3^n & \cdots & x_m^n
\end{pmatrix}

\begin{pmatrix}
1 & x_1 & x_1^2 & \cdots & x_1^n \\
1 & x_2 & x_2^2 & \cdots & x_2^n \\
1 & x_3 & x_3^2 & \cdots & x_3^n \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & x_m & x_m^2 & \cdots & x_m^n
\end{pmatrix}

\begin{pmatrix}
w_0 \\
w_1 \\
w_2 \\
\vdots \\
w_n
\end{pmatrix}
&=&
\begin{pmatrix}
1 & 1 & 1 & \cdots & 1 \\
x_1 & x_2 & x_3 & \cdots & x_m \\
x_1^2 & x_2^2 & x_3^2 & \cdots & x_m^2 \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
x_1^n & x_2^n & x_3^n & \cdots & x_m^n
\end{pmatrix}

\begin{pmatrix}
y_1 \\
y_2 \\
y_3 \\
\vdots \\
y_m
\end{pmatrix}

\end{eqnarray}
```

ここで，

```math
\boldsymbol{X} = \begin{pmatrix}
1 & x_1 & x_1^2 & \cdots & x_1^n \\
1 & x_2 & x_2^2 & \cdots & x_2^n \\
1 & x_3 & x_3^2 & \cdots & x_3^n \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & x_m & x_m^2 & \cdots & x_m^n
\end{pmatrix}
,
\boldsymbol{w} = \begin{pmatrix}
w_0 \\
w_1 \\
w_2 \\
\vdots \\
w_n
\end{pmatrix}
,
\boldsymbol{y} = \begin{pmatrix}
y_1 \\
y_2 \\
y_3 \\
\vdots \\
y_m
\end{pmatrix}
```

とおくと，

```math
\begin{eqnarray}
\boldsymbol{X}^T \boldsymbol{X} \boldsymbol{w} &=& \boldsymbol{X}^T \boldsymbol{y} \\
\boldsymbol{w} &=& (\boldsymbol{X}^T \boldsymbol{X})^{-1} \boldsymbol{X}^T \boldsymbol{y}　...(9)
\end{eqnarray}
```

(9)式は，最小二乗法の解（n次関数）の一般形（正規方程式）になります．


### 最適なn次関数の決定

さて，(9)式に以下のデータを当てはめてみます．

- 表

<table>
  <tr>
    <th></th>
    <th>1</th>
    <th>2</th>
    <th>3</th>
    <th>4</th>
    <th>5</th>
    <th>6</th>
    <th>7</th>
    <th>8</th>
    <th>9</th>
  </tr>
  <tr>
    <th>x</th>
    <td>0.000</td>
    <td>0.125</td>
    <td>0.250</td>
    <td>0.375</td>
    <td>0.500</td>
    <td>0.625</td>
    <td>0.750</td>
    <td>0.875</td>
    <td>1.000</td>
  </tr>
  <tr>
    <th>y</th>
    <td>0.063</td>
    <td>0.792</td>
    <td>1.053</td>
    <td>0.580</td>
    <td>0.051</td>
    <td>-0.711</td>
    <td>-1.129</td>
    <td>-0.654</td>
    <td>-0.155</td>
  </tr>
</table>

- グラフ <br>
![graph1-8.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/8fcd6fe1-ec6c-e8cb-a9ed-75b0a3798de8.jpeg)

これをn次関数（1≦n≦9）によってフィッティングさせると，以下のようになります．

![graph1-9.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/681ca532-352b-7457-ffa7-e3512cbc70eb.jpeg)

1次関数の場合，x=0.50のときに観測データに近い値をとっているだけで，他はほとんど近い値をとっていません．
しかしながら，9次関数の場合，全ての観測データにおいて近い値をとっていることがわかります．

このことから，**大きいnを用いると，形状がより複雑なデータの特徴を捉えることができる**ことがわかります．
（ただし，必ずしもnが大きい方が良いというわけではありません．）

以下は，n次関数のnと平均二乗平方根誤差（RMSE）の関係を示しています．
このグラフから，nが大きい方が誤差が小さい傾向にあることがわかります．

![graph1-10.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/4401efac-c455-40c8-528c-1313070c01a4.jpeg)

しかしながら，本当にnが大きい方が絶対に良いのでしょうか？
いいえ，違います．

以下のグラフを見てください．
実は，先程のデータは，y=sin(x)にノイズを加えて生成したものです．

![graph1-11.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/ef02915d-a55f-dac2-c504-02df6138c747.jpeg)

観測データに対してフィッティングがうまく行ったとしても，今後入力データxに対して出力データyを推定することを考えた場合，9次関数は適切な近似関数とは言えません．

以下の「test RMSE」は，0.0〜1.0の一様乱数により生成した入力データxを10000個用意し，この出力yとn次の近似関数の平均二乗平方根誤差（RMSE）を示しています．

![graph1-12.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/6ac8f449-4659-7593-d7aa-0c967cceb1e2.jpeg)

この結果から，テストデータに対してはn=5が最も良い結果が得られていることがわかります．
したがって，この観測データにおいては，9次関数ではなく5次関数による近似が最も有効であることがわかりました．


## 実装

今回は以下のパッケージを使用します．

```julia:Polynomial_Curve_Fitting.jl
using Distributions
using Plots
```

まず，生成する訓練データの総数と近似する関数の次数を設定します．

```julia:Polynomial_Curve_Fitting.jl
M = 9  # 訓練データの総数
N = 9  # 近似する関数の次数
```

次に，データを生成する関数を設定します．

```julia:Polynomial_Curve_Fitting.jl
dist = Normal(0.0, 0.1)  # 平均0.0，標準偏差0.1の正規分布
base(x) = sin.(2pi*x)  # 周期1の正弦波
gen(x) = base(x) + rand(dist, length(x))  # データを生成する関数
```

次に，以下のn次多項式行列Xを作成する関数を設計します．

```math
\boldsymbol{X} = \begin{pmatrix}
1 & x_1 & x_1^2 & \cdots & x_1^n \\
1 & x_2 & x_2^2 & \cdots & x_2^n \\
1 & x_3 & x_3^2 & \cdots & x_3^n \\
\vdots & \vdots & \vdots & \ddots & \vdots \\
1 & x_m & x_m^2 & \cdots & x_m^n
\end{pmatrix}
```

```julia:Polynomial_Curve_Fitting.jl
function polynomial_matrix(x, N)
    m = length(x)
    X = fill(1.0, m)  # 要素が1の列ベクトルを生成
    for j in 1:N
        x_vec = x .^ j  # xのj乗
        X = hcat(X, x_vec)  # 右側にベクトルを追加
    end
    return X
end
```

次に，以下のn次多項式の係数wを求める関数を設計します．

```math
\boldsymbol{w} = (\boldsymbol{X}^T \boldsymbol{X})^{-1} \boldsymbol{X}^T \boldsymbol{y}
```

```julia:Polynomial_Curve_Fitting.jl
function weight(x, y, N)
    X = polynomial_matrix(x, N)
    w = (X' * X) \ X' * y
    return w
end
```

さらに，推定したn次多項式の係数wと，入力データxをもとにf(x)を出力する関数を設計します．

```julia:Polynomial_Curve_Fitting.jl
function f(x, w)
    X = polynomial_matrix(x, length(w)-1)
    y = X * w
    return y
end
```

これで，関数の準備は整いました．
実際に，どのように近似されるか確認しましょう．

M個の入力データxを生成し，観測データyを得ます．

```julia:Polynomial_Curve_Fitting.jl
step = 1.0 / (M - 1)
x = collect(0.0:step:1.0)
y = gen(x)
println("x = ", x)
println("y = ", y)
```

次に，これをもとにwを推定します．

```julia:Polynomial_Curve_Fitting.jl
w = weight(x, y, N)
println("w = ", w)
```

wを推定し，f(x)のパラメータを得ることができました．
それでは，グラフを描いてみます．

```julia:Polynomial_Curve_Fitting.jl
gr()
scatter(x, y, xlabel="x", ylabel="y", label="data")
graph_x = collect(0.0:0.01:1.0)
graph_y = f(graph_x, w)
plot!(graph_x, base(graph_x), label="base")
plot!(graph_x, graph_y, label=string(N, "th degree"))
```

以下は，グラフの出力結果の一例です．

![graph1-13.jpg](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/374669/01472924-7ea7-a997-9089-29152dc59763.jpeg)

以上で，多項式曲線フィッティングの理論と実装の説明を終わります．
