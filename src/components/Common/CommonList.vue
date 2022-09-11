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
      <template v-slot:[`item.data-table-select`]="{ isSelected, select }">
        <v-icon :color="isSelected ? 'primary' : ''" @click="select(!isSelected)">{{ isSelected ? 'mdi-radiobox-marked' : 'mdi-radiobox-blank'}}</v-icon>
      </template>
      <template v-slot:[`item.index`]="{ index }">
        {{ index + 1 }}
      </template>
      <template v-for="(_, slot) in $scopedSlots" v-slot:[`${slot}`]="props">
        <slot :name="slot" v-bind="props"></slot>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-row class="actions justify-center">
          <v-icon class="rearrange" v-if="item.sort" :disabled="items.findIndex(e=>e.sort > item.sort) == -1" @click="moveDown(item)">mdi-arrow-down</v-icon>
          <v-icon class="rearrange" v-if="item.sort" :disabled="items.findIndex(e=>e.sort < item.sort) == -1" @click="moveUp(item)">mdi-arrow-up</v-icon>
          <v-icon class="rearrange" v-if="item.sort" :disabled="items.findIndex(e=>e.sort < item.sort) == -1" @click="moveTop(item)">mdi-arrow-collapse-up</v-icon>
          <v-divider class="divider mx-1" v-if="item.sort" vertical></v-divider>
          <v-icon class="edit" @click="showEdit({...item, isEdit: true})">mdi-pencil</v-icon>
          <v-icon class="delete" @click="handleDelete({ ...item, delete: true})">mdi-delete</v-icon>
        </v-row>
      </template>
    </v-data-table>
    <v-divider></v-divider>
    <v-card-actions>
      <v-btn v-if="showSelect" color="primary" @click="handleSelect">选择</v-btn>
      <v-spacer></v-spacer>
      <v-btn color="success" @click="showEdit(newItem)">新增</v-btn>
    </v-card-actions>
    <v-dialog width="500" v-model="dialog.showDetail">
      <slot v-bind="item" :cancel="handleCancel" :save="handleSave"></slot>
    </v-dialog>
  </v-card>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'
export default {
  props: {
    condition: Object,
    type: String,
    title: String,
    headers: Array,
    itemNames: Array,
    visible: Boolean,
    selectedId: String,
    showSelect: Boolean,
    preInterceptor: {
      type: Object,
      default: ()=>{
        return {
          save: Promise.resolve(),
          delete: Promise.resolve()
        }
      }
    },
  },
  watch: {
    visible:{
      immediate: true,
      handler(val) {
        if (val) {
          window.commonService.list(this.type, this.condition).then(data => {
            this.items = data
            if (this.selectedId) {
              this.$set(this, 'selected', this.items.filter(item=>item.id==this.selectedId))
            }
          })
        }
      }
    },
  },
  computed: {
    newSort() {
      return this.items.map(i=>i.sort).sort((a,b)=>b-a)[0] + 1
    },
    newItem() {
      const rst = { id: uuidv4() }
      this.itemNames.forEach(e=>{
        rst[e] = e == 'sort' ? this.newSort : ''
      })
      return rst
      // return {id:uuidv4(),name:'',icon:'',sort: this.newSort, isEdit: false}
    },
    tableHeight() {
      return '528px'
      // return window.innerHeight > 1000 ? '650px' : 'calc(70vh)'
    }
  },
  methods: {
    onClose() {
      this.$emit('close', false)
    },
    moveUp(item) {
      let flag = false
      let prev = null
      for (const e of this.items) {
        if (item != e) {
          prev = e
        } else {
          flag = true
          break
        }
      }
      if (flag && prev) {
        const sort = prev.sort
        prev.sort = item.sort
        item.sort = sort
      }

      window.commonService.save(this.type, prev, item).then(result=>{
        if (result.success) {
          window.commonService.list(this.type, this.condition).then(data => {
            this.items = data
          })
          window.ipc.send('notification', {
            title: "提示",
            body: `${this.title}更新成功！`
          })
        } else {
          window.ipc.send('notification', {
            title: "错误",
            body: `${this.title}更新失败！`
          })
        }
      })
    },
    moveDown(item) {
      let flag = false
      let next = null
      for (const e of this.items) {
        if (flag) {
          next = e
          break
        }
        flag = item == e
      }
      if (next) {
        const sort = next.sort
        next.sort = item.sort
        item.sort = sort
      }

      window.commonService.save(this.type, item, next).then(result=>{
        if (result.success) {
          window.commonService.list(this.type, this.condition).then(data => {
            this.items = data
          })
          window.ipc.send('notification', {
            title: "提示",
            body: `${this.title}更新成功！`
          })
        } else {
          window.ipc.send('notification', {
            title: "错误",
            body: `${this.title}更新失败！`
          })
        }
      })
    },
    moveTop(item) {
      if (item.sort == 1) return
      const newTopItem = {}
      for (const key in item) {
        newTopItem[key] = key == 'sort' ? 1 : item[key]
      }
      let targetArr = [ newTopItem ]
      // let targetArr = [{
      //   id: item.id,
      //   name: item.name,
      //   icon: item.icon,
      //   sort: 1
      // }]
      for (const e of this.items) {
        if (e == item) break
        const moveDownItem = {}
        for (const key in e) {
          moveDownItem[key] = key == 'sort' ? (e.sort + 1) : e[key]
        }
        targetArr.push(moveDownItem)
        // targetArr.push({
        //   id: e.id,
        //   name: e.name,
        //   icon: e.icon,
        //   sort: e.sort + 1
        // })
      }

      window.commonService.save(this.type, ...targetArr).then(result=>{
        if (result.success) {
          window.commonService.list(this.type, this.condition).then(data => {
            this.items = data
          })
          window.ipc.send('notification', {
            title: "提示",
            body: `${this.title}置顶成功！`
          })
        } else {
          window.ipc.send('notification', {
            title: "错误",
            body: `${this.title}置顶失败！`
          })
        }
      })
    },
    showEdit(item) {
      this.item = JSON.parse(JSON.stringify(item))
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
              // targetArr.push({
              //   id: e.id,
              //   name: e.name,
              //   icon: e.icon,
              //   sort: e.sort - 1
              // })
            }
          }
          
          window.commonService.save(this.type, ...targetArr).then(result=>{
            if (result.success) {
              this.dialog.showDetail = false
              window.commonService.list(this.type, this.condition).then(data => {
                this.items = data
              })
              window.ipc.send('notification', {
                title: "提示",
                body: `${this.title}删除成功！`
              })
            } else {
              window.ipc.send('notification', {
                title: "错误",
                body: `${this.title}删除失败！`
              })
            }
          })
        }
      })
    },
    handleSave(item) {
      this.preInterceptor.save(item).then(preResult=>{
        for (const key in preResult) {
          item[key] && (item[key] = preResult[key])
        }
        window.commonService.save(this.type, item).then(result=>{
          if (result.success) {
            this.dialog.showDetail = false
            window.commonService.list(this.type, this.condition).then(data => {
              this.items = data
            })
            window.ipc.send('notification', {
              title: "提示",
              body: `${this.title}保存成功！`
            })
          } else {
            window.ipc.send('notification', {
              title: "错误",
              body: `${this.title}保存失败！`
            })
          }
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
      selected: []
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