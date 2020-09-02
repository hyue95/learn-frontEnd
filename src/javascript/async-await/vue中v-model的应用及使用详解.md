### vue中v-model的应用及使用详解

​	v-model用于表单数据的双向绑定，其实它就是一个语法糖。这篇文章主要介绍了vue中v-model的应用,需要的朋友可以参考下vue中经常使用到<input>和<textarea>这类表单元素，vue对于这些元素的数据绑定和我们以前经常用的jQuery有些区别。vue使用v-model实现这些标签数据的双向绑定，它会根据控件类型自动选取正确的方法来更新元素。

  v-model本质上是一个语法糖。如下代码`<input v-model="test">`本质上是<`input :value="test" @input="test = $event.target.value">`，其中@input是对<input>输入事件的一个监听:value="test"是将监听事件中的数据放入到input，下面代码是v-model的一个简单的例子。在这边需要强调一点，v-model不仅可以给input赋值还可以获取input中的数据，而且数据的获取是实时的，因为语法糖中是用@input对输入框进行监听的。可以在如下div中加入<p>{{ test}}</p>获取input数据，然后去修改input中数据会发现<p></p>中数据随之改变。

```html
<div id=``"app"``>``
  ``<input v-model=``"test"``>`` ``<!-- <input :value=``"test"` `@input=``"test= $event.target.value"``> --><!--语法糖-->``</div>`
`<script src=``"/resources/js/vue.js"``></script>``<script>`` ``new` `Vue({``  ``el: ``'#app'``,``  ``data: {``   ``test: ``'这是一个测试'``  ``}`` ``});``</script>
```

**1.v-model在input的下拉框、单选按钮、复选框中的应用**

  如下面代码，分别是v-model在input不同的组件中的应用，但是大体用法相同。注意：像下面代码中复选框这样需要接收多条数据的情况下，在data里面应该由数组与其对应二不是字符串。

  这里有一个值绑定的问题，不管是下拉框或者单选按钮还是复选框，我们都可以在对应的标签内设置value。以下拉框为例，我们在<option>中添加了vulue=“A被选”，当我们选择第一个下拉框A的时候，在selected中的字符串为‘A被选'，如果我们不在<option>中设置value值的话那么selected中的字符串将是<option>中的值‘A'。

  这里还有一个和vue无关的问题，比较简单，但是由于平时主要做后台java开发没太注意这个前端问题。以下面的单选按钮代码为例，<label>标签内有一个for元素与input中的id值对应(两个值相同)，刚开始不太理解为什么这么写，这个对前端人员来说应该是一个很简单的问题。这样写的目的没有其它任何作用，只是label元素为鼠标改进了可用性，在点击label的时候也相当于点击了对应的input控件，点击label标签也可以触发input标签控件。例如单选按钮在加了for之后点击small也可以选择对应按钮，但是如果不加for是没有任何反应的。

```
<!--下拉框-->``<div id=``"app"``>`` ``<select v-model=``"selected"``>``  ``<option value=``"A被选"``>A</option>``  ``<option value=``"B被选"``>B</option>``  ``<option value=``"C被选"``>C</option>`` ``</select>`` ``<span>Selected: {{ selected }}</span>``</div>``<script src=``"/resources/js/vue.js"``></script>``<script>`` ``new` `Vue({``  ``el: ``'#app'``,``  ``data: {``   ``selected: ``''``  ``}`` ``});``</script>` `<!--单选按钮-->``<div id=``"app"``>`` ``<input type=``"radio"` `id=``"small"` `value=``"small_value"` `v-model=``"picked"``>`` ``<label ``for``=``"small"``>small</label>`` ``<br>`` ``<input type=``"radio"` `id=``"big"` `value=``"big_value"` `v-model=``"picked"``>`` ``<label ``for``=``"big"``>big</label>`` ``<br>`` ``<span>Picked: {{ picked }}</span>``</div>``<script src=``"/resources/js/vue.js"``></script>``<script>`` ``new` `Vue({``  ``el: ``'#app'``,``  ``data: {``   ``picked: ``''``  ``}`` ``})``</script>` `<!--复选框-->``<div id=``"app"``>`` ``<input type=``"checkbox"` `id=``"one"` `value=``"value_one"` `v-model.lazy=``"checkedNames"``>`` ``<label ``for``=``"one"``>选项一</label>`` ``<input type=``"checkbox"` `id=``"two"` `value=``"value_two"` `v-model.lazy=``"checkedNames"``>`` ``<label ``for``=``"two"``>选项二</label>`` ``<input type=``"checkbox"` `id=``"three"` `value=``"value_three"` `v-model.lazy=``"checkedNames"``>`` ``<label ``for``=``"three"``>选项三</label>`` ``<br>`` ``<span>Checked names: {{ checkedNames }}</span>``</div>``<script src=``"/resources/js/vue.js"``></script>``<script>`` ``new` `Vue({``  ``el: ``'#app'``,``  ``data: {``   ``checkedNames: []``  ``}`` ``})``</script>
```

**2.v-model修饰符**

  v-model也可以和.lazy、.trim和.number这些修饰符一起使用。

```
<!-- 在每次 input 事件触发后将输入框的值与数据进行同步，添加 lazy 修饰符，从而转变为使用 change 事件进行同步 -->``<input v-model.lazy=``"msg"` `>``<!--去除字符串首尾的空格-->``<input v-model.trim=``"msg"``>``<!--将数据转化为值类型-->``<input v-model.number=``"age"` `type=``"number"``>
```

  .trim和.number的用法比较简单，这里就不做过多解释。.lazy相当于一个延迟加载的过程。在上面我们讲过<input v-model="test">相当于一个语法糖`<input :value="test" @input="test = $event.target.value">，`而`<input v-model.lazy="msg" >`则相当将input的实时更新改为一个change事件，v-model.lazy只有当焦点移除input时才会触发事件。下图1位v-model效果，图2位v-model.lazy效果。

![img](https://img.jbzj.com/file_images/article/201806/201862785813429.png?201852785843)

**下面在单独给大家介绍下vue中v-model使用**

v-model用于表单数据的双向绑定，其实它就是一个语法糖，这个背后就做了两个操作：

  1. v-bind绑定一个value属性

  2. v-on指令给当前元素绑定input事件

自定义组件使用v-model，应该有以下操作：

\1. 接收一个value prop

\2. 触发input事件，并传入新值

在原生表单元素中：

```
<input v-model=``"inputValue"``>
```

相当于

```
<input v-bind:value=``"inputValue"` `v-on:input=``"inputValue = $event.target.value"``>
```

在自定义组件中

```
<my-component v-model=``"inputValue"``></my-component>
```

相当于

```
<my-component v-bind:value=``"inputValue"` `v-on:input=``"inputValue = argument[0]"``></my-component>
```

这个时候，inputValue接受的值就是input事件的回调函数的第一个参数，所以在自定义组件中，要实现数据绑定，还需要$emit去触发input的事件。

```
this``.$emit(``'input'``, value)
```

