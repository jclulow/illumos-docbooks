#!/usr/bin/env node

var log = console.log;
var ins = require('util').inspect;

function errx(code, obj) {
  log('error: %s', ins(obj));
  process.exit(code);
}

function rep(chr, len) {
  var str = '';
  while (str.length < len)
    str += chr;
  return (str);
}

function ind(len) {
  return rep(' ', len);
}

exports.errx = errx;
exports.rep = rep;
exports.ind = ind;
