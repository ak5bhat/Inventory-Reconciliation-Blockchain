'use strict';

const CCD = require('./lib/mychaincode');

module.exports.Mychaincode = CCD;
module.exports.contracts = [CCD];