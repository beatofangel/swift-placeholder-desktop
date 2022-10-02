<template>
  <v-app>
    <v-app-bar :color="darkMode ? 'grey darken-4' : 'primary'" app dark>
      <div class="d-flex align-center">
        <v-img
          alt="App Logo"
          class="shrink mr-2"
          contain
          src="logo.png"
          transition="scale-transition"
          width="40"
        />
      </div>
      <v-tabs>
        <v-tab v-for="link in links" :key="link.name" :to="link.path">
          {{ link.name }}
        </v-tab>
      </v-tabs>
      <v-spacer></v-spacer>
      <v-hover v-slot="{ hover }">
        <v-btn @click="dialog.settingDialog = !dialog.settingDialog" icon>
          <v-icon :class="{ 'rotate-transition-120': hover }">mdi-cog</v-icon>
        </v-btn>
      </v-hover>
      <v-btn @click="toggleDarkMode" icon>
        <v-icon>{{
          darkMode ? "mdi-weather-night" : "mdi-weather-sunny"
        }}</v-icon>
      </v-btn>
      <v-avatar
        class="hidden-sm-and-down"
        color="grey darken-1 shrink"
        size="32"
        >A</v-avatar
      >
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
    <v-bottom-sheet v-model="dialog.settingDialog" persistent>
      <v-sheet
        class="text-center"
      >
        <v-card>
          <v-toolbar dense flat>
            <v-app-bar-nav-icon><v-icon color="primary">mdi-cog</v-icon></v-app-bar-nav-icon>
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
                      @change="settingChangeHandler(setting)"
                    ></v-switch>
                  </v-card-title>
                  <v-card-text class="grey--text">
                    <v-icon small>mdi-information-variant</v-icon>{{ setting.description }}
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
export default {
  name: "App",
  mounted() {
    const theme = localStorage.getItem("darkTheme");
    if (theme) {
      if (theme === "true") {
        this.darkMode = true;
        this.$vuetify.theme.dark = true;
      } else {
        this.darkMode = false;
        this.$vuetify.theme.dark = false;
      }
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      this.darkMode = true;
      this.$vuetify.theme.dark = true;
      localStorage.setItem("darkTheme", this.$vuetify.theme.dark.toString());
    }

    window.ipc.invoke("getAppVersion").then((version) => {
      this.appVersion = version;
    });
    // const animationEndCallback = () => {
    //   setTimeout(() => {
    //     document.querySelector(".website-loading").remove();
    //     document
    //       .querySelector("#app")
    //       .classList.toggle("website-loading-fadein");
    //   }, 1000);
    // };

    // document.querySelector(".website-loading").addEventListener("animationend", animationEndCallback);

    this.$router.options.routes.forEach((route) => {
      this.links.push({
        name: route.name,
        path: route.path,
        icon: route.icon,
      });
    });
    // document.querySelector(".website-loading").classList.remove("website-loading-fadein");
    // document.querySelector(".website-loading").classList.toggle("website-loading-fadeout");

    // window.ipc
    //   .send("toMain", "test2")
    //   .then(console.log)
    //   .catch(console.log);
    // window.ipc.receive("fromMain").then(console.log).catch(console.log);
    // var remote = require('electron').remote
    // console.log(remote.getGlobal('sharedObject').db)
  },
  watch: {
    "dialog.settingDialog"(val) {
      if (val) {
        window.settingService.findSettingAll().then(settings => {
          window.store.initSettings(settings)
          this.settings = settings
        })
      }
    }
  },
  computed: {
    settingRow() {
      const count = Object.keys(this.settings).length
      return count > 0 ? Math.floor(count / 6 + 1) : 0
    },
    settingCol() {
      return 4
    },
  },
  methods: {
    toggleDarkMode: function () {
      this.darkMode = !this.darkMode;
      this.$vuetify.theme.dark = !this.$vuetify.theme.dark;
      localStorage.setItem("darkTheme", this.$vuetify.theme.dark.toString());
    },
    setting(row, col) {
      return this.settings[(row - 1) * this.settingCol + col - 1]
    },
    settingChangeHandler(setting) {
      window.settingService.saveSetting(setting).then(()=>{
        window.store.saveSetting(setting)
        // this.$forceCompute('isAdminMode')
      })
    }
  },
  data() {
    return {
      links: [],
      darkMode: false,
      appVersion: null,
      dialog: {
        settingDialog: false
      },
      settings: null
    }
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
</style>
