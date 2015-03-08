var add = require('./add');
var sub = require('./sub');

document.write('calling modules...<br><br>');

document.write('add(1, 2) = ', add(1, 2) + '<br>');
document.write('sub(3, 4) = ', sub(3, 4) + '<br>');
