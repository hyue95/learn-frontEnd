# Vue2.4中$attrs和$listeners的使用

# [vue中$attrs $listeners你会用吗？](https://www.cnblogs.com/cjh1996/p/12812652.html)

> 简单来说：`$attrs` 与 `$listeners` 是两个「对象」，`$attrs` 里存放的是父组件中绑定的非 Props 属性，`$listeners`里存放的是父组件中绑定的非原生事件。

复制代码

```html
//子组件   
//$attrs 可以收集父组件中的所有传过来的属性 除了那些在组件中没有通过 props 定义的。
//唯一缺点 没在props定义的属性 会显示在生成的html标签上
//解决办法:通过inheritAttrs:false,避免顶层容器继承属性

<template>
  <el-dialog
    :title="title"
    :visible="dialogVisible"
    @close="$emit('update:dialogVisible', false)"
    :width="width"
    :close-on-click-modal="modal"
    v-bind="$attrs"  /**关键代码**
  >
    <slot name="dialog-body"></slot>

    <div slot="footer" class="dialog-footer">
      <slot name="modal-footer">
        <el-button @click="$emit('update:dialogVisible', false)">取 消</el-button>
        <el-button type="primary" @click="$emit('confirm')" size="small">确 定</el-button>
      </slot>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "my-dialog",
  inheritAttrs:false #关键代码
  props: {
    dialogVisible: Boolean,
    title: String,
    width: {
      type: String,
      default: "500px"
    },
    modal: {
      type: Boolean,
      default: false
    }
  }
};
</script>
```

复制代码

```html
//父组件 里使用
//:fullscreen="true" 并没在子组件props内定义 依然传入了子组件
//让dialog 全屏
 <my-dialog :fullscreen="true" :dialogVisible.sync="flag" @confirm="close" title="测试弹框"></my-dialog>
```

其他例子

复制代码

```html
//componentA
<template>
  <div class="component-a">
    <component-b :name="name" :tag="tag" :age="age" @click.native="say" @mouseover="sing"></component-b>
  </div>
</template>

<script>
import componentB from "./ComponentB";
export default {
  name: "componentA",
  components: { componentB },
  data() {
    return {
      name: "六哥",
      tag: "帅",
      age: 18
    };
  },
  methods: {
    say() {},
    sing() {}
  }
};
</script>

//componentB
<template>
  <div class="component-b" v-on="$listeners" v-bind="$attrs"></div>
</template>

<script>
export default {
  name: "ComponentB",
  props: {
    age: Number
  },
  mounted() {
    console.log(this.$attrs, this.$listeners);
    //{name: "六哥", tag: "帅"}, {mouseover: ƒ}
  }
};
</script>
```





首先我们来看下面的一张图，图中表示一个多级组件嵌套的情形。

