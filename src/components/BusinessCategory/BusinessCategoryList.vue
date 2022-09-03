<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span class="text-h5 ml-1 mt-1">业务类型</span>
      <v-spacer></v-spacer>
      <v-btn @click="onCancel" fab plain small>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-data-table
      :items="items"
      :headers="headers"
      disable-sort
      hide-default-footer
      disable-pagination
    >
      <template v-slot:[`item.index`]="{ index }">
        {{ index + 1 }}
      </template>
      <template v-slot:[`item.icon`]="{ item }">
        <v-icon v-if="item.icon" color="accent">{{ item.icon }}</v-icon>
      </template>
      <template v-slot:[`item.actions`]="{ item }">
        <v-row class="actions justify-center">
          <v-icon class="rearrange" :disabled="items.findIndex(e=>e.sort > item.sort) == -1" @click="moveDown(item)">mdi-arrow-down</v-icon>
          <v-icon class="rearrange" :disabled="items.findIndex(e=>e.sort < item.sort) == -1" @click="moveUp(item)">mdi-arrow-up</v-icon>
          <v-icon class="rearrange" :disabled="items.findIndex(e=>e.sort < item.sort) == -1" @click="moveTop(item)">mdi-arrow-collapse-up</v-icon>
          <v-divider class="divider mx-1"  vertical></v-divider>
          <v-icon class="edit" @click="showEdit({...item, isEdit: true})">mdi-pencil</v-icon>
          <v-icon class="delete" @click="handleDelete({ ...item, delete: true})">mdi-delete</v-icon>
        </v-row>
      </template>
    </v-data-table>
    <v-divider></v-divider>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="success" @click="showEdit(newItem)">新增</v-btn>
    </v-card-actions>
    <v-dialog width="500" v-model="dialog.showBusinessCategoryEdit">
      <business-category-edit v-bind="item" @cancel="dialog.showBusinessCategoryEdit = false" @save="handleSave"></business-category-edit>
    </v-dialog>
  </v-card>
</template>

<script>
import BusinessCategoryEdit from '@/components/BusinessCategory/BusinessCategoryEdit.vue';
import { v4 as uuidv4 } from 'uuid'
export default {
  props: {
    visible: Boolean
  },
  components: {
    BusinessCategoryEdit
  },
  mounted() {
    // window.getBusinessCategoriesCallback =
    //   this.getBusinessCategoriesCallback;
    // window.updateBusinessCategoriesCallback = 
    //   this.updateBusinessCategoriesCallback;
  },
  watch: {
    visible:{
      immediate: true,
      handler(val) {
        if (val) {
          // this.getBusinessCategories()
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
        }
      }
    }
  },
  computed: {
    newSort() {
      return this.items.map(i=>i.sort).sort((a,b)=>b-a)[0] + 1
    },
    newItem() {
      return {id:uuidv4(),name:'',icon:'',sort: this.newSort, isEdit: false}
    }
  },
  methods: {
    // getBusinessCategories() {
    //   window.chrome.webview.postMessage({
    //     api: "getBusinessCategories",
    //     callback: "getBusinessCategoriesCallback",
    //   });
    // },
    // getBusinessCategoriesCallback(content) {
    //   const result = JSON.parse(content);
    //   if (result.Success) {
    //     this.items = result.Data;
    //   } else {
    //     console.log(result.Message);
    //   }
    // },
    // updateBusinessCategoriesCallback(content) {
    //   const result = JSON.parse(content);
    //   if (result.Success) {
    //     console.log(result.Success);
    //     this.dialog.showBusinessCategoryEdit && (this.dialog.showBusinessCategoryEdit = false)
    //     this.getBusinessCategories()
    //   } else {
    //     console.log(result.Message);
    //   }
    // },
    onCancel() {
      this.$emit('cancel', false)
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
      
      window.replaceService.saveBusinessCategories([ prev, item ]).then(result=>{
        if (result.success) {
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
          window.ipcRenderer.send('notification', {
            title: "提示",
            body: "业务类型更新成功！"
          })
        } else {
          window.ipcRenderer.send('notification', {
            title: "错误",
            body: "业务类型更新失败！"
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

      window.replaceService.saveBusinessCategories([ item, next ]).then(result=>{
        if (result.success) {
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
          window.ipcRenderer.send('notification', {
            title: "提示",
            body: "业务类型更新成功！"
          })
        } else {
          window.ipcRenderer.send('notification', {
            title: "错误",
            body: "业务类型更新失败！"
          })
        }
      })
    },
    moveTop(item) {
      if (item.sort == 1) return
      let targetArr = [{
        id: item.id,
        name: item.name,
        icon: item.icon,
        sort: 1
      }]
      for (const e of this.items) {
        if (e == item) break
        
        targetArr.push({
          id: e.id,
          name: e.name,
          icon: e.icon,
          sort: e.sort + 1
        })
      }

      window.replaceService.saveBusinessCategories(targetArr).then(result=>{
        if (result.success) {
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
          window.ipcRenderer.send('notification', {
            title: "提示",
            body: "业务类型置顶成功！"
          })
        } else {
          window.ipcRenderer.send('notification', {
            title: "错误",
            body: "业务类型置顶失败！"
          })
        }
      })
    },
    showEdit(item) {
      this.item = JSON.parse(JSON.stringify(item))
      // this.$set(this, 'item', JSON.parse(JSON.stringify(item)))
      // this.$set(this.item, 'id', item.id)
      // this.$set(this.item, 'name', item.name)
      // this.$set(this.item, 'icon', item.icon)
      // this.$set(this.item, 'sort', item.sort)
      // this.$set(this.item, 'isEdit', item.isEdit)
      this.dialog.showBusinessCategoryEdit = true
    },
    handleDelete(item) {
      const sort = item.sort
      let targetArr = [ item ]
      for (const e of this.items) {
        if (e.sort > sort) {
          targetArr.push({
            id: e.id,
            name: e.name,
            icon: e.icon,
            sort: e.sort - 1
          })
        }
      }
      
      window.replaceService.saveBusinessCategories(targetArr).then(result=>{
        if (result.success) {
          this.dialog.showBusinessCategoryEdit = false
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
          window.ipcRenderer.send('notification', {
            title: "提示",
            body: "业务类型删除成功！"
          })
        } else {
          window.ipcRenderer.send('notification', {
            title: "错误",
            body: "业务类型删除失败！"
          })
        }
      })
    },
    handleSave(item) {
      window.replaceService.saveBusinessCategories([ item ]).then(result=>{
        if (result.success) {
          this.dialog.showBusinessCategoryEdit = false
          window.replaceService.getBusinessCategories().then(data => {
            this.items = data
          })
          window.ipcRenderer.send('notification', {
            title: "提示",
            body: "业务类型保存成功！"
          })
        } else {
          window.ipcRenderer.send('notification', {
            title: "错误",
            body: "业务类型保存失败！"
          })
        }
      })
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
      headers: [
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
        // {
        //   text: '排序',
        //   value: 'sort'
        // },
        { text: '操作',
          value: 'actions',
          align: 'center',
        },
      ],
      dialog: {
        showBusinessCategoryEdit: false
      }
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