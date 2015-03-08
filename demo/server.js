'use strict';

var http2 = require('http2');
var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var browser_unpack = require('browser-unpack');

var gatherDeps = function(rows) {
  var allDeps = {};

  rows.forEach(function(row) {
    var id = row.id;

    Object.keys(row.deps).forEach(function(depName) {
      var depId = row.deps[depName];

      allDeps[id + '/' + depName] = depId;
    });
  });

  return allDeps;
};

var b = browserify({
  entries: [__dirname + '/math.js'],
  debug: true
});

b.bundle(function(err, bundleSource) {
  if (err) throw err;

  var rows = browser_unpack(bundleSource);
  var deps = gatherDeps(rows);

  console.log('browserify:',rows);
  console.log('deps:',deps);
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

http2.createServer(options, function(request, response) {
  var filename = path.join(__dirname, request.url);

  if (fs.existsSync(filename) && fs.statSync(filename).isFile()) {
    response.writeHead('200');
    fs.createReadStream(filename).pipe(response);
  } else {
    response.writeHead('404');
    response.end('Hello world');
  }
}).listen(9977);

/* TODO

var connect = require('connect');
var serveStatic = require('serve-static');

connect().use(serveStatic(__dirname + '/..')).listen(9977);
*/
