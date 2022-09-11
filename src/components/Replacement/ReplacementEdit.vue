<template>
  <v-card>
    <v-row class="ma-0">
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <v-row
          style="height: 100%"
          align="center"
          v-if="templatePreviewLoading"
        >
          <v-col offset="4" cols="4">
            <v-img src="spinner.svg"></v-img>
          </v-col>
        </v-row>
        <iframe
          v-else
          :src="templatePreviewUrl"
          width="100%"
          height="100%"
          frameborder="0"
        ></iframe>
        <v-fab-transition>
          <v-btn
            style="
              bottom: 0;
              margin-bottom: 20px;
              margin-right: 10px;
            "
            color="pink"
            dark
            absolute
            bottom
            right
            fab
            @click="previewPdf(true)"
          >
            <v-icon large>{{
              templatePreviewLoading
                ? "mdi-loading mdi-spin"
                : "mdi-sync"
            }}</v-icon>
          </v-btn>
        </v-fab-transition>
      </v-card>
      <v-card class="col-6 pa-0 mb-1" elevation="0" tile>
        <v-data-table
          fixed-header
          height="calc(100vh - 500px)"
          :items="placeholderGroups"
          :headers="placeholderGroupsHeader"
          hide-default-footer
          disable-pagination
          disable-sort
          show-expand
          :expanded.sync="placeholderGroupsExpanded"
          class="elevation-1"
        >
          <template v-slot:[`item.name`]="{ item }">
            <v-chip color="primary lighten-2" label>{{
              item.name
            }}</v-chip>
          </template>
          <template v-slot:expanded-item="{ item }">
            <td colspan="3" class="px-0">
              <v-card class="ma-2" elevation="0" tile>
                <v-data-table
                  :items="
                    placeholders.filter(
                      (e) => e.groupId == item.id
                    )
                  "
                  :headers="placeholdersHeader"
                  hide-default-header
                  hide-default-footer
                  disable-pagination
                  disable-sort
                >
                  <template v-slot:[`item.no`]="{ index }">
                    {{ index + 1 }}
                  </template>
                  <template v-slot:[`item.group`]>
                    &nbsp;
                  </template>
                  <template v-slot:[`item.name`]="{ item }">
                    <v-chip
                      :color="
                        !!item.value
                          ? 'success lighten-1'
                          : ''
                      "
                    >
                      {{ `$\{${item.name}\}` }}
                    </v-chip>
                  </template>
                  <template v-slot:[`item.value`]="{ item }">
                    <v-menu
                      v-if="item.type == 'date'"
                      v-model="item.menu"
                      :close-on-content-click="false"
                      max-width="290px"
                      min-width="auto"
                      left
                      offset-y
                    >
                      <template
                        v-slot:activator="{ on, attrs }"
                      >
                        <v-text-field
                          :value="formatDate(item)"
                          hide-details
                          class="mb-1 edit-column-font-size"
                          append-icon="mdi-calendar"
                          v-bind="attrs"
                          v-on="on"
                          dense
                        ></v-text-field>
                      </template>
                      <v-date-picker
                        no-title
                        locale="zh"
                        :first-day-of-week="1"
                        v-model="item.value"
                        @input="item.menu = false"
                      >
                      </v-date-picker>
                    </v-menu>
                    <v-text-field
                      v-else
                      v-model="item.value"
                      hide-details
                      class="mb-1 edit-column-font-size"
                      dense
                    ></v-text-field>
                  </template>
                </v-data-table>
              </v-card>
            </td>
          </template>
        </v-data-table>
      </v-card>
    </v-row>
  </v-card>
</template>

<script>
import moment from "moment";
export default {
  props: {
    tplId: String,
    tplPath: String
  },
  mounted() {
    window.ipc.receive("previewPdf", ({ id, path, ph }) => {
      if (this.tplId == id) {
        this.pdfPath = path
        this.templatePreviewLoading = false;
        console.log(ph)
      }
    });
    window.replaceService
      .listPlaceholderGroupByTemplateId(this.tplId)
      .then((data) => {
        this.placeholderGroups = data;
        // expand all
        this.placeholderGroupsExpanded = this.placeholderGroups;
      });
    window.replaceService
      .listPlaceholderByTemplateId(this.tplId)
      .then((data) => {
        this.placeholders = data;
      });
    this.previewPdf();
  },
  watch: {
    // tplId(val) {
    //   window.replaceService
    //     .listPlaceholderGroupByTemplateId(val)
    //     .then((data) => {
    //       this.placeholderGroups = data;
    //       // expand all
    //       this.placeholderGroupsExpanded = this.formData.placeholderGroups;
    //     });
    //   window.replaceService
    //     .listPlaceholderByTemplateId(val)
    //     .then((data) => {
    //       this.placeholders = data;
    //     });
    //   this.previewPdf();
    // }
  },
  computed: {
    templatePreviewUrl() {
      return this.pdfPath ? `${this.pdfPath}#view=${this.pdfOptions.view}&toolbar=${this.pdfOptions.toolbar}` : 'about:blank'
    }
  },
  methods: {
    previewPdf(replaceFlag) {
      this.templatePreviewLoading = true;
      window.ipc.send("previewPdf", {
        id: this.tplId,
        path: this.tplPath,
        data: replaceFlag ? this.placeholders : [],
      });
    },
    formatDate({ value, format }) {
      return value && format ? moment(value).format(format) : null;
    },
  },
  data() {
    return {
      placeholderGroups: [],
      placeholderGroupsExpanded: [],
      placeholders: [],
      templatePreviewLoading: false,
      pdfOptions: {
        toolbar: 0,
        view: 'FitH,top'
      },
      pdfPath: null,
      placeholderGroupsHeader: [
        {
          text: "名称",
          value: "name",
          align: "center",
          cellClass: "column-width-name text-start",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
        },
      ],
      placeholdersHeader: [
        {
          text: "No.",
          value: "no",
          align: "center",
          cellClass: "column-width-no",
        },
        {
          text: "名称",
          value: "name",
          align: "start",
          cellClass: "column-width-name",
        },
        {
          text: "替换为",
          value: "value",
          align: "center",
        },
      ],
    }
  }
}
</script>

<style>
.column-width-no {
  width: 48px;
}
.column-width-name {
  width: 30%;
}
</style>