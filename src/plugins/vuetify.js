import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import colors from 'vuetify/lib/util/colors';
import zhHans from 'vuetify/lib/locale/zh-Hans';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    themes: {
      light: {
        primary: colors.indigo.lighten1, // #E53935
        // secondary: colors.red.lighten4, // #FFCDD2
        // accent: colors.indigo.base, // #3F51B5
      },
    },
    options: { customProperties: true, },
  },
  lang: {
    locales: { zhHans },
    current: 'zhHans'
  }
});
