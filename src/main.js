import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import './validator'
import { ValidationProvider, ValidationObserver } from "vee-validate"
import VueIframe from 'vue-iframes'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"
import VuetifyDialog from 'vuetify-dialog'
import 'vuetify-dialog/dist/vuetify-dialog.css'
import UniqueId from 'vue-unique-id'

Vue.use(VuetifyDialog, {
  context: {
    vuetify
  },
  warning: {
    actions: {
      false: '取消',
      true: {
        text: '确定',
        flat: false,
        color: 'primary'
      }
    },
    title: '警告'
  },
  confirm: {
    actions: {
      false: '取消',
      true: {
        text: '确定',
        flat: false,
        color: 'primary'
      }
    },
    title: '提示',
    // icon: false, // to disable icon just put false
  },
})

Vue.use(UniqueId)

Vue.prototype.$forceCompute= function(computedName, forceUpdate /* default: true */) {
  const func = (vm) => {
    if (vm._computedWatchers && vm._computedWatchers[computedName]) {
      vm._computedWatchers[computedName].run();
      if (forceUpdate || typeof forceUpdate == 'undefined') vm.$forceUpdate()
    }
    if (vm.$children) {
      for (const child of vm.$children) {
        func(child)
      }
    }
  }
  func(this)
  // if (forceUpdate || typeof forceUpdate == 'undefined') this.$forceUpdate()
	// if (this._computedWatchers[computedName]) {
	// 	this._computedWatchers[computedName].run();
	// 	if (forceUpdate || typeof forceUpdate == 'undefined') this.$forceUpdate()
	// }
}
String.prototype.format = function () {
  // store arguments in an array
  var args = arguments;
  // use replace to iterate over the string
  // select the match and check if the related argument is present
  // if yes, replace the match with the argument
  return this.replace(/{([0-9]+)}/g, function (match, index) {
    // check if the argument is present
    return typeof args[index] == 'undefined' ? match : args[index];
  });
};
Vue.prototype.$formatPlaceholder = function(item) {
  const name = typeof item == 'object' ? item.name : item
  const { value } = window.store.get('settings.placeholderFormat')
  return value.format(name)
  // return `$\{${name}}`;
},
Vue.prototype.$parsePlaceholder = function(strPlaceholder) {
  // const regex = /\$\{(.*)\}/;
  const { value } = window.store.get('settings.placeholderRegex');
  const regex = new RegExp(value);
  const arr = regex.exec(strPlaceholder);
  return arr.length > 1 ? arr[1] : null;
}

Vue.config.productionTip = false
Vue.component('validation-provider', ValidationProvider)
Vue.component('validation-observer', ValidationObserver)
Vue.use(VueIframe)
const options = {
  // You can set your default options here
}
Vue.use(Toast, options)

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
