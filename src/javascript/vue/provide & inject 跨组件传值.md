# [provide & inject 跨组件传值](https://www.cnblogs.com/bruce-w/p/12649919.html)

## provide & inject

```
作用：可实现跨组件传值，数据的流只能是向下传递

provide : 必须在分级组件（不一定是app.vue）进行使用，用来给后代组件注入依赖（属性或方法）

inject :  必须在子组件进行使用，用来获取根组件定义的跨组件传递的数据
```

#### 应用方法：

1. 根组件定义：

   ```vue
   <template>
     <div id="app">
       <h1>appVue父组件</h1>
       <Child9/>
     </div>
   </template>
   
   <script>
   import Child9 from './components/child9'
   export default {
     components:{
       Child9,
     },
     /*
     provide(){    //provide作为一个方法使用 ( 推荐使用 )。
       return{
         'userName' : 'bruce',
       }
     },
     */
     provide : {  //provide也可以作为一个对象进行使用.
       "userName" : 'bruce',
     }
   }
   </script>
   ```

2. 子组件接收：

   ```vue
   <template>
       <div class="box">
           <h2>组件10</h2>
           <h3>接受到根组件的传递的数据{{userName}}</h3>   <!-- 使用根组件传递过来的数据 -->
       </div>
   </template>
   <script>
   export default {
      // inject : ['userName']     //inject后面用一个数组接收
      inject : {                   //inject后面可以是一个对象
           userName : {
               default : '默认值'  //指定默认值
           }
       }
   }
   </script>
   ```