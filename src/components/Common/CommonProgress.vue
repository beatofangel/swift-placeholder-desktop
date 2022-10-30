<template>
  <v-dialog
    persistent
    :value="showProgress"
    @input="$emit('intput', showProgress)"
    overlay-opacity="0"
    width="60%"
  >
    <v-card>
      <v-card-text>
        <v-row>
          <v-col class="d-flex justify-center mt-3 pb-0">
            <span v-if="indeterminate" class="text-h5" v-text="prepareMessage"></span>
            <slot name="progressing" v-bind="{ message: processMessage }" v-else-if="progressed <= total && !completed">
              <v-icon left>mdi-vanish mdi-spin</v-icon>
              <span class="text-h5">
                {{ `${processMessage} ${progressDisplay}` }}
              </span>
            </slot>
            <slot name="complete" v-bind="{ message: completeMessage }" v-if="completed">
              <span class="primary--text text-h5" v-text="completeMessage"></span>
            </slot>
            <v-progress-circular :rotate="-90" :value="closeProgress" v-if="completed">
              <v-hover v-slot="{ hover }">
                <v-icon @click="closeProgress = 110" :color="hover ? 'error' : ''">mdi-close</v-icon>
              </v-hover>
            </v-progress-circular>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-progress-linear
              :class="{ 'common-progress': !completed }"
              color="primary"
              :value="progress"
              :indeterminate="indeterminate"
              rounded
              striped
              height="6"
            >
            </v-progress-linear>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'common-progress',
  props: {
    value: Boolean,
    indeterminate: {
      type: Boolean,
      default: true
    },
    prepareMessage: {
      type: String,
      default: '准备中...'
    },
    processMessage: {
      type: String,
      default: '处理中：'
    },
    completeMessage: {
      type: String,
      default: '完成！'
    },
    completed: Boolean,
    total: Number,
    progressed: Number
  },
  watch: {
    value(val) {
      this.showProgress = val
      this.closeProgress = 0
    },
    completed(val) {
      if (val) {
        this.closeTimer = setInterval(() => {
          this.closeProgress += 10
        }, 1000);
      }
    },
    closeProgress(val) {
      if (val > 100) {
        clearInterval(this.closeTimer)
        this.$emit('input', false)
      }
    }
  },
  computed: {
    progress() {
      return Math.ceil(this.progressed / this.total * 100)
    },
    progressDisplay() {
      return `${this.progressed}/${this.total}`
    }
  },
  methods: {
  },
  data() {
    return {
      showProgress: false,
      closeProgress: 0,
      closeTimer: null
    }
  }
}
</script>

<style>
.common-progress.v-progress-linear--striped .v-progress-linear__determinate {
  -webkit-animation: cssProgressActive 1s linear infinite;
  animation: cssProgressActive 1s linear infinite;
}

@-webkit-keyframes cssProgressActive {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}
@keyframes cssProgressActive {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 40px 40px;
  }
}
</style>