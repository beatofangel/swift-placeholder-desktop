<template>
  <v-app>
    <v-app-bar app color="primary" dark>
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
    <span style="position:absolute;right:0;bottom:0;opacity:50%;font-size:28px;margin:20px;">
      测试版 v{{ appVersion }}
    </span>
  </v-app>
</template>

<script>
export default {
  name: "App",
  mounted() {
    window.ipc.invoke('getAppVersion').then(version=>{
      this.appVersion = version
    })
    const animationEndCallback = () => {
      setTimeout(() => {
        document.querySelector(".website-loading").remove();
        document
          .querySelector("#app")
          .classList.toggle("website-loading-fadein");
      }, 1000);
    };

    document.querySelector(".website-loading").addEventListener("animationend", animationEndCallback);

    this.$router.options.routes.forEach((route) => {
      this.links.push({
        name: route.name,
        path: route.path,
        icon: route.icon,
      });
    });
    document.querySelector(".website-loading").classList.remove("website-loading-fadein");
    document.querySelector(".website-loading").classList.toggle("website-loading-fadeout");

    // window.ipc
    //   .send("toMain", "test2")
    //   .then(console.log)
    //   .catch(console.log);
    // window.ipc.receive("fromMain").then(console.log).catch(console.log);
    // var remote = require('electron').remote
    // console.log(remote.getGlobal('sharedObject').db)
  },
  data: () => ({
    links: [],
    appVersion: null
  }),
};
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

</style>
