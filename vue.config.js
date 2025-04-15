const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,// 禁用生产环境的source map
  configureWebpack: {
    output: {
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].js',
      publicPath: '/'
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 250000,
        cacheGroups: {
          three: {
            name: 'chunk-three',
            test: /[\\/]node_modules[\\/]three[\\/]/,
            priority: 30,  //优先级高于其他
            reuseExistingChunk: true
          },
          elementPlus: {
            name: 'chunk-elementplus',
            test: /[\\/]node_modules[\\/]element-plus[\\/]/,
            priority: 20,
            reuseExistingChunk: true,
            enforce: true,
            chunks: 'initial'
          },
          common: {
            name: 'chunk-common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      }
    }
  },
  lintOnSave:false,
  devServer: {
    webSocketServer:false,
  },
  chainWebpack: config => {
    // 使用 url-loader 处理图片
    // config.module
    //   .rule('images')
    //   .test(/\.(png|jpe?g|gif|webp)(\?.*)?$/)
    //   .use('url-loader')
    //   .loader('url-loader')
    //   .options({
    //     limit: 4096,
    //     esModule: false,
    //     name: 'img/[name].[hash:8].[ext]',
    //     publicPath: process.env.NODE_ENV === 'production'
    //       ? '../'
    //       : '/'
    //   })

    // 开启 gzip 压缩
    config.plugin('compression')
      .use(require('compression-webpack-plugin'), [{
        test: /\.(js|css|html|svg)$/,
        threshold: 10240,
        deleteOriginalAssets: false
      }])

    // 配置 glb 格式文件
    config.module
      .rule('glb')
      .test(/\.(glb|gltf)$/)
      .use('file-loader')
      .loader('file-loader')
      .options({
        name: '[name].[contenthash:8].[ext]',  // 添加 contenthash 确保模型文件被缓存
        outputPath: 'models',
        publicPath: '/models/',
        cacheControl: 'max-age=31536000' // 设置缓存时间为一年
      })
      // //CSS
      // config.module
      // .rule('css')
      // .test(/\.css$/)
      // .use('vue-style-loader')
      // .loader('vue-style-loader')
      // .end()
      // .use('css-loader')
      // .loader('css-loader')
      // .options({
      //   sourceMap: false,
      //   importLoaders: 1
      // })
      // .end()
      // .use('postcss-loader')
      // .loader('postcss-loader')
      // .end()

    // // 添加资源缓存配置
    // config.cache({
    //   type: 'filesystem',
    //   buildDependencies: {
    //     config: [__filename]
    //   },
    //   name: 'build-cache'
    // })

    // // 优化持久化缓存
    // config.optimization
    //   .runtimeChunk('single')
    //   .splitChunks({
    //     chunks: 'all',
    //     maxInitialRequests: Infinity,
    //     minSize: 20000,
    //     cacheGroups: {
    //       vendor: {
    //         test: /[\\/]node_modules[\\/]/,
    //         name(module) {
    //           // 添加安全检查
    //           if (!module.context) return 'vendor';
              
    //           const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
    //           if (!match || !match[1]) return 'vendor';

    //           const packageName = match[1];
    //           // 处理特殊字符
    //           return `npm.${packageName.replace('@', '').replace(/[^a-zA-Z0-9]/g, '-')}`;
    //         },
    //         priority: 10,
    //         chunks: 'all'
    //       }
    //     }
    //   })
  }
})
