const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('tuan', 10);
console.log(hash); 