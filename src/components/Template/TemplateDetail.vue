<template>
  <v-card>
    <v-toolbar color="primary" dark>
      <v-icon>{{ isEdit ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
      <span class="text-h5 ml-1 mt-1">{{ isEdit ? '编辑' : '新增' }}模板</span>
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
                    placeholder="请输入模板名称"
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
                  name="新模板"
                  :rules="rules.path"
                  v-slot="{ errors }"
                >
                  <v-text-field
                    v-model="formData.path"
                    :error-messages="errors[0]"
                    label="新模板"
                    placeholder="请选择新模板"
                    persistent-placeholder
                    append-icon="mdi-file-word-box"
                    @click:append="showFileBrowserDialog"
                    clearable
                    readonly
                    outlined
                  >
                  </v-text-field>
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
export default {
  props: {
    id: String,
    name: String,
    path: String,
    bcId: String,
    isEdit: Boolean
  },
  watch: {
    id: {
      immediate: true,
      handler(val) {
        this.$set(this.formData, 'id', val)
      }
    },
    name: {
      immediate: true,
      handler(val) {
        this.$set(this.formData, 'name', val)
      }
    },
    path: {
      immediate: true,
      handler(val) {
        this.$set(this.formData, 'path', val)
      }
    },
  },
  computed: {
    // formData: {
    //   get() {
    //     return {
    //       id: this.id,
    //       name: this.name,
    //       path: this.path,
    //     }
    //   },
    //   set(newVal) {
    //     this.$emit('input', {
    //       id: newVal.id,
    //       name: newVal.name,
    //       path: newVal.path
    //     })
    //   }
    // },
  },
  methods: {
    onCancel() {
      this.$refs.observer.reset()
      this.$emit('cancel', false)
    },
    onSave() {
      const data = {
        id: this.formData.id,
        name: this.formData.name,
        path: this.formData.path,
        bcid: this.bcId,
        ignoreSaveFile: this.path == this.formData.path
      }
      this.isEdit || (data.insert = true)
      this.$emit('save', data)
    },
    showFileBrowserDialog() {
      window.ipc.invoke("filePicker", {
        title: "模板",
        directory: this.formData.path,
      }).then(res => {
        if (res) {
          this.formData.path = res;
        }
      });
    },
  },
  data() {
    return {
      rules: {
        name: { requiredInput: true },
        path: { requiredSelect: true }
      },
      formData: {},
      processing: {
        submit: false
      },
    }
  }
}
</script>

<style>

</style>