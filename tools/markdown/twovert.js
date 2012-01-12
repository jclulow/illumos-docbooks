#!/usr/bin/env node

// hideous array-stack monkey patch is GO!
Array.prototype.peek = function() {
  return this[this.length-1];
};

// global config
var SAX_STRICT = true;
var SAX_OPTIONS = {};

// deps
var fs = require('fs');
var sax = require('sax');
var util = require('util');
var async = require('async');
var tools = require('./tools');

// short function defs
var log = console.log;
var ins = util.inspect;
var errx = tools.errx;
var rep = tools.rep;
var ind = tools.ind;


/*
 * this queue will contain objects that need to be
 *  'filled out' by processing their respective xml files
 */
var workq = async.queue(function(work, callback) {
  if (work.type !== 'include') {
    log('I don\'t know what do do with this work:');
    errx(175, work);
  }
  log('  * * * * PROCESS FILE: ' + work.filename);

  structStack = [work];
  nodeStack = [];

  var stream = makeSaxStream();
  stream.on('end', callback);
  fs.createReadStream(work.filename).pipe(stream);
}, 1);

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

var globalEnts = null;
function makeSaxStream() {
  var ss = sax.createStream(SAX_STRICT, SAX_OPTIONS);
  if (globalEnts === null) {
    // monkey patch in some extra text entities, but
    //   also save this entities hash so we can reuse
    //   it in later parsers.
    globalEnts = ss._parser.ENTITIES;
    globalEnts.nbsp = ' ';
    globalEnts.rsquo = '\'';
    globalEnts.lsquo = '\'';
    globalEnts.ndash = '-';
    globalEnts.ldquo = '"';
    globalEnts.rdquo = '"';
  } else {
    ss._parser.ENTITIES = globalEnts;
  }
  ss.on('error', function(err) { errx(10, err); });
  ss.on('doctype', doctype);
  ss.on('opentag', opentag);
  ss.on('closetag', closetag);
  ss.on('text', handleText);

  // XXX
  text = '';
  pruneCount = 0;
  no_child = false;

  return ss;
}

// error if a tag that should not have children
//   has children
var no_child = false;

var text = '';
var pruneCount = 0;

/*
 * this is the root of a tree of structural frames,
 *  each with an array of children.  when we encounter
 *  a directive to include another XML file, we'll
 *  insert a placeholder object in this tree.  when we
 *  come back later we can replace the placeholder with
 *  a parsed copy of all of the tags in the included file.
 */
var root = {
  type: 'include',
  filename: process.argv[2],
  children: [],
  isRoot: true
};

/*
 * this stack contains a 'frame' for each structural tag
 *  we encounter.  Presently this can be one of:
 *   - chapter
 *   - sect1, sect2, sect3
 *
 * this frame stores various attributes that are collected
 *  as we process a structural element, including:
 *   - id
 *   - title
 *   - children (e.g. other structurals, para, variableList)
 */
var structStack = [];

var nodeStack = [];

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
    globalEnts[k] = '%%%INCLUDE:' + x[k].value + '%%%';
  }
}

var NODE_STACKS = {};
function RECORD_NODE_STACK() {
  var s = nodeStackToString();
  NODE_STACKS[s] = (NODE_STACKS[s] || 0) + 1;
}

function opentag(node) {
  if (no_child)
    errx(35, 'got child of element that should not have child');

  nodeStack.push(node);
  RECORD_NODE_STACK();
  if (pruneCount > 0) {
    pruneCount++;
    return;
  }

  if (root.children.length === 0 && node.name !== 'book') {
    errx(76, '<book> must be top level tag!');
  }

  function makeStruct(node) {
    var o = {
      id: node.attributes.id,
      children: []
    };
    switch (node.name) {
      case 'ulink':
        o.type = 'link';
        switch (node.attributes.type) {
          case 'url':
          case 'text_url':
            o.scope = 'internet';
            o.target = node.attributes.url;
            break;
          default:
            errx(178, node);
        }
        break;
      case 'olink':
        o.type = 'link';
        switch (node.attributes.remap) {
          case 'internal':
            o.scope = 'thisbook';
            o.target = node.attributes.targetptr;
            break;
          case 'external':
            o.scope = 'otherbook';
            o.target = node.attributes.targetdoc;
            break;
          default:
            errx(179, node);
        }
        break;
      case 'manvolnum':
        o.type = 'manvolnum';
        break;
      case 'refentrytitle':
        o.type = 'refentrytitle';
        break;
      case 'citerefentry':
        o.type = 'citerefentry';
        break;
      case 'listentry':
      case 'para':
        o.type = 'paragraph';
        break;
      case 'programlisting':
      case 'screen':
        o.type = 'codeblock';
        break;
      case 'term':
        o.extra = 'term';
      case 'title':
        o.type = 'title';
        break;
      case 'abstract':
        o.type = 'abstract';
        break;
      case 'book':
        o.type = 'book';
        break;
      case 'varlistentry':
      case 'sect1':
      case 'sect2':
      case 'sect3':
        o.type = 'section';
        break;
      case 'chapter':
        o.type = 'chapter';
        break;
      default:
        errx(101, 'unknown node type: ' + node.name);
    }
    return o;
  }

  var n;
  switch (node.name) {
    case 'index':
    case 'bookinfo':
    case 'indexterm':
    case 'table':
      pruneCount++;
      return;
    case 'book':
      if (root.children.length > 0)
        errx(77, '<book> should be top level tag ONLY');
      root.children.push(makeStruct(node));
      structStack.push(root.children.peek());
      break;
    case 'command':
    case 'emphasis':
    case 'literal':
    case 'replaceable':
    case 'variablelist':
      // have no structural element for these
      break;
    case 'varlistentry':
    case 'listentry':
    case 'screen':
    case 'programlisting':
    case 'para':
    case 'sect1':
    case 'sect2':
    case 'sect3':
    case 'chapter':
    case 'abstract':
    case 'olink':
    case 'ulink':
      n = makeStruct(node);
      structStack.peek().children.push(n);
      structStack.push(n);
      break;
    case 'manvolnum':
    case 'refentrytitle':
    case 'citerefentry':
    case 'term':
    case 'title':
      n = makeStruct(node);
      structStack.push(n);
      break;
    default:
      //if (stack.length)
        log('%s%s', ind(nodeStack.length), node.name);
  }
}

