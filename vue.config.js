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
          }
        ]
      }
    }
  }
}
