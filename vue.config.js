module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  configureWebpack: {
    devtool: 'source-map',
    externals: ['sqlite3', 'sequelize'],
  },
  pluginOptions: {
    electronBuilder: {
      preload: 'src/preload.js',
      builderOptions: {
        appId: "Swift Placeholder",
        extraFiles: [
          {
            from: "./database/",
            to: "database",
            filter: [ "userdata.db" ]
          },
          {
            from: "./instdir/",
            to: "instdir",
            filter: [ "**/*" ]
          },
          {
            from: "./replaceApp/",
            to: "replaceApp",
            filter: [ "**/*" ]
          }
        ]
      }
    }
  }
}
