#!/usr/bin/env node

var SAX_STRICT = true;
var SAX_OPTIONS = {};

var fs = require('fs');
var sax = require('sax');
var log = console.log;
var util = require('util');
var ins = util.inspect;

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

var lvl = 0;

function mungeDoctype(dt) {
  var ret = {};
  // extract square-bracketed section
  dt = dt.replace(/.*\[|\].*/g,'');
  // split into 'lines'
  var lines = dt.replace(/\r/g,'').split('\n');
  // tokenise the lines somewhat
  for (var i = 0; i < lines.length; i++) {
    var l = lines[i];
    if (!l) continue;
    var m = l.match(/<!ENTITY (\S+) (\S+) "(\S+)" ?(.*)>/);
    if (!m)
      errx(15, 'malformed doctype line: ' + l);
    var obj = {
      entity: m[1],
      type: m[2],
      value: m[3],
      extra: m[4]
    };
    if (obj.type !== 'SYSTEM')
      errx(20, 'unknown ENTITY type: ' + ins(obj));
    ret[obj.entity] = obj;
  }
  return ret;
}

var ss = sax.createStream(SAX_STRICT, SAX_OPTIONS);

// monkey patch in some extra text entities
ss._parser.ENTITIES['nbsp'] = ' ';
ss._parser.ENTITIES['rdquo'] = '"';
ss._parser.ENTITIES['ldquo'] = '"';

// error if a tag that should not have children
//   has children
var no_child = false;

var S = {
  NORMAL: 0,
  LITERAL: 1
};
var state = S.NORMAL;
var text = '';
var title = null;
var stack = [];
var textStack = [];
var section = 0;
var inCiteRefEntry = false;
var pruneCount = 0;

ss.on('error', function(err) {
  errx(10, err);
});
ss.on('doctype', function(dt) {
  var x = mungeDoctype(dt);
  log('DOCTYPE: %s', ins(x));
  for (var k in x) {
    ss._parser.ENTITIES[k] = '%%INCLUDE:' + x[k].value + '%% ';
  }
});
ss.on('opentag', function(node) {
  if (no_child)
    errx(35, 'got child of element that should not have child');

  stack.push(node);
  if (pruneCount > 0) {
    pruneCount++;
    return;
  }

  switch (node.name) {
    case 'listitem':
    case 'term':
      textStack.push(text);
      text = '';
      break;
    case 'para':
      textStack.push(text);
      text = '';
      break;
    case 'variablelist':
      textStack.push(text);
      text = '';
      break;
    case 'citerefentry':
      inCiteRefEntry = true;
      textStack.push(text);
      text = '';
      break;
    case 'manvolnum':
      if (!inCiteRefEntry)
        errx(45, 'should be in <citerefentry> here');
      text += '(';
      break;
    case 'refentrytitle':
      if (!inCiteRefEntry)
        errx(45, 'should be in <citerefentry> here');
      break;
    case 'literal':
      no_child = true;
    case 'title':
    case 'replaceable':
    case 'command':
      textStack.push(text);
      text = '';
      break;
    case 'sect1':
      section++;
      if (section !== 1)
        errx(37, 'unexpected section level 1');
      break;
    case 'sect2':
      section++;
      if (section !== 2)
        errx(37, 'unexpected section level 2');
      break;
    case 'sect3':
      section++;
      if (section !== 3)
        errx(37, 'unexpected section level 3');
      break;
    case 'indexterm':
      pruneCount++;
      break;
    case 'primary':
    case 'secondary':
    case 'tertiary':
    case 'olink':
      textStack.push(text);
      text = '';
      break;
    default:
      //if (stack.length)
        log('%s%s', ind(stack.length), node.name);
  }

});
ss.on('closetag', function() {
  var outg = stack.pop();

  if (pruneCount > 0)
    pruneCount--;
  if (pruneCount > 0)
    return;

  switch (outg.name) {
    case 'variablelist':
      text = textStack.pop() + text + '\n\n';
      break;
    case 'para':
      text = textStack.pop() + text + '\n\n';
      break;
    case 'manvolnum':
      text += ')';
      break;
    case 'refentrytitle':
      break;
    case 'citerefentry':
      log(ind(section + 1) + 'REF: ' + text);
      text = textStack.pop() + text;
      inCiteRefEntry = false;
      break;
    case 'listitem':
      // encase in a blockquote I guess
      text = textStack.pop() + '\n\n> ' + text.replace(/\n/g,' ').replace(/[\t ]+/g,' ') + '\n\n';
      break;
    case 'term':
      text = textStack.pop() + '`' + text + '`';
      break;
    case 'literal':
    case 'replaceable':
    case 'command':
      //log('`' + text + '`');
      text = textStack.pop() + '`' + text + '`';
      break;
    case 'title':
      log(rep('#', section + 1) + ' ' + text);
      text = textStack.pop() + '\n' + rep('#', section + 1) + ' ' + text + '\n\n';
      break;
    case 'olink':
      log(ind(section + 1) + '[[' + text + ']]');
      text = textStack.pop() + '[[' + text + ']]';
      break;
    case 'sect1':
    case 'sect2':
    case 'sect3':
      section--;
      break;
    case 'indexterm':
    case 'primary':
    case 'secondary':
    case 'tertiary':
      break;
  }
  no_child = false;
});
ss.on('text', function(t) {
  if (pruneCount === 0)
    text += t;
  //log(ind(stack.length) + 'TEXT: ' + t.trim().substr(0, 10) + '...');
});
ss.on('end', function() {
  log('end');
  log('==============================');
  log('TEXT OUTPUT:');
  log(text);
  process.exit(0);
});

fs.createReadStream(process.argv[2]).pipe(ss);
