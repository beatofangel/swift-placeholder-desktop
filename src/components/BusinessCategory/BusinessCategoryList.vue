<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span class="text-h5 ml-1 mt-1">业务类型列表</span>
      <v-spacer></v-spacer>
      <v-btn @click="onClose" fab plain small>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <v-row class="ma-0">
      <v-col v-for="level in 3" cols="4" :key="level" class="pa-0">
        <v-card elevation="0" tile>
          <v-card-text class="d-flex flex-nowrap pa-2">
            <common-list
              style="width: 100%; max-height: 649px"
              hide-tool-bar
              hide-select-btn
              flat
              :condition="conditions[level - 1]"
              model="BusinessCategory"
              :title="getCategoryName(level)"
              :headers="categoryHeaders"
              :item-names="['name', 'icon', 'ordinal', 'pid']"
              :visible="visible"
              :show-select="level != 3"
              cascade
              :selected-id="formData.businessCategories[level - 1]"
              :hide-create="level > 1 && !formData.businessCategories[level - 2]"
              @selectionChange="(val) => selectionChangeHandler(val, level)"
              @change="changeHandler"
            >
              <template v-slot:[`item.icon`]="{ item }">
                <v-icon color="accent">{{
                  item ? item.icon : "item 未定义"
                }}</v-icon>
              </template>
              <template
                v-slot="{
                  id,
                  pid,
                  name,
                  icon,
                  ordinal,
                  isEdit,
                  visible,
                  title,
                  cancel,
                  save,
                }"
              >
                <business-category-detail
                  :id="id"
                  :pid="pid"
                  :name="name"
                  :icon="icon"
                  :ordinal="ordinal"
                  :isEdit="isEdit"
                  :visible="visible"
                  :title="title"
                  @cancel="cancel"
                  @save="save"
                ></business-category-detail>
              </template>
            </common-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-card>
</template>

<script>
import CommonList from "@/components/Common/CommonList.vue";
import BusinessCategoryDetail from "@/components/BusinessCategory/BusinessCategoryDetail.vue";
export default {
  name: "business-category-list",
  props: {
    visible: Boolean,
  },
  mounted() {
    window.replaceService.findBusinessCategoryRoot().then(root => {
      this.$set(this.conditions, 0, {
        pid: root.id,
      });
    })
  },
  components: {
    CommonList,
    BusinessCategoryDetail,
  },
  watch: {
    // businessCategories: {
    //   deep: true,
    //   handler(newVal) {
    //     this.formData.businessCategories = newVal;
    //     console.log("businessCategories", newVal);
    //     for (let index in this.conditions) {
    //       if (newVal.length > index) {
    //         this.conditions[index].pid = newVal[index];
    //       } else {
    //         this.conditions[index] = null;
    //       }
    //     }
    //   },
    // },
    "formData.businessCategories": {
      deep: true,
      immediate: true,
      handler(newVal, oldVal) {
        console.log(newVal, oldVal);
      },
    },
  },
  computed: {
    // getConditions() {
    //   const conditions = [];
    //   for (let level = 1; level <= 3; level++) {
    //     conditions.push(
    //       level > 1 && !this.formData.businessCategories[level - 2]
    //         ? null
    //         : {
    //             pid:
    //               level == 1
    //                 ? null
    //                 : this.formData.businessCategories[level - 2],
    //           }
    //     );
    //   }
    //   return conditions;
    // },
  },
  methods: {
    onClose() {
      this.$emit("close", false);
    },
    getCategoryName(level) {
      return `${["一", "二", "三"][level - 1]}级业务类型`;
    },
    changeHandler() {
      this.$emit('change');
    },
    selectionChangeHandler(val, level) {
      if (val.length > 0) {
        console.log("selectionChangeHandler", level, val[0].id);
        this.formData.businessCategories[level - 1] = val[0].id;
        this.$set(this.conditions, level, {
          pid: val[0].id,
        });
        for (let i = level + 1; i < 3; i++) {
          this.$set(this.conditions, i, null);
        }
      } else {
        this.formData.businessCategories[level - 1] = null
        for (let i = level; i < 3; i++) {
          this.$set(this.conditions, i, null);
        }
      }
    },
  },
  data() {
    return {
      formData: {
        businessCategories: [],
      },
      categoryHeaders: [
        {
          text: "No.",
          value: "index",
        },
        {
          text: "名称",
          value: "name",
          class: "nameClass",
          cellClass: "nameClass text-truncate ",
        },
        {
          text: "图标",
          value: "icon",
          class: "iconClass",
        },
        {
          text: "操作",
          value: "actions",
          class: "actionsClass",
          align: "center",
        },
      ],
      conditions: [null, null, null],
    };
  },
};
</script>

<style>
.nameClass {
  max-width: 142px;
}
.iconClass {
  min-width: 48px;
}
.actionsClass {
  min-width: 64px;
}
</style>
