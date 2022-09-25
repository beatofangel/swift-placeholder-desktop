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
                      ></v-cascade-select>
                    </validation-provider>
                  </v-col>
                </v-row>
                <v-row>
                  <v-col>
                    <v-row>
                      <v-col v-for="level in visibleCategoryLevels" :key="level" :cols="12 / visibleCategoryLevels">
                        <validation-provider
                          :name="getCategoryName(level)"
                          :rules="rules.businessCategory"
                          v-slot="{ errors, invalid }"
                        >
                          <v-select
                            v-model="formData.categories2[level-1]"
                            :items="categoryOptions2[level-1]"
                            :menu-props="{
                              bottom: true,
                              offsetY: true,
                              closeOnContentClick: true,
                            }"
                            item-text="name"
                            item-value="id"
                            :label="getCategoryName(level)"
                            :error-messages="errors[0]"
                            :placeholder="`请选择${getCategoryName(level)}`"
                            persistent-placeholder
                            clearable
                            outlined
                            @change="onChangeCategory(level)"
                            @click:clear="onClearCategory(level)"
                          >
                            <template v-slot:no-data>
                              <v-list-item>
                                <v-list-item-action>
                                </v-list-item-action>
                                <v-list-item-content class="text--disabled">
                                  没有数据
                                </v-list-item-content>
                              </v-list-item>
                            </template>
                            <template v-slot:append-outer>
                              <v-tooltip v-if="visibleCategoryLevels == level && level < categoryLevels" top>
                                <template v-slot:activator="{ on, attrs }">
                                  <v-icon color="success" :disabled="invalid" @click="appendSubLevel(level)" v-bind="attrs" v-on="on">
                                    mdi-plus
                                  </v-icon>
                                </template>
                                <span v-text="`添加${getCategoryName(level)}`"></span>
                              </v-tooltip>
                              <v-tooltip v-if="level > 1 && (!categoryOptions2[level-1] || categoryOptions2[level-1].length == 0)" top>
                                <template v-slot:activator="{ on, attrs }">
                                  <v-icon color="error" @click="removeSubLevel(level-1)" v-bind="attrs" v-on="on">
                                    mdi-minus
                                  </v-icon>
                                </template>
                                <span v-text="`删除${getCategoryName(level)}`"></span>
                              </v-tooltip>
                            </template>
                            <template v-slot:selection="{ item }">
                              <v-icon v-if="item.icon" color="primary">{{
                                item.icon
                              }}</v-icon>
                              <span class="ml-8">{{
                                `${item.sort} - ${item.name}`
                              }}</span>
                            </template>
                            <template v-slot:item="{ item, on, attrs }">
                              <v-list-item class="px-0" v-on="on" v-bind="attrs">
                                <v-hover v-slot="{ hover }">
                                  <v-list-item :ripple="false">
                                    <v-list-item-action>
                                      <v-icon
                                        v-if="item.icon"
                                        :color="hover ? 'primary' : 'accent'"
                                        >{{ item.icon }}</v-icon
                                      >
                                    </v-list-item-action>
                                    <v-list-item-content>
                                      {{ `${item.sort} - ${item.name}` }}
                                    </v-list-item-content>
                                  </v-list-item>
                                </v-hover>
                              </v-list-item>
                            </template>
                            <template v-slot:append-item>
                              <v-divider class="mt-2"></v-divider>
                              <v-list-item
                                class="px-0"
                                @mousedown.prevent
                                @click="showCategoryDialog(level)"
                              >
                                <v-hover v-slot="{ hover }">
                                  <v-list-item :ripple="false">
                                    <v-list-item-action>
                                      <v-icon
                                        :class="{ 'rotate-transition-120': hover }"
                                        color="primary"
                                        >mdi-cog</v-icon
                                      >
                                    </v-list-item-action>
                                    <v-list-item-content>
                                      管理业务类型
                                    </v-list-item-content>
                                  </v-list-item>
                                </v-hover>
                              </v-list-item>
                            </template>
                          </v-select>
                        </validation-provider>
                      </v-col>
                    </v-row>
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
                        color="cyan"
                        dark
                      >
                        <v-tabs
                          v-model="tab"
                          align-with-title
                        >
                          <v-tabs-slider></v-tabs-slider>
                          <v-tab
                            v-for="{ id, name } in formData.templates"
                            :key="id"
                          >
                            <span class="text-h6">{{ name }}</span>
                          </v-tab>
                          <v-btn @click="showTemplateDialog" v-if="formData.businessCategory && formData.templates.length == 0" height="100%" color="cyan" depressed tile>
                            <v-icon>mdi-plus</v-icon><span class="text-h6">添加模板</span>
                          </v-btn>
                          <v-btn @click="showTemplateListDialog" v-if="formData.businessCategory && formData.templates.length > 0" height="100%" color="cyan" depressed tile>
                            <v-icon>mdi-cog</v-icon>
                          </v-btn>
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
    <v-dialog width="600" v-model="dialog.showCategoryList">
      <!-- 需要传入condition，且type要根据currentCategoryDialog来设定 -->
      <common-list
        :condition="currentCategoryDialogCondition"
        model="BusinessCategory" 
        :title="currentCategoryDialogTitle"
        :headers="categoryHeaders"
        :item-names="['name', 'icon', 'sort']"
        :visible="dialog.showCategoryList"
        show-select
        :selected-id="formData.categories[currentCategoryDialog]"
        @select="selected=>{this.formData.categories[currentCategoryDialog]=selected;this.dialog.showCategoryList = false}"
        @close="dialog.showCategoryList = false"
        @change="updateCategoryOptions"
      >
        <template v-slot:[`item.icon`]="{ item }">
          <v-icon color="accent">{{item ? item.icon : 'item 未定义'}}</v-icon>
        </template>
        <template v-slot="{ id, name, icon, sort, isEdit, visible, title, cancel, save }">
          <business-category-detail :id="id" :pid="currentCategoryDialogPid" :name="name" :icon="icon" :sort="sort" :isEdit="isEdit" :visible="visible" :title="title" @cancel="cancel" @save="save"></business-category-detail>
        </template>
      </common-list>
    </v-dialog>
    <v-dialog width="600" v-model="dialog.showTemplateList">
      <common-list
        :condition="{ businessCategoryId: formData.businessCategory }"
        model="Template"
        title="模板"
        :headers="templateHeaders"
        :item-names="['name', 'path']"
        :visible="dialog.showTemplateList"
        @close="dialog.showTemplateList = false"
        :pre-interceptor="{ save: saveTemplateFile, delete: deleteTemplateFile }"
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
import BusinessCategoryDetail from '@/components/BusinessCategory/BusinessCategoryDetail.vue';
import TemplateDetail from '@/components/Template/TemplateDetail.vue';
import moment from "moment";
import ReplacementEdit from '../components/Replacement/ReplacementEdit.vue';
import { v4 as uuidv4 } from "uuid";
import _ from 'lodash';
import VCascadeSelect from '../components/VCascadeSelect'

