<template>
  <v-card v-intersect="onIntersect">
    <v-row class="ma-0">
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <v-row
          key="loading"
          style="height: 100%"
          align="center"
          v-if="templatePreviewLoading || !present"
        >
          <v-col offset="4" cols="4">
            <v-img src="spinner.svg"></v-img>
          </v-col>
        </v-row>
        <iframe
          key="iframe"
          v-else
          :src="templatePreviewUrl"
          width="100%"
          height="100%"
          frameborder="0"
        ></iframe>
        <v-slide-y-reverse-transition>
          <v-card
            v-if="placeholdersInTemplateVisible"
            color="transparent"
            elevation="0"
            class="ma-4 d-flex"
            :class="{ 'pointer-events-none': !showPlaceholderDetail }"
            style="position: absolute; bottom: 30px; left: 0; width: 80%"
          >
            <draggable
              v-model="placeholdersInTemplate"
              :animation="200"
              :group="{ name: 'placeholder' }"
              :disabled="!showPlaceholderDetail"
              ghostClass="ghost"
              :class="{ 'placeholder-drop-area': showPlaceholderDetail }"
              style="
                min-height: 100px;
                width: 100%;
                text-align: center;
                vertical-align: top;
              "
              @start="onDrag"
              @end="onDrop"
            >
              <template v-for="({ name, status }, index) in placeholdersInTemplate">
                <v-chip
                  v-if="(
                    status == 'new' ||
                    status == 'saved' && (
                      !showPlaceholderDetail ||
                      (
                        isEditPlaceholder ||
                        (
                          placeholderNewGroup.placeholders.findIndex(e=>e.name==name) == -1
                        )
                      )
                    ) ||
                    status == 'bound' && !showPlaceholderDetail
                  )"
                  class="ma-2"
                  :class="{
                    'chip-draggable': showPlaceholderDetail,
                    'chip-regular': !showPlaceholderDetail,
                  }"
                  :disabled="status == 'bound'"
                  :label="status == 'bound'"
                  :color="`${status == 'bound' ? '' : 'warning'} lighten-1`"
                  :outlined="
                    status == 'bound' && !$vuetify.theme.dark
                  "
                  :key="index"
                >
                  <v-icon v-if="status == 'bound'">mdi-link-variant</v-icon>
                  <v-icon v-else-if="status == 'saved'">mdi-content-save-outline</v-icon>
                  {{ $formatPlaceholder(name) }}
                </v-chip>
              </template>
            </draggable>
          </v-card>
        </v-slide-y-reverse-transition>
        <v-btn
          @click="
            placeholdersInTemplateVisible = !placeholdersInTemplateVisible
          "
          color="primary"
          style="position: absolute; bottom: 10px; left: 40%"
          fab
          dark
          x-small
        >
          <v-icon
            :class="{ 'rotate-transition-180': !placeholdersInTemplateVisible }"
          >
            mdi-chevron-down
          </v-icon>
        </v-btn>
        <v-fab-transition>
          <v-btn
            style="bottom: 0; margin-bottom: 100px; margin-right: 10px"
            color="primary"
            dark
            absolute
            bottom
            right
            fab
            :disabled="showPlaceholderDetail"
            @click="onCreatePlaceholderGroup"
          >
            <v-icon large>mdi-tag-plus</v-icon>
          </v-btn>
        </v-fab-transition>
        <v-fab-transition>
          <v-btn
            style="bottom: 0; margin-bottom: 20px; margin-right: 10px"
            color="pink"
            dark
            absolute
            bottom
            right
            fab
            :disabled="showPlaceholderDetail"
            @click="()=>previewPdf(true)"
          >
            <v-icon large>{{
              templatePreviewLoading ? "mdi-loading mdi-spin" : "mdi-sync"
            }}</v-icon>
          </v-btn>
        </v-fab-transition>
      </v-card>
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <!-- <v-fade-transition :group="true" leave-absolute> -->
        <placeholder-detail
          v-if="showPlaceholderDetail"
          :isEdit="isEditPlaceholder"
          :tplId="tplId"
          :placeholder="placeholderNewGroup"
          :placeholdersInTemplate="placeholdersInTemplate"
          @cancel="onCancel"
          @delete="onDelete"
          @save="onSave"
          @clear="onClear"
        ></placeholder-detail>
        <!-- </v-fade-transition>
        <v-fade-transition :group="true" leave-absolute> -->
        <v-card v-if="!showPlaceholderDetail" elevation="0" tile>
          <v-toolbar elevation="0">
            <v-autocomplete
              prepend-icon="mdi-magnify"
              placeholder="查询主体信息"
              hide-details
            ></v-autocomplete>
            <v-spacer></v-spacer>
            <v-btn-toggle
              v-model="placeholderDisplayMode"
              @change="changeDisplayMode"
              mandatory
              dense
            >
              <v-btn>
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
              <v-btn>
                <v-icon>mdi-file-document</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-toolbar>
          <v-card
            elevation="0"
            tile
            v-if="placeholderDisplayMode == 1"
            height="calc(100vh - 434px)"
          >
            <v-card-subtitle>问卷模式</v-card-subtitle>
            <div class="text-h2">尽请期待</div>
          </v-card>
          <v-data-table
            v-if="placeholderDisplayMode == 0"
            key="placeholder"
            fixed-header
            height="calc(100vh - 434px)"
            :items="placeholderGroups"
            :headers="placeholderGroupsHeaders"
            hide-default-footer
            disable-pagination
            disable-sort
            show-expand
            :expanded.sync="placeholderGroupsExpanded"
            elevation="1"
          >
            <template v-slot:[`item.name`]="{ item }">
              <v-tooltip right>
                <template v-slot:activator="{ on, attrs }">
                  <v-chip
                    color="primary lighten-2"
                    v-bind="attrs"
                    v-on="on"
                    outlined
                    label
                  >
                    <v-fade-transition mode="out-in">
                      <v-progress-circular
                        v-if="calcReplaceProgress(item.placeholders) > 0"
                        :color="
                          calcReplaceProgress(item.placeholders) < 100
                            ? 'warning'
                            : 'success'
                        "
                        class="mr-1"
                        :rotate="360"
                        :size="20"
                        :width="2"
                        :value="calcReplaceProgress(item.placeholders)"
                      >
                        <v-fade-transition mode="out-in">
                          <v-icon
                            v-if="calcReplaceProgress(item.placeholders) == 100"
                            color="success"
                            small
                            >mdi-check-bold</v-icon
                          >
                        </v-fade-transition>
                      </v-progress-circular>
                      <v-icon v-if="calcReplaceProgress(item.placeholders) == 0"
                        >mdi-tag-outline</v-icon
                      >
                    </v-fade-transition>
                    <div class="text-h6">{{ item.name }}</div>
                  </v-chip>
                </template>
                {{ calcReplaceProgressFormated(item.placeholders) }}
              </v-tooltip>
            </template>
            <template v-slot:[`item.value`]="{ item }">
              <div class="d-flex justify-end">
                <v-icon @click="onEditPlaceholderGroup(item)" color="primary lighten-2">mdi-pencil</v-icon>
                <v-icon @click="onDeletePlaceholderGroup(item)" color="error lighten-2">mdi-delete</v-icon>
              </div>
            </template>
            <template v-slot:expanded-item="{ item }">
              <td colspan="3" class="px-0">
                <v-card class="ma-2" elevation="0" tile>
                  <v-data-table
                    :items="item.placeholders"
                    :headers="placeholdersHeaders"
                    hide-default-header
                    hide-default-footer
                    disable-pagination
                    disable-sort
                  >
                    <template v-slot:[`item.no`]="{ item, index }">
                      <v-slide-x-transition mode="out-in">
                        <v-icon v-if="item.value" color="success" small
                          >mdi-check-circle-outline</v-icon
                        >
                        <span v-else>{{ index + 1 }}</span>
                      </v-slide-x-transition>
                    </template>
                    <template v-slot:[`item.group`]> &nbsp; </template>
                    <template v-slot:[`item.name`]="{ item }">
                      <v-chip
                        :disabled="item.disable"
                        :color="
                          !!item.value
                            ? 'success lighten-1'
                            : 'warning lighten-1'
                        "
                      >
                        {{ $formatPlaceholder(item) }}
                      </v-chip>
                    </template>
                    <template v-slot:[`item.value`]="{ item }">
                      <v-menu
                        v-if="item.type == 'date'"
                        v-model="item.menu"
                        :close-on-content-click="false"
                        max-width="290px"
                        min-width="auto"
                        :disabled="item.disable"
                        left
                        offset-y
                      >
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field
                            :value="formatDate(item)"
                            hide-details
                            class="mb-1 edit-column-font-size"
                            append-icon="mdi-calendar"
                            v-bind="attrs"
                            v-on="on"
                            :disabled="item.disable"
                            clearable
                            @click:clear="item.value = ''"
                            dense
                          ></v-text-field>
                        </template>
                        <v-date-picker
                          no-title
                          locale="zh"
                          :first-day-of-week="1"
                          v-model="item.value"
                          @input="item.menu = false"
                        >
                        </v-date-picker>
                      </v-menu>
                      <v-text-field
                        v-else
                        v-model="item.value"
                        hide-details
                        class="mb-1 edit-column-font-size"
                        :disabled="item.disable"
                        clearable
                        dense
                      ></v-text-field>
                    </template>
                  </v-data-table>
                </v-card>
              </td>
            </template>
          </v-data-table>
        </v-card>
        <!-- </v-fade-transition> -->
      </v-card>
      <!-- <confirm-dialog
        v-model="showDeleteConfirm"
        message="确定要删除该占位符分组？"
        @confirm="onDeletePlaceholderGroup(item)"
      ></confirm-dialog> -->
    </v-row>
  </v-card>
