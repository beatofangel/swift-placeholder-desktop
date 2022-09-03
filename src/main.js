import Vue from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import './validator'
import { ValidationProvider, ValidationObserver } from "vee-validate";

Vue.config.productionTip = false
Vue.component('validation-provider', ValidationProvider)
Vue.component('validation-observer', ValidationObserver)

new Vue({
  vuetify,
  router,
  render: h => h(App)
}).$mount('#app')
