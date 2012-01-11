#!/usr/bin/env node

// hideous monkey patch is GO!
Array.prototype.peek = function() {
  return this[this.length-1]
};

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
ss._parser.ENTITIES['rsquo'] = '\'';
ss._parser.ENTITIES['lsquo'] = '\'';
ss._parser.ENTITIES['ndash'] = '-';
ss._parser.ENTITIES['ldquo'] = '"';
ss._parser.ENTITIES['rdquo'] = '"';

// error if a tag that should not have children
//   has children
var no_child = false;

var text = '';
var pruneCount = 0;

var root = null;

/*
 * this stack contains a 'frame' for each structural tag
 *  we encounter.  Presently this can be one of:
 *   - chapter
 *   - sect1, sect2, sect 3
 *
 * this frame stores various attributes that are collected
 *  as we process a structural element, including:
 *   - id
 *   - title
 *   - children (e.g. other structurals, para, variableList)
 */
var structStack = [];

var nodeStack = [];
var parserStack = [];

ss.on('error', function(err) { errx(10, err); });
ss.on('doctype', doctype);
ss.on('opentag', opentag);
ss.on('closetag', closetag);
ss.on('text', handleText);

function includeXMLFile(filename, callback) {
  log('CREATING NEW PARSER FOR ' + filename);

  var newp = sax.createStream(SAX_STRICT, SAX_OPTIONS);
  newp._parser.ENTITIES = ss._parser.ENTITIES;

  newp.on('error', function(err) { errx(10, err); });
  newp.on('doctype', doctype);
  newp.on('opentag', opentag);
  newp.on('closetag', closetag);
  newp.on('text', handleText);
  newp.on('end', function() {
    log('PARSER FINISHED FOR ' + filename);
    ss = parserStack.pop();
    callback();
  });

  parserStack.push(ss);
  ss = newp;

  fs.createReadStream(filename).pipe(ss);
}

function splitText(txt) {
  var out = [];
  for (;;) {
    var m = txt.match(/%%%INCLUDE:([^%]+)%%%/);
    if (!m) {
      if (txt.length > 0)
        out.push({ type: 'text', value: txt });
      return out;
    }
    var pre = txt.substr(0, m.index);
    if (pre.length > 0)
      out.push({ type: 'text', value: pre });
    out.push({ type: 'include', value: m[1] });
    txt = txt.substr(m.index + m[0].length);
  }
}

function doctype(dt) {
  var x = mungeDoctype(dt);
  //log('DOCTYPE: %s', ins(x));
  for (var k in x) {
    // replace entities that we know about with a directive that
    //  we can locate and process in text nodes...
    ss._parser.ENTITIES[k] = '%%%INCLUDE:' + x[k].value + '%%%';
  }
}

function opentag(node) {
  if (no_child)
    errx(35, 'got child of element that should not have child');

  nodeStack.push(node);
  if (pruneCount > 0) {
    pruneCount++;
    return;
  }

  if (root === null && node.name !== 'book') {
    errx(76, '<book> must be top level tag!');
  }

  function makeStruct(node) {
    var o = {
      id: node.attributes.id,
      children: []
    };
    switch (node.name) {
      case 'title':
        o.type = 'title'; break;
      case 'abstract':
        o.type = 'abstract'; break;
      case 'book':
        o.type = 'book'; break;
      case 'sect1':
      case 'sect2':
      case 'sect3':
        o.type = 'section'; break;
      case 'chapter':
        o.type = 'chapter'; break;
      default:
        errx(101, 'unknown node type: ' + node.name);
    }
    return o;
  }

  switch (node.name) {
    case 'index':
    case 'bookinfo':
      pruneCount++;
      return;
    case 'book':
      if (root !== null)
        errx(77, '<book> should be top level tag ONLY');
      root = makeStruct(node);
      structStack.push(root);
      break;
    case 'sect1':
    case 'sect2':
    case 'sect3':
    case 'chapter':
      var n = makeStruct(node);
      structStack.peek().children.push(n);
      structStack.push(n);
      break;
      break;
    case 'title':
    case 'abstract':
      var n = makeStruct(node);
      structStack.push(n);
      break;
    default:
      //if (stack.length)
        log('%s%s', ind(nodeStack.length), node.name);
  }
}

function closetag() {
  var outg = nodeStack.pop();

  if (pruneCount > 0)
    pruneCount--;
  if (pruneCount > 0)
    return;

  switch (outg.name) {
    case 'chapter':
    case 'sect1':
    case 'sect2':
    case 'sect3':
      structStack.pop();
      break;
    case 'title':
      var t = structStack.pop();
      if (t.children.length !== 1)
        errx(107, t);
      // this <title> refers to the containing structural element
      structStack.peek().title = t.children[0].id.replace(/[\n\r\t ]+/g,' ').trim();
      //structStack.peek().title = text.replace(/[\n\r\t ]+/g,' ').trim();
      break;
  }
  no_child = false;
}

function handleText(t) {
  if (pruneCount !== 0)
    return;
  var x = splitText(t);
  // console.log('SPLIT: ' + ins(x));
  for (var i = 0; i < x.length; i++) {
    var xx = x[i];
    if (xx.type === 'include') {
      structStack.peek().children.push({
        type: 'include',
        id: xx.value,
        children: []
      });
    } else if (xx.type === 'text' && xx.value.trim().length > 0) {
      // XXX should we essentially ditch whitespace here?
      if (!structStack.peek()) continue;
      var chch = structStack.peek().children;
      if (chch.length > 0 && chch.peek().type === 'text') {
        chch.peek().id += xx.value;
      } else {
        chch.push({
          type: 'text',
          id: xx.value,
          children: []
        });
      }
    }
  }
}

ss.on('end', function() {
  log('end');
/*
  log('==============================');
  log('TEXT OUTPUT:');
  log(text);
  process.exit(0);*/
  log('==============================');
  log('NODE TREE:');
  var lvl = 0;
  function printTree(o) {
    switch (o.type) {
      case 'book':
        log(ind(lvl + 1) + o.type + ' |' + o.title + '| (' + ins(o.id) + ')'); break;
      default:
        log(ind(lvl + 1) + o.type + ' (' + ins(o.id) + ')'); break;
    }
    for (var i = 0; i < o.children.length; i++) {
      lvl++;
      printTree(o.children[i]);
      lvl--;
    }
  }
  printTree(root);
});

fs.createReadStream(process.argv[2]).pipe(ss);
