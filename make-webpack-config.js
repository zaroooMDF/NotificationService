/* eslint-disable */
var environment = process.env;

const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = function (options) {
  const entry = {
    main: './src/app.main.js',
  };

  const defaultLoaders = [{
      test: /\.json5$/,
      use: ['json5-loader']
    },
    {
      test: /\.txt$/,
      use: ['raw-loader']
    },
    {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 10000,
        },
      },
    },
    {
      test: /\.html$/,
      use: ['html-loader']
    },
    {
      test: /\.woff2?(\?v=\d+\.\d+\.\d+|\?.*)?$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/font-woff',
        },
      },
    },
    {
      test: /\.ttf(\?v=\d+\.\d+\.\d+|\?.*)?$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/octet-stream',
        },
      },
    },
    {
      test: /\.eot(\?v=\d+\.\d+\.\d+|\?.*)?$/,
      use: ['file-loader'],
    },
    {
      test: /\.svg(\?v=\d+\.\d+\.\d+|\?.*)$/,
      use: {
        loader: 'url-loader',
        options: {
          limit: 10000,
          mimetype: 'application/svg+xml',
        },
      },
    },
  ];
  const postCssLoader = {
    loader: 'postcss-loader',
    options: {
      sourceMap: true,
    },
  };
  const cssLoader = {
    loader: 'css-loader',
    options: {
      sourceMap: true,
    },
  };

  const resolveUrlLoader = 'resolve-url-loader';

  let stylesheetLoaders = [{
      test: /\.css$/,
      use: [cssLoader, postCssLoader],
    },
    {
      test: /\.scss$/,
      use: [
        cssLoader,
        postCssLoader,
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            outputStyle: 'expanded',
            sourceMapContents: true,
          },
        },
      ],
    },
    {
      test: /\.less$/,
      use: [
        cssLoader,
        // resolveUrlLoader,
        postCssLoader,
        {
          loader: 'less-loader',
          options: {
            sourceMap: true,
          },
        },
      ],
    },
    {
      test: /\.sass$/,
      use: [
        cssLoader,
        // resolveUrlLoader,
        postCssLoader,
        {
          loader: 'sass-loader',
          options: {
            sourceMap: true,
            indentedSyntax: true,
            outputStyle: 'expanded',
            sourceMapContents: true,
          },
        },
      ],
    },
  ];


  const publicPath = options.env !== 'dev' ? './' : '/_assets/';

  const output = {
    path: path.join(__dirname, 'public', '_assets'),
    publicPath,
    filename: `[name].js${(options.longTermCaching ? '?[chunkhash]' : '')}`,
    chunkFilename: (options.devServer ? '[id].js' : '[name].js') + (options.longTermCaching ? '?[chunkhash]' : ''),
    sourceMapFilename: 'debugging/[file].map',
    pathinfo: options.debug,
  };
  const excludeFromStats = [
    // /node_modules[\\/]angular[\\/]/,
  ];

  function statsPlugin() {
    this.plugin('done', (stats) => {
      const jsonStats = stats.toJson({
        chunkModules: true,
        exclude: excludeFromStats,
      });
      jsonStats.publicPath = publicPath;
      if (!fs.existsSync(path.join(__dirname, '..', 'build'))) {
        fs.mkdirSync(path.join(__dirname, '..', 'build'));
      }
      if (!options.prerender) {
        fs.writeFileSync(path.join(__dirname, 'build', 'stats.json'), JSON.stringify(jsonStats));
      } else {
        fs.writeFileSync(path.join(__dirname, 'build', 'server', 'stats.json'), JSON.stringify(jsonStats));
      }
    });
  }

  const plugins = [];

  if (!options.devServer) {
    plugins.push(statsPlugin);
  }

  const alias = {};
  const externals = [];

  plugins.push(new webpack.ContextReplacementPlugin(/\.\/locale$/, 'empty-module', false, /js$/));

  if (options.commonsChunk && !options.cover) {
    plugins.push(new webpack.optimize.CommonsChunkPlugin(
      'commons',
      `commons.js${(options.longTermCaching ? '?[chunkhash]' : '')}`
    ));
  }

  plugins.push( new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery',
  }));


  stylesheetLoaders = stylesheetLoaders.map((loaderIn) => {
    const loader = Object.assign({}, loaderIn);
    delete loader.use;

    if (options.isServer) {
      loader.use = ['null-loader'];
    } else if (options.separateStylesheet) {
      loader.loader = ExtractTextPlugin.extract({
        fallback: 'style-loader',
        use: loaderIn.use,
      });
    } else {
      loader.use = ['style-loader', ...loaderIn.use];
    }
    return loader;
  });

  if (options.separateStylesheet) {
    plugins.push(new ExtractTextPlugin({
      filename: `[name].css${options.longTermCaching ? '?[contenthash]' : ''}`,
    }));
  }
  const definitions = {
    'process.env.NODE_ENV': options.debug ? JSON.stringify('development') : JSON.stringify('production'),
    'NODE_ENV': options.debug ? JSON.stringify('development') : JSON.stringify('production'),
    'USE_MOCKS': !! environment.USE_MOCKS ,
  };

  if (options.minimize) {
    plugins.push(
      new webpack.optimize.ModuleConcatenationPlugin(),
      new webpack.LoaderOptionsPlugin({
        minimize: true,
      }),
      new webpack.optimize.UglifyJsPlugin({
        // todo: check if needed
        sourceMap: true,
        compress: {
          warnings: false,
        },
      }),
      new webpack.NoEmitOnErrorsPlugin()
    );
  }
  plugins.push(new webpack.DefinePlugin(definitions));

  let jsRules;

  if (options.cover) {
    jsRules = [
      // transpile all files except testing sources with babel as usual
      {
        test: /\.test\.jsx?$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      // transpile and instrument only testing sources with babel-istanbul
      {
        test: /\.jsx?$/,
        exclude: [
          /node_modules/,
          /\.test\./,
        ],
        use: ['istanbul-instrumenter-loader', {
          loader: 'babel-loader',
          options: {
            presets: [
              'es2015',
            ],
            plugins: [
              'angularjs-annotate',
            ],
          },
        }],
      },
    ];
  } else {
    jsRules = [{
      test: /\.jsx?$/,
      use: ['babel-loader'],
      exclude: /node_modules/,
    }, ];
  }

  return {
    entry,
    output,
    target: 'web',
    module: {
      rules: []
        .concat(jsRules)
        .concat(defaultLoaders)
        .concat(stylesheetLoaders)
    },
    devtool: options.devtool,
    externals,
    resolve: {
      modules: [
        'web_modules',
        'node_modules',
      ],
      extensions: ['.web.js', '.js', '.jsx'],
      mainFields: ['browser', 'module', 'jsnext:main', 'main'],
      alias,
    },
    plugins,
    devServer: {
      stats: {
        cached: false,
        exclude: excludeFromStats,
      },
    },
  };
};
