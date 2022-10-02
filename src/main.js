import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import './validator'
import { ValidationProvider, ValidationObserver } from "vee-validate"
import VueIframe from 'vue-iframes'
import Toast from "vue-toastification"
import "vue-toastification/dist/index.css"

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
