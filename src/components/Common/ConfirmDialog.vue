<template>
  <v-dialog width="400" :value.sync="value">
    <v-card>
      <v-toolbar color="primary" elevation="0" dense dark>
        <v-icon color="warning">mdi-alert</v-icon>
        <v-toolbar-title class="ml-1" v-text="title"></v-toolbar-title>
      </v-toolbar>
      <v-card-title class="text-h5">{{ message }}</v-card-title>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="onCancel">取消</v-btn>
        <v-btn color="primary" @click="onConfirm">确定</v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'confirm-dialog',
  props: {
    value: Boolean,
    title: {
      type: String,
      default: '提示'
    },
    message: String,
    args: Object
  },
  methods: {
    onCancel() {
      this.$emit('input', false)
    },
    onConfirm() {
      this.$emit('confirm', this.args)
      this.$emit('input', false)
    }
  },
  data() {
    return {

    }
  }
}
</script>