function nodeStackToString() {
  var items = [];
  for (var i = 0; i < nodeStack.length; i++) {
    items.push(nodeStack[i].name);
  }
  return items.join(' -> ');
}

function closetag() {
  var outg = nodeStack.pop();

  if (pruneCount > 0)
    pruneCount--;
  if (pruneCount > 0)
    return;

  var t, i, tc, twork;
  switch (outg.name) {
    case 'command':
    case 'emphasis':
    case 'literal':
    case 'replaceable':
    case 'variablelist':
      break;
    case 'para':
      t = structStack.pop();
      twork = t.children;
      t.children = [];
      for (i = 0; i < twork.length; i++) {
        tc = twork[i];
        if (tc.type === 'text') {
          tc.id = tc.id.replace(/[\n\r\t ]+/g,' ').trim();
          if (tc.id)
            t.children.push(tc);
        } else {
          t.children.push(tc);
        }
      }
      break;
    case 'screen':
    case 'programlisting':
      t = structStack.pop();
      t.code = '';
      for (i = 0; i < t.children.length; i++) {
        tc = t.children[i];
        if (tc.type === 'text')
          t.code += tc.id.replace(/\t/g,'  ');
        else if (tc.type !== 'text')
          errx(197, t);
      }
      t.codelines = t.code.split('\n');
      t.children = [];
      console.dir(t);
      break;
    case 'varlistentry':
    case 'listentry':
    case 'sect1':
    case 'sect2':
    case 'sect3':
    case 'chapter':
    case 'abstract':
      t = structStack.pop();
      break;
    case 'olink':
    case 'ulink':
      t = structStack.pop();
      if (!t.title) {
        t.title = '';
        for (i = 0; i < t.children.length; i++) {
          tc = t.children[i];
          if (tc.type === 'text' && tc.id)
            t.title += tc.id + ' ';
          else if (tc.type !== 'text')
            errx(197, t);
        }
        t.title = t.title.replace(/[\r\n \t]+/g,' ').trim();
      }
      if (!t.title) {
        t.title = t.target;
      }
      t.children = [];
      break;
    case 'manvolnum':
    case 'refentrytitle':
      t = structStack.pop();
      if (t.children.length !== 1)
        errx(195, t);
      structStack.peek()[outg.name]= t.children[0].id.replace(/[\n\r\t ]+/g,' ').trim();
      break;
    case 'citerefentry':
      t = structStack.pop();
      if (!t.manvolnum && !t.refentrytitle)
        errx(196, t);
      structStack.peek().scope = 'manpage';
      structStack.peek().title = t.refentrytitle + '(' + t.manvolnum + ')';
      structStack.peek().target = t.refentrytitle + '(' + t.manvolnum + ')';
      break;
    case 'term':
    case 'title':
      t = structStack.pop();
      if (t.children.length !== 1)
        console.dir(t);
      else
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
      var tt = {
        type: 'include',
        id: xx.value,
        filename: xx.value,
        children: []
      };
      structStack.peek().children.push(tt);
      workq.push(tt); // XXX enqueue for processing
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

workq.push(root);

workq.drain = function() {
  log('** queue drained');
/*
  log('==============================');
  log('TEXT OUTPUT:');
  log(text);
  process.exit(0);*/

  /*
  log('==============================');
  log('RECORDED NODE STACKS: ');
  for (var k in NODE_STACKS) {
    var v = NODE_STACKS[k];
    log('%d   %s', v, k);
  }*/

  log('==============================');
  log('NODE TREE:');
  var lvl = 0;
  function printTree(o) {
    switch (o.type) {
      case 'paragraph':
        log(ind(lvl + 1) + o.type);
        break;
      case 'include':
        log(ind(lvl + 1) + o.type + ' <' + o.filename + '>');
        break;
      case 'link':
        log(ind(lvl + 1) + o.type + ' |' + o.title + '| (' + ins(o.target) + ')');
        break;
      case 'chapter':
      case 'section':
      case 'book':
        log(ind(lvl + 1) + o.type + ' |' + o.title + '| (' + ins(o.id) + ')');
        break;
      case 'text':
        log(ind(lvl + 1) + o.type + ' (' + ins(o.id).substr(0,45) + ')');
        break;
      default:
        log(ind(lvl + 1) + o.type + ' (' + ins(o.id) + ')');
        break;
    }
    for (var i = 0; i < o.children.length; i++) {
      lvl++;
      printTree(o.children[i]);
      lvl--;
    }
  }
  printTree(root);
};

//fs.createReadStream(process.argv[2]).pipe(ss);
