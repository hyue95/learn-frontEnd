v-model修饰符.lazy详解

hhf235678 2017-11-21 17:53:05  18099  收藏 1
展开
官网相关内容：

在默认情况下，v-model 在 input 事件中同步输入框的值与数据 (除了 上述 IME 部分)，但你可以添加一个修饰符 lazy ，从而转变为在 change 事件中同步：


<!-- 在 "change" 而不是 "input" 事件中更新 -->
<input v-model.lazy="msg" >
个人实践理解：
1. 当v-model没有使用.lazy修饰符时：

代码：

<template>
  <div>
    <div>
      <input v-model="msg" @change="show">
      <span>{{msg}}</span>
    </div>
  </div>
</template>


<script>
export default {
  data () {
    return {
      msg: 123
    }
  },
  methods: {
    show () {
      console.log(this.msg)
    }
  }
}
</script>
结论：

v-model是双向绑定的，所以当改变input框中的值的时候，span中的内容随之改变而改变。

2.当v-model使用.lazy修饰符时：

代码：<input v-model.lazy="msg" @change="show">

结论：当添加.lazy修饰符之后，改变input框中的内容并不会使得span中的内容发生变化，此时当输入框失去焦点后触发change事件.控制台中输出相应内容。



小结：加上.lazy后相当于 双向数据绑定不起作用了
