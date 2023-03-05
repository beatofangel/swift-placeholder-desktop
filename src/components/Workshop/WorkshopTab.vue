<template>
  <v-container fluid>
    <v-row>
      <v-col class="col-lg-9 col-xl-10">
        <validation-observer ref="observer">
          <v-card
            class="workshop-container pa-1"
            height="calc(100vh - 128px)"
            style="overflow-y: auto"
            flat
          >
            <v-form ref="form" @submit.prevent="onSubmit">
              <v-card
                id="business-category"
                class="mb-6"
                v-intersect="{
                  handler: onIntersect,
                  options: {
                    threshold
                  }
                }"
              >
                <v-card-title
                  ><v-icon left>mdi-menu</v-icon>业务类型</v-card-title
                >
                <v-card-text>
                  <validation-provider
                    name="业务类型"
                    :rules="rules.businessCategory"
                    v-slot="{ errors }"
                  >
                    <v-cascade-select
                      v-model="session.businessCategory"
                      :items="businessCategoryOptions"
                      label="业务类型"
                      placeholder="请选择业务类型"
                      persistent-placeholder
                      :menuProps="{ offsetY: true, closeOnContentClick: false }"
                      :error-messages="errors[0]"
                      item-text="name"
                      item-value="id"
                      clearable
                      open-on-clear
                      outlined
                      :scroll-offset="0"
                    >
                      <template v-slot:append-outer>
                        <v-hover v-slot="{ hover }" v-if="isAdminMode">
                          <v-icon
                            @click="showBusinessCategoryListDialog"
                            :class="{ 'rotate-transition-120': hover }"
                            >mdi-cog</v-icon
                          >
                        </v-hover>
                      </template>
                    </v-cascade-select>
                  </validation-provider>
                </v-card-text>
              </v-card>
              <v-card
                id="template"
                class="mb-6"
                v-intersect="{
                  handler: onIntersect,
                  options: {
                    threshold
                  }
                }"
              >
                <v-card-title><v-icon left>mdi-menu</v-icon>模板</v-card-title>
                <common-list
                  :condition="templateCondition"
                  model="Template"
                  :headers="templateHeaders"
                  :item-names="['name', 'path']"
                  visible
                  hideToolBar
                  show-select
                  flat
                  @change="onTemplateChange"
                  :interceptor="{ save: saveTemplateFile, delete: deleteTemplateFile }"
                >
                  <template v-slot:[`item.path`]="{ item }">
                    <v-icon @click="openTemplate(item.path)">mdi-open-in-new</v-icon>
                  </template>
                  <template v-slot="{ id, name, path, isEdit, cancel, save }">
                    <template-detail :id="id" :name="name" :path="path" :bcId="session.businessCategory" :isEdit="isEdit" @cancel="cancel" @save="save"></template-detail>
                  </template>
                </common-list>
              </v-card>
              <v-card
                id="placeholder"
                class="mb-6"
                height="calc(50vh)"
                v-intersect="{
                  handler: onIntersect,
                  options: {
                    threshold
                  }
                }"
              >
                <v-card-title><v-icon left>mdi-menu</v-icon>占位符</v-card-title>
              </v-card>
              <v-card
                id="preview"
                class="mb-6"
                height="calc(50vh)"
                v-intersect="{
                  handler: onIntersect,
                  options: {
                    threshold
                  }
                }"
              >
                <v-card-title><v-icon left>mdi-menu</v-icon>预览</v-card-title>
              </v-card>
            </v-form>
          </v-card>
          <v-navigation-drawer absolute permanent right floating>
            <template v-slot:prepend>
              <div class="text-h6">目录</div>
            </template>
            <v-divider></v-divider>
            <v-tabs grow vertical v-model="currentCard">
              <v-tab
                v-for="item in items"
                :key="item.title"
                :href="`#${item.id}`"
                @click="gotoCard(item.id)"
                class="justify-start"
              >
                {{ item.title }}
              </v-tab>
            </v-tabs>
            <!-- <v-list
                  dense
                  nav
                >
                  <v-list-item
                    v-for="item in items"
                    :key="item.title"
                    :href="`#${item.id}`"
                    :ripple="false"
                    selectable
                  >
                    <v-list-item-content>
                      <v-list-item-title>{{ item.title }}</v-list-item-title>
                    </v-list-item-content>
                  </v-list-item>
                </v-list> -->
          </v-navigation-drawer>
        </validation-observer>
      </v-col>
    </v-row>
    <v-dialog width="calc(100vw)" v-model="dialog.showBusinessCategoryList">
      <business-category-list
        :visible="dialog.showBusinessCategoryList"
        @close="dialog.showBusinessCategoryList = false"
        @change="updateCategoryOptions"
      ></business-category-list>
    </v-dialog>
  </v-container>
