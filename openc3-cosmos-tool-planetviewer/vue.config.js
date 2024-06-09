// 
const CopyWebpackPlugin = require('copy-webpack-plugin')
const Webpack = require('webpack')
// 
const cesiumContext = '../../node_modules';

module.exports = {
  publicPath: '/tools/planetviewer',
  outputDir: 'tools/planetviewer',
  filenameHashing: false,
  transpileDependencies: ['vuetify'],
  devServer: {
    port: 2918,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    client: {
      webSocketURL: {
        hostname: 'localhost',
        pathname: '/tools/admin',
        port: 2918,
      },
    },
  },
  configureWebpack: {
    output: {
      libraryTarget: 'system',
    },
    plugins: [
      // Copy Cesium Assets, Widgets, and Workers to a static directory
      new CopyWebpackPlugin({
        // Copy Cesium Assets, Widgets, and Workers to a static directory
        patterns: [
          { from: 'cesium/Build/Cesium/Workers/', to: 'Workers', context: cesiumContext, },
          { from: 'cesium/Build/Cesium/ThirdParty/', to: 'ThirdParty', context: cesiumContext, },
          { from: 'cesium/Build/Cesium/Assets/', to: 'Assets', context: cesiumContext, },
          { from: 'cesium/Build/Cesium/Widgets/', to: 'Widgets', context: cesiumContext, },
        ],
      }),
      new Webpack.DefinePlugin({
        // Define relative base path in cesium for loading assets
        CESIUM_BASE_URL: JSON.stringify(''),
      }),
    ],
    module: {
      // Removes these errors: "Critical dependency: require function is used in a way in which dependencies cannot be statically extracted"
      // https://github.com/AnalyticalGraphicsInc/cesium-webpack-example/issues/6
      unknownContextCritical: false,
      unknownContextRegExp: /\/cesium\/cesium\/Source\/Core\/buildModuleUrl\.js/,
    },
  },
  chainWebpack(config) {
    config.module
      .rule('js')
      .use('babel-loader')
      .tap((options) => {
        return {
          rootMode: 'upward',
        }
      })
    config.externals(['vue', 'vuetify', 'vuex', 'vue-router'])      
  },
}
