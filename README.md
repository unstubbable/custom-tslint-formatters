Custom TSLint Formatters
========================

A collection of custom TSLint formatters. With colors.

Included Formatters
-------------------

- `grouped`

![custom tslint formatter grouped](docs/screenshots/grouped.png)

Installation
------------

```
npm install custom-tslint-formatters --save-dev
```

Usage
-----

On the commandline specify the formatters directory with `-s` and the formatter with `-t` (see list of formatters above):
```
tslint -s node_modules/custom-tslint-formatters/formatters -t grouped src/**/*.ts
```

For [tslint-loader][] add a `tslint` configuration block to your webpack config specifying the `formattersDirectory` as well as the `formatter` (see list of formatters above):
```javascript
module.exports = {
  module: {
    preLoaders: [
      {
        test: /\.ts$/,
        loader: "tslint"
      }
    ]
  },
  tslint: {
    formattersDirectory: 'node_modules/custom-tslint-formatters/formatters',
    formatter: 'grouped'
  }
}
```

[tslint-loader]: https://github.com/wbuchwalter/tslint-loader
