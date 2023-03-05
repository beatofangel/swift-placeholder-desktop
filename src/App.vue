<template>
  <v-app>
    <v-app-bar
      :color="$vuetify.theme.dark ? 'grey darken-4' : 'primary'"
      class="title-bar title-bar-drag"
      clipped-left
      app
      flat
      dense
      dark
      fixed
    >
      <div class="d-flex align-center logo">
        <v-img
          alt="App Logo"
          class="shrink mr-4"
          contain
          src="logo.png"
          transition="scale-transition"
          width="40"
        />
      </div>
      <v-app-bar-title class="text-h6"> SWIFT PLACEHOLDER </v-app-bar-title>
      <v-spacer></v-spacer>
      <div class="d-flex flex-nowrap utility-region">
        <v-avatar
          class="hidden-sm-and-down mr-4"
          color="grey darken-1 shrink"
          size="32"
          >A</v-avatar
        >
        <v-switch
          @click="toggleDarkMode"
          :value="$vuetify.theme.dark"
          class="my-auto"
          hide-details
          :ripple="false"
          inset
        ></v-switch>
      </div>
      <div class="d-flex flex-nowrap system-control-region align-self-start">
        <v-btn
          @click="minimize"
          :color="$vuetify.theme.dark ? 'secondary lighten-5' : ''"
          text
          tile
          small
        >
          <v-icon size="20">mdi-minus</v-icon>
        </v-btn>
        <v-btn
          @click="maximize"
          :color="$vuetify.theme.dark ? 'secondary lighten-5' : ''"
          text
          tile
          small
        >
          <v-icon size="18">{{
            maximized
              ? "mdi-checkbox-multiple-blank-outline mdi-rotate-180"
              : "mdi-checkbox-blank-outline"
          }}</v-icon>
        </v-btn>
        <v-hover v-slot="{ hover }">
          <v-btn
            @click="close"
            :color="
              hover
                ? 'error darken-1'
                : $vuetify.theme.dark
                ? 'secondary lighten-5'
                : ''
            "
            :text="!hover"
            elevation="0"
            tile
            small
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-hover>
      </div>
    </v-app-bar>
    <v-navigation-drawer mini-variant mini-variant-width="48" v-if="!showLogin" clipped app>
      <v-tabs grow vertical>
        <template v-for="link in links">
          <v-tooltip transition="fade-transition" :key="link.name" right>
            <template v-slot:activator="{ on, attrs }">
              <v-tab
                style="-webkit-user-drag: none; min-width: unset"
                v-bind="attrs"
                v-on="on"
                class="pl-2 pr-0"
                :to="link.path"
              >
                <v-icon size="32" left>{{
                  $route.path == link.path || $vuetify.theme.dark
                    ? link.icon
                    : `${link.icon}-outline`
                }}</v-icon>
              </v-tab>
            </template>
            {{ link.name }}
          </v-tooltip>
        </template>
        <v-divider></v-divider>
        <v-tooltip transition="fade-transition" right>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              @click="toggleDarkMode"
              v-bind="attrs"
              v-on="on"
              min-width="48"
              width="48"
              height="48"
              text
              tile
            >
              <v-icon
                size="32"
                :color="
                  $vuetify.theme.dark ? 'yellow darken-2' : 'blue lighten-1'
                "
                >{{
                  $vuetify.theme.dark
                    ? "mdi-weather-sunny"
                    : "mdi-weather-night"
                }}</v-icon
              >
            </v-btn>
          </template>
          {{ $vuetify.theme.dark ? "关闭" : "开启" }}夜间模式
        </v-tooltip>
        <v-tooltip transition="fade-transition" right>
          <template v-slot:activator="{ on, attrs }">
            <v-hover v-slot="{ hover }">
              <v-btn
                @click="dialog.settingDialog = !dialog.settingDialog"
                v-bind="attrs"
                v-on="on"
                class="px-0"
                min-width="48"
                width="48"
                height="48"
                text
                tile
              >
                <v-icon
                  size="32"
                  :class="{ 'rotate-transition-120': hover }"
                  :color="
                    $vuetify.theme.dark
                      ? 'secondary lighten-4'
                      : 'secondary lighten-2'
                  "
                  >mdi-cog</v-icon
                >
              </v-btn>
            </v-hover>
          </template>
          设置
        </v-tooltip>
        <v-container
          class="pa-0 fill-height draggable-region"
          fluid
        ></v-container>
      </v-tabs>
    </v-navigation-drawer>
    <v-main>
      <keep-alive>
        <router-view />
      </keep-alive>
      <!-- 避免遮罩层挡住app-bar -->
      <v-overlay :absolute="true" :value="showLogin"></v-overlay>
    </v-main>
    <v-dialog v-model="showLogin" width="unset" no-click-animation hide-overlay persistent light>
      <common-login @input="e=>showLogin = e"></common-login>
    </v-dialog>
    <v-bottom-sheet v-model="dialog.settingDialog">
      <v-sheet class="text-center">
        <v-card>
          <v-toolbar dense flat>
            <v-icon color="primary" class="mr-3">mdi-cog</v-icon>
            <v-app-bar-title>设置</v-app-bar-title>
            <v-spacer></v-spacer>
            <v-btn
              text
              color="red"
              @click="dialog.settingDialog = !dialog.settingDialog"
              icon
            >
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </v-toolbar>
          <v-card-text>
            <v-row>
              <v-col v-for="(setting, key) in settings" :key="key">
                <v-card width="200">
                  <v-card-title class="d-flex justify-center">
                    <v-switch
                      v-if="setting.type === 'BOOL'"
                      true-value="1"
                      false-value="0"
                      v-model="settings[key].value"
                      :label="setting.name"
                      @change="settingChangeHandler({ id: key, ...setting })"
                    ></v-switch>
                    <v-text-field
                      v-else-if="setting.type === 'TEXT'"
                      v-model="settings[key].value"
                      :label="setting.name"
                      dense
                      outlined
                    ></v-text-field>
                    <v-text-field
                      v-else-if="setting.type === 'PATH'"
                      v-model="settings[key].value"
                      :label="setting.name"
                      dense
                      append-icon="mdi-folder"
                      @click="showFolderBrowserDialog(key)"
                      @click:append="showFolderBrowserDialog(key)"
                      clearable
                      readonly
                      outlined
                    ></v-text-field>
                    <template v-else>
                      {{ setting }}
                    </template>
                  </v-card-title>
                  <v-card-text class="grey--text">
                    <v-icon small>mdi-information-variant</v-icon
                    >{{ setting.description }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
            <!-- <v-row v-for="row in settingRow" :key="row">
              <v-col v-for="col in settingCol" :key="col">
                <v-card v-if="(row - 1) * settingCol + col - 1 < settings.length" width="200">
                  <v-card-title class="d-flex justify-center">
                    <v-switch
                      v-if="setting(row, col).type === 'BOOL'"
                      true-value="1" 
                      false-value="0"
                      v-model="setting(row, col).value"
                      :label="setting(row, col).name"
                      @change="updateBoolSetting(setting(row, col))"
                    ></v-switch>
                  </v-card-title>
                  <v-card-text class="grey--text">
                    <v-icon small>mdi-information-variant</v-icon>{{ setting(row, col).description }}
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row> -->
          </v-card-text>
        </v-card>
      </v-sheet>
    </v-bottom-sheet>
    <span
      style="
        position: absolute;
        right: 0;
        bottom: 0;
        opacity: 50%;
        font-size: 28px;
        margin: 20px;
      "
    >
      测试版 v{{ appVersion }}
    </span>
  </v-app>
</template>

<script>
import CommonLogin from './components/Common/CommonLogin.vue'
export default {
  name: "App",
  components: {
    CommonLogin
  },
  mounted() {
    const theme = localStorage.getItem("darkTheme");
    if (theme) {
      if (theme === "true") {
        // this.darkMode = true;
        this.$vuetify.theme.dark = true;
      } else {
        // this.darkMode = false;
        this.$vuetify.theme.dark = false;
      }
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      // this.darkMode = true;
      this.$vuetify.theme.dark = true;
      localStorage.setItem("darkTheme", this.$vuetify.theme.dark.toString());
    }

    this.settings = window.store.getSetting("settings");

    window.ipc.invoke("getAppVersion").then((version) => {
      this.appVersion = version;
    });

    this.$router.options.routes.forEach((route) => {
      this.links.push({
        name: route.name,
        path: route.path,
        icon: route.icon,
      });
    });
  },
  watch: {},
  computed: {
    settingRow() {
      const count = Object.keys(this.settings).length;
      return count > 0 ? Math.floor(count / 6 + 1) : 0;
    },
    settingCol() {
      return 4;
    },
  },
  methods: {
    showFolderBrowserDialog(key) {
      window.ipc
        .invoke("directoryPicker", {
          title: "请选择文件夹",
          directory: this.settings[key].value,
        })
        .then((res) => {
          if (res) {
            this.settings[key].value = res;
            this.settingChangeHandler({ id: key, ...this.settings[key] })
          }
        });
    },
    toggleDarkMode: function () {
      // this.darkMode = !this.darkMode;
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      localStorage.setItem("darkTheme", this.$vuetify.theme.dark.toString());
    },
    setting(row, col) {
      return this.settings[(row - 1) * this.settingCol + col - 1];
    },
    settingChangeHandler(setting) {
      window.settingService.saveSetting(setting).then(() => {
        window.store.saveSetting(setting);
      });
    },
    minimize() {
      window.ipc.invoke("minimize");
    },
    async maximize() {
      this.maximized = await window.ipc.invoke("maximize");
    },
    close() {
      window.ipc.invoke("close");
    },
  },
  data() {
    return {
      links: [],
      // darkMode: false,
      appVersion: null,
      dialog: {
        settingDialog: false,
      },
      settings: null,
      maximized: false,
      showLogin: true
    };
  },
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  // text-align: center;
  color: #2c3e50;
}

.v-slide-group__next > i::before,
.v-slide-group__prev > i::before {
  color: var(--v-primary-lighten1);
}

.v-slide-group__next--disabled > i::before,
.v-slide-group__prev--disabled > i::before {
  color: var(--v-secondary-lighten4);
}

.v-icon.btn-icon-close:hover {
  color: var(--v-error-base);
}

.v-icon.btn-icon-create:hover {
  color: var(--v-success-base);
}

.title-bar > .v-toolbar__content {
  // padding-left: 6px;
  padding-right: 0px;
}

.utility-region,
.system-control-region {
  -webkit-app-region: no-drag;
}

.title-bar-drag {
  -webkit-user-select: none;
  -webkit-app-region: drag;
}

.v-input.v-input--switch--inset .v-input--switch__track:after {
  content: "\1F31E";
  position: absolute;
  margin-top: 2px;
  right: 2px;
}

.v-input.v-input--switch--inset.v-input--is-label-active.v-input--is-dirty
  .v-input--switch__track:after {
  content: "\1F31B";
  position: absolute;
  left: 2px;
}

/* table row drag transition */
.flip-chip-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 1;
  background: rgb(200, 235, 251, 0.4);
}

*::-webkit-scrollbar {
  width: 4px;
}

*::-webkit-scrollbar-track {
  background: var(--v-scrollbarTrack-base);
  /* background: #e6e6e6; */
  /* border-left: 1px solid #dadada; */
}

*::-webkit-scrollbar-thumb {
  background: var(--v-scrollbarThumb-base);
  /* border: solid 2px #e6e6e6; */
  border-radius: 2px;
}

*::-webkit-scrollbar-thumb:hover {
  background: var(--v-scrollbarThumbHover-base);
}

.rotate-transition-120 {
  transform: rotate(120deg);
}

.rotate-transition-120:hover::before {
  color: var(--v-primary-base);
}

.rotate-transition-180 {
  transform: rotate(0.5turn);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s linear;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.placeholder-drop-area {
  border: 1px dashed rgba(0, 0, 0, 0.4) !important;
}

.placeholder-drop-area-hint {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  opacity: 0.5;
  font-size: 20px;
  overflow: hidden;
  pointer-events: none;
}
</style>