![img](http://www.alonehero.com/wp-content/uploads/2017/12/IMG_0002-1024x634.jpg)

现在我们来讨论一种情况，A组件与C组件怎么通信，我们有多少种解决方案？

1. 我们使用VueX来进行数据管理，但是如果项目中**多个组件共享状态比较少**，项目比较小，并且全局状态比较少,那使用VueX来实现该功能，并没有发挥出**VueX**的威力。
2. 使用B来做中转站，当**A组件**需要把信息传给C组件时，B接受A组件的信息，然后利用属性传给**C组件，**这是一种解决方案，但是如果嵌套的组件过多，会导致代码繁琐，代码维护比较困难;**如果C中状态的改变需要传递给A, 使用事件系统一级级往上传递 。**本来
3. 自定义一个Vue 中央数据总线，这个情况适合碰到组件跨级传递消息，但是使用VueX感觉又有点浪费的项目中，但是缺点是**，碰到多人合作时，代码的维护性较低，代码可读性低**

在很多开发情况下，我们只是想把A组件的信息传递给C组件，如果使用props 绑定来进行信息的传递，虽然能够实现，但是代码并不美观。

在vue2.4中，为了解决该需求，引入了**$attrs** 和**$listeners ，** 新增了**inheritAttrs** 选项。 在版本2.4以前，默认情况下父作用域的不被认作props的属性属性百年孤独，将会“回退”且作为普通的HTML特性应用在子组件的根元素上。如下列的例子

 

*父组件demo代码如下*

```
<template>
   <div>
     <child-dom
      :foo="foo"
      :coo="foo"
     >
     </child-dom>
   </div>
</template>
<script>
   import childDom from "./ChildDom.vue";
   export default {
     data() {
        return {
          foo:"Hello, world",
          coo:"Hello,rui"
        }
     },
     components:{childDom},
   }
</script>
```

子组件child-dom代码如下

```
<template>
   <div>
      <p>foo:{{foo}}</p>
   </div>
</template>
<script>
export default {
 name:'child-dom'
 props:["foo"]
}
</script>
```

当显示父组件时，查看Dom结构，结构如下
![img](http://www.alonehero.com/wp-content/uploads/2017/12/3DF95193E134CB23A56B991AF0226B93.jpg)

在2.4中新增选项**inheritAttrs** inheritAttrs的默认值为true, 将inheritAttrs的值设为**false**, 这些默认的行为会禁止掉。但是通过实例属性**$attrs** ,可以将这些特性生效，且可以通过**v-bind** 绑定到子组件的非根元素上。

修改子组件代码如下

```
<template>
   <div>
      <p>foo:{{foo}}</p>
      <p>attrs:{{$attrs}}</p>
      <childDomChild v-bind="$attrs"></childDomChild>
   </div>
</template>
<script>
import childDomChild from './childDomChild';
export default {
 name:'child-dom'
 props:["foo"],
 inheritAttrs:false,
}
</script>
```

新增子组件 childDomChild

```
<template>
  <div>
   <p>coo:{{coo}}</p>
  </div>
</template>
<script>
  export default {
    name:'childDomChild'
    props:["coo"],
    inheritAttrs:false
  }
</script>
```

输出的结果如下

![img](http://www.alonehero.com/wp-content/uploads/2017/12/WX20171212-120324@2x.png)

从上面的代码，可以看出使用$attrs ，inheritAttrs 属性 能够使用简洁的代码，**将A组件**的数据传递给**C组件 ，**该场景的使用范围还是挺广的。

此时我们又想到了一个问题，**c组件的信息，怎么同步给a组件呢？** 

vue2.4版本新增了$listeners 属性，我们在b组件上 绑定 v-on=”$listeners”, 在a组件中，监听c组件触发的事件。就能把c组件发出的数据，传递给a组件。

A组件代码更新如下

```
<template>
 <div>
   <child-dom
    :foo="foo"
    :coo="coo"
     v-on:upRocket="reciveRocket"
   >
   </child-dom>
 </div>
</template>
<script>
 import childDom from "@/components/ChildDom.vue";
 export default {
   name:'demoNo',
   data() {
     return {
       foo:"Hello, world",
        coo:"Hello,rui"
    }
  },
 components:{childDom},
 methods:{
   reciveRocket(){
      console.log("reciveRocket success")
   }
 }
}
</script>
```

b组件更新如下

```
<template>
 <div>
 <p>foo:{{foo}}</p>
 <p>attrs:{{$attrs}}</p>
 <childDomChild v-bind="$attrs" v-on="$listeners"></childDomChild>
 </div>
</template>
<script>
import childDomChild from './childDomChild';
export default {
 name:'child-dom'
 props:["foo"],
 inheritAttrs:false,
}
</script>
```

c组件更新如下

```
<template> 
 <div>
 <p>coo:{{coo}}</p>
 <button @click="startUpRocket">我要发射火箭</button>
 </div>
</template>
<script>
 export default {
 name:'childDomChild',
 props:['coo'],
 methods:{
 startUpRocket(){
 this.$emit("upRocket");
 console.log("startUpRocket")
 }
 }
 }
</script>
```

运行效果如下

![img](http://www.alonehero.com/wp-content/uploads/2017/12/WX20171212-122714@2x.png)

 

现在我们应该清楚了**$attrs**,**$listerners**，**inheritAttrs** 的作用了吧