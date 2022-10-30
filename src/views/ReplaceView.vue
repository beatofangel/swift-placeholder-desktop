<template>
  <v-container class="pa-0" fluid>
    <v-toolbar style="box-shadow: inset 0 -1px 4px -1px grey" dense>
      <v-slide-group
        v-model="tab"
        @change="onChanged"
        show-arrows
        mandatory
        style="max-width: calc(100vw - 176px)"
        class="align-self-end"
      >
        <v-slide-item
          v-for="item in sessions"
          :key="item.tab"
          v-slot="{ active, toggle }"
        >
          <div class="align-self-end">
            <!-- 由于添加了tooltip，必须在外层嵌套一个容器否则会导致激活标签无法自动显示 -->
            <v-tooltip bottom open-delay="1000">
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  v-bind="attrs"
                  v-on="on"
                  class="mx-1 rounded-b-0 rounded-t-lg text-none tab-border-top"
                  :class="{
                    active: active,
                    'primary--text': active && !editing[item.id],
                    'error--text': editing[item.id],
                    'grey--text text--darken-2': !active && !editing[item.id],
                    'font-weight-bold': active,
                  }"
                  :color="active ? 'white' : 'grey lighten-4'"
                  @click="toggle"
                  :elevation="active ? 4 : 2"
                  :small="!active"
                  :ripple="false"
                >
                  <div style="max-width: 160px" class="text-truncate">
                    {{
                      `${editing[item.id] ? "* " : ""}${calcSessionName(item)}`
                    }}
                  </div>
                  <v-hover v-slot="{ hover }">
                    <v-icon
                      :color="hover ? 'red' : ''"
                      :class="{ 'on-hover': hover }"
                      @click.stop="closeReplacementTab(item)"
                      right
                      >mdi-close</v-icon
                    >
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
      <!-- <v-hover v-slot="{ hover }">
        <v-btn
          @click="newReplacementTab"
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
      </v-hover> -->
      <v-hover v-slot="{ hover }">
        <v-btn @click="newReplacementTab" class="mb-n3" small icon>
          <v-icon :class="{ 'rotate-transition-180': hover }" color="success"
            >mdi-plus</v-icon
          >
        </v-btn>
      </v-hover>
      <v-menu
        v-model="showReplaceMenu"
        offset-y
        :close-on-content-click="false"
      >
        <template v-slot:activator="{ on, attrs }">
          <v-hover v-slot="{ hover }">
            <v-btn
              style="position: absolute; right: 16px"
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
        <v-list min-width="280" dense>
          <template
            v-for="(
              { name, icon, shortcut, handler, disabled }, key
            ) in dotMenuList"
          >
            <v-list-item @click="handler" :disabled="disabled" :key="key">
              <v-list-item-icon class="mr-3">
                <v-icon v-text="icon"></v-icon>
              </v-list-item-icon>
              <v-list-item-title v-text="name"></v-list-item-title>
              <!-- <v-list-item-subtitle class="text-no-wrap d-flex justify-end">{{
                getShortcutForDisplay(shortcut)
              }}</v-list-item-subtitle> -->
              <v-list-item-subtitle class="text-no-wrap d-flex justify-end">
                <common-key :shortcuts="shortcut" no-decorate></common-key>
              </v-list-item-subtitle>
            </v-list-item>
          </template>
        </v-list>
      </v-menu>
    </v-toolbar>
    <v-window v-model="tab">
      <template v-if="sessions.length > 0">
        <v-window-item v-for="session in sessions" :key="session.id">
          <keep-alive>
            <replacement-tab
              :session="session"
              @input="handleBusinessCategoryChange"
            ></replacement-tab>
          </keep-alive>
        </v-window-item>
      </template>
      <div
        style="height: calc(100vh - 124px)"
        class="d-flex flex-column justify-center align-center"
        v-else
      >
        <div class="text-h2 font-weight-medium mb-12 mt-n12">
          <common-key :shortcuts="shortcutNew">
            <template v-slot:prepend><span class="text--disabled">按下&nbsp;</span></template>
            <template v-slot:group-delimiter><span class="text--disabled">&nbsp;或&nbsp;</span></template>
          </common-key>
        </div>
        <div class="text-h2 font-weight-medium text--disabled mb-12">
          开启全新替换旅程！
        </div>
      </div>
    </v-window>
    <common-progress
      v-model="showProgress"
      :indeterminate="indeterminate"
      :total="total"
      :progressed="progressed"
      :completed="completed"
    >
    </common-progress>
  </v-container>
