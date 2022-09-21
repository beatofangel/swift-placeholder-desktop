<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span class="text-h5 ml-1 mt-1">{{ title }}清单</span>
      <v-spacer></v-spacer>
      <v-btn @click="onClose" fab plain small>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-data-table
      v-model="selected"
      :items="items"
      :headers="headers"
      disable-sort
      hide-default-footer
      disable-pagination
      :show-select="showSelect"
      single-select
      fixed-header
      :height="tableHeight"
    >
      <template v-slot:body="{ items: slotItems, headers, isSelected, select }">
        <draggable
          v-model="items"
          :animation="200"
          :group="`${title}List`"
          :disabled="slotItems.length == 0"
          ghostClass="ghost"
          tag="tbody"
          @start="onDragRow"
          @end="onDropRow"
        >
          <template v-for="(item, index) in slotItems">
            <transition :name="!drag ? 'flip-list' : null" type="transition" :key="item.name">
              <tr>
                <template v-for="{ value } in headers">
                  <td v-if="value == 'data-table-select'" :key="value">
                    <v-icon :color="isSelected(item) ? 'primary' : ''" @click="select(item, !isSelected(item))">{{ isSelected(item) ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'}}</v-icon>
                  </td>
                  <td v-if="value == 'index'" class="text-start" :key="`item.${value}`">
                    {{ index + 1 }}
                  </td>
                  <td v-if="!['index', 'data-table-select', 'actions'].includes(value)" class="text-start" :key="`item.${value}`">
                    <slot v-if="$scopedSlots[`item.${value}`]" :name="`item.${value}`" v-bind:item="item" v-on="$scopedSlots[`item.${value}`]"></slot>
                    <template v-else>{{ item[value] }}</template>
                  </td>
                  <td v-if="value == 'actions'" class="text-center" :key="`item.${value}`">
                    <v-row class="actions justify-center">
                      <v-icon class="edit" @click="showEdit({...item, isEdit: true})">mdi-pencil</v-icon>
                      <v-icon class="delete" @click="handleDelete({ ...item, delete: true})">mdi-delete</v-icon>
                    </v-row>
                  </td>
                </template>
              </tr>
            </transition>
          </template>
          <tr v-if="slotItems.length == 0" class="v-data-table__empty-wrapper">
            <td :colspan="headers.length">
              {{ noData }}
            </td>
          </tr>
        </draggable>
      </template>
    </v-data-table>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn v-if="showSelect" color="primary" :disabled="items.length == 0 || selected.length == 0" @click="handleSelect">选择</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="success" @click="showEdit()"><v-icon>mdi-plus</v-icon></v-btn>
    </v-card-actions>
    <v-dialog width="500" v-model="dialog.showDetail">
      <slot v-bind="item" :title="title" :visible="dialog.showDetail" :cancel="handleCancel" :save="handleSave"></slot>
    </v-dialog>
  </v-card>
</template>

<script>
import draggable from "vuedraggable";
export default {
  props: {
    condition: {
      type: Object,
      default: ()=>null
    },
    model: String,
    title: String,
    headers: Array,
    itemNames: Array,
    visible: Boolean,
    selectedId: String,
    showSelect: Boolean,
    noData: {
      type: String,
      default: '没有数据'
    },
    preInterceptor: {
      type: Object,
      default: ()=>{
        return {
          save: () => Promise.resolve(true),
          delete: () => Promise.resolve(true)
        }
      }
    },
  },
  components: {
    draggable
  },
  mounted () {
  },
  watch: {
    visible:{
      immediate: true,
      handler(val) {
        if (val) {
          console.log(this.title, this.model, this.condition)
          window.commonService.find(this.model, this.condition).then(data => {
            this.items = data
            this.$set(this, 'selected', this.selectedId ? this.items.filter(item=>item.id==this.selectedId) : [])
          })
        }
      }
    }
  },
  computed: {
    tableHeight() {
      return '528px'
      // return window.innerHeight > 1000 ? '650px' : 'calc(70vh)'
    },
  },
  methods: {
    createNewItem() {
      const rst = {}
      this.itemNames.forEach(e=>{
        rst[e] = e == 'sort' ? (this.items.length > 0 ? this.items.map(i=>i.sort).sort((a,b)=>b-a)[0] + 1 : 1) : null
      })
      return rst
    },
    onDragRow() {
      this.drag = true
    },
    onDropRow() {
      this.drag = false
      let targetArr = []
      this.items.forEach((item, index) => {
        const oriSort = index + 1
        if (oriSort != item.sort) {
          item.sort = oriSort
          targetArr.push(item)
        }
      })
      console.log('update range:', targetArr)
      targetArr.length > 0 && window.commonService.bulkSave(this.model, ...targetArr).then(()=>{
        window.commonService.find(this.model, this.condition).then(data => {
          this.items = data
        })
        this.$emit('change')
        window.ipc.send('notification', {
          title: "提示",
          body: `${this.title}更新成功！`
        })
      }).catch(err => {
        console.error(err)
        window.ipc.send('notification', {
          title: "错误",
          body: `${this.title}更新失败！`
        })
      })
    },
    onClose() {
      this.$emit('close', false)
    },
    showEdit(item) {
      this.item = JSON.parse(JSON.stringify(item || this.createNewItem()))
      this.dialog.showDetail = true
    },
    handleDelete(item) {
      this.preInterceptor.delete(item).then(preResult=>{
        if (preResult) {
          const sort = item.sort
          item.delete = true
          let targetArr = [ item ]
          for (const e of this.items) {
            if (e.sort > sort) {
              const moveUpItem = {}
              for (const key in e) {
                moveUpItem[key] = key == 'sort' ? (e.sort - 1) : e[key]
              }
              targetArr.push(moveUpItem)
            }
          }
          window.commonService.save(this.model, ...targetArr).then(()=>{
            // this.dialog.showDetail = false
            window.commonService.find(this.model, this.condition).then(data => {
              this.items = data
            })
            this.$emit('change')
            window.ipc.send('notification', {
              title: "提示",
              body: `${this.title}删除成功！`
            })
          }).catch(err => {
            console.error(err)
            window.ipc.send('notification', {
              title: "错误",
              body: `${this.title}删除失败！`
            })
          })
        }
      })
    },
    handleSave(item) {
      this.preInterceptor.save(item).then(preResult=>{
        for (const key in preResult) {
          item[key] && (item[key] = preResult[key])
        }
        window.commonService.save(this.model, item).then(()=>{
          this.dialog.showDetail = false
          window.commonService.find(this.model, this.condition).then(data => {
            this.items = data
          })
          this.$emit('change')
          window.ipc.send('notification', {
            title: "提示",
            body: `${this.title}保存成功！`
          })
        }).catch(err => {
          console.error(err)
          window.ipc.send('notification', {
            title: "错误",
            body: `${this.title}保存失败！`
          })
        })
      })
    },
    handleSelect() {
      this.selected.length != 0 && this.$emit('select', this.selected[0].id)
    },
    handleCancel() {
      this.dialog.showDetail = false
    }
  },
  data() {
    return {
      item: {
        id: '',
        name: '',
        icon: null,
        sort: 0,
        isEdit: true,
      },
      items: [],
      dialog: {
        showDetail: false
      },
      selected: [],
      drag: false
    }
  }
}
</script>

<style scoped>
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:enabled) {
  color: var(--v-accent-base) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:enabled) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:disabled) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .rearrange:hover:enabled) {
  color: var(--v-primary-base) !important;
}

:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .divider) {
  border-color: var(--v-secondary-lighten5) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .divider) {
  border-color: var(--color, transparent) !important;
}

:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit) {
  color: var(--v-primary-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .edit:hover) {
  color: var(--v-primary-base) !important;
}

:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete) {
  color: var(--v-error-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete) {
  color: var(--color, transparent) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .delete:hover) {
  color: var(--v-error-base) !important;
}

:deep(.v-data-table__wrapper > table > tbody > tr:hover:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .actions) {
  color: var(--v-error-lighten2) !important;
}
:deep(.v-data-table__wrapper > table > tbody > tr:not(.v-data-table__expanded__content):not(.v-data-table__empty-wrapper) .actions) {
  color: var(--color, transparent) !important;
}
</style>