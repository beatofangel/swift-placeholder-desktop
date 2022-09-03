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
            <v-card elevation="0">
              <v-card>
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
                          @change="handleBusinessCategoryChange"
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
                        <v-card-title class="pa-2">
                          <v-row v-if="formData.template && !editTemplateMode">
                            <v-col
                              class="d-flex align-center mb-1"
                              style="height: 72px"
                            >
                              <v-icon
                                >{{
                                  businessCategoryOptions.find(
                                    (e) => e.value == formData.businessCategory
                                  ).icon
                                }}
                              </v-icon>
                              {{ `&lt;${formData.template.name}&gt;` }}
                              <v-btn @click="editTemplate" color="primary" icon>
                                <v-icon>mdi-pencil</v-icon>
                              </v-btn>
                              <v-btn @click="openTemplate" color="primary" icon>
                                <v-icon>mdi-open-in-new</v-icon>
                              </v-btn>
                            </v-col>
                          </v-row>
                          <v-row
                            v-else-if="
                              formData.businessCategory || editTemplateMode
                            "
                          >
                            <v-col>
                              <validation-provider
                                name="模板"
                                :rules="rules.editTemplate"
                                v-slot="{ errors, dirty }"
                              >
                                <v-text-field
                                  v-model="formData.editTemplate"
                                  :error-messages="errors[0]"
                                  :placeholder="`请选择${
                                    businessCategoryOptions.find(
                                      (e) =>
                                        e.value == formData.businessCategory
                                    ).text
                                  }模板`"
                                  persistent-placeholder
                                  :prepend-icon="
                                    businessCategoryOptions.find(
                                      (e) =>
                                        e.value == formData.businessCategory
                                    ).icon
                                  "
                                  append-icon="mdi-file-word-box"
                                  @click="showFileBrowserDialog"
                                  @click:append="showFileBrowserDialog"
                                  class="mt-2"
                                  clearable
                                  readonly
                                  dense
                                >
                                  <template v-slot:append-outer>
                                    <v-btn
                                      :disabled="
                                        !dirty || !formData.editTemplate
                                      "
                                      class="mt-n2"
                                      color="success"
                                      icon
                                    >
                                      <v-icon>mdi-check</v-icon>
                                    </v-btn>
                                    <v-btn
                                      v-if="formData.template"
                                      @click="editTemplateMode = false"
                                      class="mt-n2"
                                      color="error"
                                      icon
                                    >
                                      <v-icon>mdi-cancel</v-icon>
                                    </v-btn>
                                  </template>
                                </v-text-field>
                              </validation-provider>
                            </v-col>
                          </v-row>
                          <v-row v-else>
                            <v-col
                              class="d-flex align-center mb-1"
                              style="height: 72px"
                            >
                              <v-icon color="warning">mdi-alert</v-icon
                              >未选择业务类型
                            </v-col>
                          </v-row>
                        </v-card-title>
                        <v-divider></v-divider>
                        <v-data-table
                          fixed-header
                          height="400"
                          :items="formData.placeholders"
                          :headers="placeholdersHeader"
                          group-by="group"
                          hide-default-footer
                          disable-pagination
                          disable-sort
                          no-data-text="未查询到数据"
                        >
                          <template
                            v-slot:[`group.header`]="{ items, isOpen, toggle }"
                          >
                            <th
                              class="primary lighten-5 elevation-1"
                              colspan="4"
                            >
                              <v-row class="my-0">
                                <v-btn
                                  @click="toggle"
                                  class="no-active"
                                  :ripple="false"
                                  small
                                  icon
                                >
                                  <v-icon :class="{ 'rotate-open': isOpen }"
                                    >mdi-chevron-down</v-icon
                                  >
                                </v-btn>
                                <v-chip
                                  :color="isOpen ? 'primary' : 'secondary'"
                                  @click="toggle"
                                  class="ml-1"
                                  label
                                >
                                  <span class="text-h6">{{
                                    items[0].group
                                  }}</span>
                                </v-chip>
                              </v-row>
                            </th>
                          </template>
                          <template v-slot:[`item.no`]="{ index }">
                            {{ index + 1 }}
                          </template>
                          <template v-slot:[`item.name`]="{ item }">
                            <v-chip
                              :color="
                                !!item.value && item.count > 0
                                  ? 'success lighten-1'
                                  : ''
                              "
                            >
                              {{ `$\{${item.name}\}` }}
                            </v-chip>
                          </template>
                          <template v-slot:[`item.count`]="{ item }">
                            <v-integer-field
                              v-model="item.count"
                              :min="0"
                              :max="99"
                              width="100"
                              hide-details
                            >
                            </v-integer-field>
                          </template>
                          <template v-slot:[`item.value`]="{ item }">
                            <v-text-field
                              v-model="item.value"
                              hide-details
                              class="mb-1 edit-column-font-size"
                              :disabled="item.count == 0"
                              dense
                            ></v-text-field>
                          </template>
                        </v-data-table>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
              <v-card-actions>
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
      <business-category-list
        :visible="dialog.showBusinessCategoryList"
        @cancel="dialog.showBusinessCategoryList = false"
      ></business-category-list>
    </v-dialog>
  </v-container>
</template>

<script>
import BusinessCategoryList from "@/components/BusinessCategory/BusinessCategoryList.vue";
import VIntegerField from "../components/VIntegerField.vue";
export default {
  components: {
    BusinessCategoryList,
    VIntegerField,
  },
  mounted() {
    window.replaceService.getBusinessCategoryOptions().then((data) => {
      this.businessCategoryOptions = data;
    });
  },
  watch: {
    "dialog.showBusinessCategoryList"(val) {
      if (!val) {
        // this.getBusinessCategoryOptions()
        window.replaceService.getBusinessCategoryOptions().then((data) => {
          this.businessCategoryOptions = data;
        });
      }
    },
  },
  methods: {
    // getBusinessCategoryOptions() {
    //   window.chrome.webview.postMessage({
    //     api: "getBusinessCategoryOptions",
    //     callback: "getBusinessCategoryOptionsCallback",
    //   });
    // },
    openTemplate() {
      window.ipcRenderer
        .send("openFile", this.formData.template.path)
        .then((err) => {
          if (err) {
            console.error(err);
          }
        });
    },
    editTemplate() {
      // const field = this.$refs.observer.fields.find({ name: '模板' })
      // console.log(field)
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
    // showFolderBrowserDialogCallback(content) {
    //   const result = JSON.parse(content);
    //   if (result.Success) {
    //     if (!result.Data.cancel) {
    //       this.formData.outputFolder = result.Data.path;
    //     }
    //   } else {
    //     console.log(result.Message);
    //   }
    // },
    handleBusinessCategoryChange() {
      this.formData.editTemplate = null;
      this.editTemplateMode = false;
      this.$refs.observer.reset();
      window.replaceService
        .getPlaceholders(this.formData.businessCategory)
        .then((data) => {
          this.formData.placeholders = data;
        });
      window.replaceService
        .getTemplate(this.formData.businessCategory)
        .then((data) => {
          this.formData.template = data;
        });
    },
    showBusinessCategoryDialog() {
      this.dialog.showBusinessCategoryList = true;
    },
    showFolderBrowserDialog() {
      window.ipcRenderer
        .send("directoryPicker", {
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
      window.ipcRenderer
        .send("filePicker", {
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
        editTemplate: null,
        placeholders: [],
      },
      placeholdersHeader: [
        {
          text: "No.",
          value: "no",
          align: "center",
          cellClass: "edit-column-font-size",
          class: "edit-column-font-size",
          width: "50",
        },
        { text: "数据类型", value: "group", align: "center" },
        {
          text: "名称",
          value: "name",
          align: "center",
          cellClass: "edit-column-font-size",
          class: "edit-column-font-size",
        },
        {
          text: "数量",
          value: "count",
          align: "center",
          cellClass: "edit-column-font-size",
          class: "edit-column-font-size",
          width: "150",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
          cellClass: "edit-column-font-size",
          class: "edit-column-font-size",
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
      },
      editTemplateMode: false,
    };
  },
};
</script>
<style>
.rotate-transition {
  transform: rotate(120deg);
}
/* .edit-column-font-size {
  font-size: 16px !important;
} */
</style>
<style scoped>
.rotate-open {
  transform: rotate(0.5turn);
}
</style>