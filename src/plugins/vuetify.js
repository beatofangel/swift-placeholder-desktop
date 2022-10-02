import Vue from 'vue';
import Vuetify from 'vuetify/lib/framework';
import colors from 'vuetify/lib/util/colors';
import zhHans from 'vuetify/lib/locale/zh-Hans';

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: false,
    themes: {
      light: {
        scrollbarTrack: colors.grey.lighten4,
        scrollbarThumb: colors.grey.lighten1,
        scrollbarThumbHover: colors.grey.darken1
      },
      dark: {
        scrollbarTrack: colors.grey.darken1,
        scrollbarThumb: colors.grey.lighten1,
        scrollbarThumbHover: colors.grey.lighten4
      },
    },
    options: { customProperties: true, },
  },
  lang: {
    locales: { zhHans },
    current: 'zhHans'
  },
});
