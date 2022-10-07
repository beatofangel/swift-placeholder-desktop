import Vue from 'vue'
import VueRouter from 'vue-router'
// import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    icon: 'mdi-home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/replace',
    name: '替换',
    icon: 'mdi-file-replace',
    component: () => import('../views/ReplaceView.vue')
  },
  {
    path: '/about',
    name: 'About',
    icon: 'mdi-help-circle',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/AboutView.vue')
  }
]

const router = new VueRouter({
  routes
})

export default router
