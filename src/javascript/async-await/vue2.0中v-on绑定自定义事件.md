vue2.0中v-on绑定自定义事件


vue中父组件通过prop传递数据给子组件，而想要将子组件的数据传递给父组件，则可以通过自定义事件的绑定。

每个 Vue 实例都实现了事件接口，即：

使用 $on(eventName) 监听事件
使用 $emit(eventName) 触发事件
父组件可以在使用子组件的地方直接用 v-on 来监听子组件触发的事件。

html代码

![image-20200611165616259](/Users/huanyuexie/Library/Application Support/typora-user-images/image-20200611165616259.png)

注册组件

![image-20200611165630053](/Users/huanyuexie/Library/Application Support/typora-user-images/image-20200611165630053.png)

创建Vue实例

![image-20200611165648032](/Users/huanyuexie/Library/Application Support/typora-user-images/image-20200611165648032.png)

这个例子是一个极简版的购物车合计，商品数量只要增加就合计一次总金额。子组件上绑定有一个click事件，每点击一次数量都会+1，同时，为了总金额也改变，通过v-on来监听了子组件的事件发生，用$emit触发了实例中的方法来改变总金额，需要的话方法中可带参数。用$children 找到了子组件中的数据。
