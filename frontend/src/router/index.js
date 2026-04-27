import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/login/Login.vue'
import Shop from '@/views/shop/Shop.vue'
import Partita from '@/views/partita/Partita.vue'
import Inventario from '@/views/inventario/Inventario.vue'
import Obiettivi from '@/views/obiettivi/Obiettivi.vue'
import Classifica from '@/views/classifica/Classifica.vue'


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
      path: '/partita/:id',
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
