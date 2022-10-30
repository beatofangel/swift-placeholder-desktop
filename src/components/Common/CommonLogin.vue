<template>
  <v-card
    class="d-flex flex-row align-self-center mx-auto"
    :width="width"
    :height="height"
    :min-height="minHeight"
    :min-width="minWidth"
    flat
  >
    <v-card
      width="440"
      class="d-flex align-center rounded-r-0 word-cloud-container"
      flat
    >
    </v-card>
    <v-card flat>
      <v-divider vertical></v-divider>
    </v-card>
    <v-card
      width="360"
      class="rounded-l-0"
      flat
    >
      <v-card-title class="d-flex justify-center mt-8 text-h5">用户登录</v-card-title>
      <v-card-text>
        <v-form>
          <v-row class="my-0">
            <v-col>
              <v-tabs v-model="tab" height="32" grow>
                <v-tab>验证码</v-tab>
                <v-tab>密码</v-tab>
              </v-tabs>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-text-field
                label="手机号"
                outlined
                hint="※未注册手机验证后自动登录"
                persistent-hint
                prepend-inner-icon="mdi-cellphone"
                dense
              ></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-tabs-items v-model="tab" light>
                <v-tab-item :transition="false">
                  <v-row style="margin-bottom: 6px; margin-top: -16px">
                    <v-col cols="8">
                      <v-otp-input length="6" dense> </v-otp-input>
                    </v-col>
                    <v-col cols="4" class="d-flex align-center justify-center pl-0">
                      <a
                        v-if="countdown < 0"
                        @click="getSmsCaptcha"
                        class="text-nowrap"
                        >获取短信验证码</a
                      >
                      <v-progress-circular
                        v-else
                        :rotate="-90"
                        :width="5"
                        :value="progress"
                        :color="progressColor"
                      >
                        {{ countdown }}
                      </v-progress-circular>
                    </v-col>
                  </v-row>
                </v-tab-item>
                <v-tab-item :transition="false">
                  <v-text-field
                    label="密码"
                    type="password"
                    outlined
                    prepend-inner-icon="mdi-lock"
                    dense
                  ></v-text-field>
                </v-tab-item>
              </v-tabs-items>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-btn
                color="primary"
                :disabled="!formData.agree"
                @click="handleLogin"
                block
                >登录</v-btn
              >
            </v-col>
          </v-row>
        </v-form>
        <v-row class="my-4">
          <v-col class="mt-2 pr-0"><v-divider></v-divider></v-col>
          <v-col class="d-flex justify-center px-0 text-caption"
            >第三方登录</v-col
          >
          <v-col class="mt-2 pl-0"><v-divider></v-divider></v-col>
        </v-row>
        <v-row class="d-flex justify-center my-4">
          <v-icon color="green accent-4" class="mx-4">mdi-wechat</v-icon>
          <v-icon color="blue lighten-2" class="mx-4">mdi-qqchat</v-icon>
          <v-icon color="deep-orange accent-3" class="mx-4"
            >mdi-sina-weibo</v-icon
          >
        </v-row>
        <v-row class="my-4">
          <v-col class="d-flex justify-center text-caption">
            <v-icon
              class="mr-1 agree-eula-and-privacy-policy"
              @click="formData.agree = !formData.agree"
              small
              >{{
                formData.agree
                  ? "mdi-checkbox-outline"
                  : "mdi-checkbox-blank-outline"
              }}</v-icon
            >我同意<a class="red--text">《最终用户许可协议》</a>及<a
              class="red--text"
              >《隐私条款》</a
            >
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-card>
</template>

<script>
import * as d3 from "d3";
import cloud from "d3-cloud";
export default {
  props: {
    width: {
      type: [String, Number],
      default: "100%",
    },
    height: {
      type: [String, Number],
      default: "100%",
    },
    minHeight: {
      type: [String, Number],
      default: 550,
    },
    minWidth: {
      tpe: [String, Number],
      default: 800,
    },
    words: {
      type: Array,
      default: () => [],
    },
  },
  name: "common-login",
  computed: {
    progress() {
      return Math.floor((60 - this.countdown) * 100 / 60);
    },
    progressColor() {
      return `${
        this.countdown > 30
          ? "primary"
          : this.countdown > 10
          ? "warning"
          : "error"
      }`;
    },
  },
  mounted() {
    const noData = this.words.length == 0
    this.getWordCloud(noData)
    this.timer = setInterval(() => { this.getWordCloud(noData) }, 10000)
  },
  beforeDestroy() {
    clearInterval(this.timer)
  },
  methods: {
    handleLogin() {
      // TODO
      clearInterval(this.timer)
      this.$emit('input', false)
    },
    async getWordCloud(noData = true) {
      if (noData) {
        const site = ['https://tenapi.cn/resou/','https://tenapi.cn/douyinresou/','https://tenapi.cn/baiduhot/'][~~(Math.random() * 3)]
        console.log(site)
        const { data } = await this.axios.get(site) // TODO 使用ipc请求数据，避免cors问题
        const newList = data.list.normalize('hot', [20, 50])
        console.log(newList)
        this.myWords = newList.map(e=>{
          return { text: e.name, size: e.hot }
        })
      } else {
        this.myWords = this.words.slice()
      }
      this.layout = cloud()
        .size([this.wordCloudCanvasWidth, this.wordCloudCanvasHeight])
        .words(this.myWords)
        .padding(5)
        .rotate(function () {
          // return ~~(Math.random() * 2) * 90;
          return (~~(Math.random() * 13) - 6) * 10
        })
        .font("Impact")
        .fontSize(function (d) {
          return d.size;
        })
        .on("end", this.draw);

      this.fill = d3.scaleOrdinal(d3.schemeCategory10)
      this.layout.start()
    },
    getSmsCaptcha() {
      // send request
      this.countdown = 60;
      const t = setInterval(() => {
        this.countdown -= 1;
        if (this.countdown < 0) {
          clearInterval(t);
          return;
        }
      }, 1000);
    },
    draw(words) {
      let randomColor = (d, i) => this.fill(i)
      d3.select(".word-cloud-container>svg").remove()
      d3.select(".word-cloud-container")
        .append("svg")
        .attr("width", this.layout.size()[0])
        .attr("height", this.layout.size()[1])
        .append("g")
        .attr('transform', `translate(${this.wordCloudCanvasWidth / 2},${this.wordCloudCanvasHeight / 2})`)
        .attr(
          "transform",
          "translate(" + this.layout.size()[0] / 2 + "," + this.layout.size()[1] / 2 + ")"
        )
        .selectAll("text")
        .data(words)
        .enter()
        .append("text")
        .style("font-size", function (d) {
          return d.size + "px";
        })
        .style("font-family", "Impact")
        .style("fill", randomColor)
        .attr('text-anchor', 'middle')
        .attr('transform',d => { 
            return `translate(${[d.x, d.y]})rotate(${d.rotate})`
        })
        .attr("text-anchor", "middle")
        .attr("transform", function (d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function (d) {
          return d.text;
        });
    },
  },
  data() {
    return {
      formData: {
        id: null,
        otp: null,
        password: null,
        agree: true,
      },
      tab: null,
      countdown: -1,
      layout: null,
      timer: null,
      myWords: [],
      fill: null,
      wordCloudCanvasWidth: 440,
      wordCloudCanvasHeight: 500,
    };
  },
};
</script>

<style scoped>
.agree-eula-and-privacy-policy.v-icon::after {
  background-color: transparent !important;
}
</style>
