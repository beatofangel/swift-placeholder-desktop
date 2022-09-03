<template>
  <v-text-field
    v-model="value"
    :class="{ 'mb-1': hideDetails }"
    :hide-details="hideDetails"
    :required="required"
    :disabled="disabled"
    @input="onInput"
    @focus="focus = true"
    @blur="focus = false"
    :error="error"
    dense
  >
    <template v-slot:prepend-inner>
      <v-hover v-slot="{ hover }">
        <v-icon
          :color="getBtnColor(hover, disableMinus)"
          :disabled="disableMinus"
          @click="minus()"
          >mdi-minus</v-icon
        >
      </v-hover>
    </template>
    <template v-slot:append>
      <v-tooltip top v-if="error"
        ><template v-slot:activator="{ on, attrs }">
          <v-icon v-bind="attrs" v-on="on" color="error" small
            >mdi-alert-circle-outline</v-icon
          >
        </template>
        <span>{{ errorMessages[0] }}</span>
      </v-tooltip>
      <v-hover v-slot="{ hover }">
        <v-icon
          :color="getBtnColor(hover, disablePlus)"
          :disabled="disablePlus"
          @click="plus()"
          >mdi-plus</v-icon
        >
      </v-hover>
    </template>
  </v-text-field>
</template>

<script>
export default {
  name: "v-integer-field",
  model: {
    prop: "modelValue",
    event: "input",
  },
  props: {
    modelValue: {
      type: [Number, String],
      default: null,
    },
    step: {
      type: Number,
      default: 1,
    },
    min: {
      type: Number,
      default: null,
    },
    max: {
      type: Number,
      default: null,
    },
    hideDetails: {
      type: Boolean,
      default: false,
    },
    required: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    error: {
      type: Boolean,
      default: false,
    },
    errorMessages: {
      type: Array,
      default: () => [],
    },
  },
  watch: {
    modelValue: {
      immediate: true,
      handler(val) {
        this.value = val;
      },
    },
  },
  computed: {
    disableMinus() {
      return this.value <= this.min
    },
    disablePlus() {
      return this.value >= this.max
    }
  },
  methods: {
    getBtnColor(hover, hasExceeded) {
      if (hover) {
        if (hasExceeded) {
          return "default";
        } else {
          return "primary";
        }
      } else {
        if (this.focus) {
          if (hasExceeded) {
            return "default";
          } else {
            return "primary";
          }
        } else {
          return "default";
        }
      }
    },
    plus() {
      const newVal = Number(this.value) + this.step;
      this.$emit("input", newVal);
      this.$nextTick(() => {
        this.value = newVal;
      });
    },
    minus() {
      const newVal = Number(this.value) - this.step;
      this.$emit("input", newVal);
      this.$nextTick(() => {
        this.value = newVal;
      });
    },
    onInput(val) {
      if (val == "") {
        this.$nextTick(() => {
          this.value = null;
        });
        this.$emit("input", null);
      } else if (/^-?(\d?|[1-9]\d*)$/.test(val)) {
        if (val == '-') {
          this.$emit("input", val);
        } else {
          let newVal = Math.round(val);
          if (this.min && newVal < this.min) {
            newVal = this.min;
          } else if (this.max && newVal > this.max) {
            newVal = this.max;
          }
          this.$nextTick(() => {
            this.value = newVal;
          });
          this.$emit("input", newVal);
        }
      // } else if (Number.isNaN(Number(val))) {
      } else {
        this.$nextTick(() => {
          this.value = null;
        });
        this.$emit("input", null);
      }
    },
  },
  data() {
    return {
      value: null,
      focus: false,
    };
  },
};
</script>

<style>
</style>