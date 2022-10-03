<template>
  <validation-observer ref="observer" v-slot="{ invalid }">
    <v-form @submit.native.prevent="onSave">
      <v-card elevation="0" tile>
        <v-data-table
          key="placeholder"
          fixed-header
          height="calc(100vh - 700px)"
          :items="formData.items"
          :headers="placeholderGroupHeaders"
          hide-default-footer
          disable-pagination
          disable-sort
        >
          <template v-slot:top>
            <div class="ma-1">
              <validation-provider
                name="分组名称"
                :rules="rules.name"
                v-slot="{ errors }"
              >
                <v-autocomplete
                  v-model="formData.group"
                  :search-input.sync="inputGroup"
                  :items="groups"
                  item-text="name"
                  item-value="id"
                  return-object
                  prepend-icon="mdi-tag-plus"
                  placeholder="请输入分组名称或从列表中选择现有分组"
                  :error-messages="errors[0]"
                  clearable
                  @click:clear="formData.group={id:'',name:''}"
                >
                  <template v-if="isNewGroup" v-slot:prepend-item>
                    <v-list-item-group>
                      <v-list-item @click="createPlaceholderGroupOption">
                        <v-list-item-action>
                          <v-icon color="success">mdi-plus</v-icon>
                        </v-list-item-action>
                        <v-list-item-content>
                          <v-list-item-title>
                            新建占位符分组：
                            <v-chip>{{ inputGroup }}</v-chip>
                          </v-list-item-title>
                        </v-list-item-content>
                      </v-list-item>
                    </v-list-item-group>
                  </template>
                  <template v-slot:item="{ item }">
                    <v-list-item-content>
                      <v-list-item-title>
                        {{ item.name }}
                      </v-list-item-title>
                      <v-list-item-subtitle>
                        <div v-if="item.id">
                          <div class="mt-1">
                            已绑定
                            <template v-for="({ name }, index) in (item.templates.length > 3 ? item.templates.slice(0, 3) : item.templates)">
                              <v-chip color="primary lighten-1" class="mr-1" :key="index" small>{{ name }}</v-chip>
                            </template>
                            {{ `${ item.templates.length > 3 ? '等 ' : ''} ${item.templates.length}个模板` }}
                          </div>
                          <div class="mt-1">
                            包含
                            <template v-for="({ name }, index) in (item.placeholderItems.length > 3 ? item.placeholderItems.slice(0, 3) : item.placeholderItems)">
                              <v-chip :color="containsInTemplate(name) ? 'warning lighten-1' : ''" class="mr-1" :key="index" small>{{ $formatPlaceholder(name) }}</v-chip>
                            </template>
                            {{ `${ item.placeholderItems.length > 3 ? '等 ' : ''} ${item.placeholderItems.length}个占位符` }}
                          </div>
                        </div>
                        <div v-else>新分组</div>
                      </v-list-item-subtitle>
                    </v-list-item-content>
                  </template>
                </v-autocomplete>
              </validation-provider>
            </div>
          </template>
          <template v-slot:body="{ items }">
            <draggable
              v-model="formData.items"
              :animation="200"
              group="placeholderTable"
              :disabled="formData.items.length == 0"
              ghostClass="ghost"
              tag="tbody"
              :move="onMoveCallback"
              @start="onDragRow"
              @end="onDropRow"
            >
              <template v-for="(item, index) in items">
                <transition :name="!drag ? 'flip-list' : null" type="transition" :key="item.name">
                  <tr :class="{ unmovable: !!item.id }">
                    <td>
                      {{ index + 1 }}
                    </td>
                    <td align="start">
                      <v-chip :color="containsInNewPlaceholders(item.name) ? 'warning lighten-1' : ''">
                        {{ $formatPlaceholder(item) }}
                      </v-chip>
                    </td>
                    <td>
                      <v-select
                        v-model="item.type"
                        :items="placeholderTypeOptions"
                        :disabled="!!item.id"
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
                        :disabled="['text', 'money'].includes(item.type) || !!item.id"
                        hide-details
                        dense
                      ></v-text-field>
                    </td>
                    <td style="min-width: 60px">
                      <v-icon
                        v-if="!item.id"
                        @click="onDelete(item, index)"
                        color="error"
                        >mdi-delete</v-icon
                      >
                    </td>
                  </tr>
                </transition>
              </template>
            </draggable>
          </template>
          <template v-slot:footer>
            <v-card
              height="50px"
              outlined
              class="placeholder-drop-area ma-3"
              elevation="0"
            >
              <div
                class="d-flex justify-center align-center placeholder-drop-area-hint mt-2"
              >
                请从左侧拖拽<v-chip class="mt-n1" color="warning" small
                  >占位符</v-chip
                >至虚线框以添加占位符
              </div>
              <draggable
                v-model="newPlaceholders"
                :group="{ name: 'placeholder' }"
                style="height: 100%; width: 100%"
                class="d-flex justify-center"
              >
              </draggable>
            </v-card>
          </template>
        </v-data-table>
        <v-card-actions class="px-4">
          <v-spacer></v-spacer>
          <v-btn @click="onCancel" text>取消</v-btn>
          <v-btn type="submit" color="primary" :disabled="invalid"
            >确定</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-form>
  </validation-observer>
