<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-icon>{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
      <span class="text-h5 ml-1 mt-1">{{ isEdit ? '编辑' : '新增' }}业务类型</span>
      <v-spacer></v-spacer>
      <v-btn @click="onCancel" fab plain small>
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>
    <validation-observer ref="observer" v-slot="{ invalid }">
      <v-form @submit.prevent="onSave">
        <v-card flat tile>
          <v-card-text>
            <v-row>
              <v-col>
                <v-text-field
                  disabled
                  v-model="formData.id"
                  label="ID"
                  persistent-placeholder
                  outlined
                >
                </v-text-field>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <validation-provider
                  name="名称"
                  :rules="rules.name"
                  v-slot="{ errors }"
                >
                  <v-text-field
                    v-model="formData.name"
                    label="名称"
                    placeholder="请输入业务类型名称"
                    :error-messages="errors[0]"
                    persistent-placeholder
                    outlined
                  >
                  </v-text-field>
                </validation-provider>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <validation-provider
                  name="图标"
                  :rules="rules.icon"
                  v-slot="{ errors }"
                >
                  <v-icon-picker
                    v-model="formData.icon"
                    prefix="mdi-"
                    label="图标"
                    placeholder="请输入图标名称"
                    :error-messages="errors[0]"
                    persistent-placeholder
                    outlined
                  ></v-icon-picker>
                </validation-provider>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="px-4">
            <v-spacer></v-spacer>
            <v-btn @click="onCancel" text>取消</v-btn>
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
  </v-card>
</template>

<script>
import VIconPicker from '../VIconPicker.vue'
export default {
  components: { VIconPicker },
  props: {
    id: String,
    name: String,
    icon: String,
    sort: Number,
    isEdit: Boolean
  },
  computed: {
    formData: {
      get() {
        return {
          id: this.id,
          name: this.name,
          icon: this.icon ? this.icon.substring(4) : null,
          sort: this.sort,
        }
      },
      // set(newVal) {
      //   this.$emit('input', newVal.id)
      //   this.$emit('input', newVal.name)
      //   this.$emit('input', newVal.icon)
      //   this.$emit('input', newVal.sort)
      // }
    },
  },
  methods: {
    onCancel() {
      this.$refs.observer.reset()
      this.$emit('cancel', false)
    },
    onSave() {
      this.$emit('save', {
        id: this.formData.id,
        name: this.formData.name,
        icon: `mdi-${this.formData.icon}`,
        sort: this.formData.sort,
      })
    }
  },
  data() {
    return {
      rules: {
        name: { requiredInput: true },
        icon: { requiredInput: true }
      },
      processing: {
        submit: false
      }
    }
  }
}
</script>

<style>

</style>