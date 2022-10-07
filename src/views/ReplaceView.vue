<template>
  <v-container class="pa-0" fluid>
    <v-toolbar style="box-shadow: inset 0 -1px 4px -1px grey" dense>
      <v-slide-group
        v-model="tab"
        @change="onChanged"
        show-arrows
        mandatory
        style="min-width:calc(100vw - 176px);max-width:calc(100vw - 176px);"
        class="align-self-end"
      >
        <v-slide-item
          v-for="item in sessions"
          :key="item.tab"
          v-slot="{ active, toggle }"
        >
          <div class="align-self-end">
            <!-- 由于添加了tooltip，必须在外层嵌套一个容器否则会导致激活标签无法自动显示 -->
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  class="mx-1 rounded-b-0 rounded-t-lg text-none"
                  :class="{ 'active': active, 'primary--text': active && !editing[item.id], 'error--text': editing[item.id], 'grey--text text--darken-2': !active && !editing[item.id], 'font-weight-bold': active }"
                  :color="active ? 'white' : 'grey lighten-4'"
                  @click="toggle"
                  :elevation="active ? 4 : 2"
                  :small="!active"
                  :ripple="false"
                >
                  <div style="max-width: 160px;" class="text-truncate">{{ `${editing[item.id] ? '* ' : ''}${calcSessionName(item)}` }}</div>
                  <v-hover v-slot="{ hover }">
                    <v-icon
                      :color="hover ? 'red' : ''"
                      :class="{ 'on-hover': hover }"
                      @click.stop="closeReplace(item)"
                      right
                    >mdi-close</v-icon>
                  </v-hover>
                </v-btn>
              </template>
              {{ calcSessionName(item) }}
            </v-tooltip>
          </div>
        </v-slide-item>
      </v-slide-group>
      <!-- <v-tabs v-model="tab">
        <v-tabs-slider></v-tabs-slider>
        <v-tab v-for="session in sessions" :key="session.id">
          <span class="text-h6">{{ session.name }}</span>
          <v-icon class="btn-icon-close" :ripple="false" @click="cancelReplace(session)" right>mdi-close</v-icon>
        </v-tab>
      </v-tabs> -->
      <v-hover v-slot="{ hover }">
        <v-btn
          @click="newReplace"
          height="100%"
          color="transparent"
          min-width="48"
          class="px-2"
          depressed
          tile
        >
          <v-icon
            :class="{ 'rotate-transition-180': hover, 'mb-n3': !hover }"
            color="success"
            >mdi-plus</v-icon
          >
        </v-btn>
      </v-hover>
      <v-menu offset-y>
        <template v-slot:activator="{ on, attrs }">
          <v-hover v-slot="{ hover }">
            <v-btn
              v-bind="attrs"
              v-on="on"
              height="100%"
              color="transparent"
              min-width="48"
              class="px-2"
              depressed
              tile
            >
              <v-icon :class="{ 'mb-n3': !hover }">mdi-dots-vertical</v-icon>
            </v-btn>
          </v-hover>
        </template>
        <v-list dense>
          <v-list-item @click="newReplace">
            <v-list-item-icon>
              <v-icon color="success">mdi-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-title>新建</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-window v-model="tab">
      <v-window-item v-for="item in sessions" :key="item.id">
        <keep-alive>
          <replace-tab :session="item"></replace-tab>
        </keep-alive>
      </v-window-item>
    </v-window>
    <!-- <v-tabs-items v-model="tab">
      <v-tab-item v-for="{ id } in sessions" :key="id">
        <keep-alive>
          <replace-tab :id="id"></replace-tab>
        </keep-alive>
      </v-tab-item>
    </v-tabs-items> -->
  </v-container>
</template>
<script>
import ReplaceTab from "../components/Replacement/ReplaceTab.vue";
import { v4 as uuidv4 } from "uuid";
// import moment from "moment";
export default {
  components: { ReplaceTab },
  methods: {
    newReplace() {
      const session = {
        id: uuidv4(),
      }
      session.name = this.calcSessionName(session)
      this.sessions.push(session);
      this.$nextTick(()=>{
        this.tab = this.sessions.length - 1
      })
    },
    closeReplace({ id, name }) {
      this.$dialog.confirm({ text: `确定要关闭<${name}>？<br/>（系统将自动为您保存所有内容）` }).then(res => {
        if (res) {
          const index = this.sessions.findIndex(e=>e.id == id)
          index != -1 && this.sessions.splice(index, 1)
        }
      })
    },
    onChanged(index) {
      console.log(index)
    },
    calcSessionName({ businessCategory, id }) {
      if (businessCategory && businessCategory.id) {
        return `${businessCategory.name}-${id}`
      } else {
        return `替换-${id}`
      }
    },
  },
  data() {
    return {
      tab: null,
      sessions: [],
      
      editing: []
    };
  },
};
</script>