</template>

<script>
import CommonList from "@/components/Common/CommonList.vue";
import TemplateDetail from "@/components/Template/TemplateDetail.vue";
// import WorkshopEdit from "./WorkshopEdit.vue";
import VCascadeSelect from "../VCascadeSelect";
import BusinessCategoryList from "@/components/BusinessCategory/BusinessCategoryList.vue";

export default {
  name: "workshop-tab",
  props: {
    session: {
      type: Object,
      default: () => {},
    },
  },
  components: {
    CommonList,
    TemplateDetail,
    // WorkshopEdit,
    VCascadeSelect,
    BusinessCategoryList,
  },
  mounted() {
    this.adminMode = window.store.getSetting("settings.adminMode").value;
    this.unsubscribe = window.store.onDidChange(
      "settings.adminMode",
      this.switchAdminMode
    );
    this.updateCategoryOptions();
  },
  beforeDestroy() {
    this.unsubscribe && this.unsubscribe();
  },
  watch: {
    session: {
      deep: true,
      handler(val) {
        window.store.saveSession(val);
      },
    },
    // "formData.templates": {
    //   deep: true,
    //   handler(val) {
    //     this.session.templates = val
    //   }
    // },
    "session.businessCategory"(val) {
      console.log("业务分类(watch)：", val);
      this.tab = 0;
      if (val) {
        this.onBusinessCategoryChange();
        this.$emit('input', this.session.id, this.selectedBusinessCategories.map(e=>e.name).join('_'))
      } else {
        this.session.templates.splice(0);
      }
    },
  },
  computed: {
    isAdminMode() {
      return this.adminMode == 1;
    },
    selectedBusinessCategories() {
      const path = [];
      const pathFinder = (obj, level) => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            path.push(obj[i]);
            if (obj[i].id == this.session.businessCategory) {
              return true;
            } else {
              if (obj[i].children) {
                if (pathFinder(obj[i].children, level + 1)) {
                  return true;
                } else {
                  path.pop();
                }
              } else {
                path.pop();
              }
            }
          }
        }
        return false;
      };

      this.session.businessCategory &&
        pathFinder(this.businessCategoryOptions, 0);
      return path;
    },
    currentCard: {
      get() {
        return this.cardQueue.length > 0 ? this.cardQueue[0] : 'business-category'
      },
      set(val) {
        const idx = this.cardQueue.indexOf(val)
        if (idx != -1) {
          this.cardQueue.splice(idx, 1)
        }
        this.cardQueue.unshift(val)
      }
    }
  },
  methods: {
    gotoCard(id) {
      clearTimeout(this.timer)
      this.pauseIntersect = true
      this.$vuetify.goTo(`#${id}`, {
        container: '.workshop-container',
        easing: 'easeInOutCubic',
        offset: -44,
      })
      this.timer = setTimeout(() => {
        this.pauseIntersect = false
      }, 400);
    },
    onIntersect(entries) {
      if (this.pauseIntersect) return
      if (entries[0].intersectionRatio >= 0.8) {
        // console.log(entries[0].target.id, entries[0].target.scrollTop)
        if (!this.cardQueue.includes(entries[0].target.id)) {
          this.cardQueue.unshift(entries[0].target.id)
        }
      } else {
        if (this.cardQueue.length > 0) {
          const idx = this.cardQueue.indexOf(entries[0].target.id)
          if (idx != -1) {
            this.cardQueue.splice(idx, 1)
          }
        }
      }
      // console.log(this.currentCard, this.cardQueue)
    },
    onTemplateChange(tplId) {
      console.log(tplId)
    },
    onTemplatePathChange(tplId, path) {
      console.log(tplId, path);
      // const template = this.session.templates.find(e=>e.id == tplId)
      // if (!template) {
      //   this.session.templates.push({
      //     id: tplId,
      //     path: path,
      //     placeholderGroups: []
      //   })
      // } else {
      //   template.path = path
      // }
    },
    onPlaceholderGroupsChange(tplId, groups) {
      console.log(tplId, groups);
      // const idx = this.session.templates.findIndex(e=>e.id == tplId)
      // if (!idx) {
      //   // dead code
      // } else {
      //   this.$set(this.session.templates[idx], 'placeholderGroups', groups)
      //   // this.session.templates[idx].placeholderGroups = groups
      // }
    },
    switchAdminMode(key, val) {
      this.$set(this, "adminMode", val.value);
    },
    /** 当类型列表修改时，同步修改内容（重新取得下拉菜单） */
    updateCategoryOptions() {
      window.replaceService
        .findBusinessCategoryCascaded()
        .then((data) => {
          this.businessCategoryOptions = data;
        })
        .catch((err) => {
          console.log(err);
          this.$toast.error(`业务类型加载失败！`);
        });
    },
    onBusinessCategoryChange() {
      window.replaceService
        .findTemplateByBcId({ bcId: this.session.businessCategory })
        .then((data) => {
          this.session.templates = data;
          // this.$refs.templateTabs.callSlider();
        })
        .catch((err) => {
          console.log(err);
          this.$toast.error(`模板加载失败！`);
        });
    },
    cancelTemplete() {
      this.dialog.showTemplateDetail = false;
    },
    showTemplateDialog() {
      this.dialog.showTemplateDetail = true;
      this.$set(this, "newTemplate", {
        id: null,
        name: null,
        path: null,
        bcId: this.session.businessCategory,
      });
    },
    saveTemplateFile({ path, ignoreSaveFile }) {
      return ignoreSaveFile
        ? Promise.resolve()
        : window.ipc.invoke("saveFile", {
            srcPath: path,
            folder: this.session.businessCategory,
            type: "template",
          });
    },
    deleteTemplateFile(path) {
      console.log("删除模板文件", path);
      return window.ipc
        .invoke("deleteFile", {
          filePath: path,
        })
        .then(() => {
          this.$toast.success("模板文件删除成功！");
        })
        .catch((err) => {
          console.warn(err);
          this.$toast.warning("模板文件删除失败！");
        });
    },
    saveTemplate(newTemplate) {
      this.saveTemplateFile(newTemplate).then((preResult) => {
        for (const key in preResult) {
          newTemplate[key] && (newTemplate[key] = preResult[key]);
        }
        console.log(newTemplate);
        window.replaceService
          .saveTemplate(newTemplate)
          .then(() => {
            this.dialog.showTemplateDetail = false;
            // this.onBusinessCategoryChange()
            this.$toast.success(`模板保存成功！`);
          })
          .catch((err) => {
            console.log(err);
            this.$toast.error(`模板保存失败！`);
          });
      });
    },
    openTemplate(path) {
      window.ipc.invoke("openFile", path).then((err) => {
        if (err) {
          console.error(err);
        }
      });
    },
    showBusinessCategoryListDialog() {
      this.dialog.showBusinessCategoryList = true;
    },
    showTemplateListDialog() {
      this.dialog.showTemplateList = true;
    },
    // showFolderBrowserDialog() {
    //   window.ipc
    //     .invoke("directoryPicker", {
    //       title: "输出文件夹",
    //       directory: this.formData.outputFolder,
    //     })
    //     .then((res) => {
    //       if (res) {
    //         this.formData.outputFolder = res;
    //       }
    //     });
    // },
  },
  data() {
    return {
      businessCategoryOptions: [],
      // formData: {
      //   businessCategory: null,
      //   outputFolder: null,
      //   templates: [],
      // },
      templateCondition: { bcId: this.session.businessCategory },
      templateHeaders: [
        {
          text: "No.",
          value: "index",
        },
        {
          text: "名称",
          value: "name",
        },
        {
          text: "模板",
          value: "path",
        },
        { text: "操作", value: "actions", align: "center" },
      ],
      rules: {
        businessCategory: { requiredSelect: true },
        outputFolder: { requiredSelect: true },
      },
      processing: {
        submit: false,
      },
      dialog: {
        // showCategoryList: false,
        showBusinessCategoryList: false,
        showTemplateList: false,
        showTemplateDetail: false,
      },
      newTemplate: {},
      tab: 0,
      adminMode: false,
      unsubscribe: null,
      items: [
        { id: "business-category", title: "业务类型" },
        { id: "template", title: "模板" },
        { id: "placeholder", title: "占位符" },
        { id: "preview", title: "预览" },
      ],
      threshold: [0, 0.8, 1.0],
      cardQueue: [],
      pauseIntersect: false,
      timer: null
    };
  },
};
</script>
