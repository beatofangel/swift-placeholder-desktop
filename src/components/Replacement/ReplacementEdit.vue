<template>
  <v-card>
    <v-row class="ma-0">
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <v-row
          style="height: 100%"
          align="center"
          v-if="templatePreviewLoading"
        >
          <v-col offset="4" cols="4">
            <v-img src="spinner.svg"></v-img>
          </v-col>
        </v-row>
        <iframe
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
          :class="{ 'pointer-events-none': !createPlaceholderGroup }"
          style="position:absolute;bottom:30px;left:0;width:80%"
        >
          <draggable
            v-model="placeholdersInTemplate"
            :animation="200"
            :group="{name:'placeholder'}"
            :disabled="!createPlaceholderGroup"
            ghostClass="ghost"
            :class="{ 'placeholder-drop-area': createPlaceholderGroup }"
            style="min-height:100px;width:100%;text-align:center;vertical-align:top;"
            @start="onDrag"
            @end="onDrop"
          >
            <!-- <transition-group type="transition" :name="!drag ? 'flip-chip' : null"> -->
              <template v-for="({ text, unbound }) in placeholdersInTemplate">
                <v-chip
                  v-if="createPlaceholderGroup && unbound || !createPlaceholderGroup"
                  class="ma-2"
                  :class="{'chip-draggable': createPlaceholderGroup, 'chip-regular': !createPlaceholderGroup}"
                  :disabled="!unbound"
                  :label="!unbound"
                  :color="`${unbound ? 'warning' : ''} lighten-1`"
                  :outlined="!createPlaceholderGroup && !unbound"
                  :key="text"
                >
                  <v-icon v-if="!unbound">mdi-link-variant</v-icon>
                  {{ text }}
                </v-chip>
              </template>
            <!-- </transition-group> -->
          </draggable>
        </v-card>
        </v-slide-y-reverse-transition>
        <v-btn
          @click="placeholdersInTemplateVisible = !placeholdersInTemplateVisible"
          color="primary"
          style="position:absolute;bottom:10px;left:40%;"
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
            style="
              bottom: 0;
              margin-bottom: 100px;
              margin-right: 10px;
            "
            color="primary"
            dark
            absolute
            bottom
            right
            fab
            :disabled="createPlaceholderGroup"
            @click="createPlaceholderGroup = true"
          >
            <v-icon large>mdi-tag-plus</v-icon>
          </v-btn>
        </v-fab-transition>
        <v-fab-transition>
          <v-btn
            style="
              bottom: 0;
              margin-bottom: 20px;
              margin-right: 10px;
            "
            color="pink"
            dark
            absolute
            bottom
            right
            fab
            :disabled="createPlaceholderGroup"
            @click="previewPdf(true)"
          >
            <v-icon large>{{
              templatePreviewLoading
                ? "mdi-loading mdi-spin"
                : "mdi-sync"
            }}</v-icon>
          </v-btn>
        </v-fab-transition>
      </v-card>
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <!-- <v-fade-transition :group="true" leave-absolute> -->
        
        <validation-observer ref="observer" v-slot="{ invalid }">
          <v-form @submit.prevent="onSave">
            <v-card
              v-if="createPlaceholderGroup"
              elevation="0"
              tile
            >
              <v-data-table
                key="placeholder"
                fixed-header
                height="calc(100vh - 700px)"
                :items="placeholderNewGroup.items"
                :headers="placeholderNewGroupHeaders"
                hide-default-footer
                disable-pagination
                disable-sort
              >
                <template v-slot:top>
                  <div class="ma-1">
                  <validation-provider
                    name="分组名称"
                    :rules="rules.group"
                    v-slot="{ errors }"
                  >
                    <v-text-field
                      v-model="placeholderNewGroup.group"
                      prepend-icon="mdi-tag-plus"
                      placeholder="请输入分组名称"
                      :error-messages="errors[0]"
                    >
                    </v-text-field>
                  </validation-provider>
                  </div>
                </template>
                <template v-slot:body="{ items }">
                  <draggable v-model="placeholderNewGroup.items" group="placeholderTable" :disabled="newPlaceholders.length == 0" tag="tbody" @start="onDragRow" @end="onDropRow">
                    <tr v-for="(item, index) in items" :key="item.name">
                      <td>
                        {{ index + 1 }}
                      </td>
                      <td align="start">
                        <v-chip>
                          {{ formatPlaceholder(item) }}
                        </v-chip>
                      </td>
                      <td>
                        <v-select
                          v-model="item.type"
                          :items="placeholderTypeOptions"
                          menu-props="offsetY"
                          class="narrow-select"
                          @change="onPlaceholderTypeChange($event, item)"
                          hide-details
                          dense
                        ></v-select>
                      </td>
                      <td>
                        <v-text-field
                          v-model="item.format"
                          prepend-icon="mdi-function"
                          :disabled="['text','money'].includes(item.type)"
                          hide-details
                          dense
                        ></v-text-field>
                      </td>
                      <td style="min-width: 60px;">
                        <v-icon
                          @click="onDeletePlaceholder(item, index)"
                          color="error"
                        >mdi-delete</v-icon>
                      </td>
                    </tr>
                  </draggable>
                </template>
                <template v-slot:footer>
                  <v-card height="50px" outlined class="placeholder-drop-area ma-3" elevation="0">
                    <div class="placeholder-drop-area-hint mt-2">请从左侧拖拽<v-chip class="mt-n1" color="warning" small>占位符</v-chip>至虚线框以添加占位符</div>
                    <draggable v-model="newPlaceholders" :group="{name:'placeholder'}" style="height:100%;width:100%;">
                      <!-- <div v-for="item in newPlaceholders" :key="item.name"></div> -->
                    </draggable>
                  </v-card>
                </template>
              </v-data-table>
              <v-card-actions class="px-4">
                <v-spacer></v-spacer>
                <v-btn @click="onCancel" text>取消</v-btn>
                <v-btn
                  type="submit"
                  color="primary"
                  :disabled="invalid"
                  >确定</v-btn
                >
              </v-card-actions>
            </v-card>
          </v-form>
        </validation-observer>
        <!-- </v-fade-transition>
        <v-fade-transition :group="true" leave-absolute> -->
        <v-card
          v-if="!createPlaceholderGroup"
          elevation="0"
          tile
        >
          <v-toolbar elevation="0">
            <v-autocomplete
              prepend-icon="mdi-magnify"
              placeholder="查询主体信息"
              hide-details
            ></v-autocomplete>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="placeholderDisplayMode" @change="changeDisplayMode" mandatory dense>
              <v-btn>
                <v-icon>mdi-format-list-bulleted</v-icon>
              </v-btn>
              <v-btn>
                <v-icon>mdi-file-document</v-icon>
              </v-btn>
            </v-btn-toggle>
          </v-toolbar>
          <v-card elevation="0" tile v-if="placeholderDisplayMode == 1" height="calc(100vh - 564px)">
            <v-card-subtitle>问卷模式</v-card-subtitle>
            <div class="text-h2">尽请期待</div>
          </v-card>
          <v-data-table
            v-if="placeholderDisplayMode == 0"
            key="placeholder"
            fixed-header
            height="calc(100vh - 564px)"
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
              <v-chip color="primary lighten-2" label>
                <v-icon class="mr-1" small>mdi-tag</v-icon>
                {{ item.name }}
              </v-chip>
            </template>
            <template v-slot:expanded-item="{ item }">
              <td colspan="3" class="px-0">
                <v-card class="ma-2" elevation="0" tile>
                  <v-data-table
                    :items="
                      placeholders.filter(
                        (e) => e.groupId == item.id
                      )
                    "
                    :headers="placeholdersHeaders"
                    hide-default-header
                    hide-default-footer
                    disable-pagination
                    disable-sort
                  >
                    <template v-slot:[`item.no`]="{ index }">
                      {{ index + 1 }}
                    </template>
                    <template v-slot:[`item.group`]>
                      &nbsp;
                    </template>
                    <template v-slot:[`item.name`]="{ item }">
                      <v-chip
                        :color="
                          !!item.value
                            ? 'success lighten-1'
                            : ''
                        "
                      >
                        {{ formatPlaceholder(item) }}
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
                        <template
                          v-slot:activator="{ on, attrs }"
                        >
                          <v-text-field
                            :value="formatDate(item)"
                            hide-details
                            class="mb-1 edit-column-font-size"
                            append-icon="mdi-calendar"
                            v-bind="attrs"
                            v-on="on"
                            :disabled="item.disable"
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
    </v-row>
  </v-card>