</template>

<script>
import moment from "moment";
import draggable from "vuedraggable";
import _ from "lodash";
import PlaceholderDetail from "../Placeholder/PlaceholderDetail.vue"
// import ConfirmDialog from '../Common/ConfirmDialog.vue';
// import nzhcn from "nzh/cn";
export default {
  props: {
    tplId: String,
    tplPath: String,
    session: {
      type: Object,
      default: () => {}
    }
  },
  components: {
    draggable,
    PlaceholderDetail,
    // ConfirmDialog
  },
  mounted() {
    window.ipc.receive(`previewPdf-${this.uid}`, ({ id, data }) => {
      if (this.tplId == id) {
        // this.pdfPath = path
        var blob = new Blob([data], { type: "application/pdf" });
        this.pdfPath = URL.createObjectURL(blob);
        this.templatePreviewLoading = false;
      }
    });
    window.ipc.receive(`readPlaceholderFromTemplate-${this.uid}`, ({ id, ph }) => {
      if (this.tplId == id) {
        window.replaceService.checkPlaceholderExistanceByName(ph.map(this.$parsePlaceholder), this.tplId).then(data => {
          console.log(data)
          this.placeholdersInTemplate = data
        })

        // 右侧标签列表：禁用已包含在模板中的占位符
        this.placeholderGroups.forEach((group) => {
          group.placeholders.forEach((placeholder) => {
            // 2-1. 存在于模板中：可填值
            // 2-2. 不存在模板中：禁用
            placeholder.disable = !ph.find(
              (e) => this.$formatPlaceholder(placeholder) == e
            );
          });
        });
      }
    });
    this.initTemplate()
  },
  beforeDestroy() {
    window.ipc.removeListener(`previewPdf-${this.uid}`)
    console.log(`listener previewPdf-${this.uid} is removed.`)
    window.ipc.removeListener(`readPlaceholderFromTemplate-${this.uid}`)
    console.log(`listener readPlaceholderFromTemplate-${this.uid} is removed.`)
  },
  watch: {
    // tplPath: {
    //   immediate: true,
    //   handler(val) {
    //     this.$emit('input:template-path', this.tplId, val)
    //   }
    // },
    placeholderGroups: {
      deep: true,
      handler(val) {
        this.session.templates.find(e=>e.id==this.tplId).placeholderGroups = val
        window.store.saveSession(this.session)
      }
    },
    drag(val) {
      console.log("drag variable:", val);
    },
    placeholdersInTemplate: {
      deep: true,
      handler(val) {
        if (!val.find((e) => ['new', 'saved'].includes(e.status))) {
          this.placeholdersInTemplateVisible = false;
        } else {
          this.placeholdersInTemplateVisible = true;
        }
      },
    },
  },
  computed: {
    templatePreviewUrl() {
      return this.pdfPath && this.present
        ? `${this.pdfPath}#view=${this.pdfOptions.view}&toolbar=${this.pdfOptions.toolbar}`
        : "about:blank";
    },
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost",
      };
    },
    placeholders() {
      const ph = []
      this.placeholderGroups.forEach(group => {
        ph.push(...group.placeholders)
      })
      return ph
    },
    sessionTemplate() {
      return this.session.templates.find(e=>e.id == this.tplId)
    }
  },
  methods: {
    onIntersect(entries) {
      this.present = entries[0].isIntersecting
    },
    initPlaceholderStatus() {
    },
    initTemplate(preview = true) {
      window.replaceService
        .findPlaceholderByTplId({ tplId: this.tplId })
        .then((data) => {
          this.placeholderGroups = data;
          if (this.sessionTemplate) {
            this.placeholderGroups.forEach(group=>{
              if (this.sessionTemplate.placeholderGroups) {
                const sessionGroup = this.sessionTemplate.placeholderGroups.find(e=>e.id==group.id)
                if (sessionGroup) {
                  sessionGroup.placeholders.forEach(sessionPlaceholder=>{
                    group.placeholders.find(e=>e.id==sessionPlaceholder.id).value = sessionPlaceholder.value
                  })
                }
              }
            })
          }
          this.placeholderGroupsExpanded = this.placeholderGroups;
          preview && this.previewPdf();
        });
    },
    calcReplaceProgress(placeholders) {
      return (
        (placeholders.filter((ph) => !_.isEmpty(ph.value)).length /
          placeholders.length) *
        100
      );
    },
    calcReplaceProgressFormated(placeholders) {
      return `${placeholders.filter((ph) => !_.isEmpty(ph.value)).length} / ${
        placeholders.length
      }`;
    },
    previewPdf(replaceFlag) {
      this.templatePreviewLoading = true;
      window.ipc.send('previewPdf', {
        uid: this.uid,
        sessionId: this.session.id,
        id: this.tplId,
        path: this.tplPath,
        data: replaceFlag ? this.placeholders : [],
      });
    },
    // formatPlaceholder({ name }) {
    //   return `$\{${name}}`;
    // },
    // parsePlaceholder(str) {
    //   const regex = /\$\{(.*)\}/;
    //   const arr = regex.exec(str);
    //   return arr.length > 1 ? arr[1] : null;
    // },
    formatDate({ value, format }) {
      return value && format ? moment(value).format(format) : "";
    },
    onDrag(obj) {
      this.drag = true;
      console.log("drag:", obj);
    },
    onDrop(obj) {
      this.drag = false;
      console.log("drop:", obj);
    },
    // onDragRow(obj) {
    //   this.drag = true;
    //   console.log("dragrow:", obj);
    // },
    // onDropRow(obj) {
    //   this.drag = false;
    //   console.log("droprow:", obj);
    // },
    // onPlaceholderTypeChange(item, row) {
    //   const option = this.placeholderTypeOptions.find((e) => e.value == item);
    //   option && (row.format = option.format);
    // },
    onCreatePlaceholderGroup() {
      this.isEditPlaceholder = false
      this.showPlaceholderDetail = true;
    },
    onEditPlaceholderGroup(group) {
      this.placeholderNewGroup.group = {
        id: group.id,
        name: group.name
      }
      this.placeholderNewGroup.placeholders = group.placeholders.slice()
      this.isEditPlaceholder = true
      this.showPlaceholderDetail = true;
      console.log(group)
    },
    onDeletePlaceholderGroup(group) {
      this.$dialog.confirm({ text: `确定要删除占位符分组：${group.name}？` }).then(res => {
        console.log(res, group)
        if (res) {
          window.replaceService.savePlaceholderGroup({
            // tplId: this.tplId,
            id: group.id,
            delete: true
          }).then(() => {
            this.$toast.success(`占位符分组删除成功！`);
            this.initTemplate()
          }).catch((err) => {
            console.log(err);
            this.$toast.error(`占位符分组删除失败！`);
          });
        }
      })
    },
    onDelete(item) {
      if (item) {
        console.log("onDelete", item)
        this.placeholdersInTemplate.push(item);
      }

      this.initTemplate()
    },
    onCancel(items) {
      this.placeholdersInTemplate.push(...items);
      this.placeholderNewGroup.group = { id: null, name: null };
      this.placeholderNewGroup.placeholders.splice(0);
      this.showPlaceholderDetail = false;
    },
    onSave() {
      this.placeholderNewGroup.group = { id: null, name: null };
      this.placeholderNewGroup.placeholders.splice(0);
      this.showPlaceholderDetail = false;
      this.initTemplate()
    },
    onClear(items) {
      this.placeholdersInTemplate.push(...items);
    },
    changeDisplayMode(value) {
      console.log(value);
    },
  },
  data() {
    return {
      placeholderGroups: [],
      placeholderGroupsExpanded: [],
      placeholdersInTemplate: [],
      placeholdersInTemplateVisible: true,
      templatePreviewLoading: false,
      pdfOptions: {
        toolbar: 0,
        view: "FitH,top",
      },
      // pdfOptions: {
      //   toolbar: 1,
      //   view: ''
      // },
      pdfPath: null,
      placeholderGroupsHeaders: [
        {
          text: "名称",
          value: "name",
          align: "center",
          cellClass: "column-width-name text-start",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
        },
      ],
      placeholdersHeaders: [
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
      drag: false,
      showPlaceholderDetail: false,
      placeholderNewGroupHeaders: [
        {
          text: "No.",
          value: "no",
          align: "center",
        },
        {
          text: "名称",
          value: "name",
          align: "center",
        },
        {
          text: "类型",
          value: "type",
          align: "center",
        },
        {
          text: "格式化",
          value: "format",
          align: "center",
        },
        {
          text: "删除",
          value: "operation",
          align: "center",
        },
      ],
      placeholderNewGroup: {
        group: {
          id: null,
          name: null
        },
        placeholders: [],
      },
      newPlaceholders: [],
      placeholderTypeOptions: [
        { text: "文本", value: "text" },
        { text: "日期", value: "date", format: "YYYY 年 M 月 D 日" },
        { text: "金额", value: "money" },
      ],
      rules: {
        group: { requiredInput: true },
      },
      placeholderDisplayMode: 0, // 0：列表模式 1：问卷模式,
      isEditPlaceholder: false,
      showDeleteConfirm: false,
      present: false,
    };
  },
};
</script>

<style>
.column-width-no {
  width: 48px;
}
.column-width-name {
  width: 30%;
}
.chip-regular {
  opacity: 75%;
}
.chip-draggable {
  cursor: move;
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
  opacity: 50%;
  font-size: 20px;
  overflow: hidden;
  pointer-events: none;
}
.narrow-select .v-select__selections input {
  display: none;
}
.pointer-events-none {
  pointer-events: none;
}
</style>
