import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: "/",
    name: "Map1",
    component: () => import("../views/Map1.vue")
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  if (to.meta.title){
    document.title = to.meta.title
  }
  next()
})

export default router
