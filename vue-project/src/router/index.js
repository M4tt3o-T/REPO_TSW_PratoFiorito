import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Page.vue'
import Login from '@/views/login/Page.vue'
import Shop from '@/views/shop/Page.vue'
import Partita from '@/views/partita/Page.vue'
import Inventario from '@/views/inventario/Page.vue'
import Obiettivi from '@/views/obiettivi/Page.vue'
import Classifica from '@/views/classifica/Page.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/shop',
      name: 'shop',
      component: Shop,
    },
    {
      path: '/partita',
      name: 'partita',
      component: Partita,
    },
    {
      path: '/inventario',
      name: 'inventario',
      component: Inventario,
    },
    {
      path: '/obiettivi',
      name: 'obiettivi',
      component: Obiettivi,
    },
    {
      path: '/classifica',
      name: 'classifica',
      component: Classifica,
    },
  ],
})

export default router
