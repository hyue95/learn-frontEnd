var VueObserver = (function (exports) {
  'use strict';

  const globalsWhitelist = new Set(('Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,' +
      'decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,' +
      'Object,Boolean,String,RegExp,Map,Set,JSON,Intl').split(','));

  const EMPTY_OBJ =  Object.freeze({})
      ;

  // b 的属性复制到 a，浅复制
  const extend = (a, b) => {
      for (const key in b) {
          a[key] = b[key];
      }
      return a;
  };
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  const hasOwn = (val, key) => hasOwnProperty.call(val, key); // 有代表修改，没代表新增
  const isFunction = (val) => typeof val === 'function';
  const isObject = (val) => val !== null && typeof val === 'object';
  const objectToString = Object.prototype.toString;
  const toTypeString = (value) => objectToString.call(value);
  const capitalize = (str) => {
      return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // global immutability lock
  let LOCKED = true; // 锁打开后，只读 proxy 不能修改和删除 target 属性
  function lock() {
      LOCKED = true;
  }
  function unlock() {
      LOCKED = false;
  }

  // 内置的 Symbol 值，有13种（与阮大神es6教程中说的11种多了2种：matchAll, asyncIterator），用来指向语言内部使用的方法
  const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol)
      .map(key => Symbol[key])
      .filter(value => typeof value === 'symbol'));

  // 生成 getter 拦截函数
  // 进行依赖收集，如果返回值是对象，生成响应式代理或者只读代理
  function createGetter(isReadonly) {
      return function get(target, key, receiver) {
          const res = Reflect.get(target, key, receiver);
          if (typeof key === 'symbol' && builtInSymbols.has(key)) {
              return res;
          }
          if (isRef(res)) {
              return res.value;
          }
          track(target, "get" /* GET */, key);

          // 如果返回值的对象，再转成代理对象返回，目的是为了能对该进行依赖收集
          // 此处和 vue2.0 的一个区别是：2.0在开始时就通过递归把属性全部改造完了，3.0是取到该值时才进行生成代理对象
          return isObject(res)
              ? isReadonly
                  ? // need to lazy access readonly and reactive here to avoid
                      // circular dependency
                      readonly(res)
                  : reactive(res)
              : res;
      };
  }

  // 设置属性值，并执行相关依赖
  function set(target, key, value, receiver) {
      value = toRaw(value); // 如果是代理对象，则转回原对象
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];

      // 如果旧值是 ref 类型且新值不是，则只改 ref 的 value 值
      if (isRef(oldValue) && !isRef(value)) {
          oldValue.value = value;
          return true;
      }
      const result = Reflect.set(target, key, value, receiver);
      // don't trigger if target is something up in the prototype chain of original
      // 直接在代理对象上执行 set 操作（注意：proxy 对象可作为原型对象使用）
      if (target === toRaw(receiver)) {
          /* istanbul ignore else */
          {
              const extraInfo = { oldValue, newValue: value };
              if (!hadKey) { // 代表新增属性
                  trigger(target, "add" /* ADD */, key, extraInfo);
              }
              else if (value !== oldValue) { // 代表修改属性值
                  trigger(target, "set" /* SET */, key, extraInfo);
              }
          }
      }
      return result;
  }

  // 删除属性值，并执行相关依赖
  function deleteProperty(target, key) {
      const hadKey = hasOwn(target, key);
      const oldValue = target[key];
      const result = Reflect.deleteProperty(target, key);
      if (hadKey) { // 对象删除前含有该 key，则需要执行相关依赖
          /* istanbul ignore else */
          {
              trigger(target, "delete" /* DELETE */, key, { oldValue });
          }
      }
      return result;
  }

  // 判断 target 是否存在 key 属性，并进行一次依赖收集
  function has(target, key) {
      const result = Reflect.has(target, key);
      track(target, "has" /* HAS */, key);
      return result;
  }

  // 拦截属性遍历，并且收集遍历依赖到 targetMap
  function ownKeys(target) {
      track(target, "iterate" /* ITERATE */);
      return Reflect.ownKeys(target);
  }

  // 普通拦截 handler
  const mutableHandlers = {
      get: createGetter(false), // value 值是对象时，value 转为响应式代理
      set,
      deleteProperty,
      has,
      ownKeys
  };
  const readonlyHandlers = {
      get: createGetter(true), // value 值是对象时，value 转为只读代理
      set(target, key, value, receiver) {
          if (LOCKED) {
              {
                  console.warn(`Set operation on key "${String(key)}" failed: target is readonly.`, target);
              }
              return true;
          }
          else {
              return set(target, key, value, receiver);
          }
      },
      deleteProperty(target, key) {
          if (LOCKED) {
              {
                  console.warn(`Delete operation on key "${String(key)}" failed: target is readonly.`, target);
              }
              return true;
          }
          else {
              return deleteProperty(target, key);
          }
      },
      has,
      ownKeys
  };

  const toReactive = (value) => (isObject(value) ? reactive(value) : value); // 将值转为响应式代理对象
  const toReadonly = (value) => (isObject(value) ? readonly(value) : value); // 将值转为只读代理对象

  // map 获取 key 时，进行依赖收集和返回值的响应式处理
  function get(target, key, wrap) {
      target = toRaw(target);
      key = toRaw(key);
      const proto = Reflect.getPrototypeOf(target);
      track(target, "get" /* GET */, key); // 依赖收集
      const res = proto.get.call(target, key); // get 方法存在于原型中
      return wrap(res); // 此处将返回值进行响应式处理
  }

  // Set、Map 判断是否含有个值或属性时，进行依赖收集
  function has$1(key) {
      const target = toRaw(this);
      key = toRaw(key);
      const proto = Reflect.getPrototypeOf(target);
      track(target, "has" /* HAS */, key);
      return proto.has.call(target, key);
  }

  // 获取 Set、Map 长度的时候，收集为其 iterate 属性收集依赖
  function size(target) {
      target = toRaw(target);
      const proto = Reflect.getPrototypeOf(target);
      track(target, "iterate" /* ITERATE */);
      return Reflect.get(proto, 'size', target); // Set、Map 原型上的 size 属性是 get 方法，它里面的 this 指向必须对应 set 或者 map 对象
  }

  // Set 新增值，如果该值之前不存在，执行与新增相关的依赖
  function add(value) {
      value = toRaw(value);
      const target = toRaw(this);
      const proto = Reflect.getPrototypeOf(this);
      const hadKey = proto.has.call(target, value);
      const result = proto.add.call(target, value);
      if (!hadKey) {
          /* istanbul ignore else */
          {
              trigger(target, "add" /* ADD */, value, { value });
          }
      }
      return result;
  }

  // Map 设置值，并根据是“新增”还是“修改”，执行相关依赖
  function set$1(key, value) {
      value = toRaw(value);
      const target = toRaw(this);
      const proto = Reflect.getPrototypeOf(this);
      const hadKey = proto.has.call(target, key);
      const oldValue = proto.get.call(target, key);
      const result = proto.set.call(target, key, value);
      if (value !== oldValue) {
          /* istanbul ignore else */
          {
              const extraInfo = { oldValue, newValue: value };
              if (!hadKey) { // 该值之前不存在，则执行“新增”相关的依赖
                  trigger(target, "add" /* ADD */, key, extraInfo);
              }
              else { // 该值之前存在，则执行“修改”相关的依赖
                  trigger(target, "set" /* SET */, key, extraInfo);
              }
          }
      }
      return result;
  }

  // Set、Map 删除值时，执行与“删除”相关的依赖
  function deleteEntry(key) {
      const target = toRaw(this);
      const proto = Reflect.getPrototypeOf(this);
      const hadKey = proto.has.call(target, key);
      const oldValue = proto.get ? proto.get.call(target, key) : undefined; // 此处的 undefined: 如果是 weakSet 的话，将旧值传出来了就多一次引用，这样可能就清除不了内存了
      // forward the operation before queueing reactions
      const result = proto.delete.call(target, key);
      if (hadKey) {
          /* istanbul ignore else */
          {
              trigger(target, "delete" /* DELETE */, key, { oldValue });
          }
      }
      return result;
  }

  // Set、Map 清除数据时，执行“清除”相关的依赖
  function clear() {
      const target = toRaw(this);
      const proto = Reflect.getPrototypeOf(this);
      const hadItems = target.size !== 0;
      const oldTarget = target instanceof Map ? new Map(target) : new Set(target);
      // forward the operation before queueing reactions
      const result = proto.clear.call(target);
      if (hadItems) {
          /* istanbul ignore else */
          {
              trigger(target, "clear" /* CLEAR */, void 0, { oldTarget });
          }
      }
      return result;
  }

  // 生成Set、Map 通过 forEach 遍历时的代理函数
  function createForEach(isReadonly) {
      return function forEach(callback, thisArg) {
          const observed = this;
          const target = toRaw(observed);
          const proto = Reflect.getPrototypeOf(target);
          const wrap = isReadonly ? toReadonly : toReactive;
          track(target, "iterate" /* ITERATE */);
          // important: create sure the callback is
          // 1. invoked with the reactive map as `this` and 3rd arg
          // 2. the value received should be a corresponding reactive/readonly.

          // 此处需要注意:
          // 1. callback 的第一个和最后一个参数应传 target 的代理对象，这样才能在对 target 处理时能够进行依赖收集
          // 2. 将返回的 value 和 key 都做响应式代理/只读代理处理，以便依赖收集
          // 3. thisArg 的作用存疑？？？
          function wrappedCallback(value, key) {
              return callback.call(observed, wrap(value), wrap(key), observed);
          }
          return proto.forEach.call(target, wrappedCallback, thisArg);
      };
  }

  // 创建Set、Map 等通过 keys、values、entries、Symbol.iterator 生成遍历器的代理函数
  function createIterableMethod(method, isReadonly) {
      return function (...args) {
          const target = toRaw(this);
          const proto = Reflect.getPrototypeOf(target);
          const isPair = method === 'entries' ||
              (method === Symbol.iterator && target instanceof Map);
          const innerIterator = proto[method].apply(target, args);
          const wrap = isReadonly ? toReadonly : toReactive;
          track(target, "iterate" /* ITERATE */);
          // return a wrapped iterator which returns observed versions of the
          // values emitted from the real iterator
          return {
              // iterator protocol
              next() {
                  const { value, done } = innerIterator.next();
                  return done
                      ? { value, done }
                      : {
                          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
                          done
                      };
              },
              // iterable protocol
              [Symbol.iterator]() { // 遍历器的 Symbol.iterator 的属性就是它自身
                  return this;
              }
          };
      };
  }

  // 为只读的 add、set、delete、clear 的会影响值的操作的代理函数加一层拦截：如果已经打开锁，只读代理对象不允许进行操作
  function createReadonlyMethod(method, type) {
      return function (...args) {
          if (LOCKED) {
              {
                  const key = args[0] ? `on key "${args[0]}" ` : ``;
                  console.warn(`${capitalize(type)} operation ${key}failed: target is readonly.`, toRaw(this));
              }
              return type === "delete" /* DELETE */ ? false : this;
          }
          else {
              return method.apply(this, args);
          }
      };
  }

  // 如果直接通过 Reflect 返回原型的方法，proxy 执行会报错，因为 set、map 等原型的方法不能直接被 proxy 对象执行
  // 故而需要再装饰一层方法，既保证 proxy 执行不报错，同时也可以进行依赖收集
  const mutableInstrumentations = {
      get(key) {
          return get(this, key, toReactive); // 此处的 this 指向代理对象
      },
      get size() {
          return size(this);
      },
      has: has$1,
      add, // set 专有
      set: set$1, // map 专有
      delete: deleteEntry,
      clear,
      forEach: createForEach(false)
  };
  const readonlyInstrumentations = {
      get(key) {
          return get(this, key, toReadonly);
      },
      get size() {
          return size(this);
      },
      has: has$1,
      add: createReadonlyMethod(add, "add" /* ADD */),
      set: createReadonlyMethod(set$1, "set" /* SET */),
      delete: createReadonlyMethod(deleteEntry, "delete" /* DELETE */),
      clear: createReadonlyMethod(clear, "clear" /* CLEAR */),
      forEach: createForEach(true)
  };

  // 为生成遍历器的属性添加代理函数
  const iteratorMethods = ['keys', 'values', 'entries', Symbol.iterator];
  iteratorMethods.forEach(method => {
      mutableInstrumentations[method] = createIterableMethod(method, false);
      readonlyInstrumentations[method] = createIterableMethod(method, true);
  });

  // 生成 Set、Map 等的 get 代理函数
  function createInstrumentationGetter(instrumentations) {
      return function getInstrumented(target, key, receiver) {
          target =
              hasOwn(instrumentations, key) && key in target ? instrumentations : target;
          return Reflect.get(target, key, receiver);
      };
  }

  // Set、Map 响应式代理的 handler
  const mutableCollectionHandlers = {
      get: createInstrumentationGetter(mutableInstrumentations)
  };

  // Set、Map 只读代理的 handler
  const readonlyCollectionHandlers = {
      get: createInstrumentationGetter(readonlyInstrumentations)
  };

  const targetMap = new WeakMap(); // 存储所有依赖收集，收集的依赖里面包括：计算属性的fn *****
  // WeakMaps that store {raw <-> observed} pairs.
  const rawToReactive = new WeakMap(); // 原对象 映射 -> 响应式代理对象 *****
  const reactiveToRaw = new WeakMap(); // 响应式代理对象 -> 原对象 *****
  const rawToReadonly = new WeakMap(); // 原对象 -> 只读代理对象 *****
  const readonlyToRaw = new WeakMap(); // 只读代理对象 -> 原对象 *****
  // WeakSets for values that are marked readonly or non-reactive during
  // observable creation.
  const readonlyValues = new WeakSet(); // 只读名单 *****
  const nonReactiveValues = new WeakSet(); // 不能处理成响应式或只读代理的名单 *****
  const collectionTypes = new Set([Set, Map, WeakMap, WeakSet]); // *****
  const observableValueRE = /^\[object (?:Object|Array|Map|Set|WeakMap|WeakSet)\]$/; // 正则 ?: 代表不捕获匹配的文本 *****
  const canObserve = (value) => { // *****
      return (!value._isVue &&
          !value._isVNode &&
          observableValueRE.test(toTypeString(value)) &&
          !nonReactiveValues.has(value));
  };

  // 生成响应式代理对象
  function reactive(target) {
      // if trying to observe a readonly proxy, return the readonly version.
      // target 是只读代理对象，直接返回，已有只读不能再生成响应式
      if (readonlyToRaw.has(target)) {
          return target;
      }
      // target is explicitly marked as readonly by user
      // target 被设置在只读名单里，生成只读代理对象
      if (readonlyValues.has(target)) {
          return readonly(target);
      }
      return createReactiveObject(target, rawToReactive, reactiveToRaw, mutableHandlers, mutableCollectionHandlers);
  }

  // 生成 target 的只读代理对象
  function readonly(target) {
      // value is a mutable observable, retrieve its original and return
      // a readonly version.
      // 如果传入一个响应式代理对象，则取它对应的原对象再生成只读代理对象
      // 总结：已经生成了响应式代理，可再生成只读代理；已经生成只读代理，不能生成响应式代理
      if (reactiveToRaw.has(target)) {
          target = reactiveToRaw.get(target);
      }
      return createReactiveObject(target, rawToReadonly, readonlyToRaw, readonlyHandlers, readonlyCollectionHandlers);
  }

  // 创建 target 的代理对象，存储两者之间的映射，并初始化 target 的依赖集合
  function createReactiveObject(target, toProxy, toRaw, baseHandlers, collectionHandlers) {
      if (!isObject(target)) { // typeof 不为 object 不代理
          {
              console.warn(`value cannot be made reactive: ${String(target)}`);
          }
          return target;
      }
      // target already has corresponding Proxy
      // target 已经有代理（响应式代理/只读代理）对象了，则返回该代理
      let observed = toProxy.get(target);
      if (observed !== void 0) {
          return observed;
      }
      // target is already a Proxy （target 就是 proxy 对象
      // 避免多层代理，不允许已生成的代理（响应式代理/只读代理）再设置代理
      if (toRaw.has(target)) {
          return target;
      }
      // only a whitelist of value types can be observed.
      // 如果对象不满足代理条件，则直接返回该对象
      // 主要条件：对象必须是 Array、Object、Set、Map、WeakSet、WeakMap 之一，且不在不能生成响应式的名单里
      if (!canObserve(target)) {
          return target;
      }

      // set、map、weakSet、weakMap 采用 collectionHandlers 代理
      // 其它采用 baseHandlers 代理
      const handlers = collectionTypes.has(target.constructor)
          ? collectionHandlers
          : baseHandlers;
      observed = new Proxy(target, handlers);
      toProxy.set(target, observed); // 存储 target -> proxy 对象的映射se
      toRaw.set(observed, target); // 存储 proxy -> target 的映射

      // targetMap 的作用是依赖收集
      // target 代理之后，需要在 targetMap 中映射一个 map，map 存储的是 target 属性及其对应依赖的映射
      // targetMap 数据结构：{[target]: {[targetProperty]: [fn, fn...]]}}
      if (!targetMap.has(target)) {
          targetMap.set(target, new Map());
      }
      return observed;
  }

  // 判断是否已存在代理
  function isReactive(value) {
      return reactiveToRaw.has(value) || readonlyToRaw.has(value);
  }

  // 判断是否是只读代理
  function isReadonly(value) {
      return readonlyToRaw.has(value);
  }

  // 由代理对象映射回原对象
  function toRaw(observed) {
      return reactiveToRaw.get(observed) || readonlyToRaw.get(observed) || observed;
  }

  // 手动添加生成只读代理的对象
  function markReadonly(value) {
      readonlyValues.add(value);
      return value;
  }

  // 手动添加不能生成响应式代理的对象 *****
  function markNonReactive(value) {
      nonReactiveValues.add(value);
      return value;
  }

  const activeReactiveEffectStack = [];
  const ITERATE_KEY = Symbol('iterate');

  // 将 fn 函数转为副作用函数，即装饰“执行时将自身推入栈”的功能，以供依赖收集
  function effect(fn, options = EMPTY_OBJ) {
      if (fn.isEffect) {
          fn = fn.raw;
      }
      const effect = createReactiveEffect(fn, options);
      if (!options.lazy) { // 非懒执行，则立即执行一次，进行依赖收集
          effect();
      }
      return effect;
  }

  // 停止 effect 响应
  function stop(effect) {
      if (effect.active) {
          cleanup(effect);
          if (effect.onStop) {
              effect.onStop();
          }
          effect.active = false;
      }
  }

  // 创建副作用函数，并为其添加一些自定义配置
  function createReactiveEffect(fn, options) {
      const effect = function effect(...args) {
          return run(effect, fn, args);
      };
      effect.isEffect = true;
      effect.active = true;
      effect.raw = fn; // effect 的原始函数
      effect.scheduler = options.scheduler; // 代替 effect 执行的回调，effect 作为参数传入
      effect.onTrack = options.onTrack; // effect 被收集后执行的回调
      effect.onTrigger = options.onTrigger; // effect 执行前的回调
      effect.onStop = options.onStop; // effect 停止使用时执行的回调
      effect.computed = options.computed; // 是否是计算属性的 effect
      effect.deps = []; // 拥有该 effect 的所有依赖的集合
      return effect;
  }

  // effect 存入栈中，并执行 fn，从而实现对 effect 的依赖收集
  function run(effect, fn, args) {
      if (!effect.active) { // 如果 effect 不是活动状态，则执行原函数，此时不能收集该 effect
          return fn(...args);
      }
      if (activeReactiveEffectStack.indexOf(effect) === -1) {
          cleanup(effect);
          try { // 这里可能出现 fn 报错
              activeReactiveEffectStack.push(effect);
              return fn(...args);
          }
          finally {
              activeReactiveEffectStack.pop();
          }
      }
  }

  // 删除所有属性对 effect 的依赖
  function cleanup(effect) {
      const { deps } = effect;
      if (deps.length) {
          for (let i = 0; i < deps.length; i++) {
              deps[i].delete(effect);
          }
          deps.length = 0;
      }
  }
  let shouldTrack = true; // 控制是否暂停依赖收集的标识符
  function pauseTracking() {
      shouldTrack = false;
  }
  function resumeTracking() {
      shouldTrack = true;
  }

  // 进行依赖收集的方法
  function track(target, type, key) {
      if (!shouldTrack) {
          return;
      }
      const effect = activeReactiveEffectStack[activeReactiveEffectStack.length - 1];
      if (effect) {
          if (type === "iterate" /* ITERATE */) {
              key = ITERATE_KEY;
          }
          let depsMap = targetMap.get(target);
          if (depsMap === void 0) { // 没有 target 的依赖收集，则新建
              targetMap.set(target, (depsMap = new Map()));
          }
          let dep = depsMap.get(key);
          if (dep === void 0) { // 没有 target 的 key 属性的依赖收集，则新建
              depsMap.set(key, (dep = new Set()));
          }
          if (!dep.has(effect)) {
              // target 和 effect 相互引用
              dep.add(effect);
              effect.deps.push(dep);

              // 如果有依赖收集回调，则执行
              if ( effect.onTrack) {
                  effect.onTrack({
                      effect,
                      target,
                      type,
                      key
                  });
              }
          }
      }
  }

  // 执行不同操作关联的所有依赖
  function trigger(target, type, key, extraInfo) {
      const depsMap = targetMap.get(target);
      if (depsMap === void 0) {
          // never been tracked
          return;
      }

      // 此处需要将 普通 effects 和 计算属性的 effects 分隔开
      // 需要先执行计算属性的 effects, 使它们设置它们内部属性 dirty 为 true, 当普通 effects 里获取计算属性时，才能使计算属性重新计算
      // 此处需要注意：先执行计算属性 effects 不是指先把计算属性值先算出来，而是指将其内部状态改为可计算
      const effects = new Set();
      const computedRunners = new Set();
      if (type === "clear" /* CLEAR */) {
          // collection being cleared, trigger all effects for target
          depsMap.forEach(dep => {
              addRunners(effects, computedRunners, dep);
          });
      }
      else {
          // schedule runs for SET | ADD | DELETE
          // 修改和删除时，取出所有依赖（新增时，依赖为空）
          if (key !== void 0) {
              addRunners(effects, computedRunners, depsMap.get(key));
          }
          // also run for iteration key on ADD | DELETE
          // 遍历对象属性时，也会收集依赖，新增或删除时，属性遍历有变化，取出遍历存储的依赖
          if (type === "add" /* ADD */ || type === "delete" /* DELETE */) {
              const iterationKey = Array.isArray(target) ? 'length' : ITERATE_KEY;
              addRunners(effects, computedRunners, depsMap.get(iterationKey));
          }
      }
      const run = (effect) => {
          scheduleRun(effect, target, type, key, extraInfo);
      };
      // Important: computed effects must be run first so that computed getters
      // can be invalidated before any normal effects that depend on them are run.
      // 先执行计算属性
      computedRunners.forEach(run);
      effects.forEach(run);
  }

  // 将 effects 按 计算属性的effect 和 普通的effect 分类存好
  function addRunners(effects, computedRunners, effectsToAdd) {
      if (effectsToAdd !== void 0) {
          effectsToAdd.forEach(effect => {
              if (effect.computed) {
                  computedRunners.add(effect);
              }
              else {
                  effects.add(effect);
              }
          });
      }
  }

  // 执行 effect 之前，执行 onTrigger
  // 或者：用 effect.scheduler 代替 effect 执行
  function scheduleRun(effect, target, type, key, extraInfo) {
      if ( effect.onTrigger) {
          effect.onTrigger(extend({
              effect,
              target,
              key,
              type
          }, extraInfo));
      }
      if (effect.scheduler !== void 0) {
          effect.scheduler(effect);
      }
      else {
          effect();
      }
  }

  const refSymbol = Symbol( 'refSymbol' ); // ref 对象的标识属性
  const convert = (val) => (isObject(val) ? reactive(val) : val);

  // ref 的作用是让数字、字符串这类基础数据类型也能响应
  // 如果传入对象，则为对象生成 proxy 对象，再生成该 proxy 对象的响应
  function ref(raw) {
      raw = convert(raw);
      const v = {
          [refSymbol]: true,
          get value() {
              track(v, "get" /* GET */, '');
              return raw;
          },
          set value(newVal) {
              raw = convert(newVal);
              trigger(v, "set" /* SET */, '');
          }
      };
      return v;
  }

  // 判断是否是 ref 对象
  function isRef(v) {
      return v ? v[refSymbol] === true : false;
  }

  // 将对象所有属性值转为 ref 对象：对 obj[key] 的操作转为对 obj[key].value 的操作
  // 为对象的属性值设置代理，不管值是复杂还是基础数据类型
  // 对象解构之后，对取出的值进行更改，能同步在原对象上
  // 此处不包含响应式
  function toRefs(object) {
      const ret = {};
      for (const key in object) {
          ret[key] = toProxyRef(object, key);
      }
      return ret;
  }

  // 生成 ref 对象
  function toProxyRef(object, key) {
      const v = {
          [refSymbol]: true,
          get value() {
              return object[key];
          },
          set value(newVal) {
              object[key] = newVal;
          }
      };
      return v;
  }

  function computed(getterOrOptions) {
      const isReadonly = isFunction(getterOrOptions);
      const getter = isReadonly
          ? getterOrOptions
          : getterOrOptions.get;
      const setter = isReadonly
          ? () => {
              // TODO warn attempting to mutate readonly computed value
          }
          : getterOrOptions.set;
      let dirty = true; // 代表是否需要重新计算值
      let value;
      const runner = effect(getter, {
          lazy: true, // 设置为懒执行，则生成 effect 函数时，默认不执行第一次
          // mark effect as computed so that it gets priority during trigger
          computed: true, // 代表该 effect 是计算属性，用于 trigger 执行依赖时进行分类
          scheduler: () => { // trigger 触发时，变化涉及到了该 effect，则设置 dirty 为 true, 从而允许重新计算值
              dirty = true;
          }
      });
      return {
          [refSymbol]: true,
          // expose effect so computed can be stopped
          // 暴露出 effect 的目的是为了能够手动清除 effect 
          effect: runner,
          get value() {
              if (dirty) {
                  value = runner();
                  dirty = false;
              }
              // When computed effects are accessed in a parent effect, the parent
              // should track all the dependencies the computed property has tracked.
              // This should also apply for chained computed properties.
              
              // 当执行计算属性的 effect 时，存在父级 effect，此时计算属性 effect 执行时所用到值也是父级 effect 所依赖的
              // 所以需要在计算属性 effect 的 deps 每一项都存入父级 effect
              trackChildRun(runner);
              return value;
          },
          set value(newValue) {
              setter(newValue);
          }
      };
  }

  // 将父级 effect 存入子 effect 的所有 deps 中
  // 因为子 effect 用到的属性也相当于父 effect 用到的属性
  function trackChildRun(childRunner) {
      const parentRunner = activeReactiveEffectStack[activeReactiveEffectStack.length - 1];
      if (parentRunner) {
          for (let i = 0; i < childRunner.deps.length; i++) {
              const dep = childRunner.deps[i];
              if (!dep.has(parentRunner)) {
                  dep.add(parentRunner);
                  parentRunner.deps.push(dep);
              }
          }
      }
  }

  exports.ITERATE_KEY = ITERATE_KEY;
  exports.computed = computed;
  exports.effect = effect;
  exports.isReactive = isReactive;
  exports.isReadonly = isReadonly;
  exports.isRef = isRef;
  exports.lock = lock;
  exports.markNonReactive = markNonReactive;
  exports.markReadonly = markReadonly;
  exports.pauseTracking = pauseTracking;
  exports.reactive = reactive;
  exports.readonly = readonly;
  exports.ref = ref;
  exports.resumeTracking = resumeTracking;
  exports.stop = stop;
  exports.toRaw = toRaw;
  exports.toRefs = toRefs;
  exports.unlock = unlock;

  return exports;

}({}));
