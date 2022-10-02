<template>
  <v-container>
    <v-row>
      <v-col>
        <validation-observer
          ref="observer"
          :disabled="dialog.showCategoryList"
          v-slot="{ invalid }"
        >
          <v-form ref="form" @submit.prevent="onSubmit">
            <v-card height="calc(100vh - 100px)">
              <v-card-text>
                <v-row>
                  <v-col>
                    <validation-provider
                      name="业务类型"
                      :rules="rules.businessCategory"
                      v-slot="{ errors }"
                    >
                      <v-cascade-select
                        v-model="formData.businessCategory"
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
                      >
                        <template v-slot:append-outer>
                          <v-hover v-slot="{ hover }" v-if="isAdminMode">
                            <v-icon @click="showBusinessCategoryListDialog" :class="{ 'rotate-transition-120': hover }">mdi-cog</v-icon>
                          </v-hover>
                        </template>
                      </v-cascade-select>
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <validation-provider
                      name="输出文件夹"
                      :rules="rules.outputFolder"
                      v-slot="{ errors }"
                    >
                      <v-text-field
                        v-model="formData.outputFolder"
                        label="输出文件夹"
                        :error-messages="errors[0]"
                        placeholder="请选择输出文件夹"
                        persistent-placeholder
                        append-icon="mdi-folder"
                        @click:append="showFolderBrowserDialog"
                        clearable
                        readonly
                        outlined
                      >
                      </v-text-field>
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-card>
                      <v-toolbar
                        :color="$vuetify.theme.dark ? 'grey darken-4' : 'primary'"
                        dark
                      >
                        <!-- <v-icon color="grey lighten-2">mdi-file-document-multiple-outline</v-icon> -->
                        <v-tabs
                          v-model="tab"
                          ref="templateTabs"
                          align-with-title
                        >
                          <v-tabs-slider :key="formData.templates[tab] == null ? 'not_found' : formData.templates[tab].id"></v-tabs-slider>
                          <v-tab
                            v-for="{ id, name } in formData.templates"
                            :key="id"
                          >
                            <span class="text-h6">{{ name }}</span>
                          </v-tab>
                          <v-hover v-slot="{ hover }" v-if="formData.businessCategory && formData.templates.length == 0">
                            <v-btn @click="showTemplateDialog" height="100%" color="transparent" depressed tile>
                              <v-icon :class="{ 'rotate-transition-180': hover }">mdi-plus</v-icon><span class="text-h6">添加模板</span>
                            </v-btn>
                          </v-hover>
                          <v-hover v-slot="{ hover }" v-if="formData.businessCategory && formData.templates.length > 0">
                            <v-btn @click="showTemplateListDialog" height="100%" color="transparent" depressed tile>
                              <v-icon :class="{ 'rotate-transition-120': hover }">mdi-cog</v-icon>
                            </v-btn>
                          </v-hover>
                          <v-banner v-if="!formData.businessCategory">
                            <v-icon class="mt-n1 mr-1" color="warning">mdi-alert</v-icon>
                            <span class="text-h6">未选择业务类型</span>
                          </v-banner>
                        </v-tabs>
                      </v-toolbar>
                      <v-tabs-items v-model="tab">
                        <v-tab-item
                          v-for="{ id, path } in formData.templates"
                          :key="id"
                        >
                        <keep-alive>
                          <replacement-edit
                            :tplId="id"
                            :tplPath="path"
                          >
                          </replacement-edit>
                        </keep-alive>
                        </v-tab-item>
                      </v-tabs-items>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
              <v-card-actions class="px-4">
                <v-spacer></v-spacer>
                <v-btn
                  type="submit"
                  :loading="processing.submit"
                  :disabled="invalid"
                  color="primary"
                  >开始替换</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-form>
        </validation-observer>
      </v-col>
    </v-row>
    <v-dialog width="calc(100vw)" v-model="dialog.showBusinessCategoryList">
      <business-category-list
        :businessCategories="selectedBusinessCategories"
        :visible="dialog.showBusinessCategoryList"
        @close="dialog.showBusinessCategoryList = false"
        @change="updateCategoryOptions"
      ></business-category-list>
    </v-dialog>
    <v-dialog width="600" v-model="dialog.showTemplateList">
      <common-list
        :condition="{ bcId: formData.businessCategory }"
        model="Template"
        title="模板"
        :headers="templateHeaders"
        :item-names="['name', 'path']"
        :visible="dialog.showTemplateList"
        @close="dialog.showTemplateList = false"
        @change="onBusinessCategoryChange"
        :interceptor="{ save: saveTemplateFile, delete: deleteTemplateFile }"
      >
        <template v-slot:[`item.path`]="{ item }">
          <v-icon @click="openTemplate(item.path)">mdi-open-in-new</v-icon>
        </template>
        <template v-slot="{ id, name, path, isEdit, cancel, save }">
          <template-detail :id="id" :name="name" :path="path" :bcId="formData.businessCategory" :isEdit="isEdit" @cancel="cancel" @save="save"></template-detail>
        </template>
      </common-list>
    </v-dialog>
    <v-dialog width="500" v-model="dialog.showTemplateDetail">
      <template-detail v-bind="newTemplate" :isEdit="false" @cancel="cancelTemplete" @save="saveTemplate"></template-detail>
    </v-dialog>
  </v-container>