</template>

<script>
import draggable from "vuedraggable";
import _ from "lodash";
export default {
  name: 'placeholder-detail',
  props: {
    tplId: String,
    placeholder: Object,
    placeholdersInTemplate: {
      type: Array,
      default: () => []
    },
    isEdit: Boolean,
  },
  components: {
    draggable
  },
  mounted() {
    window.replaceService.findPlaceholderByTplIdExcluded({ tplId: this.tplId }).then(data => {
      console.log(data)
      this.groups = data
    })
  },
  watch: {
    placeholder: {
      deep: true,
      handler(val) {
        if (val) {
          this.formData.group = {
            id: val.id,
            name: val.name
          }
          this.formData.items = val.items
        }
      }
    },
    "formData.group"(val) {
      if (val && val.placeholderItems) {
        this.placeholdersInTemplate.push(...this.newPlaceholders.splice(0))
        val.placeholderItems.forEach(item=>{
          const index = this.placeholdersInTemplate.findIndex(pit=>pit.text==this.$formatPlaceholder(item.name))
          if (index != -1) {
            const item = this.placeholdersInTemplate.splice(index, 1)
            this.newPlaceholders.push(...item)
          }
        })
        this.formData.items = val.placeholderItems
      } else {
        this.placeholdersInTemplate.push(...this.newPlaceholders.splice(0));
        this.formData.items.splice(0)
      }
    },
    newPlaceholders: {
      deep: true,
      handler(newVal, oldVal) {
        console.log(newVal, oldVal);
        if (newVal.length == 0) return;
        if (newVal.length > oldVal.length) {
          // add item
          _.difference(newVal, oldVal).forEach((newGroup) => {
            this.formData.items.push({
              // id: uuidv4(),
              name: this.$parsePlaceholder(newGroup.text),
              type: "text",
              format: null,
            });
          });
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
      },
    },
  },
  computed: {
    isNewGroup() {
      return this.inputGroup && this.groups.findIndex(group=>group.name==this.inputGroup) == -1
    },
  },
  methods: {
    onMoveCallback(evt, originalEvent) {
      console.log('onMoveCallback', evt, originalEvent)
      if (evt.dragged.classList.contains("unmovable") || evt.related.classList.contains("unmovable")) {
        return false
      }
    },
    containsInTemplate(name) {
      return this.placeholdersInTemplate.findIndex(pit => pit.text == this.$formatPlaceholder(name)) != -1
    },
    containsInNewPlaceholders(name) {
      return this.newPlaceholders.findIndex(newPh => newPh.text == this.$formatPlaceholder(name)) != -1
    },
    createPlaceholderGroupOption() {
      const existedGroup = this.groups.find(group=>!group.id)
      if (existedGroup) {
        existedGroup.name = this.inputGroup
        this.formData.group = existedGroup
      } else {
        const newGroup = {
          id: '',
          name: this.inputGroup
        }
        this.groups.push(newGroup)
        this.formData.group = newGroup
      }
    },
    handleInput(e) {
      if (e.keyCode == 13) {
        console.log(this.inputGroup)
      }
      // const existedGroup = this.groups.find(group=>group==e)
      // if (!existedGroup && e) {
      //   const newGroup = this.groups.find(group=>!group.id)
      //   if (newGroup) {
      //     newGroup.name = e
      //   } else {
      //     this.groups.push({
      //       id: '',
      //       name: e
      //     })
      //   }
      // }
    },
    onPlaceholderTypeChange(item, row) {
      const option = this.placeholderTypeOptions.find((e) => e.value == item);
      option && (row.format = option.format);
    },
    onDelete(item, index) {
      this.formData.items.splice(index, 1);
      const newPlaceholderIndex = this.newPlaceholders.findIndex(
        (e) => e.text == this.$formatPlaceholder(item)
      );
      // this.placeholdersInTemplate.push(
      //   ...this.newPlaceholders.splice(newPlaceholderIndex, 1)
      // );
      this.$emit('delete', ...this.newPlaceholders.splice(newPlaceholderIndex, 1))
    },
    onCancel() {
      this.$emit('cancel', this.newPlaceholders.splice(0))
    },
    onSave() {
      // 新增 或 修改 分组， 新增 占位符
      const group = {
        tplId: this.tplId,
        name: this.formData.group.name,
        placeholderItems: [],
        insert: true
      }
      this.formData.items.forEach((ph) => {
        group.placeholderItems.push({
          // id: uuidv4(),
          name: ph.name,
          type: ph.type,
          format: ph.format,
          insert: true
          // ordinal: index + 1,
        });
      });
      window.replaceService.bulkSavePlaceholderGroup([group]).then(() => {
        this.$toast.success(`占位符保存成功！`);
        this.$emit('save')
      }).catch((err) => {
        console.log(err);
        this.$toast.error(`占位符保存失败！`);
      });
      // window.commonService
      //   .save("Placeholder", {
      //     templateId: this.tplId,
      //     // groupId: uuidv4(),
      //     groupName: this.formData.group,
      //     // groupOrdinal: this.placeholderGroups.length + 1,
      //     items: items,
      //     insert: true,
      //   })
      //   .then(() => {
      //     this.$toast.success(`占位符保存成功！`);
      //     window.replaceService
      //       .listPlaceholderGroupByTemplateId(this.tplId)
      //       .then((data) => {
      //         this.placeholderGroups = data;
      //         // expand all
      //         this.placeholderGroupsExpanded = this.placeholderGroups;
      //       });
      //     window.replaceService
      //       .listPlaceholderByTemplateId(this.tplId)
      //       .then((data) => {
      //         this.placeholders = data;
      //       });
      //     this.previewPdf();
      //     this.createPlaceholderGroup = false;
      //     // reset
      //     this.formData.group = null;
      //     this.formData.items.splice(0);
      //     this.newPlaceholders.splice(0);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //     this.$toast.error(`占位符保存失败！`);
      //   });
    },
    onDragRow(obj) {
      this.drag = true;
      console.log("dragrow:", obj);
    },
    onDropRow(obj) {
      this.drag = false;
      console.log("droprow:", obj);
    },
  },
  data() {
    return {
      placeholderGroupHeaders: [
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
      rules: {
        name: { requiredInputObject: { field: 'name' } },
      },
      formData: {
        group: {
          id: '',
          name: '',
          tplId: this.tplId
        },
        items: []
      },
      newPlaceholders: [],
      placeholderTypeOptions: [
        { text: "文本", value: "text" },
        { text: "日期", value: "date", format: "YYYY 年 M 月 D 日" },
        { text: "金额", value: "money" },
      ],
      inputGroup: null,
      groups: [],
      drag: false,
    }
  }
}
</script>