<template>
  <v-container>
    <div id="viewerContainer">
      <div id="pageContainer" class="pdfViewer"></div>
    </div>
  </v-container>
</template>
<script>
import * as pdfjsLib from 'pdfjs-dist/build/pdf'
import * as pdfjsViewer from 'pdfjs-dist/web/pdf_viewer'
// import 'pdfjs-dist/web/pdf_viewer.css';
export default {
  name: "pdf-viewer",
  props: {
    src: String
  },
  watch: {
    src(val) {
      if (val) {
        this.initPage()
      }
    }
  },
  methods: {
    initPage() {
      if (!pdfjsLib.getDocument || !pdfjsViewer.PDFPageView) {
        // eslint-disable-next-line no-alert
        alert("Please build the pdfjs-dist library using\n  `gulp dist-install`");
      }

      // The workerSrc property shall be specified.
      //
      // let PdfjsWorker = require('worker-loader!../node_modules/pdfjs-dist/build/pdf.worker.js')
      pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(new URL('pdfjs-dist/build/pdf.worker.js', import.meta.url))
      // pdfjsLib.GlobalWorkerOptions.workerPort = new Worker('https://cdn.jsdelivr.net/npm/pdfjs-dist@3.4.120/build/pdf.worker.js')
      // pdfjsLib.GlobalWorkerOptions.workerSrc =
      //   "../node_modules/pdfjs-dist/build/pdf.worker.js";

      const CMAP_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@latest/cmaps/";
      // const CMAP_URL = "/cmaps/";
      const CMAP_PACKED = true;

      // const DEFAULT_URL = "/ac8b5907e1cf5ee7cada8650bbf1082d.pdf";
      // const DEFAULT_URL = "/7a79c35f7ce0704dec63be82440c8182.pdf";
      // const DEFAULT_URL = "/cl4nx_cl6nx_programmingreference_eng_09.pdf";
      const DEFAULT_URL = this.src;
      const eventBus = new pdfjsViewer.EventBus();
      this.eventBus = eventBus
      // const pdfLinkService = new pdfjsViewer.PDFLinkService({
      //   eventBus,
      // });
      // const pdfFindController = new pdfjsViewer.PDFFindController({
      //   eventBus,
      //   linkService: pdfLinkService
      // })
      const container = document.getElementById("viewerContainer");
      const pdfViewer = new pdfjsViewer.PDFViewer({
        container,
        eventBus,
        // linkService: pdfLinkService,
        // findController: pdfFindController,
        // scriptingManager: pdfScriptingManager,
      });
      eventBus.on("pagesinit", function () {
        // We can use pdfViewer now, e.g. let's change default scale.
        pdfViewer.currentScaleValue = "page-fit";
        eventBus.on(
          "pagesloaded",
          event => {
            this.isPagesLoaded = !!event.pagesCount
            console.log('page count:', event.pagesCount)
          },
          { once: true }
        )
      })
      // pdfLinkService.setViewer(pdfViewer)
    
      // Loading document.
      const config = {
        url: DEFAULT_URL,
        cMapUrl: CMAP_URL,
        cMapPacked: CMAP_PACKED,
        verbosity: 1
      }
      console.log(config)
      const loadingTask = pdfjsLib.getDocument(config);
      loadingTask.promise.then((pdfDocument) => {
        pdfDocument
        this.pdf = pdfDocument
        pdfViewer.setDocument(pdfDocument)
        // pdfLinkService.setDocument(pdfDocument)
        // pdfFindController.setDocument(pdfDocument)
      })
    }
  },
  data() {
    return {
      pdf: null,
      eventBus: null
    }
  }
}
</script>
<style scoped>
@import url('pdfjs-dist/web/pdf_viewer.css');
:deep(.pdfViewer>.page) {
  /* default: border-box */
  /* https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing#content-box */
  box-sizing: content-box;
}
#pageContainer {
  background-color: #808080;
  /* margin: 0;
  padding: 0; */
}
#viewerContainer {
  position: absolute;
  height: 700px;
  overflow-y: auto;
}
</style>