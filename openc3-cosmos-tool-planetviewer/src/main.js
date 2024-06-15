import 'systemjs-webpack-interop/auto-public-path/2'
import singleSpaVue from 'single-spa-vue'
import Vue from 'vue'

import store from '@openc3/tool-common/src/plugins/store'
import App from './App.vue'
import router from './router'

Vue.config.productionTip = false

import '@openc3/tool-common/src/assets/stylesheets/layout/layout.scss'
import Dialog from '@openc3/tool-common/src/plugins/dialog'
import Notify from '@openc3/tool-common/src/plugins/notify'
import vuetify from '@openc3/tool-common/src/plugins/vuetify'
import PortalVue from 'portal-vue'

Vue.use(PortalVue)
Vue.use(Dialog)
Vue.use(Notify, { store })

const vueLifecycles = singleSpaVue({
  Vue,
  appOptions: {
    router,
    store,
    vuetify,
    render(h) {
      return h(App, {
        props: {},
      })
    },
    el: '#openc3-tool',
  },
})

export const bootstrap = vueLifecycles.bootstrap
export const mount = vueLifecycles.mount
export const unmount = vueLifecycles.unmount
