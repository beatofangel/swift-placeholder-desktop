<template>
  <v-container>
    <v-row>
      <v-col>
        <validation-observer
          ref="observer"
          :disabled="dialog.showBusinessCategoryList"
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
                      <v-select
                        v-model="formData.businessCategory"
                        :items="businessCategoryOptions"
                        :menu-props="{
                          bottom: true,
                          offsetY: true,
                          closeOnContentClick: true,
                        }"
                        label="业务类型"
                        :error-messages="errors[0]"
                        placeholder="请选择业务类型"
                        persistent-placeholder
                        clearable
                        outlined
                      >
                        <template v-slot:selection="{ item }">
                          <v-icon v-if="item.icon" color="primary">{{
                            item.icon
                          }}</v-icon>
                          <span class="ml-8">{{
                            `${item.index} - ${item.text}`
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
                                  {{ `${item.index} - ${item.text}` }}
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
                            @click="showBusinessCategoryDialog"
                          >
                            <v-hover v-slot="{ hover }">
                              <v-list-item :ripple="false">
                                <v-list-item-action>
                                  <v-icon
                                    :class="{ 'rotate-transition': hover }"
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
                            v-for="{ id, name, isNew } in formData.templates"
                            :disabled="hasNewTemplate && !isNew"
                            :key="id"
                          >
                            <v-text-field
                              v-if="isNew"
                              class="text-h6 mb-n3"
                              placeholder="请输入新模板名称"
                              persistent-placeholder
                              hide-details
                              autofocus
                              clearable
                            >
                              <template v-slot:append-outer>
                                <v-btn
                                  class="mt-n3"
                                  color="success"
                                  icon
                                >
                                  <v-icon>mdi-check</v-icon>
                                </v-btn>
                                <v-btn
                                  @click="cancelTemplete"
                                  class="mt-n3"
                                  color="error"
                                  icon
                                >
                                  <v-icon>mdi-cancel</v-icon>
                                </v-btn>
                              </template>
                            </v-text-field>
                            <span v-else class="text-h6">{{ name }}</span>
                          </v-tab>
                          <!-- <v-btn @click="addTemplate" v-if="formData.businessCategory && !hasNewTemplate" height="100%" color="cyan" depressed tile>
                            <v-icon>mdi-plus</v-icon>
                          </v-btn> -->
                          <v-btn @click="showTemplateDialog" v-if="formData.businessCategory && !hasNewTemplate" height="100%" color="cyan" depressed tile>
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
                <v-btn text>取消</v-btn>
                <v-btn
                  type="submit"
                  :loading="processing.submit"
                  :disabled="invalid"
                  color="primary"
                  >确定</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-form>
        </validation-observer>
      </v-col>
    </v-row>
    <v-dialog width="600" v-model="dialog.showBusinessCategoryList">
      <common-list
        type="BusinessCategory"
        title="业务类型"
        :headers="businessCategoryHeaders"
        :item-names="['name', 'icon', 'sort']"
        :visible="dialog.showBusinessCategoryList"
        show-select
        :selected-id="formData.businessCategory"
        @select="selected=>{this.formData.businessCategory=selected;this.dialog.showBusinessCategoryList = false}"
        @close="dialog.showBusinessCategoryList = false"
      >
        <template v-slot:[`item.icon`]="{ item }">
          <v-icon key="item.icon" color="accent">{{item.icon}}</v-icon>
        </template>
        <template v-slot="{ id, name, icon, sort, isEdit, cancel, save }">
          <business-category-detail :id="id" :name="name" :icon="icon" :sort="sort" :isEdit="isEdit" @cancel="cancel" @save="save"></business-category-detail>
        </template>
      </common-list>
    </v-dialog>
    <v-dialog width="600" v-model="dialog.showTemplateList">
      <common-list
        :condition="{ businessCategoryId: formData.businessCategory }"
        type="Template"
        title="模板"
        :headers="templateHeaders"
        :item-names="['name', 'path']"
        :visible="dialog.showTemplateList"
        @close="dialog.showTemplateList = false"
        :pre-interceptor="{ save: saveTemplateFile, delete: deleteTemplateFile }"
      >
        <template v-slot:[`item.path`]="{ item }">
          <v-icon @click="openTemplate(item.path)">mdi-open-in-new</v-icon>
          <v-icon key="item.path" color="accent">{{item.icon}}</v-icon>
        </template>
        <template v-slot="{ id, name, path, isEdit, cancel, save }">
          <template-detail :id="id" :name="name" :path="path" :bcId="formData.businessCategory" :isEdit="isEdit" @cancel="cancel" @save="save" @input="template=$event"></template-detail>
        </template>
      </common-list>
    </v-dialog>
  </v-container>
</template>

<script>
import CommonList from "@/components/Common/CommonList.vue";
import BusinessCategoryDetail from '@/components/BusinessCategory/BusinessCategoryDetail.vue';
import TemplateDetail from '@/components/Template/TemplateDetail.vue';
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import ReplacementEdit from '../components/Replacement/ReplacementEdit.vue';

export default {
  components: {
    CommonList,
    BusinessCategoryDetail,
    TemplateDetail,
    ReplacementEdit
  },
  mounted() {
    window.replaceService.getBusinessCategoryOptions().then((data) => {
      this.businessCategoryOptions = data;
    });
    // window.ipc.receive("previewPdf", ({ id, path }) => {
    //   console.log("业务分类(mounted)：", id);
    //   if (this.formData.businessCategory == id) {
    //     this.templatePreview = `${path}#view=FitH,top&toolbar=0`;
    //     this.templatePreviewLoading = false;
    //   }
    // });
  },
  watch: {
    // tab(val) {
    //   const currentTemplate = this.formData.templates[val]
    //   console.log(currentTemplate)
    //   this.previewPdf2()
    // },
    "dialog.showBusinessCategoryList"(val) {
      if (!val) {
        window.replaceService.getBusinessCategoryOptions().then((data) => {
          this.businessCategoryOptions = data;
        });
      }
    },
    "formData.businessCategory"(val) {
      console.log("业务分类(watch)：", val);
      this.formData.editTemplate = null;
      this.editTemplateMode = false;
      this.formData.placeholderGroups = [];
      this.formData.placeholders = [];
      this.formData.template = null;
      this.formData.templates = [];
      this.templatePreview = null;
      this.$refs.observer.reset();
      val &&
        window.replaceService
          .listTemplateByBusinessCategoryId(this.formData.businessCategory)
          .then((data) => {
            data.length > 0 && (this.formData.template = data[0]);
            this.formData.templates = data;
            // if (this.formData.template) {
            //   window.replaceService
            //     .listPlaceholderGroupByTemplateId(this.formData.template.id)
            //     .then((data) => {
            //       this.formData.placeholderGroups = data;
            //       this.expanded = this.formData.placeholderGroups;
            //     });
            //   window.replaceService
            //     .listPlaceholderByTemplateId(this.formData.template.id)
            //     .then((data) => {
            //       this.formData.placeholders = data;

            //     });
            //   this.previewPdf();
            // }
          });
    },
  },
  computed: {
    currentBusinessCategory() {
      return this.businessCategoryOptions.find(
        (e) => e.value == this.formData.businessCategory
      );
    },
    hasNewTemplate() {
      return this.formData.templates.find(e=>e.isNew)
    }
  },
  methods: {
    formatDate({ value, format }) {
      return value && format ? moment(value).format(format) : null;
    },
    // previewPdf2(replaceFlag) {
    //   this.templatePreviewLoading = true;
    //   this.formData.templates.length > 0 && this.formData.templates[this.tab] &&
    //     window.ipc.send("previewPdf", {
    //       id: this.formData.businessCategory,
    //       path: this.formData.templates[this.tab].path,
    //       data: replaceFlag ? this.formData.placeholders : [],
    //     });
    // },
    // previewPdf(replaceFlag) {
    //   this.templatePreviewLoading = true;
    //   this.formData.template &&
    //     window.ipc.send("previewPdf", {
    //       id: this.formData.businessCategory,
    //       path: this.formData.template.path,
    //       data: replaceFlag ? this.formData.placeholders : [],
    //     });
    // },
    cancelTemplete() {
      this.formData.templates.pop()
    },
    addTemplate() {
      this.tab = this.formData.templates.length
      const newTab = {
        id: uuidv4(),
        name: '新模板',
        path: '',
        isNew: true
      }
      this.formData.templates.push(newTab)
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
    saveTemplate() {
      window.ipc
        .invoke("saveFile", {
          srcPath: this.formData.editTemplate,
          folder: this.formData.businessCategory,
          type: "template",
        })
        .then((res) => {
          const updateFlag = !!this.formData.template;
          window.replaceService
            .saveTemplate({
              id: updateFlag ? this.formData.template.id : uuidv4(),
              name: `${this.currentBusinessCategory.text} - 模板`,
              path: res.path,
              bcid: this.formData.businessCategory,
              update: updateFlag,
            })
            .then((result) => {
              if (result.success) {
                this.editTemplateMode = false;
                this.$set(this.formData, "template", {
                  name: `${this.currentBusinessCategory.text} - 模板`,
                  path: res.path,
                });
                window.ipc.send("notification", {
                  title: "提示",
                  body: "模板保存成功！",
                });
              }
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
    editTemplate() {
      this.formData.editTemplate = this.formData.template.path;
      this.editTemplateMode = true;
    },
    getBusinessCategoryOptionsCallback(content) {
      const result = JSON.parse(content);
      if (result.Success) {
        this.businessCategoryOptions = result.Data;
      } else {
        console.log(result.Message);
      }
    },
    showBusinessCategoryDialog() {
      this.dialog.showBusinessCategoryList = true;
    },
    showTemplateDialog() {
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
    showFileBrowserDialog() {
      window.ipc
        .invoke("filePicker", {
          title: "模板",
          directory: this.formData.editTemplate,
        })
        .then((res) => {
          if (res) {
            this.formData.editTemplate = res;
          }
        });
    },
  },
  data() {
    return {
      formData: {
        businessCategory: null,
        outputFolder: null,
        template: null,
        templates: [],
        editTemplate: null,
        placeholderGroups: [],
        placeholders: [],
      },
      businessCategoryHeaders: [
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
      placeholderGroupsHeader: [
        {
          text: "名称",
          value: "name",
          align: "start",
          cellClass: "column-width-name",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
        },
      ],
      placeholdersHeader: [
        {
          text: "No.",
          value: "no",
          align: "center",
          cellClass: "column-width-no",
        },
        {
          text: "名称",
          value: "name",
          align: "start",
          cellClass: "column-width-name",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
        },
      ],
      rules: {
        businessCategory: { requiredSelect: true },
        outputFolder: { requiredSelect: true },
        editTemplate: { requiredSelect: true },
      },
      businessCategoryOptions: [],
      processing: {
        submit: false,
      },
      dialog: {
        showBusinessCategoryList: false,
        showTemplateList: false,
      },
      editTemplateMode: false,
      templatePreview: null,
      templatePreviewLoading: false,
      expanded: [],
      tab: null,
      template: null,
    };
  },
};
</script>
<style>
.rotate-transition {
  transform: rotate(120deg);
}
</style>
<style scoped>
.rotate-open {
  transform: rotate(0.5turn);
}
</style>