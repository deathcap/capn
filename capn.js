'use strict';

var http2 = require('http2');
var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var browser_unpack = require('browser-unpack');
var cjs2es6import = require('cjs2es6import');
var Readable = require('stream').Readable;
var endsWith = require('lodash.endswith');

var PORT = 9977;

var allDeps = {};

var gatherDeps = function(rows) {
  rows.forEach(function(row) {
    var id = row.id;

    Object.keys(row.deps).forEach(function(depName) {
      var depId = row.deps[depName];

      depName = depName.replace(/\./, '_'); // encoded for es6 import below

      allDeps['/' + id + '/' + depName + '.js'] = '/' + depId;
    });
  });

  return allDeps;
};

var srcFn = process.argv[2];
if (!srcFn) {
  console.error('source module required'); // TODO: pass through all args to browserify/watchify like wzrd, beefy
  process.exit(-1);
}

var b = browserify({
  entries: [srcFn],
  debug: true
});

var sources = {};
var sourceEntryId = null;

b.bundle(function(err, bundleSource) {
  if (err) throw err;

  var rows = browser_unpack(bundleSource);
  var deps = gatherDeps(rows);

  //console.log('deps:',deps);
  //console.log('browserify:',rows);
  console.log('processed',rows.length,'rows, ',Object.keys(deps).length,'deps');
  rows.forEach(function(row) {
    var newSource = cjs2es6import(row.source, {encode:
      function(moduleName) {
        moduleName = moduleName.replace(/\./, '_'); // '.' not allowed in module names but can come from require('./foo')
        return row.id + '/' + moduleName;
      }
    });

    newSource = newSource.replace('module.exports = ', 'export default '); // TODO: refactor, cjs2es6export?

    sources['/' + row.id] = newSource;
    if (row.entry) {
      sourceEntryId = row.id;
    }
  });
});

// most browsers require TLS for HTTP2, use example key from http2 module
var options = {
  key: 
'-----BEGIN RSA PRIVATE KEY-----\n' + 
'MIICXAIBAAKBgQDPA+LYBNXHSPbi6ODfQC/ApKIERB+S0pt0rERhXVLuW9jcetyv\n' + 
'6sLU1G7VJSEmQSPihEpMEF3H9RK8F1A5207ZP1aSyfoHyDdfHvSwHYmYADBFpYrY\n' + 
'i4Ufg9e8ODcx2DqVstWM4DnJLpD8tWX0x/Xu47RB/fu3OJqb+0DJBXcOIQIDAQAB\n' + 
'AoGAHtRVVBZkP+l92w0TcCv+8JGUD06V5Se4Pwfopxde4mCLS0qA0zIDEe8REm0V\n' + 
'Ir1Quss4xVsqnDzDLX/LUtJ2S1+seWcoLdDV/wSDiM2CLS7KauUazrTWHLNId/lu\n' + 
'/VombYWK10uNiDZZJ8xwEaKt+ZptC2kK8/yi0aX0PrGhAIECQQDsD8A64BBrWCrb\n' + 
'7PrJt04CAcM3uBUzS6ausiJKw9IEktnvcnsN9kZazcAW86WDFsXI5oPubmgHhQ/s\n' + 
'm9iIrbMPAkEA4IAUWi5mVuWAyUIc9YbjJdnmvkAykSxr/vp/26RMSDmUAAUlYNNc\n' + 
'HZbM1uVZsFForKza28Px01Ga728ZdhRrzwJBAIrwNlcwu9lCWm95Cp6hGfPKb8ki\n' + 
'uq+nTiKyS8avfLQebtElE1JDamNViEK6AuemBqFZM7upFeefJKFBlO/VNHcCQCXN\n' + 
'CyBALdU14aCBtFSXOMoXzaV9M8aD/084qKy4FmwW3de/BhMuo5UL3kPU7Gwm2QQy\n' + 
'OsvES4S0ee0U/OmH+LsCQAnNdxNPgzJDTx7wOTFhHIBr4mtepLiaRXIdkLEsR9Kb\n' + 
'vcK6BwUfomM29eGOXtUAU7sJ5xnyKkSuNN7fxIWjzPI=\n' + 
'-----END RSA PRIVATE KEY-----',
  cert:
'-----BEGIN CERTIFICATE-----\n' + 
'MIICIzCCAYwCCQCsvG34Az33qTANBgkqhkiG9w0BAQUFADBWMQswCQYDVQQGEwJY\n' + 
'WDEVMBMGA1UEBwwMRGVmYXVsdCBDaXR5MRwwGgYDVQQKDBNEZWZhdWx0IENvbXBh\n' + 
'bnkgTHRkMRIwEAYDVQQDDAlsb2NhbGhvc3QwHhcNMTMwODAyMTMwODQzWhcNMTMw\n' + 
'OTAxMTMwODQzWjBWMQswCQYDVQQGEwJYWDEVMBMGA1UEBwwMRGVmYXVsdCBDaXR5\n' + 
'MRwwGgYDVQQKDBNEZWZhdWx0IENvbXBhbnkgTHRkMRIwEAYDVQQDDAlsb2NhbGhv\n' + 
'c3QwgZ8wDQYJKoZIhvcNAQEBBQADgY0AMIGJAoGBAM8D4tgE1cdI9uLo4N9AL8Ck\n' + 
'ogREH5LSm3SsRGFdUu5b2Nx63K/qwtTUbtUlISZBI+KESkwQXcf1ErwXUDnbTtk/\n' + 
'VpLJ+gfIN18e9LAdiZgAMEWlitiLhR+D17w4NzHYOpWy1YzgOckukPy1ZfTH9e7j\n' + 
'tEH9+7c4mpv7QMkFdw4hAgMBAAEwDQYJKoZIhvcNAQEFBQADgYEAP+ZFskjJtNxY\n' + 
'c+5JfMjEgSHEIy+AJ5/vXIspNYKMb7l0gYDvmFm8QTKChKTYvJmepBrIdL7MjXCX\n' + 
'SWiPz05ch99c84yOx5qVpcPd0y2fjO8xn2NCLfWdP7iSVYmpftwzjqFzPc4EkAny\n' + 
'NOpbnw9iM4JXsZNFtPTvSp+8StPGWzU=\n' + 
'-----END CERTIFICATE-----'
};

console.log('http://0.0.0.0:' + PORT);
http2.createServer(options, function(request, response) {

  if (request.url === '/main.js') {
    // main entrypoint id
    request.url = '/' + sourceEntryId; // TODO: redirect
  }

  if (allDeps[request.url]) {
    // /<id>/<depname> dependency -> lookup id
    request.url = allDeps[request.url];
  }

  if (sources[request.url]) {
    // /<id> bundle part javascript
    response.setHeader('Content-Type', 'text/javascript');
    response.writeHead('200');

    var s = new Readable();
    s.push(sources[request.url]);
    s.push(null);
    s.pipe(response);
    return;
  }

  if (request.url === '/') {
    response.setHeader('Content-Type', 'text/html');
    response.writeHead('200');
    fs.createReadStream(__dirname + '/demo/index.html').pipe(response);
    return;
  }

  var filename = path.join(__dirname, request.url);
  console.log(filename);

  // traceur and es6-module-loader TODO: only allow
  if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
    if (endsWith(filename, '.js'))
      response.setHeader('Content-Type', 'text/javascript');

    response.writeHead('200');
    fs.createReadStream(filename).pipe(response);
  } else {
    response.writeHead('404');
    response.end('Hello world');
  }
}).listen(PORT);
