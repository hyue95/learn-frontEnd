flex布局，flex:1的计算

勤奋小学童 2019-02-26 17:22:10  3507  已收藏 16
分类专栏： CSS html
版权
一、flex的属性梳理



注意，设为 Flex 布局以后，子元素的float、clear和vertical-align属性将失效。

（1）flex1的计算规则
第一步：先明确：flex 是 flex-grow | flex-shrink | flex-basis 的缩写。
1、默认情况：flex：0 1 auto;

2、flex取值为none 0 0 auto;

3、flex取值auto: 1 1 auto

4、flex取值为一个非负的值时：则该数值是flex-grow的值。flex-shrink: 1， flex-basis: 0；即为： num 1 0%;

5、flex取值是一个长度或百分比 60%，200px：则该数值是flex-basis的值。取值（ 1 1 60%）（ 1 1 200px）；

6、flex取值是2个非负数字（2，3），则分别视为flex-grow和flex-shrink的值。flex-basis取值0%。（2 3 0%）；

7、flex 取值是1个非负数字一个百分比(长度)(2 200px)，则flex-grow 和 flex-shrink的值是非负数字的值。(2 2 200px)

第二步：剩余空间的计算和占比的分配
flex-basis: 规定的是子元素的基准值；

auto: 检索该子元素的主尺寸。如果主尺寸是auto,则采用主尺寸的值。如果也是auto就是去content的值。

百分比：根据其包含块的主尺寸计算。如果包含块的主尺寸未定义，则计算结果和设为auto一样。


<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no" />
  <title>flex1</title>
  <style>
    *{
      margin: 0;
      padding: 0;
    }
   #flexul {
     display: flex;
     width: 750px;
   }
   #flexul li {
    list-style-type: none;
   }
   .one {
     width: 50px;
     background: red;
     flex: 1 1 0%;
   }
   .two {
     width: 80px;
     background: green;
     flex: 2 1 auto;
   }
   .three {
     width: 50px;
     background: yellow;
     flex: 1 1 0%; 
   }
   .four {
     background: blue;
     flex: 2 1 200px;
   } 
  </style>
</head>
<body>
  <ul id="flexul">
    <li class="one">第一个li</li>
    <li class="two">我是第二个li</li>
    <li class="three">的第三个li</li>
    <li class="four">布局中的第四个li</li>
  </ul>
</body>
</html>
计算步骤：
1、主轴的父容器的尺寸：750px;
子元素的总基准：0% + auto + 0% + 200px = 0 + 80 + 0 + 200 = 280px;

0% 即宽度是0；auto 对应主尺寸。

剩余的空间：750 - 280 = 470；

2、伸缩放大系数和：
1+2+1+2 = 6；

剩余空间的分配：470*（1/6）= 78.3

470*(2/6)=156.6

3、各项目的最终宽度：
0+78.3 = 78.3

80+156.6 = 236.6

0+78.3 = 78.3

200+156.6=356.6

参考链接：

[align-items 和 align-content 的区别](https://www.cnblogs.com/zmc-change/p/6178757.html)

[vertical-align](https://www.cnblogs.com/starof/p/4512284.html?utm_source=tuicool&utm_medium=referral)

[flex1 详解](https://blog.csdn.net/fengyjch/article/details/79047908)
