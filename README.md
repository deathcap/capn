# capn

Experimental browserify development server using HTTP/2 and ES6 Modules

Usage:

    node capn.js ./demo/demo.js
    open https://localhost:9977

[browserify](https://www.npmjs.com/package/browserify) normally concatenates
all modules into one `bundle.js` file, to reduce roundtrip HTTP requests
and therefore latency. `capn` instead serves each module individually,
taking advantage of the request streamlining improvements of [HTTP/2](http://daniel.haxx.se/http2/)
which make concatenation unnecessary.

Additionally, CommonJS modules are (partially) converted to ES6 modules using
[cjs2es6import](https://www.npmjs.com/package/cjs2es6import) for loading in the
browser. For example, `var foo = require('bar')` is converted to `import foo from 'id/bar'`,
which causes an HTTP/2 request to `/id/bar.js` for loading the module.

Requires a modern browser for HTTP/2 support (tested on Chrome 41).
ES6 Modules are polyfilled with
[es6-module-loader](https://github.com/ModuleLoader/es6-module-loader).

Warning: incomplete

## See also

* [beefy](https://www.npmjs.com/package/beefy)
* [wzrd](https://www.npmjs.com/package/wzrd)
* [budo](https://www.npmjs.com/package/budo)
* [wizz](https://github.com/mattdesl/wizz)

## License

MIT

