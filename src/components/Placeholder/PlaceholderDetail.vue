<template>
  <validation-observer ref="observer" v-slot="{ valid, dirty }">
    <v-form @submit.prevent="onSave">
      <v-card elevation="0" tile>
        <v-data-table
          key="placeholder"
          fixed-header
          height="calc(100vh - 700px)"
          :items="formData.placeholders"
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
                <v-text-field
                  v-if="isEdit"
                  v-model="formData.group.name"
                  :prepend-icon="isEdit ? 'mdi-tag' : 'mdi-tag-plus'"
                  placeholder="请输入分组名称"
                  :error-messages="errors[0]"
                  clearable
                >
                </v-text-field>
                <!-- @input: 当设定为return-object时，清空按钮会导致v-model变为null，需要判断 -->
                <v-autocomplete
                  v-else
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
                  @input="formData.group = $event ? $event : { id: null, name: null, tplId: tplId }"
                >
                  <template v-if="isNewGroup" v-slot:prepend-item>
                    <v-list-item-group>
                      <v-list-item @click="createPlaceholderGroupOption">
                        <v-list-item-action>
                          <v-icon :color="formData.group.name ? 'primary' : 'success'">{{ formData.group.name ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
                        </v-list-item-action>
                        <v-list-item-content>
                          <v-list-item-title>
                            <template v-if="formData.group.name">
                              <v-chip>{{ formData.group.name }}</v-chip>
                              <v-icon class="mx-1">mdi-arrow-right</v-icon>
                            </template>
                            <template v-else>新分组：</template>
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
              v-model="formData.placeholders"
              :animation="200"
              group="placeholderTable"
              :disabled="
                formData.placeholders.length == 0 || 
                isEdit && (
                  newPlaceholders.length == 0
                ) || 
                !!formData.group.id && newPlaceholders.length == 0
              "
              ghostClass="ghost"
              filter=".unmovable"
              draggable=".movable"
              tag="tbody"
              @start="onDragRow"
              @end="onDropRow"
            >
              <template v-for="(item, index) in items">
                <transition :name="!drag ? 'flip-list' : null" type="transition" :key="item.name">
                  <!-- "编辑模式"或"新增模式（现有分组）"只能移动从模板过来的占位符，"新增模式（新分组）"可以移动所有占位符 -->
                  <v-hover v-slot="{ hover }">
                  <tr :class="{
                      unmovable: !containsInNewPlaceholders(item.name),
                      movable: containsInNewPlaceholders(item.name)
                    }"
                  >
                    <td>
                      <v-icon v-if="hover && containsInNewPlaceholders(item.name)" size="20" class="ml-n1">mdi-swap-vertical</v-icon>
                      <template v-else>
                        {{ index + 1 }}
                      </template>
                    </td>
                    <td align="start">
                      <v-chip :color="containsInNewPlaceholders(item.name) ? 'warning lighten-1' : ''">
                        {{ $formatPlaceholder(item) }}
                      </v-chip>
                    </td>
                    <td>
                      <validation-provider
                        :name="`类型[${index + 1}]`"
                      >
                        <v-select
                          v-model="item.type"
                          :items="placeholderTypeOptions"
                          :disabled="!isEdit && !!item.id"
                          menu-props="offsetY"
                          class="narrow-select"
                          @change="onPlaceholderTypeChange($event, item)"
                          hide-details
                          dense
                        ></v-select>
                      </validation-provider>
                    </td>
                    <td>
                      <validation-provider
                        :name="`格式化[${index + 1}]`"
                      >
                        <v-text-field
                          v-model="item.format"
                          prepend-icon="mdi-function"
                          :disabled="['text', 'money'].includes(item.type) || !isEdit && !!item.id"
                          hide-details
                          dense
                        ></v-text-field>
                      </validation-provider>
                    </td>
                    <td style="min-width: 60px">
                      <v-icon
                        v-if="isEdit || (
                          !formData.group.id || 
                          containsInNewPlaceholders(item.name)
                        )"
                        @click="onDelete(item, index)"
                        color="error"
                        >mdi-delete</v-icon
                      >
                    </td>
                  </tr>
                  </v-hover>
                </transition>
              </template>
            </draggable>
          </template>
          <template v-slot:footer>
            <v-card
              height="50px"
              :outlined="!!formData.group.name"
              class="ma-3"
              :class="{ 'placeholder-drop-area': !!formData.group.name }"
              elevation="0"
            >
              <div
                v-if="formData.group.name"
                class="d-flex justify-center align-center placeholder-drop-area-hint mt-2"
              >
                请从左侧拖拽<v-chip class="mt-n1" color="warning" small
                  >占位符</v-chip
                >至虚线框以添加占位符
              </div>
              <draggable
                v-model="newPlaceholders"
                v-if="formData.group.name"
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
          <v-btn type="submit" color="primary" :disabled="!(
            valid && (
              dirty ||
              newPlaceholders.length > 0
            )
          )"
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
    placeholder: {
      type: Object,
      default: () => {
        return {
          group: {
            id: null,
            name: null,
          }
        }
      }
    },
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
    console.log("mounted",this.placeholder)
    this.formData.group = {
      ...this.placeholder.group
    }
    if (!this.isEdit) {
      window.replaceService.findPlaceholderByTplIdExcluded({ tplId: this.tplId }).then(data => {
        console.log(data)
        this.groups = data
      })
    }
  },
  watch: {
    "formData.group.id"(val) {
      if (val) {
        window.replaceService.findPlaceholderItemByPhGrpId({ phGrpId: val}).then(data => {
          // this.placeholder.placeholders = data
          this.formData.placeholders = data
          this.$emit('clear', this.newPlaceholders.splice(0))
        })
      } else {
        // this.placeholder.placeholders.splice(0)
        this.formData.placeholders.splice(0)
        this.$emit('clear', this.newPlaceholders.splice(0))
      }
    },
    // "formData.group.id": {
    //   // deep: true,
    //   handler(val) {
    //     if (val) {
    //       // if (val.placeholderItems) { // database
    //         // 退还全部占位符给模板
    //         const newPlaceholders = this.newPlaceholders.splice(0)
    //         newPlaceholders.forEach(newPlaceholder=>{
    //           newPlaceholder.unbound = true
    //           this.placeholdersInTemplate.push(newPlaceholder)
    //         })
    //         if (this.isEdit) {
    //           window.replaceService.findPlaceholderItemByPhGrpId({ phGrpId: val}).then(data => {
    //             this.formData.placeholders = data
    //           })
    //         } else {
    //           // TODO 需要细分标签的状态：
    //           // 非编辑模式： 模板中（未绑定+未保存）、模板中（已保存）、模板中（已绑定）？？？
    //           // 编辑模式：   ？？？
    //           /**
    //            * 标签分为两（三？）类
    //            *   1. 模板标签，用于左侧显示及拖拽到右侧
    //            *      1-1. 新标签（未保存）
    //            *           1-1-1. 列表模式：显示（高亮）
    //            *           1-1-2. 详情模式
    //            *                  1-1-2-1. 新增：显示（高亮）
    //            *                  1-1-2-2. 编辑：显示（高亮）
    //            *      1-2. 标签（已保存）
    //            *           1-2-1. 列表模式：显示（高亮，保存图标）
    //            *           1-2-2. 详情模式
    //            *                  1-2-2-1. 新增：
    //            *                           1-2-2-1-1. 分组（不含）：显示（高亮，保存图标）
    //            *                           1-2-2-1-2. 分组（含）：切换*1-4. 标签（已绑定）（临时）
    //            *                  1-2-2-2. 编辑：显示（高亮，保存图标）
    //            *      1-3. 标签（已绑定）
    //            *           1-3-1. 列表模式：显示（绑定图标，边框化，无色）
    //            *           1-3-2. 详情模式
    //            *                  1-3-2-1. 新增：
    //            *                           1-3-2-1-1. 分组（不含）：隐藏
    //            *                           1-3-2-1-2. 分组（含）：隐藏
    //            *                  1-3-2-2. 编辑：隐藏
    //            *      1-4. 标签（已绑定）（临时）
    //            *           1-4-1. 列表模式：-
    //            *           1-4-2. 详情模式
    //            *                  1-4-2-1. 新增：
    //            *                           1-4-2-1-1. 分组（不含）：切换*1-2. 标签（已保存）
    //            *                           1-4-2-1-2. 分组（含）：隐藏
    //            *                  1-4-2-2. 编辑：-
    //            *   2. 展示在标签列表中的标签
    //            *      2-1. 存在于模板中：可填值
    //            *      2-2. 不存在模板中：禁用
    //            *   3. 详情（新增/编辑）中的标签：同1.
    //            * 
    //            */
    //           this.formData.group.placeholderItems.forEach(item=>{ // TODO 点击编辑分组的时候还有问题
    //             // 占位符是否包含在模板中
    //             const index = this.placeholdersInTemplate.findIndex(pit=>pit.text==this.$formatPlaceholder(item.name))
    //             if (index != -1) {
    //               const item = this.placeholdersInTemplate.splice(index, 1)
    //               // 占位符置为已绑定
    //               item[0].unbound = false
    //               // this.newPlaceholders.push(item[0])
    //             }
    //           })
    //           this.formData.placeholders = this.formData.group.placeholderItems
    //         }
    //       // }
    //     } else {
    //       const newPlaceholders = this.newPlaceholders.splice(0)
    //       newPlaceholders.forEach(newPlaceholder=>{
    //         newPlaceholder.unbound = true
    //         this.placeholdersInTemplate.push(newPlaceholder)
    //       })
    //       this.formData.placeholders.splice(0)
    //     }
    //   }
    // },
    newPlaceholders: {
      deep: true,
      handler(newVal, oldVal) {
        console.log(newVal, oldVal);
        if (newVal.length == 0) return;
        if (newVal.length > oldVal.length) {
          // add item
          _.difference(newVal, oldVal).forEach((newItem) => {
            // this.placeholder.placeholders.push(newItem);
            this.formData.placeholders.push({...newItem});
          });
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
    // onMoveCallback(evt, originalEvent) {
    //   console.log('onMoveCallback', evt, originalEvent)
    //   if (evt.dragged.classList.contains("unmovable") || evt.related.classList.contains("unmovable")) {
    //     return false
    //   }
    // },
    containsInTemplate(name) {
      return this.placeholdersInTemplate.findIndex(pit => pit.name == name) != -1
    },
    containsInNewPlaceholders(name) {
      return this.newPlaceholders.findIndex(newPh => newPh.name == name) != -1
    },
    createPlaceholderGroupOption() {
      const existedGroup = this.groups.find(group=>!group.id)
      if (existedGroup) {
        existedGroup.name = this.inputGroup
        // this.placeholder.group = existedGroup
        this.formData.group = existedGroup
      } else {
        const newGroup = {
          id: '',
          name: this.inputGroup
        }
        // this.groups.push(newGroup)
        this.groups.unshift(newGroup)
        // this.placeholder.group = newGroup
        this.formData.group = newGroup
      }
    },
    onPlaceholderTypeChange(item, row) {
      const option = this.placeholderTypeOptions.find((e) => e.value == item);
      option && (row.format = option.format);
    },
    async onDelete(item, index) {
      let deleteFlag = true

      // 当前为编辑模式，且此占位符不是来自模板
      if (this.isEdit && !this.containsInNewPlaceholders(item.name)) {
        deleteFlag = await this.$dialog.confirm({
          text: `确定要删除占位符：${item.name}？`
        })
      }

      if (deleteFlag) {
        if (this.containsInNewPlaceholders(item.name)) {
          // this.placeholder.placeholders.splice(index, 1);
          this.formData.placeholders.splice(index, 1);
          const newPlaceholderIndex = this.newPlaceholders.findIndex(
            (e) => e.name == item.name
          );
          // this.newPlaceholders[newPlaceholderIndex].unbound = true
          this.$emit('delete', ...this.newPlaceholders.splice(newPlaceholderIndex, 1))
        } else {
          window.replaceService.savePlaceholderItem({
            ...item,
            phGrpId: this.formData.group.id,// this.placeholder.group.id,
            delete: true
          }).then(()=>{
            this.$toast.success(`占位符删除成功！`);
            // this.placeholder.placeholders.splice(index, 1);
            this.formData.placeholders.splice(index, 1);
            const newPlaceholderIndex = this.newPlaceholders.findIndex(
              (e) => e.name == item.name
            );
            if (newPlaceholderIndex != -1) {
              // this.newPlaceholders[newPlaceholderIndex].unbound = true
              this.$emit('delete', ...this.newPlaceholders.splice(newPlaceholderIndex, 1))
            } else {
              this.$emit('delete')
            }
          })
        }
      }
      // 

    },
    onCancel() {
      this.$emit('cancel', this.newPlaceholders.splice(0))
    },
    onSave() {
      const group = {
        tplId: this.tplId,
        name: this.formData.group.name,// this.placeholder.group.name,
        placeholderItems: [],
      }
      // 非修改（不含绑定）
      if (this.isEdit) {
        // group.id = this.placeholder.group.id
        group.id = this.formData.group.id
      } else {
        if (this.formData.group.id) { // 绑定
          group.id = this.formData.group.id
          group.bind = true
        } else { // 新增（含绑定）
          group.insert = true
        }
      }
      this.formData.placeholders.forEach((ph) => {
        // 只添加从模板拖拽过来的占位符，分组自带占位符不作为处理对象
        const newPlaceholder = this.newPlaceholders.find(nph=>nph.name==ph.name)
        if (newPlaceholder && newPlaceholder.status != 'bound') {
          const item = {
            // id: uuidv4(),
            // id: ph.id,
            name: ph.name,
            type: ph.type,
            format: ph.format,
            // insert: true
            // ordinal: index + 1,
          }
          // TODO 暂不允许修改（修改占位符有可能会影响到本次替换中其他模板已使用的占位符）
          if (ph.id) { // 绑定
            item.id = ph.id
            item.bind = true
          } else { // 新增（含绑定）
            item.insert = true
          }
          group.placeholderItems.push(item);
        }
      });
      window.replaceService.bulkSavePlaceholderGroup([group]).then(() => {
        this.$toast.success(`占位符保存成功！`);
        this.$emit('save')
      }).catch((err) => {
        console.log(err);
        this.$toast.error(`占位符保存失败！`);
      });
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
          tplId: this.tplId,
        },
        placeholders: []
      },
      newPlaceholders: [],
      placeholderTypeOptions: [
        { text: "文本", value: "text" },
        { text: "日期", value: "date", format: "Y 年 M 月 D 日" },
        { text: "金额", value: "money" },
      ],
      inputGroup: null,
      groups: [],
      drag: false,
    }
  }
}
</script>