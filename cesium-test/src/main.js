import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { Ion } from 'cesium'
Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIxODdmYjE4Ny1jYTcwLTQ5MmItYTY4MC0wODMzOTg1NjE0YzAiLCJpZCI6MTgxOTM3LCJpYXQiOjE3MDE0MjE5ODh9.fuPg9H1dlvnvOL1RqfiOfZnsw1ixCjwcGjZLSvVyz-A'

createApp(App)
  .use(store)
  .use(router)
  .use(ElementPlus)
  .mount('#app')