export default {
  components: {
    CommonList,
    BusinessCategoryDetail,
    TemplateDetail,
    ReplacementEdit,
    VCascadeSelect
  },
  mounted() {
    window.replaceService.findBusinessCategoryCascaded().then(data => {
      console.log(data)
      
      const formatted = []
      const format = (items, formatted) => {
        items.forEach(item => {
          const dataValues = item.dataValues
          const children = item.children
          const formattedItem = {
            id: dataValues.id,
            name: dataValues.name,
            icon: dataValues.icon
          }
          formatted.push(formattedItem)
          if (children && children.length) {
            formattedItem.children = []
            format(children, formattedItem.children)
          }
        })
      }
      format(data, formatted)
      this.businessCategoryOptions = formatted

    })
    window.commonService.find('BusinessCategory', { pid: null }).then(data => {
      console.log('BusinessCategory', data)
      this.categoryOptions.primary = data
      this.categoryOptions2.push(data)
      console.log(this.categoryOptions2)
      console.log(this.formData.categories2)
    })
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
        })
      }
    },
    "dialog.showTemplateList"(val) {
      if (!val) {
        this.onBusinessCategoryChange();
      }
    },
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
      // val && this.onBusinessCategoryChange();
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
    /** 当前类型修改时，判断关联的下一级类型是否有可选项。若有，则显示下一级类型；否则隐藏下一级类型 */
    "formData.categories.primary"(val) {
      console.log('primary:', val)
      this.formData.categories.secondary = null
      val ? window.commonService.find('BusinessCategory', { pid: val }).then(data => {
        this.secondaryCategoryDisplayFlag = data.length > 0
        this.categoryOptions.secondary = data
      }) : (this.secondaryCategoryDisplayFlag = false)
      // 一级类型相关联的模板
    },
    /** 当前类型修改时，判断关联的下一级类型是否有可选项。若有，则显示下一级类型；否则隐藏下一级类型 */
    "formData.categories.secondary"(val) {
      console.log('secondary:', val)
      this.formData.categories.tertiary = null
      val ? window.commonService.find('BusinessCategory', { pid: val }).then(data => {
        this.tertiaryCategoryDisplayFlag = data.length > 0
        this.categoryOptions.tertiary = data
      }) : (this.tertiaryCategoryDisplayFlag = false)
    },
    "formData.categories.tertiary"(val) {
      console.log('tertiary:', val)
    }
  },
  computed: {
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
    getCategoryName(level) {
      return `${['一','二','三','四'][level - 1]}级业务类型`
    },
    onChangeCategory(level) {
      const index = level - 1
      if (this.formData.categories2[index]) {
        window.commonService.find('BusinessCategory', { pid: this.formData.categories2[index] }).then(data => {
          this.$set(this.categoryVisibleArray, index + 1, data.length > 0)
          this.categoryOptions2[index + 1] = data
        })
      }
    },
    onClearCategory(level) {
      const index = level - 1
      this.$set(this.categoryVisibleArray, index + 1, false)
    },
    appendSubLevel(level) {
      const index = level - 1
      this.$set(this.categoryVisibleArray, index + 1, true)
      // this.categoryVisibleArray[level] = true
    },
    removeSubLevel(level) {
      const index = level - 1
      this.$set(this.categoryVisibleArray, index + 1, false)
    },
    /** 当类型清单修改时，同步修改内容（重新取得下拉菜单） */
    updateCategoryOptions() {
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
      })
    },
    /** 取得指定index对应的类型名称 */
    getCatLevel(index) {
      return index == 1 ? 'primary' : index == 2 ? 'secondary' : 'tertiary'
    },
    removeCategory(catIndex) {
      switch (catIndex) {
        case 3:
          this.tertiaryCategoryDisplayFlag = false
          this.formData.categories.tertiary = null
          break;
        case 2:
          this.secondaryCategoryDisplayFlag = false
          this.formData.categories.secondary = null
          break;
        default:
      }
    },
    appendCategory(catIndex) {
      const curCatLevel = this.getCatLevel(catIndex)
      const params = { pid: this.formData.categories[curCatLevel] }
      const nextCatLevel = this.getCatLevel(catIndex + 1)
      this[`${nextCatLevel}CategoryDisplayFlag`] = true
      window.commonService.find('BusinessCategory', params).then(data => {
        this.categoryOptions[nextCatLevel] = data
      })
    },
    onBusinessCategoryChange() {
      window.replaceService
        .listTemplateByBusinessCategoryId(this.formData.businessCategory)
        .then((data) => {
          // data.length > 0 && (this.formData.template = data[0]);
          this.formData.templates = data;
        });
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
        id: uuidv4(), // TODO id由sqlite自动生成
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
    deleteTemplateFile({ path }) {
      return window.ipc.invoke("deleteFile", {
        filePath: path
      })
    },
    saveTemplate(newTemplate) {
      this.saveTemplateFile(newTemplate).then(preResult=>{
        for (const key in preResult) {
          newTemplate[key] && (newTemplate[key] = preResult[key])
        }
        window.commonService.save('Template', newTemplate).then(result=>{
          if (result.success) {
            this.dialog.showTemplateDetail = false
            this.onBusinessCategoryChange()
            window.ipc.send('notification', {
              title: "提示",
              body: `模板保存成功！`
            })
          } else {
            window.ipc.send('notification', {
              title: "错误",
              body: `模板保存失败！`
            })
          }
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
        businessCategory: null, //'67a9e7cd-506b-473a-b8fa-f19fe0743033',
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
        showTemplateList: false,
        showTemplateDetail: false,
      },
      newTemplate: {},
      editTemplateMode: false, // TODO 没用？
      templatePreview: null, // TODO 没用？
      tab: null,
    };
  },
};
</script>
<style>
.rotate-transition-120 {
  transform: rotate(120deg);
}
</style>