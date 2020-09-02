# [Vue.js语法糖整理](https://www.cnblogs.com/lhl66/p/8021730.html)

```
el:element 需要获取的元素，一定是HTML中的根容器元素
data:用于数据的存储
methods:用于存储各种方法
数据绑定字面量只加载一次{{* msg}}
data里面可以进行简单的运算；
methods:{
 getHome(){
   return "早上好"
 }
}
--------------------------------------------------
HTML中渲染{{getHome()}}  //得到的结果是--->早上好

v-bind绑定属性简写就是一个冒号 如
data{
 id:12
}
<p :id="id">123</>
--------------------------------------------------
动态绑定dom元素

data{
  websiteTag:"<a href='http://www.baidu.com'>百度</a>"
}

html中 <p v-html="websiteTag"></p>
--------------------------------------------------
单击事件：v-on:click="方法"      @click="方法"(简写)
双击事件：v-on:dblclick="方法"    @dblclick="方法"(简写)
data:{
  x:0,
  y:0
}
updataXY(event){
  console.log(event) //js鼠标事件默认的
  this.x = event.offsetX;
  this.y = event.offsetY;
}

HTML渲染:

<div id="canvas" @mousemove="updataXY">
   {{x}}-----{{y}}
</div>

事件还有很多，用法都一样；
--------------------------------------------------
阻止冒泡：
data:{
  x:0,
  y:0
}
updataXY(event){
  console.log(event) //js鼠标事件默认的
  this.x = event.offsetX;
  this.y = event.offsetY;
}
updataStop(evevt){
 event.stopPropagation();
}
HTML渲染:
方法一：
<div id="canvas" @mousemove="updataXY">
   {{x}}-----{{y}}
   <span @mousemove="updataStop">移到我这里不会改变xy坐标</span>
</div>
方法二:
<div id="canvas" @mousemove="updataXY">
   {{x}}-----{{y}}
   <span @mousemove.stop="">移到我这里不会改变xy坐标</span> //vue中加stop修饰符即可阻止冒泡
</div>
--------------------------------------------------
阻止默认行为:
<a href="http://www.baidu.com" @click.prevent="">百度</a>
--------------------------------------------------
键盘事件：
changeName(){
 console.log("你正在输入名字")
}
<input type="text" @keyup="changeName">
<input type="text" @keyup.enter="changeName">
<input type="text" @keydown="changeName">
其他键盘事件类似，用法一致
--------------------------------------------------
数据双向绑定：
data:{
 name:""
}
<input type="text" v-model="name" ref="name">
补充一个知识点：获取vue获取input的value的方法--->this.$refs.name.value;
--------------------------------------------------
计算属性：
data:{
 a:0,
 b:0,
 age:10
}

methods:{
  addA(){
    console.log("add  to a")
    return this.a+this.age;
  }
  addB(){
    console.log("add  to B")
    return this.b+this.age;
  }
}
法一：用方法实现这个功能
<button @click="a++">Add to A</button>
<button @click="b++">Add to A</button>
<p>A-{{a}}</p>
<p>A-{{b}}</p>
<p>Age-A={{addA()}}</p>
<p>Age-B={{addB()}}</p>
法二：用计算属性实现
computed:{
  addA(){
    console.log("add  to a")
    return this.a+this.age;
  }
  addB(){
    console.log("add  to B")
    return this.b+this.age;
  }
}
<button @click="a++">Add to A</button>
<button @click="b++">Add to A</button>
<p>A-{{a}}</p>
<p>A-{{b}}</p>
<p>Age-A={{addA}}</p>
<p>Age-B={{addB}}</p>
--------------------------------------------------
动态css
data:{
  changeColor:false
}
<h1 @click="changeColor!=changeColor" :class="{changeColor:changeColor}">
   <span>你好</span>
</h1>

<style>
 .changeColor span{
    background:#f2f1f1;
  }
</style>
--------------------------------------------------
v-if指令（后面可以跟v-else-if  v-else）
v-show指令
区别在于v-if 判断dom结构是否存在，v-show是使用的display属性来是否显示
--------------------------------------------------
v-for指令数组遍历数组、对象

data:{
  arr:["bob","wow","pop"],
  list:[
    {name:"bob",age:18}
    {name:"wow",age:19}
    {name:"pop",age:20}
  ]
}

<ul>
  <li v-for="item in arr">{{item}}</li>
</ul>

<ul>
  <li v-for="(item,index) in list">{{item.name}}</li>
  <li v-for="(item,index) in list">{{item.age}}</li>
  <li v-for="(item,index) in list">{{index}如果下标需要从一开始如排行榜{{index+1}}</li>
</ul>
注意如果用div渲染会直接渲染div包着的结构；（3个div）
<div v-for="(item,index) in list">
  <h3>{{item.name}}</h3>
  <p>{{item.age}}</p>
</div>
改用template的话可以去掉不必须要的空元素div （1个div）
<template v-for="(item,index) in list">
  <h3>{{item.name}}</h3>
  <p>{{item.age}}</p>
</template>
--------------------------------------------------
index.html-->main.js（实例化vue对象）-->app.vue
html（template）--->js---->style三部分内容
--------------------------------------------------
全局注册组件在main.js写上Vue.component("自定义名字",组件名)
调用组件<自定义名字></自定义名字>
局部组件：
data(){
  return{
  
  }
},
components:{组件名}
--------------------------------------------------
组件css作用域 scoped限定
组件预处理器<style lang="预处理器" scoped></style>
--------------------------------------------------
组件传值（父组件-->子组件（props）/子组件--->父组件（自定义事件））
需要用的数据放置父组件的data里面
假定在app.vue
data:{
  list:[
    {name:"bob",age:18}
    {name:"wow",age:19}
    {name:"pop",age:20}
  ]
}
<header><header>
<content :list="list"></content>
<footer><footer>
在content组件内props接收
法一:  props["list"]
法二（官方推荐）:
props{
  list:{
    type:Array
    required:true
  },
}
法三:vuex状态管理仓库
传值：string、number、boolean （单个变）
传引用：array、object  （整个变）

子--->父
changeTitle(){
  this.$emit("titleChange","子到父传东西")
}

父组件@titleChange="方法名($event)"

methods:{
  //做的事情
  方法名(形参){
    //做什么事情
  }
}
--------------------------------------------------
路由：（写法routes数组里面包着对象）
import 自定义名字 from "组件路径"
const router = new VueRouter ({
   model:"history",
   routes:[
      {
          pateh:"xxx",
          meta:{单页面配置标题},     //---->该字段也可以校验路由
          components:{组件}          //---->该方法component: resolve => require(['组件路径'], resolve)路由懒加载（不用import组件了）
      },
   ]

})
--------------------------------------------------
请求方式另外一节附上
```