</template>

<script>
import moment from "moment";
import draggable from "vuedraggable";
import { v4 as uuidv4 } from "uuid";
import _ from "lodash";
// import nzhcn from "nzh/cn";
export default {
  props: {
    tplId: String,
    tplPath: String
  },
  components: {
    draggable
  },
  mounted() {
    window.ipc.receive("previewPdf", ({ id, path }) => {
      if (this.tplId == id) {
        this.pdfPath = path
        this.templatePreviewLoading = false;
      }
    });
    window.ipc.receive("readPlaceholderFromTemplate", ({ id, ph }) => {
      if (this.tplId == id) {
        this.placeholdersInTemplate = ph.map(e=>{
          return {
            text: e,
            unbound: !this.placeholders.find(item=>this.formatPlaceholder(item) == e)
          }
        })
        this.placeholders.forEach(item=>{
          item.disable = !ph.find(e=>this.formatPlaceholder(item) == e)
          console.log(item.name, item.disable)
        })
      }
    });
    window.replaceService
      .listPlaceholderGroupByTemplateId(this.tplId)
      .then((data) => {
        this.placeholderGroups = data;
        // expand all
        this.placeholderGroupsExpanded = this.placeholderGroups;
      });
    window.replaceService
      .listPlaceholderByTemplateId(this.tplId)
      .then((data) => {
        this.placeholders = data;
      });
    this.previewPdf();
  },
  watch: {
    drag(val) {
      console.log('drag variable:',val)
    },
    newPlaceholders: {
      deep: true,
      handler(newVal, oldVal) {
        console.log(newVal, oldVal)
        if (newVal.length == 0) return
        if (newVal.length > oldVal.length) {
          // add item
          _.difference(newVal, oldVal).forEach(newGroup => {
            this.placeholderNewGroup.items.push({
              id: uuidv4(),
              name: this.parsePlaceholder(newGroup.text),
              type: 'text',
              format: null
            })
          })
          // const newGroup = _.difference(newVal, oldVal)[0]
          // // const newGroup = newVal[newVal.length-1]
          // this.placeholderNewGroup.items.push({
          //   id: uuidv4(),
          //   name: this.parsePlaceholder(newGroup.text),
          //   type: 'text',
          //   format: null
          // })
        }
        if (newVal.length < oldVal.length) {
          // delete item
          // nothing todo
        }
      }
    },
    // tplId(val) {
    //   window.replaceService
    //     .listPlaceholderGroupByTemplateId(val)
    //     .then((data) => {
    //       this.placeholderGroups = data;
    //       // expand all
    //       this.placeholderGroupsExpanded = this.formData.placeholderGroups;
    //     });
    //   window.replaceService
    //     .listPlaceholderByTemplateId(val)
    //     .then((data) => {
    //       this.placeholders = data;
    //     });
    //   this.previewPdf();
    // }
    placeholdersInTemplate: {
      deep: true,
      handler(val) {
        if (!val.find(e=>e.unbound)) {
          this.placeholdersInTemplateVisible = false
        }
      }
    }
  },
  computed: {
    templatePreviewUrl() {
      return this.pdfPath ? `${this.pdfPath}#view=${this.pdfOptions.view}&toolbar=${this.pdfOptions.toolbar}` : 'about:blank'
    },
    dragOptions() {
      return {
        animation: 200,
        group: "description",
        disabled: false,
        ghostClass: "ghost"
      };
    }
  },
  methods: {
    previewPdf(replaceFlag) {
      this.templatePreviewLoading = true;
      window.ipc.send("previewPdf", {
        id: this.tplId,
        path: this.tplPath,
        data: replaceFlag ? this.placeholders : [],
      });
    },
    formatPlaceholder({ name }) {
      return `$\{${name}}`
    },
    parsePlaceholder(str) {
      const regex = /\$\{(.*)\}/
      const arr = regex.exec(str)
      return arr.length > 1 ? arr[1] : null
    },
    formatDate({ value, format }) {
      return value && format ? moment(value).format(format) : null;
    },
    onDrag(obj) {
      this.drag = true
      console.log('drag:', obj)
    },
    onDrop(obj) {
      this.drag = false
      console.log('drop:', obj)
    },
    onDragRow(obj) {
      this.drag = true
      console.log('dragrow:', obj)
    },
    onDropRow(obj) {
      this.drag = false
      console.log('droprow:', obj)
    },
    onPlaceholderTypeChange(item, row) {
      const option = this.placeholderTypeOptions.find(e=>e.value == item)
      option && (row.format = option.format)
    },
    onDeletePlaceholder(item, index) {
      this.placeholderNewGroup.items.splice(index, 1)
      const newPlaceholderIndex = this.newPlaceholders.findIndex(e=>e.text == this.formatPlaceholder(item))
      this.placeholdersInTemplate.push(...this.newPlaceholders.splice(newPlaceholderIndex, 1))
    },
    onCancel() {
      this.createPlaceholderGroup = false
      this.placeholdersInTemplate.push(...this.newPlaceholders)
      this.newPlaceholders.splice(0)
      this.placeholderNewGroup.group = null
      this.placeholderNewGroup.items.splice(0)
    },
    onSave() {
      const items = []
      this.placeholderNewGroup.items.forEach((ph,index) => {
        items.push({
          id: uuidv4(),
          name: ph.name,
          type: ph.type,
          format: ph.format,
          sort: index + 1
        })
      })
      window.commonService.save('Placeholder', {
        templateId: this.tplId,
        groupId: uuidv4(),
        groupName: this.placeholderNewGroup.group,
        groupSort: this.placeholderGroups.length + 1,
        items: items,
        insert: true
      }).then(result => {
        if (result.success) {
          window.replaceService
            .listPlaceholderGroupByTemplateId(this.tplId)
            .then((data) => {
              this.placeholderGroups = data;
              // expand all
              this.placeholderGroupsExpanded = this.placeholderGroups;
            });
          window.replaceService
            .listPlaceholderByTemplateId(this.tplId)
            .then((data) => {
              this.placeholders = data;
            });
          this.previewPdf();
          this.createPlaceholderGroup = false
          // reset
          this.placeholderNewGroup.group = null
          this.placeholderNewGroup.items.splice(0)
          this.newPlaceholders.splice(0)
        }
      })
    },
    changeDisplayMode(value) {
      console.log(value)
    }
  },
  data() {
    return {
      placeholderGroups: [],
      placeholderGroupsExpanded: [],
      placeholders: [],
      placeholdersInTemplate: [],
      placeholdersInTemplateVisible: true,
      templatePreviewLoading: false,
      pdfOptions: {
        toolbar: 0,
        view: 'FitH,top'
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
      createPlaceholderGroup: false,
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
          align: "center"
        }
      ],
      placeholderNewGroup: {
        group: null,
        items: []
      },
      newPlaceholders: [],
      placeholderTypeOptions: [
        { text: '文本', value: 'text' },
        { text: '日期', value: 'date', format: 'YYYY 年 M 月 D 日' },
        { text: '金额', value: 'money' },
      ],
      rules: {
        group: { requiredInput: true },
      },
      placeholderDisplayMode: 0, // 0：清单模式 1：问卷模式
    }
  }
}
</script>

<style>
.column-width-no {
  width: 48px;
}
.column-width-name {
  width: 30%;
}
.chip-regular {
  opacity:75%;
}
.chip-draggable {
  cursor:move;
}
.placeholder-drop-area {
  border: 1px dashed rgba(0,0,0, .4) !important;
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
.rotate-transition-180 {
  transform: rotate(0.5turn);
}
</style>