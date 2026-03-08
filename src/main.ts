import { createApp } from 'vue'
import { router } from './router'
import App from './App.vue'

import '@unocss/reset/tailwind.css'
import 'uno.css'
import './assets/styles/main.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