</template>
<script>
import ReplacementTab from "../components/Replacement/ReplacementTab.vue";
import { v4 as uuidv4 } from "uuid";
import Mousetrap from "mousetrap";
import upperFirst from "lodash/upperFirst";
import CommonProgress from "../components/Common/CommonProgress.vue";
import CommonKey from "../components/Common/CommonKey.vue";
export default {
  components: { ReplacementTab, CommonProgress, CommonKey },
  mounted() {
    const savedSessions = window.store.loadSessions();
    if (savedSessions && savedSessions.length > 0) {
      this.sessions.push(...savedSessions);
    }
    window.ipc.receive(`replacePdf`, (result) => {
      this.progressed += 1;
      if (this.progressed == this.total) {
        setTimeout(() => {
          this.completed = true;
          this.$toast.success(`替换完成！`);
          window.ipc.invoke("openFile", result.output);
        }, 500);
      }
    });
  },
  beforeDestroy() {
    window.ipc.removeListener(`replacePdf`);
    console.log(`listener replacePdf is removed.`);
  },
  activated() {
    console.log("bind shortcuts");
    for (const { shortcut, handler } of this.shortcuts) {
      Mousetrap.bind(this.getShortcutSet(shortcut), () => {
        handler();
        return false;
      });
    }
  },
  deactivated() {
    console.log("unbind shortcuts");
    for (const { shortcut } of this.shortcuts) {
      Mousetrap.unbind(this.getShortcutSet(shortcut));
    }
  },
  computed: {
    shortcuts() {
      return [
        {
          id: "new",
          handler: () => {
            this.showReplaceMenu = false;
            this.newReplacementTab();
          },
          icon: "mdi-plus",
          name: "新建",
          shortcut: [
            ["ctrl", "n"],
            ["shift", "n"],
          ],
        },
        {
          id: "close",
          handler: () => {
            this.sessions[this.tab] &&
              this.closeReplacementTab(this.sessions[this.tab]);
          },
          name: "关闭",
          shortcut: ["ctrl", "w"],
          invisible: true,
        },
        {
          id: "replace",
          handler: () => {
            if (this.noSessionDisabled) return;
            this.showReplaceMenu = false;
            this.doReplace();
          },
          icon: "mdi-file-document-outline",
          name: "替换",
          disabled: this.noSessionDisabled,
          shortcut: ["ctrl", "r"],
        },
        {
          id: "replaceAll",
          handler: () => {
            if (this.noSessionDisabled) return;
            this.showReplaceMenu = false;
            this.doReplaceAll();
          },
          icon: "mdi-file-document-multiple-outline",
          name: "全部替换",
          disabled: this.noSessionDisabled,
          shortcut: ["ctrl", "shift", "r"],
        },
      ];
    },
    dotMenuList() {
      return this.shortcuts.filter((e) => !e.invisible);
    },
    shortcutNew() {
      return this.shortcuts.find((e) => e.id == "new").shortcut
    },
    noSessionDisabled() {
      return this.sessions.length == 0;
    },
  },
  methods: {
    // TODO =>mixin
    getShortcutSet(shortcut) {
      if (Array.isArray(shortcut[0])) {
        const shortcutSet = [];
        for (const combination of shortcut) {
          shortcutSet.push(combination.join("+"));
        }
        return shortcutSet;
      } else {
        return shortcut.join("+");
      }
    },
    // TODO =>mixin
    getShortcutSetForDisplay(shortcut, delimiter = " + ") {
      if (Array.isArray(shortcut[0])) {
        const shortcutSet = [];
        for (const combination of shortcut) {
          shortcutSet.push(
            combination.map((e) => upperFirst(e)).join(delimiter)
          );
        }
        return shortcutSet;
      } else {
        return [shortcut.map((e) => upperFirst(e)).join(delimiter)];
      }
    },
    // TODO =>mixin
    getShortcutForDisplay(shortcut, delimiter = ", ") {
      return this.getShortcutSetForDisplay(shortcut).join(delimiter);
    },
    newReplacementTab() {
      const session = {
        id: uuidv4(),
        businessCategory: null,
        templates: [],
      };
      window.ipc.invoke("createSession", session).then((result) => {
        if (result) {
          console.log(result);
          session.name = this.calcSessionName(session);
          this.sessions.push(session);
          this.$nextTick(() => {
            this.tab = this.sessions.length - 1;
          });
        }
      });
    },
    closeReplacementTab({ id }) {
      this.$dialog
        .confirm({ text: `即将删除本次替换，是否继续？` })
        .then((res) => {
          if (res) {
            const index = this.sessions.findIndex((e) => e.id == id);
            if (index != -1) {
              const session = this.sessions.splice(index, 1);
              if (session.length > 0) {
                window.store.deleteSession(session[0].id);
              }
            }
          }
        });
    },
    onChanged(index) {
      console.log(index);
    },
    calcSessionName({ businessCategoryDisplay, id }) {
      if (businessCategoryDisplay) {
        return `${businessCategoryDisplay}-${id}`;
      } else {
        return `替换-${id}`;
      }
    },
    handleBusinessCategoryChange(sessionId, businessCategoryDisplay) {
      const session = this.sessions.find((s) => s.id == sessionId);
      this.$set(session, "businessCategoryDisplay", businessCategoryDisplay);
      console.log(session);
    },
    flattenPlaceholders(placeholderGroup) {
      const ph = [];
      placeholderGroup.forEach((group) => {
        ph.push(...group.placeholders);
      });
      return ph;
    },
    doReplace() {
      console.log("替换");
      this.showProgress = true;
      this.indeterminate = true;
      this.completed = false;
      this.progressed = 0;
      const session = this.sessions[this.tab];
      if (session) {
        this.total = session.templates.length;
        const data = session.templates.map((template, index) => {
          return {
            name: `${session.businessCategoryDisplay}_${session.id}`,
            path: template.path,
            filename: `${index + 1}.${template.name}`,
            data: this.flattenPlaceholders(template.placeholderGroups),
          };
        });
        console.log(data);
        window.ipc.send("replacePdf", data);
        this.$nextTick(() => {
          this.indeterminate = false;
        });
      }
    },
    doReplaceAll() {
      this.$dialog
        .confirm({
          text: `即将替换全部模板，是否继续？`,
        })
        .then((res) => {
          if (res) {
            console.log("批量替换");
            this.showProgress = true;
            this.indeterminate = true;
            this.completed = false;
            this.progressed = 0;
            this.total = 0;
            let data = [];
            this.sessions.forEach((session) => {
              this.total += session.templates.length;
              data.push(
                ...session.templates.map((template, index) => {
                  return {
                    name: `${session.businessCategoryDisplay}_${session.id}`,
                    path: template.path,
                    filename: `${index + 1}.${template.name}`,
                    data: this.flattenPlaceholders(template.placeholderGroups),
                  };
                })
              );
            });
            console.log(data);
            window.ipc.send("replacePdf", data);
            this.$nextTick(() => {
              this.indeterminate = false;
            });
          }
        });
    },
  },
  data() {
    return {
      tab: null,
      showReplaceMenu: false,
      sessions: [],
      showProgress: false,
      indeterminate: true,
      progressed: 0,
      total: 0,
      completed: false,

      editing: [],
    };
  },
};
</script>
<style scoped>
::v-deep(.tab-border-top) {
  border-top: 1px solid #f5f5f5 !important;
}
</style>