</template>

<script>
import CommonList from "@/components/Common/CommonList.vue";
// import BusinessCategoryDetail from '@/components/BusinessCategory/BusinessCategoryDetail.vue';
import TemplateDetail from '@/components/Template/TemplateDetail.vue';
import moment from "moment";
import ReplacementEdit from '../components/Replacement/ReplacementEdit.vue';
// import { v4 as uuidv4 } from "uuid";
import _ from 'lodash';
import VCascadeSelect from '../components/VCascadeSelect'
import BusinessCategoryList from '@/components/BusinessCategory/BusinessCategoryList.vue'

export default {
  components: {
    CommonList,
    // BusinessCategoryDetail,
    TemplateDetail,
    ReplacementEdit,
    VCascadeSelect,
    BusinessCategoryList
  },
  mounted() {
    this.unsubscribe = window.store.onDidChange('settings.adminMode', this.switchAdminMode)
    this.switchAdminMode('settings.adminMode', window.store.get('settings.adminMode'))
    this.updateCategoryOptions()
    // window.commonService.find('BusinessCategory', { pid: '319f8bd1-0210-4a45-83d5-c6cdd01af2a5' }).then(data => {
    //   console.log('BusinessCategory', data)
    //   this.categoryOptions.primary = data
    //   this.categoryOptions2.push(data)
    //   console.log(this.categoryOptions2)
    //   console.log(this.formData.categories2)
    // })
  },
  beforeDestroy() {
    this.unsubscribe && this.unsubscribe()
  },
  watch: {
    // tab(val) {
    //   const currentTemplate = this.formData.templates[val]
    //   console.log(currentTemplate)
    //   this.previewPdf2()
    // },
    "dialog.showCategoryList"(val) {
      if (!val) {
        let params
        switch (this.currentCategoryDialog) {
          case 'primary':
            params = { pid: null }
            break;
          case 'secondary':
            params = { pid: this.formData.categories.primary }
            break
          case 'tertiary':
            params = { pid: this.formData.categories.secondary }
            break
        }
        window.commonService.find('BusinessCategory', params).then(data => {
          this.categoryOptions[this.currentCategoryDialog] = data
        }).catch(err => {
          console.log(err)
          this.$toast.error(`业务分类加载失败！`)
        })
      }
    },
    // "dialog.showTemplateList"(val) {
    //   if (!val) {
    //     this.onBusinessCategoryChange();
    //   }
    // },
    "formData.businessCategory"(val) {
      console.log("业务分类(watch)：", val);
      // // this.formData.editTemplate = null;
      // this.editTemplateMode = false;
      // // this.formData.placeholderGroups = [];
      // // this.formData.placeholders = [];
      // // this.formData.template = null;
      // this.formData.templates = [];
      // this.templatePreview = null;
      // this.$refs.observer.reset();
      if (val) {
        this.onBusinessCategoryChange()
      } else {
        this.formData.templates.splice(0)
      }
    },
    // "formData.categories2": {
    //   deep: true,
    //   handler(newVal, oldVal) {
    //     for (let idx in newVal) {
    //       if (newVal[idx] && !oldVal[idx]) {
    //         this.categoryVisibleArray[idx + 1] = true
    //         window.commonService.find('BusinessCategory', { pid: newVal[idx] }).then(data => {
    //           this.categoryOptions2[idx + 1] = data
    //         })
    //         break
    //       } else if (!newVal[idx] && oldVal[idx]) {
    //         this.categoryVisibleArray[idx + 1] = false
    //         break
    //       } else if (newVal[idx] != oldVal[idx]) {
    //         this.categoryVisibleArray[idx + 1] = true
    //         window.commonService.find('BusinessCategory', { pid: newVal[idx] }).then(data => {
    //           this.categoryOptions2[idx + 1] = data
    //         })
    //         break
    //       }
    //     }
    //   }
    // },
    // /** 当前类型修改时，判断关联的下一级类型是否有可选项。若有，则显示下一级类型；否则隐藏下一级类型 */
    // "formData.categories.primary"(val) {
    //   console.log('primary:', val)
    //   this.formData.categories.secondary = null
    //   val ? window.commonService.find('BusinessCategory', { pid: val }).then(({ success, data, error }) => {
    //     if (success) {
    //       this.secondaryCategoryDisplayFlag = data.length > 0
    //       this.categoryOptions.secondary = data
    //     } else {
    //       console.log(error)
    //     }
    //   }) : (this.secondaryCategoryDisplayFlag = false)
    //   // 一级类型相关联的模板
    // },
    // /** 当前类型修改时，判断关联的下一级类型是否有可选项。若有，则显示下一级类型；否则隐藏下一级类型 */
    // "formData.categories.secondary"(val) {
    //   console.log('secondary:', val)
    //   this.formData.categories.tertiary = null
    //   val ? window.commonService.find('BusinessCategory', { pid: val }).then(({ success, data, error }) => {
    //     if
    //     this.tertiaryCategoryDisplayFlag = data.length > 0
    //     this.categoryOptions.tertiary = data
    //   }) : (this.tertiaryCategoryDisplayFlag = false)
    // },
    // "formData.categories.tertiary"(val) {
    //   console.log('tertiary:', val)
    // }
  },
  computed: {
    isAdminMode() {
      return this.adminMode == 1
    },
    selectedBusinessCategories() {
      const path = [];
      const pathFinder = (obj, level) => {
        if (obj && Array.isArray(obj)) {
          for (let i = 0; i < obj.length; i++) {
            path.push(i);
            if (obj[i].value == this.formData.businessCategory) {
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

      this.value && pathFinder(this.businessCategoryOptions, 0);
      return path
    },
    // currentBusinessCategory() {
    //   return this.primaryCategoryOptions.find(
    //     (e) => e.value == this.formData.businessCategory
    //   );
    // },
    /** 类型数：用于限定类型的最多显示级数 */
    categoryCount() {
      return this.secondaryCategoryDisplayFlag && this.tertiaryCategoryDisplayFlag ? 3 : this.secondaryCategoryDisplayFlag ? 2 : 1
    },
    /** 对话框用Condition */
    currentCategoryDialogCondition() {
      let condition
      switch (this.currentCategoryDialog) {
        case 'primary':
          condition = { pid: null }
          break;
        case 'secondary':
          condition = { pid: this.formData.categories.primary }
          break;
        case 'tertiary':
          condition = { pid: this.formData.categories.secondary }
          break;
        default:
      }

      return condition
    },
    /** 对话框用Model */
    currentCategoryDialogModel() {
      return `${_.upperFirst(this.currentCategoryDialog)}Category`
    },
    /** 对话框用Title */
    currentCategoryDialogTitle() {
      let title
      switch (this.currentCategoryDialog) {
        case 'primary':
          title = '一级类型'
          break;
        case 'secondary':
          title = '二级类型'
          break;
        case 'tertiary':
          title = '三级类型'
          break;
        default:
      }

      return title
    },
    /** 对话框用父级类型id */
    currentCategoryDialogPid() {
      let pid
      switch (this.currentCategoryDialog) {
        case 'primary':
          pid = null
          break;
        case 'secondary':
          pid = this.formData.categories.primary
          break;
        case 'tertiary':
          pid = this.formData.categories.secondary
          break;
        default:
      }

      return pid
    },
    visibleCategoryLevels() {
      return this.categoryVisibleArray.filter(e=>e==true).length
      // return this.categoryVisibleArray.reduce((total, current) => total + (current ? 1 : 0), 0)
    }
  },
  methods: {
    switchAdminMode(key, val) {
      this.$set(this, 'adminMode', val.value)
    },
    getCategoryName(level) {
      return `${['一','二','三'][level - 1]}级业务类型`
    },
    // onChangeCategory(level) {
    //   const index = level - 1
    //   if (this.formData.categories2[index]) {
    //     window.commonService.find('BusinessCategory', { pid: this.formData.categories2[index] }).then(data => {
    //       this.$set(this.categoryVisibleArray, index + 1, data.length > 0)
    //       this.categoryOptions2[index + 1] = data
    //     })
    //   }
    // },
    // onClearCategory(level) {
    //   const index = level - 1
    //   this.$set(this.categoryVisibleArray, index + 1, false)
    // },
    // appendSubLevel(level) {
    //   const index = level - 1
    //   this.$set(this.categoryVisibleArray, index + 1, true)
    //   // this.categoryVisibleArray[level] = true
    // },
    // removeSubLevel(level) {
    //   const index = level - 1
    //   this.$set(this.categoryVisibleArray, index + 1, false)
    // },
    /** 当类型清单修改时，同步修改内容（重新取得下拉菜单） */
    updateCategoryOptions() {
      window.replaceService.findBusinessCategoryCascaded().then(data => {
        this.businessCategoryOptions = data
      }).catch(err => {
        console.log(err)
        this.$toast.error(`业务类型加载失败！`)
      })
    },
    /** 取得指定index对应的类型名称 */
    // getCatLevel(index) {
    //   return index == 1 ? 'primary' : index == 2 ? 'secondary' : 'tertiary'
    // },
    // removeCategory(catIndex) {
    //   switch (catIndex) {
    //     case 3:
    //       this.tertiaryCategoryDisplayFlag = false
    //       this.formData.categories.tertiary = null
    //       break;
    //     case 2:
    //       this.secondaryCategoryDisplayFlag = false
    //       this.formData.categories.secondary = null
    //       break;
    //     default:
    //   }
    // },
    // appendCategory(catIndex) {
    //   const curCatLevel = this.getCatLevel(catIndex)
    //   const params = { pid: this.formData.categories[curCatLevel] }
    //   const nextCatLevel = this.getCatLevel(catIndex + 1)
    //   this[`${nextCatLevel}CategoryDisplayFlag`] = true
    //   window.commonService.find('BusinessCategory', params).then(data => {
    //     this.categoryOptions[nextCatLevel] = data
    //   })
    // },
    onBusinessCategoryChange() {
      window.replaceService
        .findTemplateByBcId({ bcId: this.formData.businessCategory })
        .then(data => {
          this.formData.templates = data;
          this.$refs.templateTabs.callSlider()
        }).catch(err => {
          console.log(err)
          this.$toast.error(`模板加载失败！`)
        })
    },
    formatDate({ value, format }) {
      return value && format ? moment(value).format(format) : null;
    },
    cancelTemplete() {
      this.dialog.showTemplateDetail = false
    },
    // addTemplate() {
    //   this.tab = this.formData.templates.length
    //   const newTab = {
    //     id: uuidv4(),
    //     name: '新模板',
    //     path: '',
    //   }
    //   this.formData.templates.push(newTab)
    // },
    showTemplateDialog() {
      this.dialog.showTemplateDetail = true
      this.$set(this, 'newTemplate', {
        // id: uuidv4(), // TODO id由sqlite自动生成
        id: null,
        name: null,
        path: null,
        bcId: this.formData.businessCategory
      })
    },
    saveTemplateFile({ path, ignoreSaveFile }) {
      return ignoreSaveFile ? Promise.resolve() : window.ipc
        .invoke("saveFile", {
          srcPath: path,
          folder: this.formData.businessCategory,
          type: "template",
        })
    },
    deleteTemplateFile(path) {
      console.log("删除模板文件", path)
      return window.ipc.invoke("deleteFile", {
        filePath: path
      })
      .then(() => {
        this.$toast.success('模板文件删除成功！')
      })
      .catch(err => {
        console.warn(err)
        this.$toast.warning('模板文件删除失败！')
      })
    },
    saveTemplate(newTemplate) {
      this.saveTemplateFile(newTemplate).then(preResult=>{
        for (const key in preResult) {
          newTemplate[key] && (newTemplate[key] = preResult[key])
        }
        console.log(newTemplate)
        window.replaceService.saveTemplate(newTemplate).then(()=>{
          this.dialog.showTemplateDetail = false
          // this.onBusinessCategoryChange()
          this.$toast.success(`模板保存成功！`)
        }).catch(err => {
          console.log(err)
          this.$toast.error(`模板保存失败！`)
        })
      })
    },
    openTemplate(path) {
      window.ipc.invoke("openFile", path).then((err) => {
        if (err) {
          console.error(err);
        }
      });
    },
    showCategoryDialog(index) {
      this.dialog.showCategoryList = true;
      this.currentCategoryDialog = this.getCatLevel(index)
    },
    showBusinessCategoryListDialog() {
      this.dialog.showBusinessCategoryList = true
    },
    showTemplateListDialog() {
      this.dialog.showTemplateList = true;
    },
    showFolderBrowserDialog() {
      window.ipc
        .invoke("directoryPicker", {
          title: "输出文件夹",
          directory: this.formData.outputFolder,
        })
        .then((res) => {
          if (res) {
            this.formData.outputFolder = res;
          }
        });
    },
  },
  data() {
    let MAX_LEVEL = 3
    let visibleArray = new Array(MAX_LEVEL).fill(false)
    visibleArray[0] = true
    return {
      categoryLevels: MAX_LEVEL,
      categoryVisibleArray: visibleArray,
      categoryOptions2: [],
      businessCategoryOptions: [
      ],
      formData: {
        businessCategory: null, //'85b4a210-d234-4791-bdd8-19a365ea222a',
        categories: {
          primary: null,
          secondary: null,
          tertiary: null
        },
        categories2: new Array(MAX_LEVEL).fill(null),
        outputFolder: null,
        templates: [],
      },
      categoryHeaders: [
        {
          text: 'No.',
          value: 'index'
        },
        {
          text: '名称',
          value: 'name'
        },
        {
          text: '图标',
          value: 'icon'
        },
        { text: '操作',
          value: 'actions',
          align: 'center',
        },
      ],
      templateHeaders: [
        {
          text: 'No.',
          value: 'index'
        },
        {
          text: '名称',
          value: 'name'
        },
        {
          text: '模板',
          value: 'path'
        },
        { text: '操作',
          value: 'actions',
          align: 'center',
        },
      ],
      rules: {
        businessCategory: { requiredSelect: true },
        outputFolder: { requiredSelect: true },
      },
      categoryOptions: {
        primary: [],
        secondary: [],
        tertiary: []
      },
      currentCategoryDialog: null,
      secondaryCategoryDisplayFlag: false,
      tertiaryCategoryDisplayFlag: false,
      processing: {
        submit: false,
      },
      dialog: {
        showCategoryList: false,
        showBusinessCategoryList: false,
        showTemplateList: false,
        showTemplateDetail: false,
      },
      newTemplate: {},
      editTemplateMode: false, // TODO 没用？
      templatePreview: null, // TODO 没用？
      tab: 0,
      adminMode: false,
      unsubscribe: null
    };
  },
};
</script>