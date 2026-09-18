#!/usr/bin/env node
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS({
  "node_modules/yaml/dist/nodes/identity.js"(exports) {
    "use strict";
    var ALIAS = /* @__PURE__ */ Symbol.for("yaml.alias");
    var DOC = /* @__PURE__ */ Symbol.for("yaml.document");
    var MAP = /* @__PURE__ */ Symbol.for("yaml.map");
    var PAIR = /* @__PURE__ */ Symbol.for("yaml.pair");
    var SCALAR2 = /* @__PURE__ */ Symbol.for("yaml.scalar");
    var SEQ = /* @__PURE__ */ Symbol.for("yaml.seq");
    var NODE_TYPE = /* @__PURE__ */ Symbol.for("yaml.node.type");
    var isAlias2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
    var isDocument2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
    var isMap2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
    var isPair2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
    var isScalar3 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR2;
    var isSeq2 = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
    function isCollection2(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case MAP:
          case SEQ:
            return true;
        }
      return false;
    }
    function isNode(node) {
      if (node && typeof node === "object")
        switch (node[NODE_TYPE]) {
          case ALIAS:
          case MAP:
          case SCALAR2:
          case SEQ:
            return true;
        }
      return false;
    }
    var hasAnchor = (node) => (isScalar3(node) || isCollection2(node)) && !!node.anchor;
    exports.ALIAS = ALIAS;
    exports.DOC = DOC;
    exports.MAP = MAP;
    exports.NODE_TYPE = NODE_TYPE;
    exports.PAIR = PAIR;
    exports.SCALAR = SCALAR2;
    exports.SEQ = SEQ;
    exports.hasAnchor = hasAnchor;
    exports.isAlias = isAlias2;
    exports.isCollection = isCollection2;
    exports.isDocument = isDocument2;
    exports.isMap = isMap2;
    exports.isNode = isNode;
    exports.isPair = isPair2;
    exports.isScalar = isScalar3;
    exports.isSeq = isSeq2;
  }
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS({
  "node_modules/yaml/dist/visit.js"(exports) {
    "use strict";
    var identity = require_identity();
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove node");
    function visit(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        visit_(null, node, visitor_, Object.freeze([]));
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    function visit_(key, node, visitor, path2) {
      const ctrl = callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visit_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = visit_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = visit_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = visit_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    async function visitAsync(node, visitor) {
      const visitor_ = initVisitor(visitor);
      if (identity.isDocument(node)) {
        const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
        if (cd === REMOVE)
          node.contents = null;
      } else
        await visitAsync_(null, node, visitor_, Object.freeze([]));
    }
    visitAsync.BREAK = BREAK;
    visitAsync.SKIP = SKIP;
    visitAsync.REMOVE = REMOVE;
    async function visitAsync_(key, node, visitor, path2) {
      const ctrl = await callVisitor(key, node, visitor, path2);
      if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
        replaceNode(key, path2, ctrl);
        return visitAsync_(key, ctrl, visitor, path2);
      }
      if (typeof ctrl !== "symbol") {
        if (identity.isCollection(node)) {
          path2 = Object.freeze(path2.concat(node));
          for (let i = 0; i < node.items.length; ++i) {
            const ci = await visitAsync_(i, node.items[i], visitor, path2);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              node.items.splice(i, 1);
              i -= 1;
            }
          }
        } else if (identity.isPair(node)) {
          path2 = Object.freeze(path2.concat(node));
          const ck = await visitAsync_("key", node.key, visitor, path2);
          if (ck === BREAK)
            return BREAK;
          else if (ck === REMOVE)
            node.key = null;
          const cv = await visitAsync_("value", node.value, visitor, path2);
          if (cv === BREAK)
            return BREAK;
          else if (cv === REMOVE)
            node.value = null;
        }
      }
      return ctrl;
    }
    function initVisitor(visitor) {
      if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
        return Object.assign({
          Alias: visitor.Node,
          Map: visitor.Node,
          Scalar: visitor.Node,
          Seq: visitor.Node
        }, visitor.Value && {
          Map: visitor.Value,
          Scalar: visitor.Value,
          Seq: visitor.Value
        }, visitor.Collection && {
          Map: visitor.Collection,
          Seq: visitor.Collection
        }, visitor);
      }
      return visitor;
    }
    function callVisitor(key, node, visitor, path2) {
      if (typeof visitor === "function")
        return visitor(key, node, path2);
      if (identity.isMap(node))
        return visitor.Map?.(key, node, path2);
      if (identity.isSeq(node))
        return visitor.Seq?.(key, node, path2);
      if (identity.isPair(node))
        return visitor.Pair?.(key, node, path2);
      if (identity.isScalar(node))
        return visitor.Scalar?.(key, node, path2);
      if (identity.isAlias(node))
        return visitor.Alias?.(key, node, path2);
      return void 0;
    }
    function replaceNode(key, path2, node) {
      const parent = path2[path2.length - 1];
      if (identity.isCollection(parent)) {
        parent.items[key] = node;
      } else if (identity.isPair(parent)) {
        if (key === "key")
          parent.key = node;
        else
          parent.value = node;
      } else if (identity.isDocument(parent)) {
        parent.contents = node;
      } else {
        const pt = identity.isAlias(parent) ? "alias" : "scalar";
        throw new Error(`Cannot replace node with ${pt} parent`);
      }
    }
    exports.visit = visit;
    exports.visitAsync = visitAsync;
  }
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS({
  "node_modules/yaml/dist/doc/directives.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    var escapeChars = {
      "!": "%21",
      ",": "%2C",
      "[": "%5B",
      "]": "%5D",
      "{": "%7B",
      "}": "%7D"
    };
    var escapeTagName = (tn) => tn.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);
    var Directives = class _Directives {
      constructor(yaml, tags) {
        this.docStart = null;
        this.docEnd = false;
        this.yaml = Object.assign({}, _Directives.defaultYaml, yaml);
        this.tags = Object.assign({}, _Directives.defaultTags, tags);
      }
      clone() {
        const copy = new _Directives(this.yaml, this.tags);
        copy.docStart = this.docStart;
        return copy;
      }
      /**
       * During parsing, get a Directives instance for the current document and
       * update the stream state according to the current version's spec.
       */
      atDocument() {
        const res = new _Directives(this.yaml, this.tags);
        switch (this.yaml.version) {
          case "1.1":
            this.atNextDocument = true;
            break;
          case "1.2":
            this.atNextDocument = false;
            this.yaml = {
              explicit: _Directives.defaultYaml.explicit,
              version: "1.2"
            };
            this.tags = Object.assign({}, _Directives.defaultTags);
            break;
        }
        return res;
      }
      /**
       * @param onError - May be called even if the action was successful
       * @returns `true` on success
       */
      add(line, onError) {
        if (this.atNextDocument) {
          this.yaml = { explicit: _Directives.defaultYaml.explicit, version: "1.1" };
          this.tags = Object.assign({}, _Directives.defaultTags);
          this.atNextDocument = false;
        }
        const parts = line.trim().split(/[ \t]+/);
        const name = parts.shift();
        switch (name) {
          case "%TAG": {
            if (parts.length !== 2) {
              onError(0, "%TAG directive should contain exactly two parts");
              if (parts.length < 2)
                return false;
            }
            const [handle, prefix] = parts;
            this.tags[handle] = prefix;
            return true;
          }
          case "%YAML": {
            this.yaml.explicit = true;
            if (parts.length !== 1) {
              onError(0, "%YAML directive should contain exactly one part");
              return false;
            }
            const [version] = parts;
            if (version === "1.1" || version === "1.2") {
              this.yaml.version = version;
              return true;
            } else {
              const isValid = /^\d+\.\d+$/.test(version);
              onError(6, `Unsupported YAML version ${version}`, isValid);
              return false;
            }
          }
          default:
            onError(0, `Unknown directive ${name}`, true);
            return false;
        }
      }
      /**
       * Resolves a tag, matching handles to those defined in %TAG directives.
       *
       * @returns Resolved tag, which may also be the non-specific tag `'!'` or a
       *   `'!local'` tag, or `null` if unresolvable.
       */
      tagName(source, onError) {
        if (source === "!")
          return "!";
        if (source[0] !== "!") {
          onError(`Not a valid tag: ${source}`);
          return null;
        }
        if (source[1] === "<") {
          const verbatim = source.slice(2, -1);
          if (verbatim === "!" || verbatim === "!!") {
            onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
            return null;
          }
          if (source[source.length - 1] !== ">")
            onError("Verbatim tags must end with a >");
          return verbatim;
        }
        const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
        if (!suffix)
          onError(`The ${source} tag has no suffix`);
        const prefix = this.tags[handle];
        if (prefix) {
          try {
            return prefix + decodeURIComponent(suffix);
          } catch (error) {
            onError(String(error));
            return null;
          }
        }
        if (handle === "!")
          return source;
        onError(`Could not resolve tag: ${source}`);
        return null;
      }
      /**
       * Given a fully resolved tag, returns its printable string form,
       * taking into account current tag prefixes and defaults.
       */
      tagString(tag) {
        for (const [handle, prefix] of Object.entries(this.tags)) {
          if (tag.startsWith(prefix))
            return handle + escapeTagName(tag.substring(prefix.length));
        }
        return tag[0] === "!" ? tag : `!<${tag}>`;
      }
      toString(doc) {
        const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
        const tagEntries = Object.entries(this.tags);
        let tagNames;
        if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
          const tags = {};
          visit.visit(doc.contents, (_key, node) => {
            if (identity.isNode(node) && node.tag)
              tags[node.tag] = true;
          });
          tagNames = Object.keys(tags);
        } else
          tagNames = [];
        for (const [handle, prefix] of tagEntries) {
          if (handle === "!!" && prefix === "tag:yaml.org,2002:")
            continue;
          if (!doc || tagNames.some((tn) => tn.startsWith(prefix)))
            lines.push(`%TAG ${handle} ${prefix}`);
        }
        return lines.join("\n");
      }
    };
    Directives.defaultYaml = { explicit: false, version: "1.2" };
    Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
    exports.Directives = Directives;
  }
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS({
  "node_modules/yaml/dist/doc/anchors.js"(exports) {
    "use strict";
    var identity = require_identity();
    var visit = require_visit();
    function anchorIsValid(anchor) {
      if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
        const sa = JSON.stringify(anchor);
        const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
        throw new Error(msg);
      }
      return true;
    }
    function anchorNames(root) {
      const anchors = /* @__PURE__ */ new Set();
      visit.visit(root, {
        Value(_key, node) {
          if (node.anchor)
            anchors.add(node.anchor);
        }
      });
      return anchors;
    }
    function findNewAnchor(prefix, exclude) {
      for (let i = 1; true; ++i) {
        const name = `${prefix}${i}`;
        if (!exclude.has(name))
          return name;
      }
    }
    function createNodeAnchors(doc, prefix) {
      const aliasObjects = [];
      const sourceObjects = /* @__PURE__ */ new Map();
      let prevAnchors = null;
      return {
        onAnchor: (source) => {
          aliasObjects.push(source);
          prevAnchors ?? (prevAnchors = anchorNames(doc));
          const anchor = findNewAnchor(prefix, prevAnchors);
          prevAnchors.add(anchor);
          return anchor;
        },
        /**
         * With circular references, the source node is only resolved after all
         * of its child nodes are. This is why anchors are set only after all of
         * the nodes have been created.
         */
        setAnchors: () => {
          for (const source of aliasObjects) {
            const ref = sourceObjects.get(source);
            if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
              ref.node.anchor = ref.anchor;
            } else {
              const error = new Error("Failed to resolve repeated object (this should not happen)");
              error.source = source;
              throw error;
            }
          }
        },
        sourceObjects
      };
    }
    exports.anchorIsValid = anchorIsValid;
    exports.anchorNames = anchorNames;
    exports.createNodeAnchors = createNodeAnchors;
    exports.findNewAnchor = findNewAnchor;
  }
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS({
  "node_modules/yaml/dist/doc/applyReviver.js"(exports) {
    "use strict";
    function applyReviver(reviver2, obj, key, val) {
      if (val && typeof val === "object") {
        if (Array.isArray(val)) {
          for (let i = 0, len = val.length; i < len; ++i) {
            const v0 = val[i];
            const v1 = applyReviver(reviver2, val, String(i), v0);
            if (v1 === void 0)
              delete val[i];
            else if (v1 !== v0)
              val[i] = v1;
          }
        } else if (val instanceof Map) {
          for (const k of Array.from(val.keys())) {
            const v0 = val.get(k);
            const v1 = applyReviver(reviver2, val, k, v0);
            if (v1 === void 0)
              val.delete(k);
            else if (v1 !== v0)
              val.set(k, v1);
          }
        } else if (val instanceof Set) {
          for (const v0 of Array.from(val)) {
            const v1 = applyReviver(reviver2, val, v0, v0);
            if (v1 === void 0)
              val.delete(v0);
            else if (v1 !== v0) {
              val.delete(v0);
              val.add(v1);
            }
          }
        } else {
          for (const [k, v0] of Object.entries(val)) {
            const v1 = applyReviver(reviver2, val, k, v0);
            if (v1 === void 0)
              delete val[k];
            else if (v1 !== v0)
              val[k] = v1;
          }
        }
      }
      return reviver2.call(obj, key, val);
    }
    exports.applyReviver = applyReviver;
  }
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS({
  "node_modules/yaml/dist/nodes/toJS.js"(exports) {
    "use strict";
    var identity = require_identity();
    function toJS(value, arg, ctx) {
      if (Array.isArray(value))
        return value.map((v, i) => toJS(v, String(i), ctx));
      if (value && typeof value.toJSON === "function") {
        if (!ctx || !identity.hasAnchor(value))
          return value.toJSON(arg, ctx);
        const data = { aliasCount: 0, count: 1, res: void 0 };
        ctx.anchors.set(value, data);
        ctx.onCreate = (res2) => {
          data.res = res2;
          delete ctx.onCreate;
        };
        const res = value.toJSON(arg, ctx);
        if (ctx.onCreate)
          ctx.onCreate(res);
        return res;
      }
      if (typeof value === "bigint" && !ctx?.keep)
        return Number(value);
      return value;
    }
    exports.toJS = toJS;
  }
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS({
  "node_modules/yaml/dist/nodes/Node.js"(exports) {
    "use strict";
    var applyReviver = require_applyReviver();
    var identity = require_identity();
    var toJS = require_toJS();
    var NodeBase = class {
      constructor(type) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: type });
      }
      /** Create a copy of this node.  */
      clone() {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** A plain JavaScript representation of this node. */
      toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver: reviver2 } = {}) {
        if (!identity.isDocument(doc))
          throw new TypeError("A document argument is required");
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc,
          keep: true,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this, "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver2 === "function" ? applyReviver.applyReviver(reviver2, { "": res }, "", res) : res;
      }
    };
    exports.NodeBase = NodeBase;
  }
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS({
  "node_modules/yaml/dist/nodes/Alias.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var visit = require_visit();
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var Alias = class extends Node.NodeBase {
      constructor(source) {
        super(identity.ALIAS);
        this.source = source;
        Object.defineProperty(this, "tag", {
          set() {
            throw new Error("Alias nodes cannot have tags");
          }
        });
      }
      /**
       * Resolve the value of this alias within `doc`, finding the last
       * instance of the `source` anchor before this node.
       */
      resolve(doc, ctx) {
        if (ctx?.maxAliasCount === 0)
          throw new ReferenceError("Alias resolution is disabled");
        let nodes;
        if (ctx?.aliasResolveCache) {
          nodes = ctx.aliasResolveCache;
        } else {
          nodes = [];
          visit.visit(doc, {
            Node: (_key, node) => {
              if (identity.isAlias(node) || identity.hasAnchor(node))
                nodes.push(node);
            }
          });
          if (ctx)
            ctx.aliasResolveCache = nodes;
        }
        let found = void 0;
        for (const node of nodes) {
          if (node === this)
            break;
          if (node.anchor === this.source)
            found = node;
        }
        if (found && ctx) {
          const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
          let data = anchors2.get(found);
          if (!data) {
            toJS.toJS(found, null, ctx);
            data = anchors2.get(found);
          }
          if (data?.res === void 0) {
            const msg = "This should not happen: Alias anchor was not resolved?";
            throw new ReferenceError(msg);
          }
          if (maxAliasCount >= 0) {
            data.count += 1;
            if (data.aliasCount === 0)
              data.aliasCount = getAliasCount(doc2, found, anchors2);
            if (data.count * data.aliasCount > maxAliasCount) {
              const msg = "Excessive alias count indicates a resource exhaustion attack";
              throw new ReferenceError(msg);
            }
          }
        }
        return found;
      }
      toJSON(_arg, ctx) {
        if (!ctx)
          return { source: this.source };
        const source = this.resolve(ctx.doc, ctx);
        if (!source) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new ReferenceError(msg);
        }
        return ctx.anchors.get(source).res;
      }
      toString(ctx, _onComment, _onChompKeep) {
        const src = `*${this.source}`;
        if (ctx) {
          anchors.anchorIsValid(this.source);
          if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
            const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
            throw new Error(msg);
          }
          if (ctx.implicitKey)
            return `${src} `;
        }
        return src;
      }
    };
    function getAliasCount(doc, node, anchors2) {
      if (identity.isAlias(node)) {
        const source = node.resolve(doc);
        const anchor = anchors2 && source && anchors2.get(source);
        return anchor ? anchor.count * anchor.aliasCount : 0;
      } else if (identity.isCollection(node)) {
        let count = 0;
        for (const item of node.items) {
          const c = getAliasCount(doc, item, anchors2);
          if (c > count)
            count = c;
        }
        return count;
      } else if (identity.isPair(node)) {
        const kc = getAliasCount(doc, node.key, anchors2);
        const vc = getAliasCount(doc, node.value, anchors2);
        return Math.max(kc, vc);
      }
      return 1;
    }
    exports.Alias = Alias;
  }
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS({
  "node_modules/yaml/dist/nodes/Scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Node = require_Node();
    var toJS = require_toJS();
    var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";
    var Scalar = class extends Node.NodeBase {
      constructor(value) {
        super(identity.SCALAR);
        this.value = value;
      }
      toJSON(arg, ctx) {
        return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
      }
      toString() {
        return String(this.value);
      }
    };
    Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
    Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
    Scalar.PLAIN = "PLAIN";
    Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
    Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
    exports.Scalar = Scalar;
    exports.isScalarValue = isScalarValue;
  }
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS({
  "node_modules/yaml/dist/doc/createNode.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var defaultTagPrefix = "tag:yaml.org,2002:";
    function findTagObject(value, tagName, tags) {
      if (tagName) {
        const match = tags.filter((t) => t.tag === tagName);
        const tagObj = match.find((t) => !t.format) ?? match[0];
        if (!tagObj)
          throw new Error(`Tag ${tagName} not found`);
        return tagObj;
      }
      return tags.find((t) => t.identify?.(value) && !t.format);
    }
    function createNode(value, tagName, ctx) {
      if (identity.isDocument(value))
        value = value.contents;
      if (identity.isNode(value))
        return value;
      if (identity.isPair(value)) {
        const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
        map.items.push(value);
        return map;
      }
      if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
        value = value.valueOf();
      }
      const { aliasDuplicateObjects, onAnchor, onTagObj, schema: schema2, sourceObjects } = ctx;
      let ref = void 0;
      if (aliasDuplicateObjects && value && typeof value === "object") {
        ref = sourceObjects.get(value);
        if (ref) {
          ref.anchor ?? (ref.anchor = onAnchor(value));
          return new Alias.Alias(ref.anchor);
        } else {
          ref = { anchor: null, node: null };
          sourceObjects.set(value, ref);
        }
      }
      if (tagName?.startsWith("!!"))
        tagName = defaultTagPrefix + tagName.slice(2);
      let tagObj = findTagObject(value, tagName, schema2.tags);
      if (!tagObj) {
        if (value && typeof value.toJSON === "function") {
          value = value.toJSON();
        }
        if (!value || typeof value !== "object") {
          const node2 = new Scalar.Scalar(value);
          if (ref)
            ref.node = node2;
          return node2;
        }
        tagObj = value instanceof Map ? schema2[identity.MAP] : Symbol.iterator in Object(value) ? schema2[identity.SEQ] : schema2[identity.MAP];
      }
      if (onTagObj) {
        onTagObj(tagObj);
        delete ctx.onTagObj;
      }
      const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
      if (tagName)
        node.tag = tagName;
      else if (!tagObj.default)
        node.tag = tagObj.tag;
      if (ref)
        ref.node = node;
      return node;
    }
    exports.createNode = createNode;
  }
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS({
  "node_modules/yaml/dist/nodes/Collection.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var identity = require_identity();
    var Node = require_Node();
    function collectionFromPath(schema2, path2, value) {
      let v = value;
      for (let i = path2.length - 1; i >= 0; --i) {
        const k = path2[i];
        if (typeof k === "number" && Number.isInteger(k) && k >= 0) {
          const a = [];
          a[k] = v;
          v = a;
        } else {
          v = /* @__PURE__ */ new Map([[k, v]]);
        }
      }
      return createNode.createNode(v, void 0, {
        aliasDuplicateObjects: false,
        keepUndefined: false,
        onAnchor: () => {
          throw new Error("This should not happen, please report a bug.");
        },
        schema: schema2,
        sourceObjects: /* @__PURE__ */ new Map()
      });
    }
    var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;
    var Collection = class extends Node.NodeBase {
      constructor(type, schema2) {
        super(type);
        Object.defineProperty(this, "schema", {
          value: schema2,
          configurable: true,
          enumerable: false,
          writable: true
        });
      }
      /**
       * Create a copy of this collection.
       *
       * @param schema - If defined, overwrites the original's schema
       */
      clone(schema2) {
        const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
        if (schema2)
          copy.schema = schema2;
        copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema2) : it);
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /**
       * Adds a value to the collection. For `!!map` and `!!omap` the value must
       * be a Pair instance or a `{ key, value }` object, which may not have a key
       * that already exists in the map.
       */
      addIn(path2, value) {
        if (isEmptyPath(path2))
          this.add(value);
        else {
          const [key, ...rest] = path2;
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.addIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
      /**
       * Removes a value from the collection.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.delete(key);
        const node = this.get(key, true);
        if (identity.isCollection(node))
          return node.deleteIn(rest);
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (rest.length === 0)
          return !keepScalar && identity.isScalar(node) ? node.value : node;
        else
          return identity.isCollection(node) ? node.getIn(rest, keepScalar) : void 0;
      }
      hasAllNullValues(allowScalar) {
        return this.items.every((node) => {
          if (!identity.isPair(node))
            return false;
          const n = node.value;
          return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
        });
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       */
      hasIn(path2) {
        const [key, ...rest] = path2;
        if (rest.length === 0)
          return this.has(key);
        const node = this.get(key, true);
        return identity.isCollection(node) ? node.hasIn(rest) : false;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        const [key, ...rest] = path2;
        if (rest.length === 0) {
          this.set(key, value);
        } else {
          const node = this.get(key, true);
          if (identity.isCollection(node))
            node.setIn(rest, value);
          else if (node === void 0 && this.schema)
            this.set(key, collectionFromPath(this.schema, rest, value));
          else
            throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
        }
      }
    };
    exports.Collection = Collection;
    exports.collectionFromPath = collectionFromPath;
    exports.isEmptyPath = isEmptyPath;
  }
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyComment.js"(exports) {
    "use strict";
    var stringifyComment = (str2) => str2.replace(/^(?!$)(?: $)?/gm, "#");
    function indentComment(comment, indent) {
      if (/^\n+$/.test(comment))
        return comment.substring(1);
      return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
    }
    var lineComment = (str2, indent, comment) => str2.endsWith("\n") ? indentComment(comment, indent) : comment.includes("\n") ? "\n" + indentComment(comment, indent) : (str2.endsWith(" ") ? "" : " ") + comment;
    exports.indentComment = indentComment;
    exports.lineComment = lineComment;
    exports.stringifyComment = stringifyComment;
  }
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS({
  "node_modules/yaml/dist/stringify/foldFlowLines.js"(exports) {
    "use strict";
    var FOLD_FLOW = "flow";
    var FOLD_BLOCK = "block";
    var FOLD_QUOTED = "quoted";
    function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
      if (!lineWidth || lineWidth < 0)
        return text;
      if (lineWidth < minContentWidth)
        minContentWidth = 0;
      const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
      if (text.length <= endStep)
        return text;
      const folds = [];
      const escapedFolds = {};
      let end = lineWidth - indent.length;
      if (typeof indentAtStart === "number") {
        if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
          folds.push(0);
        else
          end = lineWidth - indentAtStart;
      }
      let split = void 0;
      let prev = void 0;
      let overflow = false;
      let i = -1;
      let escStart = -1;
      let escEnd = -1;
      if (mode === FOLD_BLOCK) {
        i = consumeMoreIndentedLines(text, i, indent.length);
        if (i !== -1)
          end = i + endStep;
      }
      for (let ch; ch = text[i += 1]; ) {
        if (mode === FOLD_QUOTED && ch === "\\") {
          escStart = i;
          switch (text[i + 1]) {
            case "x":
              i += 3;
              break;
            case "u":
              i += 5;
              break;
            case "U":
              i += 9;
              break;
            default:
              i += 1;
          }
          escEnd = i;
        }
        if (ch === "\n") {
          if (mode === FOLD_BLOCK)
            i = consumeMoreIndentedLines(text, i, indent.length);
          end = i + indent.length + endStep;
          split = void 0;
        } else {
          if (ch === " " && prev && prev !== " " && prev !== "\n" && prev !== "	") {
            const next = text[i + 1];
            if (next && next !== " " && next !== "\n" && next !== "	")
              split = i;
          }
          if (i >= end) {
            if (split) {
              folds.push(split);
              end = split + endStep;
              split = void 0;
            } else if (mode === FOLD_QUOTED) {
              while (prev === " " || prev === "	") {
                prev = ch;
                ch = text[i += 1];
                overflow = true;
              }
              const j = i > escEnd + 1 ? i - 2 : escStart - 1;
              if (escapedFolds[j])
                return text;
              folds.push(j);
              escapedFolds[j] = true;
              end = j + endStep;
              split = void 0;
            } else {
              overflow = true;
            }
          }
        }
        prev = ch;
      }
      if (overflow && onOverflow)
        onOverflow();
      if (folds.length === 0)
        return text;
      if (onFold)
        onFold();
      let res = text.slice(0, folds[0]);
      for (let i2 = 0; i2 < folds.length; ++i2) {
        const fold = folds[i2];
        const end2 = folds[i2 + 1] || text.length;
        if (fold === 0)
          res = `
${indent}${text.slice(0, end2)}`;
        else {
          if (mode === FOLD_QUOTED && escapedFolds[fold])
            res += `${text[fold]}\\`;
          res += `
${indent}${text.slice(fold + 1, end2)}`;
        }
      }
      return res;
    }
    function consumeMoreIndentedLines(text, i, indent) {
      let end = i;
      let start = i + 1;
      let ch = text[start];
      while (ch === " " || ch === "	") {
        if (i < start + indent) {
          ch = text[++i];
        } else {
          do {
            ch = text[++i];
          } while (ch && ch !== "\n");
          end = i;
          start = i + 1;
          ch = text[start];
        }
      }
      return end;
    }
    exports.FOLD_BLOCK = FOLD_BLOCK;
    exports.FOLD_FLOW = FOLD_FLOW;
    exports.FOLD_QUOTED = FOLD_QUOTED;
    exports.foldFlowLines = foldFlowLines;
  }
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyString.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var foldFlowLines = require_foldFlowLines();
    var getFoldOptions = (ctx, isBlock) => ({
      indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
      lineWidth: ctx.options.lineWidth,
      minContentWidth: ctx.options.minContentWidth
    });
    var containsDocumentMarker = (str2) => /^(%|---|\.\.\.)/m.test(str2);
    function lineLengthOverLimit(str2, lineWidth, indentLength) {
      if (!lineWidth || lineWidth < 0)
        return false;
      const limit = lineWidth - indentLength;
      const strLen = str2.length;
      if (strLen <= limit)
        return false;
      for (let i = 0, start = 0; i < strLen; ++i) {
        if (str2[i] === "\n") {
          if (i - start > limit)
            return true;
          start = i + 1;
          if (strLen - start <= limit)
            return false;
        }
      }
      return true;
    }
    function doubleQuotedString(value, ctx) {
      const json = JSON.stringify(value);
      if (ctx.options.doubleQuotedAsJSON)
        return json;
      const { implicitKey } = ctx;
      const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      let str2 = "";
      let start = 0;
      for (let i = 0, ch = json[i]; ch; ch = json[++i]) {
        if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
          str2 += json.slice(start, i) + "\\ ";
          i += 1;
          start = i;
          ch = "\\";
        }
        if (ch === "\\")
          switch (json[i + 1]) {
            case "u":
              {
                str2 += json.slice(start, i);
                const code = json.substr(i + 2, 4);
                switch (code) {
                  case "0000":
                    str2 += "\\0";
                    break;
                  case "0007":
                    str2 += "\\a";
                    break;
                  case "000b":
                    str2 += "\\v";
                    break;
                  case "001b":
                    str2 += "\\e";
                    break;
                  case "0085":
                    str2 += "\\N";
                    break;
                  case "00a0":
                    str2 += "\\_";
                    break;
                  case "2028":
                    str2 += "\\L";
                    break;
                  case "2029":
                    str2 += "\\P";
                    break;
                  default:
                    if (code.substr(0, 2) === "00")
                      str2 += "\\x" + code.substr(2);
                    else
                      str2 += json.substr(i, 6);
                }
                i += 5;
                start = i + 1;
              }
              break;
            case "n":
              if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
                i += 1;
              } else {
                str2 += json.slice(start, i) + "\n\n";
                while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                  str2 += "\n";
                  i += 2;
                }
                str2 += indent;
                if (json[i + 2] === " ")
                  str2 += "\\";
                i += 1;
                start = i + 1;
              }
              break;
            default:
              i += 1;
          }
      }
      str2 = start ? str2 + json.slice(start) : json;
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
    }
    function singleQuotedString(value, ctx) {
      if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes("\n") || /[ \t]\n|\n[ \t]/.test(value))
        return doubleQuotedString(value, ctx);
      const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
      const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
      return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function quotedString(value, ctx) {
      const { singleQuote } = ctx.options;
      let qs;
      if (singleQuote === false)
        qs = doubleQuotedString;
      else {
        const hasDouble = value.includes('"');
        const hasSingle = value.includes("'");
        if (hasDouble && !hasSingle)
          qs = singleQuotedString;
        else if (hasSingle && !hasDouble)
          qs = doubleQuotedString;
        else
          qs = singleQuote ? singleQuotedString : doubleQuotedString;
      }
      return qs(value, ctx);
    }
    var blockEndNewlines;
    try {
      blockEndNewlines = new RegExp("(^|(?<!\n))\n+(?!\n|$)", "g");
    } catch {
      blockEndNewlines = /\n+(?!\n|$)/g;
    }
    function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
      const { blockQuote, commentString, lineWidth } = ctx.options;
      if (!blockQuote || /\n[\t ]+$/.test(value)) {
        return quotedString(value, ctx);
      }
      const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
      const literal2 = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
      if (!value)
        return literal2 ? "|\n" : ">\n";
      let chomp;
      let endStart;
      for (endStart = value.length; endStart > 0; --endStart) {
        const ch = value[endStart - 1];
        if (ch !== "\n" && ch !== "	" && ch !== " ")
          break;
      }
      let end = value.substring(endStart);
      const endNlPos = end.indexOf("\n");
      if (endNlPos === -1) {
        chomp = "-";
      } else if (value === end || endNlPos !== end.length - 1) {
        chomp = "+";
        if (onChompKeep)
          onChompKeep();
      } else {
        chomp = "";
      }
      if (end) {
        value = value.slice(0, -end.length);
        if (end[end.length - 1] === "\n")
          end = end.slice(0, -1);
        end = end.replace(blockEndNewlines, `$&${indent}`);
      }
      let startWithSpace = false;
      let startEnd;
      let startNlPos = -1;
      for (startEnd = 0; startEnd < value.length; ++startEnd) {
        const ch = value[startEnd];
        if (ch === " ")
          startWithSpace = true;
        else if (ch === "\n")
          startNlPos = startEnd;
        else
          break;
      }
      let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
      if (start) {
        value = value.substring(start.length);
        start = start.replace(/\n+/g, `$&${indent}`);
      }
      const indentSize = indent ? "2" : "1";
      let header = (startWithSpace ? indentSize : "") + chomp;
      if (comment) {
        header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
        if (onComment)
          onComment();
      }
      if (!literal2) {
        const foldedValue = value.replace(/\n+/g, "\n$&").replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
        let literalFallback = false;
        const foldOptions = getFoldOptions(ctx, true);
        if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
          foldOptions.onOverflow = () => {
            literalFallback = true;
          };
        }
        const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
        if (!literalFallback)
          return `>${header}
${indent}${body}`;
      }
      value = value.replace(/\n+/g, `$&${indent}`);
      return `|${header}
${indent}${start}${value}${end}`;
    }
    function plainString(item, ctx, onComment, onChompKeep) {
      const { type, value } = item;
      const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
      if (implicitKey && value.includes("\n") || inFlow && /[[\]{},]/.test(value)) {
        return quotedString(value, ctx);
      }
      if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
        return implicitKey || inFlow || !value.includes("\n") ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
      }
      if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes("\n")) {
        return blockString(item, ctx, onComment, onChompKeep);
      }
      if (containsDocumentMarker(value)) {
        if (indent === "") {
          ctx.forceBlockIndent = true;
          return blockString(item, ctx, onComment, onChompKeep);
        } else if (implicitKey && indent === indentStep) {
          return quotedString(value, ctx);
        }
      }
      const str2 = value.replace(/\n+/g, `$&
${indent}`);
      if (actualString) {
        const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str2);
        const { compat, tags } = ctx.doc.schema;
        if (tags.some(test) || compat?.some(test))
          return quotedString(value, ctx);
      }
      return implicitKey ? str2 : foldFlowLines.foldFlowLines(str2, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
    }
    function stringifyString(item, ctx, onComment, onChompKeep) {
      const { implicitKey, inFlow } = ctx;
      const ss = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
      let { type } = item;
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss.value))
          type = Scalar.Scalar.QUOTE_DOUBLE;
      }
      const _stringify = (_type) => {
        switch (_type) {
          case Scalar.Scalar.BLOCK_FOLDED:
          case Scalar.Scalar.BLOCK_LITERAL:
            return implicitKey || inFlow ? quotedString(ss.value, ctx) : blockString(ss, ctx, onComment, onChompKeep);
          case Scalar.Scalar.QUOTE_DOUBLE:
            return doubleQuotedString(ss.value, ctx);
          case Scalar.Scalar.QUOTE_SINGLE:
            return singleQuotedString(ss.value, ctx);
          case Scalar.Scalar.PLAIN:
            return plainString(ss, ctx, onComment, onChompKeep);
          default:
            return null;
        }
      };
      let res = _stringify(type);
      if (res === null) {
        const { defaultKeyType, defaultStringType } = ctx.options;
        const t = implicitKey && defaultKeyType || defaultStringType;
        res = _stringify(t);
        if (res === null)
          throw new Error(`Unsupported default string type ${t}`);
      }
      return res;
    }
    exports.stringifyString = stringifyString;
  }
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS({
  "node_modules/yaml/dist/stringify/stringify.js"(exports) {
    "use strict";
    var anchors = require_anchors();
    var identity = require_identity();
    var stringifyComment = require_stringifyComment();
    var stringifyString = require_stringifyString();
    function createStringifyContext(doc, options) {
      const opt = Object.assign({
        blockQuote: true,
        commentString: stringifyComment.stringifyComment,
        defaultKeyType: null,
        defaultStringType: "PLAIN",
        directives: null,
        doubleQuotedAsJSON: false,
        doubleQuotedMinMultiLineLength: 40,
        falseStr: "false",
        flowCollectionPadding: true,
        indentSeq: true,
        lineWidth: 80,
        minContentWidth: 20,
        nullStr: "null",
        simpleKeys: false,
        singleQuote: null,
        trailingComma: false,
        trueStr: "true",
        verifyAliasOrder: true
      }, doc.schema.toStringOptions, options);
      let inFlow;
      switch (opt.collectionStyle) {
        case "block":
          inFlow = false;
          break;
        case "flow":
          inFlow = true;
          break;
        default:
          inFlow = null;
      }
      return {
        anchors: /* @__PURE__ */ new Set(),
        doc,
        flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
        indent: "",
        indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
        inFlow,
        options: opt
      };
    }
    function getTagObject(tags, item) {
      if (item.tag) {
        const match = tags.filter((t) => t.tag === item.tag);
        if (match.length > 0)
          return match.find((t) => t.format === item.format) ?? match[0];
      }
      let tagObj = void 0;
      let obj;
      if (identity.isScalar(item)) {
        obj = item.value;
        let match = tags.filter((t) => t.identify?.(obj));
        if (match.length > 1) {
          const testMatch = match.filter((t) => t.test);
          if (testMatch.length > 0)
            match = testMatch;
        }
        tagObj = match.find((t) => t.format === item.format) ?? match.find((t) => !t.format);
      } else {
        obj = item;
        tagObj = tags.find((t) => t.nodeClass && obj instanceof t.nodeClass);
      }
      if (!tagObj) {
        const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
        throw new Error(`Tag not resolved for ${name} value`);
      }
      return tagObj;
    }
    function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
      if (!doc.directives)
        return "";
      const props = [];
      const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
      if (anchor && anchors.anchorIsValid(anchor)) {
        anchors$1.add(anchor);
        props.push(`&${anchor}`);
      }
      const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
      if (tag)
        props.push(doc.directives.tagString(tag));
      return props.join(" ");
    }
    function stringify(item, ctx, onComment, onChompKeep) {
      if (identity.isPair(item))
        return item.toString(ctx, onComment, onChompKeep);
      if (identity.isAlias(item)) {
        if (ctx.doc.directives)
          return item.toString(ctx);
        if (ctx.resolvedAliases?.has(item)) {
          throw new TypeError(`Cannot stringify circular structure without alias nodes`);
        } else {
          if (ctx.resolvedAliases)
            ctx.resolvedAliases.add(item);
          else
            ctx.resolvedAliases = /* @__PURE__ */ new Set([item]);
          item = item.resolve(ctx.doc);
        }
      }
      let tagObj = void 0;
      const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o) => tagObj = o });
      tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
      const props = stringifyProps(node, tagObj, ctx);
      if (props.length > 0)
        ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
      const str2 = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
      if (!props)
        return str2;
      return identity.isScalar(node) || str2[0] === "{" || str2[0] === "[" ? `${props} ${str2}` : `${props}
${ctx.indent}${str2}`;
    }
    exports.createStringifyContext = createStringifyContext;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyPair.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
      const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
      let keyComment = identity.isNode(key) && key.comment || null;
      if (simpleKeys) {
        if (keyComment) {
          throw new Error("With simple keys, key nodes cannot have comments");
        }
        if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
          const msg = "With simple keys, collection cannot be used as a key value";
          throw new Error(msg);
        }
      }
      let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
      ctx = Object.assign({}, ctx, {
        allNullValues: false,
        implicitKey: !explicitKey && (simpleKeys || !allNullValues),
        indent: indent + indentStep
      });
      let keyCommentDone = false;
      let chompKeep = false;
      let str2 = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
      if (!explicitKey && !ctx.inFlow && str2.length > 1024) {
        if (simpleKeys)
          throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
        explicitKey = true;
      }
      if (ctx.inFlow) {
        if (allNullValues || value == null) {
          if (keyCommentDone && onComment)
            onComment();
          return str2 === "" ? "?" : explicitKey ? `? ${str2}` : str2;
        }
      } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
        str2 = `? ${str2}`;
        if (keyComment && !keyCommentDone) {
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        } else if (chompKeep && onChompKeep)
          onChompKeep();
        return str2;
      }
      if (keyCommentDone)
        keyComment = null;
      if (explicitKey) {
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
        str2 = `? ${str2}
${indent}:`;
      } else {
        str2 = `${str2}:`;
        if (keyComment)
          str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(keyComment));
      }
      let vsb, vcb, valueComment;
      if (identity.isNode(value)) {
        vsb = !!value.spaceBefore;
        vcb = value.commentBefore;
        valueComment = value.comment;
      } else {
        vsb = false;
        vcb = null;
        valueComment = null;
        if (value && typeof value === "object")
          value = doc.createNode(value);
      }
      ctx.implicitKey = false;
      if (!explicitKey && !keyComment && identity.isScalar(value))
        ctx.indentAtStart = str2.length + 1;
      chompKeep = false;
      if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
        ctx.indent = ctx.indent.substring(2);
      }
      let valueCommentDone = false;
      const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
      let ws = " ";
      if (keyComment || vsb || vcb) {
        ws = vsb ? "\n" : "";
        if (vcb) {
          const cs = commentString(vcb);
          ws += `
${stringifyComment.indentComment(cs, ctx.indent)}`;
        }
        if (valueStr === "" && !ctx.inFlow) {
          if (ws === "\n" && valueComment)
            ws = "\n\n";
        } else {
          ws += `
${ctx.indent}`;
        }
      } else if (!explicitKey && identity.isCollection(value)) {
        const vs0 = valueStr[0];
        const nl0 = valueStr.indexOf("\n");
        const hasNewline = nl0 !== -1;
        const flow2 = ctx.inFlow ?? value.flow ?? value.items.length === 0;
        if (hasNewline || !flow2) {
          let hasPropsLine = false;
          if (hasNewline && (vs0 === "&" || vs0 === "!")) {
            let sp0 = valueStr.indexOf(" ");
            if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
              sp0 = valueStr.indexOf(" ", sp0 + 1);
            }
            if (sp0 === -1 || nl0 < sp0)
              hasPropsLine = true;
          }
          if (!hasPropsLine)
            ws = `
${ctx.indent}`;
        }
      } else if (valueStr === "" || valueStr[0] === "\n") {
        ws = "";
      }
      str2 += ws + valueStr;
      if (ctx.inFlow) {
        if (valueCommentDone && onComment)
          onComment();
      } else if (valueComment && !valueCommentDone) {
        str2 += stringifyComment.lineComment(str2, ctx.indent, commentString(valueComment));
      } else if (chompKeep && onChompKeep) {
        onChompKeep();
      }
      return str2;
    }
    exports.stringifyPair = stringifyPair;
  }
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS({
  "node_modules/yaml/dist/log.js"(exports) {
    "use strict";
    var node_process = __require("process");
    function debug(logLevel, ...messages) {
      if (logLevel === "debug")
        console.log(...messages);
    }
    function warn(logLevel, warning) {
      if (logLevel === "debug" || logLevel === "warn") {
        if (typeof node_process.emitWarning === "function")
          node_process.emitWarning(warning);
        else
          console.warn(warning);
      }
    }
    exports.debug = debug;
    exports.warn = warn;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/merge.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var MERGE_KEY = "<<";
    var merge = {
      identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
      default: "key",
      tag: "tag:yaml.org,2002:merge",
      test: /^<<$/,
      resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
        addToJSMap: addMergeToJSMap
      }),
      stringify: () => MERGE_KEY
    };
    var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
    function addMergeToJSMap(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (identity.isSeq(source))
        for (const it of source.items)
          mergeValue(ctx, map, it);
      else if (Array.isArray(source))
        for (const it of source)
          mergeValue(ctx, map, it);
      else
        mergeValue(ctx, map, source);
    }
    function mergeValue(ctx, map, value) {
      const source = resolveAliasValue(ctx, value);
      if (!identity.isMap(source))
        throw new Error("Merge sources must be maps or map aliases");
      const srcMap = source.toJSON(null, ctx, Map);
      for (const [key, value2] of srcMap) {
        if (map instanceof Map) {
          if (!map.has(key))
            map.set(key, value2);
        } else if (map instanceof Set) {
          map.add(key);
        } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
          Object.defineProperty(map, key, {
            value: value2,
            writable: true,
            enumerable: true,
            configurable: true
          });
        }
      }
      return map;
    }
    function resolveAliasValue(ctx, value) {
      return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
    }
    exports.addMergeToJSMap = addMergeToJSMap;
    exports.isMergeKey = isMergeKey;
    exports.merge = merge;
  }
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS({
  "node_modules/yaml/dist/nodes/addPairToJSMap.js"(exports) {
    "use strict";
    var log = require_log();
    var merge = require_merge();
    var stringify = require_stringify();
    var identity = require_identity();
    var toJS = require_toJS();
    function addPairToJSMap(ctx, map, { key, value }) {
      if (identity.isNode(key) && key.addToJSMap)
        key.addToJSMap(ctx, map, value);
      else if (merge.isMergeKey(ctx, key))
        merge.addMergeToJSMap(ctx, map, value);
      else {
        const jsKey = toJS.toJS(key, "", ctx);
        if (map instanceof Map) {
          map.set(jsKey, toJS.toJS(value, jsKey, ctx));
        } else if (map instanceof Set) {
          map.add(jsKey);
        } else {
          const stringKey = stringifyKey(key, jsKey, ctx);
          const jsValue = toJS.toJS(value, stringKey, ctx);
          if (stringKey in map)
            Object.defineProperty(map, stringKey, {
              value: jsValue,
              writable: true,
              enumerable: true,
              configurable: true
            });
          else
            map[stringKey] = jsValue;
        }
      }
      return map;
    }
    function stringifyKey(key, jsKey, ctx) {
      if (jsKey === null)
        return "";
      if (typeof jsKey !== "object")
        return String(jsKey);
      if (identity.isNode(key) && ctx?.doc) {
        const strCtx = stringify.createStringifyContext(ctx.doc, {});
        strCtx.anchors = /* @__PURE__ */ new Set();
        for (const node of ctx.anchors.keys())
          strCtx.anchors.add(node.anchor);
        strCtx.inFlow = true;
        strCtx.inStringifyKey = true;
        const strKey = key.toString(strCtx);
        if (!ctx.mapKeyWarned) {
          let jsonStr = JSON.stringify(strKey);
          if (jsonStr.length > 40)
            jsonStr = jsonStr.substring(0, 36) + '..."';
          log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
          ctx.mapKeyWarned = true;
        }
        return strKey;
      }
      return JSON.stringify(jsKey);
    }
    exports.addPairToJSMap = addPairToJSMap;
  }
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS({
  "node_modules/yaml/dist/nodes/Pair.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyPair = require_stringifyPair();
    var addPairToJSMap = require_addPairToJSMap();
    var identity = require_identity();
    function createPair(key, value, ctx) {
      const k = createNode.createNode(key, void 0, ctx);
      const v = createNode.createNode(value, void 0, ctx);
      return new Pair(k, v);
    }
    var Pair = class _Pair {
      constructor(key, value = null) {
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
        this.key = key;
        this.value = value;
      }
      clone(schema2) {
        let { key, value } = this;
        if (identity.isNode(key))
          key = key.clone(schema2);
        if (identity.isNode(value))
          value = value.clone(schema2);
        return new _Pair(key, value);
      }
      toJSON(_, ctx) {
        const pair = ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        return addPairToJSMap.addPairToJSMap(ctx, pair, this);
      }
      toString(ctx, onComment, onChompKeep) {
        return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
      }
    };
    exports.Pair = Pair;
    exports.createPair = createPair;
  }
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyCollection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyCollection(collection, ctx, options) {
      const flow2 = ctx.inFlow ?? collection.flow;
      const stringify2 = flow2 ? stringifyFlowCollection : stringifyBlockCollection;
      return stringify2(collection, ctx, options);
    }
    function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
      const { indent, options: { commentString } } = ctx;
      const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
      let chompKeep = false;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment2 = null;
        if (identity.isNode(item)) {
          if (!chompKeep && item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
          if (item.comment)
            comment2 = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (!chompKeep && ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
          }
        }
        chompKeep = false;
        let str3 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
        if (comment2)
          str3 += stringifyComment.lineComment(str3, itemIndent, commentString(comment2));
        if (chompKeep && comment2)
          chompKeep = false;
        lines.push(blockItemPrefix + str3);
      }
      let str2;
      if (lines.length === 0) {
        str2 = flowChars.start + flowChars.end;
      } else {
        str2 = lines[0];
        for (let i = 1; i < lines.length; ++i) {
          const line = lines[i];
          str2 += line ? `
${indent}${line}` : "\n";
        }
      }
      if (comment) {
        str2 += "\n" + stringifyComment.indentComment(commentString(comment), indent);
        if (onComment)
          onComment();
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str2;
    }
    function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
      const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
      itemIndent += indentStep;
      const itemCtx = Object.assign({}, ctx, {
        indent: itemIndent,
        inFlow: true,
        type: null
      });
      let reqNewline = false;
      let linesAtValue = 0;
      const lines = [];
      for (let i = 0; i < items.length; ++i) {
        const item = items[i];
        let comment = null;
        if (identity.isNode(item)) {
          if (item.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, item.commentBefore, false);
          if (item.comment)
            comment = item.comment;
        } else if (identity.isPair(item)) {
          const ik = identity.isNode(item.key) ? item.key : null;
          if (ik) {
            if (ik.spaceBefore)
              lines.push("");
            addCommentBefore(ctx, lines, ik.commentBefore, false);
            if (ik.comment)
              reqNewline = true;
          }
          const iv = identity.isNode(item.value) ? item.value : null;
          if (iv) {
            if (iv.comment)
              comment = iv.comment;
            if (iv.commentBefore)
              reqNewline = true;
          } else if (item.value == null && ik?.comment) {
            comment = ik.comment;
          }
        }
        if (comment)
          reqNewline = true;
        let str2 = stringify.stringify(item, itemCtx, () => comment = null);
        reqNewline || (reqNewline = lines.length > linesAtValue || str2.includes("\n"));
        if (i < items.length - 1) {
          str2 += ",";
        } else if (ctx.options.trailingComma) {
          if (ctx.options.lineWidth > 0) {
            reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str2.length + 2) > ctx.options.lineWidth);
          }
          if (reqNewline) {
            str2 += ",";
          }
        }
        if (comment)
          str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment));
        lines.push(str2);
        linesAtValue = lines.length;
      }
      const { start, end } = flowChars;
      if (lines.length === 0) {
        return start + end;
      } else {
        if (!reqNewline) {
          const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
          reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
        }
        if (reqNewline) {
          let str2 = start;
          for (const line of lines)
            str2 += line ? `
${indentStep}${indent}${line}` : "\n";
          return `${str2}
${indent}${end}`;
        } else {
          return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
        }
      }
    }
    function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
      if (comment && chompKeep)
        comment = comment.replace(/^\n+/, "");
      if (comment) {
        const ic = stringifyComment.indentComment(commentString(comment), indent);
        lines.push(ic.trimStart());
      }
    }
    exports.stringifyCollection = stringifyCollection;
  }
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLMap.js"(exports) {
    "use strict";
    var stringifyCollection = require_stringifyCollection();
    var addPairToJSMap = require_addPairToJSMap();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    function findPair(items, key) {
      const k = identity.isScalar(key) ? key.value : key;
      for (const it of items) {
        if (identity.isPair(it)) {
          if (it.key === key || it.key === k)
            return it;
          if (identity.isScalar(it.key) && it.key.value === k)
            return it;
        }
      }
      return void 0;
    }
    var YAMLMap = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:map";
      }
      constructor(schema2) {
        super(identity.MAP, schema2);
        this.items = [];
      }
      /**
       * A generic collection parsing method that can be extended
       * to other node classes that inherit from YAMLMap
       */
      static from(schema2, obj, ctx) {
        const { keepUndefined, replacer: replacer2 } = ctx;
        const map = new this(schema2);
        const add = (key, value) => {
          if (typeof replacer2 === "function")
            value = replacer2.call(obj, key, value);
          else if (Array.isArray(replacer2) && !replacer2.includes(key))
            return;
          if (value !== void 0 || keepUndefined)
            map.items.push(Pair.createPair(key, value, ctx));
        };
        if (obj instanceof Map) {
          for (const [key, value] of obj)
            add(key, value);
        } else if (obj && typeof obj === "object") {
          for (const key of Object.keys(obj))
            add(key, obj[key]);
        }
        if (typeof schema2.sortMapEntries === "function") {
          map.items.sort(schema2.sortMapEntries);
        }
        return map;
      }
      /**
       * Adds a value to the collection.
       *
       * @param overwrite - If not set `true`, using a key that is already in the
       *   collection will throw. Otherwise, overwrites the previous value.
       */
      add(pair, overwrite) {
        let _pair;
        if (identity.isPair(pair))
          _pair = pair;
        else if (!pair || typeof pair !== "object" || !("key" in pair)) {
          _pair = new Pair.Pair(pair, pair?.value);
        } else
          _pair = new Pair.Pair(pair.key, pair.value);
        const prev = findPair(this.items, _pair.key);
        const sortEntries = this.schema?.sortMapEntries;
        if (prev) {
          if (!overwrite)
            throw new Error(`Key ${_pair.key} already set`);
          if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
            prev.value.value = _pair.value;
          else
            prev.value = _pair.value;
        } else if (sortEntries) {
          const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
          if (i === -1)
            this.items.push(_pair);
          else
            this.items.splice(i, 0, _pair);
        } else {
          this.items.push(_pair);
        }
      }
      delete(key) {
        const it = findPair(this.items, key);
        if (!it)
          return false;
        const del = this.items.splice(this.items.indexOf(it), 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const it = findPair(this.items, key);
        const node = it?.value;
        return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? void 0;
      }
      has(key) {
        return !!findPair(this.items, key);
      }
      set(key, value) {
        this.add(new Pair.Pair(key, value), true);
      }
      /**
       * @param ctx - Conversion context, originally set in Document#toJS()
       * @param {Class} Type - If set, forces the returned collection type
       * @returns Instance of Type, Map, or Object
       */
      toJSON(_, ctx, Type) {
        const map = Type ? new Type() : ctx?.mapAsMap ? /* @__PURE__ */ new Map() : {};
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const item of this.items)
          addPairToJSMap.addPairToJSMap(ctx, map, item);
        return map;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        for (const item of this.items) {
          if (!identity.isPair(item))
            throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
        }
        if (!ctx.allNullValues && this.hasAllNullValues(false))
          ctx = Object.assign({}, ctx, { allNullValues: true });
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "",
          flowChars: { start: "{", end: "}" },
          itemIndent: ctx.indent || "",
          onChompKeep,
          onComment
        });
      }
    };
    exports.YAMLMap = YAMLMap;
    exports.findPair = findPair;
  }
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS({
  "node_modules/yaml/dist/schema/common/map.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLMap = require_YAMLMap();
    var map = {
      collection: "map",
      default: true,
      nodeClass: YAMLMap.YAMLMap,
      tag: "tag:yaml.org,2002:map",
      resolve(map2, onError) {
        if (!identity.isMap(map2))
          onError("Expected a mapping for this tag");
        return map2;
      },
      createNode: (schema2, obj, ctx) => YAMLMap.YAMLMap.from(schema2, obj, ctx)
    };
    exports.map = map;
  }
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS({
  "node_modules/yaml/dist/nodes/YAMLSeq.js"(exports) {
    "use strict";
    var createNode = require_createNode();
    var stringifyCollection = require_stringifyCollection();
    var Collection = require_Collection();
    var identity = require_identity();
    var Scalar = require_Scalar();
    var toJS = require_toJS();
    var YAMLSeq = class extends Collection.Collection {
      static get tagName() {
        return "tag:yaml.org,2002:seq";
      }
      constructor(schema2) {
        super(identity.SEQ, schema2);
        this.items = [];
      }
      add(value) {
        this.items.push(value);
      }
      /**
       * Removes a value from the collection.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       *
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return false;
        const del = this.items.splice(idx, 1);
        return del.length > 0;
      }
      get(key, keepScalar) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          return void 0;
        const it = this.items[idx];
        return !keepScalar && identity.isScalar(it) ? it.value : it;
      }
      /**
       * Checks if the collection includes a value with the key `key`.
       *
       * `key` must contain a representation of an integer for this to succeed.
       * It may be wrapped in a `Scalar`.
       */
      has(key) {
        const idx = asItemIndex(key);
        return typeof idx === "number" && idx < this.items.length;
      }
      /**
       * Sets a value in this collection. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       *
       * If `key` does not contain a representation of an integer, this will throw.
       * It may be wrapped in a `Scalar`.
       */
      set(key, value) {
        const idx = asItemIndex(key);
        if (typeof idx !== "number")
          throw new Error(`Expected a valid index, not ${key}.`);
        const prev = this.items[idx];
        if (identity.isScalar(prev) && Scalar.isScalarValue(value))
          prev.value = value;
        else
          this.items[idx] = value;
      }
      toJSON(_, ctx) {
        const seq = [];
        if (ctx?.onCreate)
          ctx.onCreate(seq);
        let i = 0;
        for (const item of this.items)
          seq.push(toJS.toJS(item, String(i++), ctx));
        return seq;
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        return stringifyCollection.stringifyCollection(this, ctx, {
          blockItemPrefix: "- ",
          flowChars: { start: "[", end: "]" },
          itemIndent: (ctx.indent || "") + "  ",
          onChompKeep,
          onComment
        });
      }
      static from(schema2, obj, ctx) {
        const { replacer: replacer2 } = ctx;
        const seq = new this(schema2);
        if (obj && Symbol.iterator in Object(obj)) {
          let i = 0;
          for (let it of obj) {
            if (typeof replacer2 === "function") {
              const key = obj instanceof Set ? it : String(i++);
              it = replacer2.call(obj, key, it);
            }
            seq.items.push(createNode.createNode(it, void 0, ctx));
          }
        }
        return seq;
      }
    };
    function asItemIndex(key) {
      let idx = identity.isScalar(key) ? key.value : key;
      if (idx && typeof idx === "string")
        idx = Number(idx);
      return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
    }
    exports.YAMLSeq = YAMLSeq;
  }
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS({
  "node_modules/yaml/dist/schema/common/seq.js"(exports) {
    "use strict";
    var identity = require_identity();
    var YAMLSeq = require_YAMLSeq();
    var seq = {
      collection: "seq",
      default: true,
      nodeClass: YAMLSeq.YAMLSeq,
      tag: "tag:yaml.org,2002:seq",
      resolve(seq2, onError) {
        if (!identity.isSeq(seq2))
          onError("Expected a sequence for this tag");
        return seq2;
      },
      createNode: (schema2, obj, ctx) => YAMLSeq.YAMLSeq.from(schema2, obj, ctx)
    };
    exports.seq = seq;
  }
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS({
  "node_modules/yaml/dist/schema/common/string.js"(exports) {
    "use strict";
    var stringifyString = require_stringifyString();
    var string = {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str2) => str2,
      stringify(item, ctx, onComment, onChompKeep) {
        ctx = Object.assign({ actualString: true }, ctx);
        return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
      }
    };
    exports.string = string;
  }
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS({
  "node_modules/yaml/dist/schema/common/null.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var nullTag = {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^(?:~|[Nn]ull|NULL)?$/,
      resolve: () => new Scalar.Scalar(null),
      stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
    };
    exports.nullTag = nullTag;
  }
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS({
  "node_modules/yaml/dist/schema/core/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var boolTag = {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
      resolve: (str2) => new Scalar.Scalar(str2[0] === "t" || str2[0] === "T"),
      stringify({ source, value }, ctx) {
        if (source && boolTag.test.test(source)) {
          const sv = source[0] === "t" || source[0] === "T";
          if (value === sv)
            return source;
        }
        return value ? ctx.options.trueStr : ctx.options.falseStr;
      }
    };
    exports.boolTag = boolTag;
  }
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyNumber.js"(exports) {
    "use strict";
    function stringifyNumber({ format: format2, minFractionDigits, tag, value }) {
      if (typeof value === "bigint")
        return String(value);
      const num = typeof value === "number" ? value : Number(value);
      if (!isFinite(num))
        return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
      let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
      if (!format2 && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
        let i = n.indexOf(".");
        if (i < 0) {
          i = n.length;
          n += ".";
        }
        let d = minFractionDigits - (n.length - i - 1);
        while (d-- > 0)
          n += "0";
      }
      return n;
    }
    exports.stringifyNumber = stringifyNumber;
  }
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS({
  "node_modules/yaml/dist/schema/core/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2));
        const dot = str2.indexOf(".");
        if (dot !== -1 && str2[str2.length - 1] === "0")
          node.minFractionDigits = str2.length - dot - 1;
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS({
  "node_modules/yaml/dist/schema/core/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    var intResolve = (str2, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2.substring(offset), radix);
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value) && value >= 0)
        return prefix + value.toString(radix);
      return stringifyNumber.stringifyNumber(node);
    }
    var intOct = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^0o[0-7]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 8, opt),
      stringify: (node) => intStringify(node, 8, "0o")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: (value) => intIdentify(value) && value >= 0,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^0x[0-9a-fA-F]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS({
  "node_modules/yaml/dist/schema/core/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool2 = require_bool();
    var float = require_float();
    var int = require_int();
    var schema2 = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool2.boolTag,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float
    ];
    exports.schema = schema2;
  }
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS({
  "node_modules/yaml/dist/schema/json/schema.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var map = require_map();
    var seq = require_seq();
    function intIdentify(value) {
      return typeof value === "bigint" || Number.isInteger(value);
    }
    var stringifyJSON = ({ value }) => JSON.stringify(value);
    var jsonScalars = [
      {
        identify: (value) => typeof value === "string",
        default: true,
        tag: "tag:yaml.org,2002:str",
        resolve: (str2) => str2,
        stringify: stringifyJSON
      },
      {
        identify: (value) => value == null,
        createNode: () => new Scalar.Scalar(null),
        default: true,
        tag: "tag:yaml.org,2002:null",
        test: /^null$/,
        resolve: () => null,
        stringify: stringifyJSON
      },
      {
        identify: (value) => typeof value === "boolean",
        default: true,
        tag: "tag:yaml.org,2002:bool",
        test: /^true$|^false$/,
        resolve: (str2) => str2 === "true",
        stringify: stringifyJSON
      },
      {
        identify: intIdentify,
        default: true,
        tag: "tag:yaml.org,2002:int",
        test: /^-?(?:0|[1-9][0-9]*)$/,
        resolve: (str2, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str2) : parseInt(str2, 10),
        stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
      },
      {
        identify: (value) => typeof value === "number",
        default: true,
        tag: "tag:yaml.org,2002:float",
        test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
        resolve: (str2) => parseFloat(str2),
        stringify: stringifyJSON
      }
    ];
    var jsonError = {
      default: true,
      tag: "",
      test: /^/,
      resolve(str2, onError) {
        onError(`Unresolved plain scalar ${JSON.stringify(str2)}`);
        return str2;
      }
    };
    var schema2 = [map.map, seq.seq].concat(jsonScalars, jsonError);
    exports.schema = schema2;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/binary.js"(exports) {
    "use strict";
    var node_buffer = __require("buffer");
    var Scalar = require_Scalar();
    var stringifyString = require_stringifyString();
    var binary = {
      identify: (value) => value instanceof Uint8Array,
      // Buffer inherits from Uint8Array
      default: false,
      tag: "tag:yaml.org,2002:binary",
      /**
       * Returns a Buffer in node and an Uint8Array in browsers
       *
       * To use the resulting buffer as an image, you'll want to do something like:
       *
       *   const blob = new Blob([buffer], { type: 'image/jpeg' })
       *   document.querySelector('#photo').src = URL.createObjectURL(blob)
       */
      resolve(src, onError) {
        if (typeof node_buffer.Buffer === "function") {
          return node_buffer.Buffer.from(src, "base64");
        } else if (typeof atob === "function") {
          const str2 = atob(src.replace(/[\n\r]/g, ""));
          const buffer = new Uint8Array(str2.length);
          for (let i = 0; i < str2.length; ++i)
            buffer[i] = str2.charCodeAt(i);
          return buffer;
        } else {
          onError("This environment does not support reading binary tags; either Buffer or atob is required");
          return src;
        }
      },
      stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
        if (!value)
          return "";
        const buf = value;
        let str2;
        if (typeof node_buffer.Buffer === "function") {
          str2 = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
        } else if (typeof btoa === "function") {
          let s = "";
          for (let i = 0; i < buf.length; ++i)
            s += String.fromCharCode(buf[i]);
          str2 = btoa(s);
        } else {
          throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
        }
        type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
        if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
          const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
          const n = Math.ceil(str2.length / lineWidth);
          const lines = new Array(n);
          for (let i = 0, o = 0; i < n; ++i, o += lineWidth) {
            lines[i] = str2.substr(o, lineWidth);
          }
          str2 = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? "\n" : " ");
        }
        return stringifyString.stringifyString({ comment, type, value: str2 }, ctx, onComment, onChompKeep);
      }
    };
    exports.binary = binary;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/pairs.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLSeq = require_YAMLSeq();
    function resolvePairs(seq, onError) {
      if (identity.isSeq(seq)) {
        for (let i = 0; i < seq.items.length; ++i) {
          let item = seq.items[i];
          if (identity.isPair(item))
            continue;
          else if (identity.isMap(item)) {
            if (item.items.length > 1)
              onError("Each pair must have its own sequence indicator");
            const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
            if (item.commentBefore)
              pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
            if (item.comment) {
              const cn = pair.value ?? pair.key;
              cn.comment = cn.comment ? `${item.comment}
${cn.comment}` : item.comment;
            }
            item = pair;
          }
          seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
        }
      } else
        onError("Expected a sequence for this tag");
      return seq;
    }
    function createPairs(schema2, iterable, ctx) {
      const { replacer: replacer2 } = ctx;
      const pairs3 = new YAMLSeq.YAMLSeq(schema2);
      pairs3.tag = "tag:yaml.org,2002:pairs";
      let i = 0;
      if (iterable && Symbol.iterator in Object(iterable))
        for (let it of iterable) {
          if (typeof replacer2 === "function")
            it = replacer2.call(iterable, String(i++), it);
          let key, value;
          if (Array.isArray(it)) {
            if (it.length === 2) {
              key = it[0];
              value = it[1];
            } else
              throw new TypeError(`Expected [key, value] tuple: ${it}`);
          } else if (it && it instanceof Object) {
            const keys = Object.keys(it);
            if (keys.length === 1) {
              key = keys[0];
              value = it[key];
            } else {
              throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
            }
          } else {
            key = it;
          }
          pairs3.items.push(Pair.createPair(key, value, ctx));
        }
      return pairs3;
    }
    var pairs2 = {
      collection: "seq",
      default: false,
      tag: "tag:yaml.org,2002:pairs",
      resolve: resolvePairs,
      createNode: createPairs
    };
    exports.createPairs = createPairs;
    exports.pairs = pairs2;
    exports.resolvePairs = resolvePairs;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/omap.js"(exports) {
    "use strict";
    var identity = require_identity();
    var toJS = require_toJS();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var pairs2 = require_pairs();
    var YAMLOMap = class _YAMLOMap extends YAMLSeq.YAMLSeq {
      constructor() {
        super();
        this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
        this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
        this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
        this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
        this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
        this.tag = _YAMLOMap.tag;
      }
      /**
       * If `ctx` is given, the return type is actually `Map<unknown, unknown>`,
       * but TypeScript won't allow widening the signature of a child method.
       */
      toJSON(_, ctx) {
        if (!ctx)
          return super.toJSON(_);
        const map = /* @__PURE__ */ new Map();
        if (ctx?.onCreate)
          ctx.onCreate(map);
        for (const pair of this.items) {
          let key, value;
          if (identity.isPair(pair)) {
            key = toJS.toJS(pair.key, "", ctx);
            value = toJS.toJS(pair.value, key, ctx);
          } else {
            key = toJS.toJS(pair, "", ctx);
          }
          if (map.has(key))
            throw new Error("Ordered maps must not include duplicate keys");
          map.set(key, value);
        }
        return map;
      }
      static from(schema2, iterable, ctx) {
        const pairs$1 = pairs2.createPairs(schema2, iterable, ctx);
        const omap2 = new this();
        omap2.items = pairs$1.items;
        return omap2;
      }
    };
    YAMLOMap.tag = "tag:yaml.org,2002:omap";
    var omap = {
      collection: "seq",
      identify: (value) => value instanceof Map,
      nodeClass: YAMLOMap,
      default: false,
      tag: "tag:yaml.org,2002:omap",
      resolve(seq, onError) {
        const pairs$1 = pairs2.resolvePairs(seq, onError);
        const seenKeys = [];
        for (const { key } of pairs$1.items) {
          if (identity.isScalar(key)) {
            if (seenKeys.includes(key.value)) {
              onError(`Ordered maps must not include duplicate keys: ${key.value}`);
            } else {
              seenKeys.push(key.value);
            }
          }
        }
        return Object.assign(new YAMLOMap(), pairs$1);
      },
      createNode: (schema2, iterable, ctx) => YAMLOMap.from(schema2, iterable, ctx)
    };
    exports.YAMLOMap = YAMLOMap;
    exports.omap = omap;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/bool.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function boolStringify({ value, source }, ctx) {
      const boolObj = value ? trueTag : falseTag;
      if (source && boolObj.test.test(source))
        return source;
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
    var trueTag = {
      identify: (value) => value === true,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
      resolve: () => new Scalar.Scalar(true),
      stringify: boolStringify
    };
    var falseTag = {
      identify: (value) => value === false,
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
      resolve: () => new Scalar.Scalar(false),
      stringify: boolStringify
    };
    exports.falseTag = falseTag;
    exports.trueTag = trueTag;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/float.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var stringifyNumber = require_stringifyNumber();
    var floatNaN = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
      resolve: (str2) => str2.slice(-3).toLowerCase() === "nan" ? NaN : str2[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
      stringify: stringifyNumber.stringifyNumber
    };
    var floatExp = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "EXP",
      test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
      resolve: (str2) => parseFloat(str2.replace(/_/g, "")),
      stringify(node) {
        const num = Number(node.value);
        return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
      }
    };
    var float = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
      resolve(str2) {
        const node = new Scalar.Scalar(parseFloat(str2.replace(/_/g, "")));
        const dot = str2.indexOf(".");
        if (dot !== -1) {
          const f = str2.substring(dot + 1).replace(/_/g, "");
          if (f[f.length - 1] === "0")
            node.minFractionDigits = f.length;
        }
        return node;
      },
      stringify: stringifyNumber.stringifyNumber
    };
    exports.float = float;
    exports.floatExp = floatExp;
    exports.floatNaN = floatNaN;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/int.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
    function intResolve(str2, offset, radix, { intAsBigInt }) {
      const sign = str2[0];
      if (sign === "-" || sign === "+")
        offset += 1;
      str2 = str2.substring(offset).replace(/_/g, "");
      if (intAsBigInt) {
        switch (radix) {
          case 2:
            str2 = `0b${str2}`;
            break;
          case 8:
            str2 = `0o${str2}`;
            break;
          case 16:
            str2 = `0x${str2}`;
            break;
        }
        const n2 = BigInt(str2);
        return sign === "-" ? BigInt(-1) * n2 : n2;
      }
      const n = parseInt(str2, radix);
      return sign === "-" ? -1 * n : n;
    }
    function intStringify(node, radix, prefix) {
      const { value } = node;
      if (intIdentify(value)) {
        const str2 = value.toString(radix);
        return value < 0 ? "-" + prefix + str2.substr(1) : prefix + str2;
      }
      return stringifyNumber.stringifyNumber(node);
    }
    var intBin = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "BIN",
      test: /^[-+]?0b[0-1_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 2, opt),
      stringify: (node) => intStringify(node, 2, "0b")
    };
    var intOct = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "OCT",
      test: /^[-+]?0[0-7_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 1, 8, opt),
      stringify: (node) => intStringify(node, 8, "0")
    };
    var int = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^[-+]?[0-9][0-9_]*$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 0, 10, opt),
      stringify: stringifyNumber.stringifyNumber
    };
    var intHex = {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "HEX",
      test: /^[-+]?0x[0-9a-fA-F_]+$/,
      resolve: (str2, _onError, opt) => intResolve(str2, 2, 16, opt),
      stringify: (node) => intStringify(node, 16, "0x")
    };
    exports.int = int;
    exports.intBin = intBin;
    exports.intHex = intHex;
    exports.intOct = intOct;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/set.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSet = class _YAMLSet extends YAMLMap.YAMLMap {
      constructor(schema2) {
        super(schema2);
        this.tag = _YAMLSet.tag;
      }
      add(key) {
        let pair;
        if (identity.isPair(key))
          pair = key;
        else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
          pair = new Pair.Pair(key.key, null);
        else
          pair = new Pair.Pair(key, null);
        const prev = YAMLMap.findPair(this.items, pair.key);
        if (!prev)
          this.items.push(pair);
      }
      /**
       * If `keepPair` is `true`, returns the Pair matching `key`.
       * Otherwise, returns the value of that Pair's key.
       */
      get(key, keepPair) {
        const pair = YAMLMap.findPair(this.items, key);
        return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
      }
      set(key, value) {
        if (typeof value !== "boolean")
          throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
        const prev = YAMLMap.findPair(this.items, key);
        if (prev && !value) {
          this.items.splice(this.items.indexOf(prev), 1);
        } else if (!prev && value) {
          this.items.push(new Pair.Pair(key));
        }
      }
      toJSON(_, ctx) {
        return super.toJSON(_, ctx, Set);
      }
      toString(ctx, onComment, onChompKeep) {
        if (!ctx)
          return JSON.stringify(this);
        if (this.hasAllNullValues(true))
          return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
        else
          throw new Error("Set items must all have null values");
      }
      static from(schema2, iterable, ctx) {
        const { replacer: replacer2 } = ctx;
        const set2 = new this(schema2);
        if (iterable && Symbol.iterator in Object(iterable))
          for (let value of iterable) {
            if (typeof replacer2 === "function")
              value = replacer2.call(iterable, value, value);
            set2.items.push(Pair.createPair(value, null, ctx));
          }
        return set2;
      }
    };
    YAMLSet.tag = "tag:yaml.org,2002:set";
    var set = {
      collection: "map",
      identify: (value) => value instanceof Set,
      nodeClass: YAMLSet,
      default: false,
      tag: "tag:yaml.org,2002:set",
      createNode: (schema2, iterable, ctx) => YAMLSet.from(schema2, iterable, ctx),
      resolve(map, onError) {
        if (identity.isMap(map)) {
          if (map.hasAllNullValues(true))
            return Object.assign(new YAMLSet(), map);
          else
            onError("Set items must all have null values");
        } else
          onError("Expected a mapping for this tag");
        return map;
      }
    };
    exports.YAMLSet = YAMLSet;
    exports.set = set;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/timestamp.js"(exports) {
    "use strict";
    var stringifyNumber = require_stringifyNumber();
    function parseSexagesimal(str2, asBigInt) {
      const sign = str2[0];
      const parts = sign === "-" || sign === "+" ? str2.substring(1) : str2;
      const num = (n) => asBigInt ? BigInt(n) : Number(n);
      const res = parts.replace(/_/g, "").split(":").reduce((res2, p) => res2 * num(60) + num(p), num(0));
      return sign === "-" ? num(-1) * res : res;
    }
    function stringifySexagesimal(node) {
      let { value } = node;
      let num = (n) => n;
      if (typeof value === "bigint")
        num = (n) => BigInt(n);
      else if (isNaN(value) || !isFinite(value))
        return stringifyNumber.stringifyNumber(node);
      let sign = "";
      if (value < 0) {
        sign = "-";
        value *= num(-1);
      }
      const _60 = num(60);
      const parts = [value % _60];
      if (value < 60) {
        parts.unshift(0);
      } else {
        value = (value - parts[0]) / _60;
        parts.unshift(value % _60);
        if (value >= 60) {
          value = (value - parts[0]) / _60;
          parts.unshift(value);
        }
      }
      return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
    }
    var intTime = {
      identify: (value) => typeof value === "bigint" || Number.isInteger(value),
      default: true,
      tag: "tag:yaml.org,2002:int",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
      resolve: (str2, _onError, { intAsBigInt }) => parseSexagesimal(str2, intAsBigInt),
      stringify: stringifySexagesimal
    };
    var floatTime = {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      format: "TIME",
      test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
      resolve: (str2) => parseSexagesimal(str2, false),
      stringify: stringifySexagesimal
    };
    var timestamp = {
      identify: (value) => value instanceof Date,
      default: true,
      tag: "tag:yaml.org,2002:timestamp",
      // If the time zone is omitted, the timestamp is assumed to be specified in UTC. The time part
      // may be omitted altogether, resulting in a date format. In such a case, the time part is
      // assumed to be 00:00:00Z (start of day, UTC).
      test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})(?:(?:t|T|[ \\t]+)([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?)?$"),
      resolve(str2) {
        const match = str2.match(timestamp.test);
        if (!match)
          throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
        const [, year, month, day, hour, minute, second] = match.map(Number);
        const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
        let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
        const tz = match[8];
        if (tz && tz !== "Z") {
          let d = parseSexagesimal(tz, false);
          if (Math.abs(d) < 30)
            d *= 60;
          date -= 6e4 * d;
        }
        return new Date(date);
      },
      stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
    };
    exports.floatTime = floatTime;
    exports.intTime = intTime;
    exports.timestamp = timestamp;
  }
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS({
  "node_modules/yaml/dist/schema/yaml-1.1/schema.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var binary = require_binary();
    var bool2 = require_bool2();
    var float = require_float2();
    var int = require_int2();
    var merge = require_merge();
    var omap = require_omap();
    var pairs2 = require_pairs();
    var set = require_set();
    var timestamp = require_timestamp();
    var schema2 = [
      map.map,
      seq.seq,
      string.string,
      _null.nullTag,
      bool2.trueTag,
      bool2.falseTag,
      int.intBin,
      int.intOct,
      int.int,
      int.intHex,
      float.floatNaN,
      float.floatExp,
      float.float,
      binary.binary,
      merge.merge,
      omap.omap,
      pairs2.pairs,
      set.set,
      timestamp.intTime,
      timestamp.floatTime,
      timestamp.timestamp
    ];
    exports.schema = schema2;
  }
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS({
  "node_modules/yaml/dist/schema/tags.js"(exports) {
    "use strict";
    var map = require_map();
    var _null = require_null();
    var seq = require_seq();
    var string = require_string();
    var bool2 = require_bool();
    var float = require_float();
    var int = require_int();
    var schema2 = require_schema();
    var schema$1 = require_schema2();
    var binary = require_binary();
    var merge = require_merge();
    var omap = require_omap();
    var pairs2 = require_pairs();
    var schema$2 = require_schema3();
    var set = require_set();
    var timestamp = require_timestamp();
    var schemas = /* @__PURE__ */ new Map([
      ["core", schema2.schema],
      ["failsafe", [map.map, seq.seq, string.string]],
      ["json", schema$1.schema],
      ["yaml11", schema$2.schema],
      ["yaml-1.1", schema$2.schema]
    ]);
    var tagsByName = {
      binary: binary.binary,
      bool: bool2.boolTag,
      float: float.float,
      floatExp: float.floatExp,
      floatNaN: float.floatNaN,
      floatTime: timestamp.floatTime,
      int: int.int,
      intHex: int.intHex,
      intOct: int.intOct,
      intTime: timestamp.intTime,
      map: map.map,
      merge: merge.merge,
      null: _null.nullTag,
      omap: omap.omap,
      pairs: pairs2.pairs,
      seq: seq.seq,
      set: set.set,
      timestamp: timestamp.timestamp
    };
    var coreKnownTags = {
      "tag:yaml.org,2002:binary": binary.binary,
      "tag:yaml.org,2002:merge": merge.merge,
      "tag:yaml.org,2002:omap": omap.omap,
      "tag:yaml.org,2002:pairs": pairs2.pairs,
      "tag:yaml.org,2002:set": set.set,
      "tag:yaml.org,2002:timestamp": timestamp.timestamp
    };
    function getTags(customTags, schemaName, addMergeTag) {
      const schemaTags = schemas.get(schemaName);
      if (schemaTags && !customTags) {
        return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
      }
      let tags = schemaTags;
      if (!tags) {
        if (Array.isArray(customTags))
          tags = [];
        else {
          const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
        }
      }
      if (Array.isArray(customTags)) {
        for (const tag of customTags)
          tags = tags.concat(tag);
      } else if (typeof customTags === "function") {
        tags = customTags(tags.slice());
      }
      if (addMergeTag)
        tags = tags.concat(merge.merge);
      return tags.reduce((tags2, tag) => {
        const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
        if (!tagObj) {
          const tagName = JSON.stringify(tag);
          const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
          throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
        }
        if (!tags2.includes(tagObj))
          tags2.push(tagObj);
        return tags2;
      }, []);
    }
    exports.coreKnownTags = coreKnownTags;
    exports.getTags = getTags;
  }
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS({
  "node_modules/yaml/dist/schema/Schema.js"(exports) {
    "use strict";
    var identity = require_identity();
    var map = require_map();
    var seq = require_seq();
    var string = require_string();
    var tags = require_tags();
    var sortMapEntriesByKey = (a, b) => a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    var Schema = class _Schema {
      constructor({ compat, customTags, merge, resolveKnownTags, schema: schema2, sortMapEntries, toStringDefaults }) {
        this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
        this.name = typeof schema2 === "string" && schema2 || "core";
        this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
        this.tags = tags.getTags(customTags, this.name, merge);
        this.toStringOptions = toStringDefaults ?? null;
        Object.defineProperty(this, identity.MAP, { value: map.map });
        Object.defineProperty(this, identity.SCALAR, { value: string.string });
        Object.defineProperty(this, identity.SEQ, { value: seq.seq });
        this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
      }
      clone() {
        const copy = Object.create(_Schema.prototype, Object.getOwnPropertyDescriptors(this));
        copy.tags = this.tags.slice();
        return copy;
      }
    };
    exports.Schema = Schema;
  }
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS({
  "node_modules/yaml/dist/stringify/stringifyDocument.js"(exports) {
    "use strict";
    var identity = require_identity();
    var stringify = require_stringify();
    var stringifyComment = require_stringifyComment();
    function stringifyDocument(doc, options) {
      const lines = [];
      let hasDirectives = options.directives === true;
      if (options.directives !== false && doc.directives) {
        const dir = doc.directives.toString(doc);
        if (dir) {
          lines.push(dir);
          hasDirectives = true;
        } else if (doc.directives.docStart)
          hasDirectives = true;
      }
      if (hasDirectives)
        lines.push("---");
      const ctx = stringify.createStringifyContext(doc, options);
      const { commentString } = ctx.options;
      if (doc.commentBefore) {
        if (lines.length !== 1)
          lines.unshift("");
        const cs = commentString(doc.commentBefore);
        lines.unshift(stringifyComment.indentComment(cs, ""));
      }
      let chompKeep = false;
      let contentComment = null;
      if (doc.contents) {
        if (identity.isNode(doc.contents)) {
          if (doc.contents.spaceBefore && hasDirectives)
            lines.push("");
          if (doc.contents.commentBefore) {
            const cs = commentString(doc.contents.commentBefore);
            lines.push(stringifyComment.indentComment(cs, ""));
          }
          ctx.forceBlockIndent = !!doc.comment;
          contentComment = doc.contents.comment;
        }
        const onChompKeep = contentComment ? void 0 : () => chompKeep = true;
        let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
        if (contentComment)
          body += stringifyComment.lineComment(body, "", commentString(contentComment));
        if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
          lines[lines.length - 1] = `--- ${body}`;
        } else
          lines.push(body);
      } else {
        lines.push(stringify.stringify(doc.contents, ctx));
      }
      if (doc.directives?.docEnd) {
        if (doc.comment) {
          const cs = commentString(doc.comment);
          if (cs.includes("\n")) {
            lines.push("...");
            lines.push(stringifyComment.indentComment(cs, ""));
          } else {
            lines.push(`... ${cs}`);
          }
        } else {
          lines.push("...");
        }
      } else {
        let dc = doc.comment;
        if (dc && chompKeep)
          dc = dc.replace(/^\n+/, "");
        if (dc) {
          if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
            lines.push("");
          lines.push(stringifyComment.indentComment(commentString(dc), ""));
        }
      }
      return lines.join("\n") + "\n";
    }
    exports.stringifyDocument = stringifyDocument;
  }
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS({
  "node_modules/yaml/dist/doc/Document.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var Collection = require_Collection();
    var identity = require_identity();
    var Pair = require_Pair();
    var toJS = require_toJS();
    var Schema = require_Schema();
    var stringifyDocument = require_stringifyDocument();
    var anchors = require_anchors();
    var applyReviver = require_applyReviver();
    var createNode = require_createNode();
    var directives = require_directives();
    var Document = class _Document {
      constructor(value, replacer2, options) {
        this.commentBefore = null;
        this.comment = null;
        this.errors = [];
        this.warnings = [];
        Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
        let _replacer = null;
        if (typeof replacer2 === "function" || Array.isArray(replacer2)) {
          _replacer = replacer2;
        } else if (options === void 0 && replacer2) {
          options = replacer2;
          replacer2 = void 0;
        }
        const opt = Object.assign({
          intAsBigInt: false,
          keepSourceTokens: false,
          logLevel: "warn",
          prettyErrors: true,
          strict: true,
          stringKeys: false,
          uniqueKeys: true,
          version: "1.2"
        }, options);
        this.options = opt;
        let { version } = opt;
        if (options?._directives) {
          this.directives = options._directives.atDocument();
          if (this.directives.yaml.explicit)
            version = this.directives.yaml.version;
        } else
          this.directives = new directives.Directives({ version });
        this.setSchema(version, options);
        this.contents = value === void 0 ? null : this.createNode(value, _replacer, options);
      }
      /**
       * Create a deep copy of this Document and its contents.
       *
       * Custom Node values that inherit from `Object` still refer to their original instances.
       */
      clone() {
        const copy = Object.create(_Document.prototype, {
          [identity.NODE_TYPE]: { value: identity.DOC }
        });
        copy.commentBefore = this.commentBefore;
        copy.comment = this.comment;
        copy.errors = this.errors.slice();
        copy.warnings = this.warnings.slice();
        copy.options = Object.assign({}, this.options);
        if (this.directives)
          copy.directives = this.directives.clone();
        copy.schema = this.schema.clone();
        copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
        if (this.range)
          copy.range = this.range.slice();
        return copy;
      }
      /** Adds a value to the document. */
      add(value) {
        if (assertCollection(this.contents))
          this.contents.add(value);
      }
      /** Adds a value to the document. */
      addIn(path2, value) {
        if (assertCollection(this.contents))
          this.contents.addIn(path2, value);
      }
      /**
       * Create a new `Alias` node, ensuring that the target `node` has the required anchor.
       *
       * If `node` already has an anchor, `name` is ignored.
       * Otherwise, the `node.anchor` value will be set to `name`,
       * or if an anchor with that name is already present in the document,
       * `name` will be used as a prefix for a new unique anchor.
       * If `name` is undefined, the generated anchor will use 'a' as a prefix.
       */
      createAlias(node, name) {
        if (!node.anchor) {
          const prev = anchors.anchorNames(this);
          node.anchor = // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
        }
        return new Alias.Alias(node.anchor);
      }
      createNode(value, replacer2, options) {
        let _replacer = void 0;
        if (typeof replacer2 === "function") {
          value = replacer2.call({ "": value }, "", value);
          _replacer = replacer2;
        } else if (Array.isArray(replacer2)) {
          const keyToStr = (v) => typeof v === "number" || v instanceof String || v instanceof Number;
          const asStr = replacer2.filter(keyToStr).map(String);
          if (asStr.length > 0)
            replacer2 = replacer2.concat(asStr);
          _replacer = replacer2;
        } else if (options === void 0 && replacer2) {
          options = replacer2;
          replacer2 = void 0;
        }
        const { aliasDuplicateObjects, anchorPrefix, flow: flow2, keepUndefined, onTagObj, tag } = options ?? {};
        const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(
          this,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          anchorPrefix || "a"
        );
        const ctx = {
          aliasDuplicateObjects: aliasDuplicateObjects ?? true,
          keepUndefined: keepUndefined ?? false,
          onAnchor,
          onTagObj,
          replacer: _replacer,
          schema: this.schema,
          sourceObjects
        };
        const node = createNode.createNode(value, tag, ctx);
        if (flow2 && identity.isCollection(node))
          node.flow = true;
        setAnchors();
        return node;
      }
      /**
       * Convert a key and a value into a `Pair` using the current schema,
       * recursively wrapping all values as `Scalar` or `Collection` nodes.
       */
      createPair(key, value, options = {}) {
        const k = this.createNode(key, null, options);
        const v = this.createNode(value, null, options);
        return new Pair.Pair(k, v);
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      delete(key) {
        return assertCollection(this.contents) ? this.contents.delete(key) : false;
      }
      /**
       * Removes a value from the document.
       * @returns `true` if the item was found and removed.
       */
      deleteIn(path2) {
        if (Collection.isEmptyPath(path2)) {
          if (this.contents == null)
            return false;
          this.contents = null;
          return true;
        }
        return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
      }
      /**
       * Returns item at `key`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      get(key, keepScalar) {
        return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : void 0;
      }
      /**
       * Returns item at `path`, or `undefined` if not found. By default unwraps
       * scalar values from their surrounding node; to disable set `keepScalar` to
       * `true` (collections are always returned intact).
       */
      getIn(path2, keepScalar) {
        if (Collection.isEmptyPath(path2))
          return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
        return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : void 0;
      }
      /**
       * Checks if the document includes a value with the key `key`.
       */
      has(key) {
        return identity.isCollection(this.contents) ? this.contents.has(key) : false;
      }
      /**
       * Checks if the document includes a value at `path`.
       */
      hasIn(path2) {
        if (Collection.isEmptyPath(path2))
          return this.contents !== void 0;
        return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      set(key, value) {
        if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, [key], value);
        } else if (assertCollection(this.contents)) {
          this.contents.set(key, value);
        }
      }
      /**
       * Sets a value in this document. For `!!set`, `value` needs to be a
       * boolean to add/remove the item from the set.
       */
      setIn(path2, value) {
        if (Collection.isEmptyPath(path2)) {
          this.contents = value;
        } else if (this.contents == null) {
          this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
        } else if (assertCollection(this.contents)) {
          this.contents.setIn(path2, value);
        }
      }
      /**
       * Change the YAML version and schema used by the document.
       * A `null` version disables support for directives, explicit tags, anchors, and aliases.
       * It also requires the `schema` option to be given as a `Schema` instance value.
       *
       * Overrides all previously set schema options.
       */
      setSchema(version, options = {}) {
        if (typeof version === "number")
          version = String(version);
        let opt;
        switch (version) {
          case "1.1":
            if (this.directives)
              this.directives.yaml.version = "1.1";
            else
              this.directives = new directives.Directives({ version: "1.1" });
            opt = { resolveKnownTags: false, schema: "yaml-1.1" };
            break;
          case "1.2":
          case "next":
            if (this.directives)
              this.directives.yaml.version = version;
            else
              this.directives = new directives.Directives({ version });
            opt = { resolveKnownTags: true, schema: "core" };
            break;
          case null:
            if (this.directives)
              delete this.directives;
            opt = null;
            break;
          default: {
            const sv = JSON.stringify(version);
            throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
          }
        }
        if (options.schema instanceof Object)
          this.schema = options.schema;
        else if (opt)
          this.schema = new Schema.Schema(Object.assign(opt, options));
        else
          throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
      }
      // json & jsonArg are only used from toJSON()
      toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver: reviver2 } = {}) {
        const ctx = {
          anchors: /* @__PURE__ */ new Map(),
          doc: this,
          keep: !json,
          mapAsMap: mapAsMap === true,
          mapKeyWarned: false,
          maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
        };
        const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
        if (typeof onAnchor === "function")
          for (const { count, res: res2 } of ctx.anchors.values())
            onAnchor(res2, count);
        return typeof reviver2 === "function" ? applyReviver.applyReviver(reviver2, { "": res }, "", res) : res;
      }
      /**
       * A JSON representation of the document `contents`.
       *
       * @param jsonArg Used by `JSON.stringify` to indicate the array index or
       *   property name.
       */
      toJSON(jsonArg, onAnchor) {
        return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
      }
      /** A YAML representation of the document. */
      toString(options = {}) {
        if (this.errors.length > 0)
          throw new Error("Document with errors cannot be stringified");
        if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
          const s = JSON.stringify(options.indent);
          throw new Error(`"indent" option must be a positive integer, not ${s}`);
        }
        return stringifyDocument.stringifyDocument(this, options);
      }
    };
    function assertCollection(contents) {
      if (identity.isCollection(contents))
        return true;
      throw new Error("Expected a YAML collection as document contents");
    }
    exports.Document = Document;
  }
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS({
  "node_modules/yaml/dist/errors.js"(exports) {
    "use strict";
    var YAMLError = class extends Error {
      constructor(name, pos, code, message) {
        super();
        this.name = name;
        this.code = code;
        this.message = message;
        this.pos = pos;
      }
    };
    var YAMLParseError = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLParseError", pos, code, message);
      }
    };
    var YAMLWarning = class extends YAMLError {
      constructor(pos, code, message) {
        super("YAMLWarning", pos, code, message);
      }
    };
    var prettifyError = (src, lc) => (error) => {
      if (error.pos[0] === -1)
        return;
      error.linePos = error.pos.map((pos) => lc.linePos(pos));
      const { line, col } = error.linePos[0];
      error.message += ` at line ${line}, column ${col}`;
      let ci = col - 1;
      let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
      if (ci >= 60 && lineStr.length > 80) {
        const trimStart = Math.min(ci - 39, lineStr.length - 79);
        lineStr = "\u2026" + lineStr.substring(trimStart);
        ci -= trimStart - 1;
      }
      if (lineStr.length > 80)
        lineStr = lineStr.substring(0, 79) + "\u2026";
      if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
        let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
        if (prev.length > 80)
          prev = prev.substring(0, 79) + "\u2026\n";
        lineStr = prev + lineStr;
      }
      if (/[^ ]/.test(lineStr)) {
        let count = 1;
        const end = error.linePos[1];
        if (end?.line === line && end.col > col) {
          count = Math.max(1, Math.min(end.col - col, 80 - ci));
        }
        const pointer = " ".repeat(ci) + "^".repeat(count);
        error.message += `:

${lineStr}
${pointer}
`;
      }
    };
    exports.YAMLError = YAMLError;
    exports.YAMLParseError = YAMLParseError;
    exports.YAMLWarning = YAMLWarning;
    exports.prettifyError = prettifyError;
  }
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS({
  "node_modules/yaml/dist/compose/resolve-props.js"(exports) {
    "use strict";
    function resolveProps(tokens, { flow: flow2, indicator, next, offset, onError, parentIndent, startOnNewline }) {
      let spaceBefore = false;
      let atNewline = startOnNewline;
      let hasSpace = startOnNewline;
      let comment = "";
      let commentSep = "";
      let hasNewline = false;
      let reqSpace = false;
      let tab = null;
      let anchor = null;
      let tag = null;
      let newlineAfterProp = null;
      let comma = null;
      let found = null;
      let start = null;
      for (const token of tokens) {
        if (reqSpace) {
          if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
            onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
          reqSpace = false;
        }
        if (tab) {
          if (atNewline && token.type !== "comment" && token.type !== "newline") {
            onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
          }
          tab = null;
        }
        switch (token.type) {
          case "space":
            if (!flow2 && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("	")) {
              tab = token;
            }
            hasSpace = true;
            break;
          case "comment": {
            if (!hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = token.source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += commentSep + cb;
            commentSep = "";
            atNewline = false;
            break;
          }
          case "newline":
            if (atNewline) {
              if (comment)
                comment += token.source;
              else if (!found || indicator !== "seq-item-ind")
                spaceBefore = true;
            } else
              commentSep += token.source;
            atNewline = true;
            hasNewline = true;
            if (anchor || tag)
              newlineAfterProp = token;
            hasSpace = true;
            break;
          case "anchor":
            if (anchor)
              onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
            if (token.source.endsWith(":"))
              onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
            anchor = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          case "tag": {
            if (tag)
              onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
            tag = token;
            start ?? (start = token.offset);
            atNewline = false;
            hasSpace = false;
            reqSpace = true;
            break;
          }
          case indicator:
            if (anchor || tag)
              onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
            if (found)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow2 ?? "collection"}`);
            found = token;
            atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
            hasSpace = false;
            break;
          case "comma":
            if (flow2) {
              if (comma)
                onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow2}`);
              comma = token;
              atNewline = false;
              hasSpace = false;
              break;
            }
          // else fallthrough
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
            atNewline = false;
            hasSpace = false;
        }
      }
      const last = tokens[tokens.length - 1];
      const end = last ? last.offset + last.source.length : offset;
      if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
        onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
      }
      if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
        onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
      return {
        comma,
        found,
        spaceBefore,
        comment,
        hasNewline,
        anchor,
        tag,
        newlineAfterProp,
        end,
        start: start ?? end
      };
    }
    exports.resolveProps = resolveProps;
  }
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS({
  "node_modules/yaml/dist/compose/util-contains-newline.js"(exports) {
    "use strict";
    function containsNewline(key) {
      if (!key)
        return null;
      switch (key.type) {
        case "alias":
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          if (key.source.includes("\n"))
            return true;
          if (key.end) {
            for (const st of key.end)
              if (st.type === "newline")
                return true;
          }
          return false;
        case "flow-collection":
          for (const it of key.items) {
            for (const st of it.start)
              if (st.type === "newline")
                return true;
            if (it.sep) {
              for (const st of it.sep)
                if (st.type === "newline")
                  return true;
            }
            if (containsNewline(it.key) || containsNewline(it.value))
              return true;
          }
          return false;
        default:
          return true;
      }
    }
    exports.containsNewline = containsNewline;
  }
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS({
  "node_modules/yaml/dist/compose/util-flow-indent-check.js"(exports) {
    "use strict";
    var utilContainsNewline = require_util_contains_newline();
    function flowIndentCheck(indent, fc, onError) {
      if (fc?.type === "flow-collection") {
        const end = fc.end[0];
        if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
          const msg = "Flow end indicator should be more indented than parent";
          onError(end, "BAD_INDENT", msg, true);
        }
      }
    }
    exports.flowIndentCheck = flowIndentCheck;
  }
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS({
  "node_modules/yaml/dist/compose/util-map-includes.js"(exports) {
    "use strict";
    var identity = require_identity();
    function mapIncludes(ctx, items, search) {
      const { uniqueKeys } = ctx.options;
      if (uniqueKeys === false)
        return false;
      const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a, b) => a === b || identity.isScalar(a) && identity.isScalar(b) && a.value === b.value;
      return items.some((pair) => isEqual(pair.key, search));
    }
    exports.mapIncludes = mapIncludes;
  }
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-map.js"(exports) {
    "use strict";
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    var utilMapIncludes = require_util_map_includes();
    var startColMsg = "All mapping items must start at the same column";
    function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
      const map = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      let offset = bm.offset;
      let commentEnd = null;
      for (const collItem of bm.items) {
        const { start, key, sep, value } = collItem;
        const keyProps = resolveProps.resolveProps(start, {
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: bm.indent,
          startOnNewline: true
        });
        const implicitKey = !keyProps.found;
        if (implicitKey) {
          if (key) {
            if (key.type === "block-seq")
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
            else if ("indent" in key && key.indent !== bm.indent)
              onError(offset, "BAD_INDENT", startColMsg);
          }
          if (!keyProps.anchor && !keyProps.tag && !sep) {
            commentEnd = keyProps.end;
            if (keyProps.comment) {
              if (map.comment)
                map.comment += "\n" + keyProps.comment;
              else
                map.comment = keyProps.comment;
            }
            continue;
          }
          if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
            onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
          }
        } else if (keyProps.found?.indent !== bm.indent) {
          onError(offset, "BAD_INDENT", startColMsg);
        }
        ctx.atKey = true;
        const keyStart = keyProps.end;
        const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
        ctx.atKey = false;
        if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
          onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: bm.indent,
          startOnNewline: !key || key.type === "block-scalar"
        });
        offset = valueProps.end;
        if (valueProps.found) {
          if (implicitKey) {
            if (value?.type === "block-map" && !valueProps.hasNewline)
              onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
            if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
              onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
          if (ctx.schema.compat)
            utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
          offset = valueNode.range[2];
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        } else {
          if (implicitKey)
            onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
          if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          map.items.push(pair);
        }
      }
      if (commentEnd && commentEnd < offset)
        onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
      map.range = [bm.offset, offset, commentEnd ?? offset];
      return map;
    }
    exports.resolveBlockMap = resolveBlockMap;
  }
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-seq.js"(exports) {
    "use strict";
    var YAMLSeq = require_YAMLSeq();
    var resolveProps = require_resolve_props();
    var utilFlowIndentCheck = require_util_flow_indent_check();
    function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs, onError, tag) {
      const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
      const seq = new NodeClass(ctx.schema);
      if (ctx.atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = bs.offset;
      let commentEnd = null;
      for (const { start, value } of bs.items) {
        const props = resolveProps.resolveProps(start, {
          indicator: "seq-item-ind",
          next: value,
          offset,
          onError,
          parentIndent: bs.indent,
          startOnNewline: true
        });
        if (!props.found) {
          if (props.anchor || props.tag || value) {
            if (value?.type === "block-seq")
              onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
            else
              onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
          } else {
            commentEnd = props.end;
            if (props.comment)
              seq.comment = props.comment;
            continue;
          }
        }
        const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bs.indent, value, onError);
        offset = node.range[2];
        seq.items.push(node);
      }
      seq.range = [bs.offset, offset, commentEnd ?? offset];
      return seq;
    }
    exports.resolveBlockSeq = resolveBlockSeq;
  }
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS({
  "node_modules/yaml/dist/compose/resolve-end.js"(exports) {
    "use strict";
    function resolveEnd(end, offset, reqSpace, onError) {
      let comment = "";
      if (end) {
        let hasSpace = false;
        let sep = "";
        for (const token of end) {
          const { source, type } = token;
          switch (type) {
            case "space":
              hasSpace = true;
              break;
            case "comment": {
              if (reqSpace && !hasSpace)
                onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
              const cb = source.substring(1) || " ";
              if (!comment)
                comment = cb;
              else
                comment += sep + cb;
              sep = "";
              break;
            }
            case "newline":
              if (comment)
                sep += source;
              hasSpace = true;
              break;
            default:
              onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
          }
          offset += source.length;
        }
      }
      return { comment, offset };
    }
    exports.resolveEnd = resolveEnd;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Pair = require_Pair();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    var utilContainsNewline = require_util_contains_newline();
    var utilMapIncludes = require_util_map_includes();
    var blockMsg = "Block collections are not allowed within flow collections";
    var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
    function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
      const isMap2 = fc.start.source === "{";
      const fcName = isMap2 ? "flow map" : "flow sequence";
      const NodeClass = tag?.nodeClass ?? (isMap2 ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
      const coll = new NodeClass(ctx.schema);
      coll.flow = true;
      const atRoot = ctx.atRoot;
      if (atRoot)
        ctx.atRoot = false;
      if (ctx.atKey)
        ctx.atKey = false;
      let offset = fc.offset + fc.start.source.length;
      for (let i = 0; i < fc.items.length; ++i) {
        const collItem = fc.items[i];
        const { start, key, sep, value } = collItem;
        const props = resolveProps.resolveProps(start, {
          flow: fcName,
          indicator: "explicit-key-ind",
          next: key ?? sep?.[0],
          offset,
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (!props.found) {
          if (!props.anchor && !props.tag && !sep && !value) {
            if (i === 0 && props.comma)
              onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
            else if (i < fc.items.length - 1)
              onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
            if (props.comment) {
              if (coll.comment)
                coll.comment += "\n" + props.comment;
              else
                coll.comment = props.comment;
            }
            offset = props.end;
            continue;
          }
          if (!isMap2 && ctx.options.strict && utilContainsNewline.containsNewline(key))
            onError(
              key,
              // checked by containsNewline()
              "MULTILINE_IMPLICIT_KEY",
              "Implicit keys of flow sequence pairs need to be on a single line"
            );
        }
        if (i === 0) {
          if (props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
        } else {
          if (!props.comma)
            onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
          if (props.comment) {
            let prevItemComment = "";
            loop: for (const st of start) {
              switch (st.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
            if (prevItemComment) {
              let prev = coll.items[coll.items.length - 1];
              if (identity.isPair(prev))
                prev = prev.value ?? prev.key;
              if (prev.comment)
                prev.comment += "\n" + prevItemComment;
              else
                prev.comment = prevItemComment;
              props.comment = props.comment.substring(prevItemComment.length + 1);
            }
          }
        }
        if (!isMap2 && !sep && !props.found) {
          const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
          coll.items.push(valueNode);
          offset = valueNode.range[2];
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else {
          ctx.atKey = true;
          const keyStart = props.end;
          const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
          if (isBlock(key))
            onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
          ctx.atKey = false;
          const valueProps = resolveProps.resolveProps(sep ?? [], {
            flow: fcName,
            indicator: "map-value-ind",
            next: value,
            offset: keyNode.range[2],
            onError,
            parentIndent: fc.indent,
            startOnNewline: false
          });
          if (valueProps.found) {
            if (!isMap2 && !props.found && ctx.options.strict) {
              if (sep)
                for (const st of sep) {
                  if (st === valueProps.found)
                    break;
                  if (st.type === "newline") {
                    onError(st, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                    break;
                  }
                }
              if (props.start < valueProps.found.offset - 1024)
                onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
            }
          } else if (value) {
            if ("source" in value && value.source?.[0] === ":")
              onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
            else
              onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
          }
          const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
          if (valueNode) {
            if (isBlock(value))
              onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
          } else if (valueProps.comment) {
            if (keyNode.comment)
              keyNode.comment += "\n" + valueProps.comment;
            else
              keyNode.comment = valueProps.comment;
          }
          const pair = new Pair.Pair(keyNode, valueNode);
          if (ctx.options.keepSourceTokens)
            pair.srcToken = collItem;
          if (isMap2) {
            const map = coll;
            if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
              onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
            map.items.push(pair);
          } else {
            const map = new YAMLMap.YAMLMap(ctx.schema);
            map.flow = true;
            map.items.push(pair);
            const endRange = (valueNode ?? keyNode).range;
            map.range = [keyNode.range[0], endRange[1], endRange[2]];
            coll.items.push(map);
          }
          offset = valueNode ? valueNode.range[2] : valueProps.end;
        }
      }
      const expectedEnd = isMap2 ? "}" : "]";
      const [ce, ...ee] = fc.end;
      let cePos = offset;
      if (ce?.source === expectedEnd)
        cePos = ce.offset + ce.source.length;
      else {
        const name = fcName[0].toUpperCase() + fcName.substring(1);
        const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
        onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
        if (ce && ce.source.length !== 1)
          ee.unshift(ce);
      }
      if (ee.length > 0) {
        const end = resolveEnd.resolveEnd(ee, cePos, ctx.options.strict, onError);
        if (end.comment) {
          if (coll.comment)
            coll.comment += "\n" + end.comment;
          else
            coll.comment = end.comment;
        }
        coll.range = [fc.offset, cePos, end.offset];
      } else {
        coll.range = [fc.offset, cePos, cePos];
      }
      return coll;
    }
    exports.resolveFlowCollection = resolveFlowCollection;
  }
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS({
  "node_modules/yaml/dist/compose/compose-collection.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var resolveBlockMap = require_resolve_block_map();
    var resolveBlockSeq = require_resolve_block_seq();
    var resolveFlowCollection = require_resolve_flow_collection();
    function resolveCollection(CN, ctx, token, onError, tagName, tag) {
      const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
      const Coll = coll.constructor;
      if (tagName === "!" || tagName === Coll.tagName) {
        coll.tag = Coll.tagName;
        return coll;
      }
      if (tagName)
        coll.tag = tagName;
      return coll;
    }
    function composeCollection(CN, ctx, token, props, onError) {
      const tagToken = props.tag;
      const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
      if (token.type === "block-seq") {
        const { anchor, newlineAfterProp: nl } = props;
        const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
        if (lastProp && (!nl || nl.offset < lastProp.offset)) {
          const message = "Missing newline after block sequence props";
          onError(lastProp, "MISSING_CHAR", message);
        }
      }
      const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
      if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
      let tag = ctx.schema.tags.find((t) => t.tag === tagName && t.collection === expType);
      if (!tag) {
        const kt = ctx.schema.knownTags[tagName];
        if (kt?.collection === expType) {
          ctx.schema.tags.push(Object.assign({}, kt, { default: false }));
          tag = kt;
        } else {
          if (kt) {
            onError(tagToken, "BAD_COLLECTION_TYPE", `${kt.tag} used for ${expType} collection, but expects ${kt.collection ?? "scalar"}`, true);
          } else {
            onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
          }
          return resolveCollection(CN, ctx, token, onError, tagName);
        }
      }
      const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
      const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
      const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
      node.range = coll.range;
      node.tag = tagName;
      if (tag?.format)
        node.format = tag.format;
      return node;
    }
    exports.composeCollection = composeCollection;
  }
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-block-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    function resolveBlockScalar(ctx, scalar, onError) {
      const start = scalar.offset;
      const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
      if (!header)
        return { value: "", type: null, comment: "", range: [start, start, start] };
      const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
      const lines = scalar.source ? splitLines(scalar.source) : [];
      let chompStart = lines.length;
      for (let i = lines.length - 1; i >= 0; --i) {
        const content = lines[i][1];
        if (content === "" || content === "\r")
          chompStart = i;
        else
          break;
      }
      if (chompStart === 0) {
        const value2 = header.chomp === "+" && lines.length > 0 ? "\n".repeat(Math.max(1, lines.length - 1)) : "";
        let end2 = start + header.length;
        if (scalar.source)
          end2 += scalar.source.length;
        return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
      }
      let trimIndent = scalar.indent + header.indent;
      let offset = scalar.offset + header.length;
      let contentStart = 0;
      for (let i = 0; i < chompStart; ++i) {
        const [indent, content] = lines[i];
        if (content === "" || content === "\r") {
          if (header.indent === 0 && indent.length > trimIndent)
            trimIndent = indent.length;
        } else {
          if (indent.length < trimIndent) {
            const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
            onError(offset + indent.length, "MISSING_CHAR", message);
          }
          if (header.indent === 0)
            trimIndent = indent.length;
          contentStart = i;
          if (trimIndent === 0 && !ctx.atRoot) {
            const message = "Block scalar values in collections must be indented";
            onError(offset, "BAD_INDENT", message);
          }
          break;
        }
        offset += indent.length + content.length + 1;
      }
      for (let i = lines.length - 1; i >= chompStart; --i) {
        if (lines[i][0].length > trimIndent)
          chompStart = i + 1;
      }
      let value = "";
      let sep = "";
      let prevMoreIndented = false;
      for (let i = 0; i < contentStart; ++i)
        value += lines[i][0].slice(trimIndent) + "\n";
      for (let i = contentStart; i < chompStart; ++i) {
        let [indent, content] = lines[i];
        offset += indent.length + content.length + 1;
        const crlf = content[content.length - 1] === "\r";
        if (crlf)
          content = content.slice(0, -1);
        if (content && indent.length < trimIndent) {
          const src = header.indent ? "explicit indentation indicator" : "first line";
          const message = `Block scalar lines must not be less indented than their ${src}`;
          onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
          indent = "";
        }
        if (type === Scalar.Scalar.BLOCK_LITERAL) {
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
        } else if (indent.length > trimIndent || content[0] === "	") {
          if (sep === " ")
            sep = "\n";
          else if (!prevMoreIndented && sep === "\n")
            sep = "\n\n";
          value += sep + indent.slice(trimIndent) + content;
          sep = "\n";
          prevMoreIndented = true;
        } else if (content === "") {
          if (sep === "\n")
            value += "\n";
          else
            sep = "\n";
        } else {
          value += sep + content;
          sep = " ";
          prevMoreIndented = false;
        }
      }
      switch (header.chomp) {
        case "-":
          break;
        case "+":
          for (let i = chompStart; i < lines.length; ++i)
            value += "\n" + lines[i][0].slice(trimIndent);
          if (value[value.length - 1] !== "\n")
            value += "\n";
          break;
        default:
          value += "\n";
      }
      const end = start + header.length + scalar.source.length;
      return { value, type, comment: header.comment, range: [start, end, end] };
    }
    function parseBlockScalarHeader({ offset, props }, strict, onError) {
      if (props[0].type !== "block-scalar-header") {
        onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
        return null;
      }
      const { source } = props[0];
      const mode = source[0];
      let indent = 0;
      let chomp = "";
      let error = -1;
      for (let i = 1; i < source.length; ++i) {
        const ch = source[i];
        if (!chomp && (ch === "-" || ch === "+"))
          chomp = ch;
        else {
          const n = Number(ch);
          if (!indent && n)
            indent = n;
          else if (error === -1)
            error = offset + i;
        }
      }
      if (error !== -1)
        onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
      let hasSpace = false;
      let comment = "";
      let length = source.length;
      for (let i = 1; i < props.length; ++i) {
        const token = props[i];
        switch (token.type) {
          case "space":
            hasSpace = true;
          // fallthrough
          case "newline":
            length += token.source.length;
            break;
          case "comment":
            if (strict && !hasSpace) {
              const message = "Comments must be separated from other tokens by white space characters";
              onError(token, "MISSING_CHAR", message);
            }
            length += token.source.length;
            comment = token.source.substring(1);
            break;
          case "error":
            onError(token, "UNEXPECTED_TOKEN", token.message);
            length += token.source.length;
            break;
          /* istanbul ignore next should not happen */
          default: {
            const message = `Unexpected token in block scalar header: ${token.type}`;
            onError(token, "UNEXPECTED_TOKEN", message);
            const ts = token.source;
            if (ts && typeof ts === "string")
              length += ts.length;
          }
        }
      }
      return { mode, indent, chomp, comment, length };
    }
    function splitLines(source) {
      const split = source.split(/\n( *)/);
      const first = split[0];
      const m = first.match(/^( *)/);
      const line0 = m?.[1] ? [m[1], first.slice(m[1].length)] : ["", first];
      const lines = [line0];
      for (let i = 1; i < split.length; i += 2)
        lines.push([split[i], split[i + 1]]);
      return lines;
    }
    exports.resolveBlockScalar = resolveBlockScalar;
  }
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS({
  "node_modules/yaml/dist/compose/resolve-flow-scalar.js"(exports) {
    "use strict";
    var Scalar = require_Scalar();
    var resolveEnd = require_resolve_end();
    function resolveFlowScalar(scalar, strict, onError) {
      const { offset, type, source, end } = scalar;
      let _type;
      let value;
      const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
      switch (type) {
        case "scalar":
          _type = Scalar.Scalar.PLAIN;
          value = plainValue(source, _onError);
          break;
        case "single-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_SINGLE;
          value = singleQuotedValue(source, _onError);
          break;
        case "double-quoted-scalar":
          _type = Scalar.Scalar.QUOTE_DOUBLE;
          value = doubleQuotedValue(source, _onError);
          break;
        /* istanbul ignore next should not happen */
        default:
          onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
          return {
            value: "",
            type: null,
            comment: "",
            range: [offset, offset + source.length, offset + source.length]
          };
      }
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
      return {
        value,
        type: _type,
        comment: re.comment,
        range: [offset, valueEnd, re.offset]
      };
    }
    function plainValue(source, onError) {
      let badChar = "";
      switch (source[0]) {
        /* istanbul ignore next should not happen */
        case "	":
          badChar = "a tab character";
          break;
        case ",":
          badChar = "flow indicator character ,";
          break;
        case "%":
          badChar = "directive indicator character %";
          break;
        case "|":
        case ">": {
          badChar = `block scalar indicator ${source[0]}`;
          break;
        }
        case "@":
        case "`": {
          badChar = `reserved character ${source[0]}`;
          break;
        }
      }
      if (badChar)
        onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
      return unfoldLines(source);
    }
    function singleQuotedValue(source, onError) {
      if (source[source.length - 1] !== "'" || source.length === 1)
        onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
      return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
    }
    function unfoldLines(source) {
      const line = /(.*?)\r?\n/sy;
      let match = line.exec(source);
      if (!match)
        return source;
      let trimEnd, trimBoth;
      try {
        trimEnd = new RegExp("(?<![ 	])[ 	]+$");
        trimBoth = new RegExp("^[ 	]+|(?<![ 	])[ 	]+$", "g");
      } catch {
        trimEnd = /[ \t]+$/;
        trimBoth = /^[ \t]+|[ \t]+$/g;
      }
      let res = match[1].replace(trimEnd, "");
      let sep = " ";
      let pos = line.lastIndex;
      while (match = line.exec(source)) {
        const lm = match[1].replace(trimBoth, "");
        if (lm === "") {
          if (sep === "\n")
            res += sep;
          else
            sep = "\n";
        } else {
          res += sep + lm;
          sep = " ";
        }
        pos = line.lastIndex;
      }
      const last = /[ \t]*(.*)/sy;
      last.lastIndex = pos;
      match = last.exec(source);
      return res + sep + (match?.[1] ?? "");
    }
    function doubleQuotedValue(source, onError) {
      let res = "";
      for (let i = 1; i < source.length - 1; ++i) {
        const ch = source[i];
        if (ch === "\r" && source[i + 1] === "\n")
          continue;
        if (ch === "\n") {
          const { fold, offset } = foldNewline(source, i);
          res += fold;
          i = offset;
        } else if (ch === "\\") {
          let next = source[++i];
          const cc = escapeCodes[next];
          if (cc)
            res += cc;
          else if (next === "\n") {
            next = source[i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "\r" && source[i + 1] === "\n") {
            next = source[++i + 1];
            while (next === " " || next === "	")
              next = source[++i + 1];
          } else if (next === "x" || next === "u" || next === "U") {
            const length = next === "x" ? 2 : next === "u" ? 4 : 8;
            res += parseCharCode(source, i + 1, length, onError);
            i += length;
          } else {
            const raw = source.substr(i - 1, 2);
            onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
            res += raw;
          }
        } else if (ch === " " || ch === "	") {
          const wsStart = i;
          let next = source[i + 1];
          while (next === " " || next === "	")
            next = source[++i + 1];
          if (next !== "\n" && !(next === "\r" && source[i + 2] === "\n"))
            res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
        } else {
          res += ch;
        }
      }
      if (source[source.length - 1] !== '"' || source.length === 1)
        onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
      return res;
    }
    function foldNewline(source, offset) {
      let fold = "";
      let ch = source[offset + 1];
      while (ch === " " || ch === "	" || ch === "\n" || ch === "\r") {
        if (ch === "\r" && source[offset + 2] !== "\n")
          break;
        if (ch === "\n")
          fold += "\n";
        offset += 1;
        ch = source[offset + 1];
      }
      if (!fold)
        fold = " ";
      return { fold, offset };
    }
    var escapeCodes = {
      "0": "\0",
      // null character
      a: "\x07",
      // bell character
      b: "\b",
      // backspace
      e: "\x1B",
      // escape character
      f: "\f",
      // form feed
      n: "\n",
      // line feed
      r: "\r",
      // carriage return
      t: "	",
      // horizontal tab
      v: "\v",
      // vertical tab
      N: "\x85",
      // Unicode next line
      _: "\xA0",
      // Unicode non-breaking space
      L: "\u2028",
      // Unicode line separator
      P: "\u2029",
      // Unicode paragraph separator
      " ": " ",
      '"': '"',
      "/": "/",
      "\\": "\\",
      "	": "	"
    };
    function parseCharCode(source, offset, length, onError) {
      const cc = source.substr(offset, length);
      const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
      const code = ok ? parseInt(cc, 16) : NaN;
      try {
        return String.fromCodePoint(code);
      } catch {
        const raw = source.substr(offset - 2, length + 2);
        onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
        return raw;
      }
    }
    exports.resolveFlowScalar = resolveFlowScalar;
  }
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS({
  "node_modules/yaml/dist/compose/compose-scalar.js"(exports) {
    "use strict";
    var identity = require_identity();
    var Scalar = require_Scalar();
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    function composeScalar(ctx, token, tagToken, onError) {
      const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
      const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
      let tag;
      if (ctx.options.stringKeys && ctx.atKey) {
        tag = ctx.schema[identity.SCALAR];
      } else if (tagName)
        tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
      else if (token.type === "scalar")
        tag = findScalarTagByTest(ctx, value, token, onError);
      else
        tag = ctx.schema[identity.SCALAR];
      let scalar;
      try {
        const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
        scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
        scalar = new Scalar.Scalar(value);
      }
      scalar.range = range;
      scalar.source = value;
      if (type)
        scalar.type = type;
      if (tagName)
        scalar.tag = tagName;
      if (tag.format)
        scalar.format = tag.format;
      if (comment)
        scalar.comment = comment;
      return scalar;
    }
    function findScalarTagByName(schema2, value, tagName, tagToken, onError) {
      if (tagName === "!")
        return schema2[identity.SCALAR];
      const matchWithTest = [];
      for (const tag of schema2.tags) {
        if (!tag.collection && tag.tag === tagName) {
          if (tag.default && tag.test)
            matchWithTest.push(tag);
          else
            return tag;
        }
      }
      for (const tag of matchWithTest)
        if (tag.test?.test(value))
          return tag;
      const kt = schema2.knownTags[tagName];
      if (kt && !kt.collection) {
        schema2.tags.push(Object.assign({}, kt, { default: false, test: void 0 }));
        return kt;
      }
      onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
      return schema2[identity.SCALAR];
    }
    function findScalarTagByTest({ atKey, directives, schema: schema2 }, value, token, onError) {
      const tag = schema2.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema2[identity.SCALAR];
      if (schema2.compat) {
        const compat = schema2.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema2[identity.SCALAR];
        if (tag.tag !== compat.tag) {
          const ts = directives.tagString(tag.tag);
          const cs = directives.tagString(compat.tag);
          const msg = `Value may be parsed as either ${ts} or ${cs}`;
          onError(token, "TAG_RESOLVE_FAILED", msg, true);
        }
      }
      return tag;
    }
    exports.composeScalar = composeScalar;
  }
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS({
  "node_modules/yaml/dist/compose/util-empty-scalar-position.js"(exports) {
    "use strict";
    function emptyScalarPosition(offset, before, pos) {
      if (before) {
        pos ?? (pos = before.length);
        for (let i = pos - 1; i >= 0; --i) {
          let st = before[i];
          switch (st.type) {
            case "space":
            case "comment":
            case "newline":
              offset -= st.source.length;
              continue;
          }
          st = before[++i];
          while (st?.type === "space") {
            offset += st.source.length;
            st = before[++i];
          }
          break;
        }
      }
      return offset;
    }
    exports.emptyScalarPosition = emptyScalarPosition;
  }
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS({
  "node_modules/yaml/dist/compose/compose-node.js"(exports) {
    "use strict";
    var Alias = require_Alias();
    var identity = require_identity();
    var composeCollection = require_compose_collection();
    var composeScalar = require_compose_scalar();
    var resolveEnd = require_resolve_end();
    var utilEmptyScalarPosition = require_util_empty_scalar_position();
    var CN = { composeNode, composeEmptyNode };
    function composeNode(ctx, token, props, onError) {
      const atKey = ctx.atKey;
      const { spaceBefore, comment, anchor, tag } = props;
      let node;
      let isSrcToken = true;
      switch (token.type) {
        case "alias":
          node = composeAlias(ctx, token, onError);
          if (anchor || tag)
            onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
          break;
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "block-scalar":
          node = composeScalar.composeScalar(ctx, token, tag, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
          break;
        case "block-map":
        case "block-seq":
        case "flow-collection":
          try {
            node = composeCollection.composeCollection(CN, ctx, token, props, onError);
            if (anchor)
              node.anchor = anchor.source.substring(1);
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            onError(token, "RESOURCE_EXHAUSTION", message);
          }
          break;
        default: {
          const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
          onError(token, "UNEXPECTED_TOKEN", message);
          isSrcToken = false;
        }
      }
      node ?? (node = composeEmptyNode(ctx, token.offset, void 0, null, props, onError));
      if (anchor && node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
        const msg = "With stringKeys, all keys must be strings";
        onError(tag ?? token, "NON_STRING_KEY", msg);
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        if (token.type === "scalar" && token.source === "")
          node.comment = comment;
        else
          node.commentBefore = comment;
      }
      if (ctx.options.keepSourceTokens && isSrcToken)
        node.srcToken = token;
      return node;
    }
    function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
      const token = {
        type: "scalar",
        offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
        indent: -1,
        source: ""
      };
      const node = composeScalar.composeScalar(ctx, token, tag, onError);
      if (anchor) {
        node.anchor = anchor.source.substring(1);
        if (node.anchor === "")
          onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
      }
      if (spaceBefore)
        node.spaceBefore = true;
      if (comment) {
        node.comment = comment;
        node.range[2] = end;
      }
      return node;
    }
    function composeAlias({ options }, { offset, source, end }, onError) {
      const alias = new Alias.Alias(source.substring(1));
      if (alias.source === "")
        onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
      if (alias.source.endsWith(":"))
        onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
      const valueEnd = offset + source.length;
      const re = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
      alias.range = [offset, valueEnd, re.offset];
      if (re.comment)
        alias.comment = re.comment;
      return alias;
    }
    exports.composeEmptyNode = composeEmptyNode;
    exports.composeNode = composeNode;
  }
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS({
  "node_modules/yaml/dist/compose/compose-doc.js"(exports) {
    "use strict";
    var Document = require_Document();
    var composeNode = require_compose_node();
    var resolveEnd = require_resolve_end();
    var resolveProps = require_resolve_props();
    function composeDoc(options, directives, { offset, start, value, end }, onError) {
      const opts = Object.assign({ _directives: directives }, options);
      const doc = new Document.Document(void 0, opts);
      const ctx = {
        atKey: false,
        atRoot: true,
        directives: doc.directives,
        options: doc.options,
        schema: doc.schema
      };
      const props = resolveProps.resolveProps(start, {
        indicator: "doc-start",
        next: value ?? end?.[0],
        offset,
        onError,
        parentIndent: 0,
        startOnNewline: true
      });
      if (props.found) {
        doc.directives.docStart = true;
        if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
          onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
      }
      doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
      const contentEnd = doc.contents.range[2];
      const re = resolveEnd.resolveEnd(end, contentEnd, false, onError);
      if (re.comment)
        doc.comment = re.comment;
      doc.range = [offset, contentEnd, re.offset];
      return doc;
    }
    exports.composeDoc = composeDoc;
  }
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS({
  "node_modules/yaml/dist/compose/composer.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var directives = require_directives();
    var Document = require_Document();
    var errors = require_errors();
    var identity = require_identity();
    var composeDoc = require_compose_doc();
    var resolveEnd = require_resolve_end();
    function getErrorPos(src) {
      if (typeof src === "number")
        return [src, src + 1];
      if (Array.isArray(src))
        return src.length === 2 ? src : [src[0], src[1]];
      const { offset, source } = src;
      return [offset, offset + (typeof source === "string" ? source.length : 1)];
    }
    function parsePrelude(prelude) {
      let comment = "";
      let atComment = false;
      let afterEmptyLine = false;
      for (let i = 0; i < prelude.length; ++i) {
        const source = prelude[i];
        switch (source[0]) {
          case "#":
            comment += (comment === "" ? "" : afterEmptyLine ? "\n\n" : "\n") + (source.substring(1) || " ");
            atComment = true;
            afterEmptyLine = false;
            break;
          case "%":
            if (prelude[i + 1]?.[0] !== "#")
              i += 1;
            atComment = false;
            break;
          default:
            if (!atComment)
              afterEmptyLine = true;
            atComment = false;
        }
      }
      return { comment, afterEmptyLine };
    }
    var Composer = class {
      constructor(options = {}) {
        this.doc = null;
        this.atDirectives = false;
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
        this.onError = (source, code, message, warning) => {
          const pos = getErrorPos(source);
          if (warning)
            this.warnings.push(new errors.YAMLWarning(pos, code, message));
          else
            this.errors.push(new errors.YAMLParseError(pos, code, message));
        };
        this.directives = new directives.Directives({ version: options.version || "1.2" });
        this.options = options;
      }
      decorate(doc, afterDoc) {
        const { comment, afterEmptyLine } = parsePrelude(this.prelude);
        if (comment) {
          const dc = doc.contents;
          if (afterDoc) {
            doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
          } else if (afterEmptyLine || doc.directives.docStart || !dc) {
            doc.commentBefore = comment;
          } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
            let it = dc.items[0];
            if (identity.isPair(it))
              it = it.key;
            const cb = it.commentBefore;
            it.commentBefore = cb ? `${comment}
${cb}` : comment;
          } else {
            const cb = dc.commentBefore;
            dc.commentBefore = cb ? `${comment}
${cb}` : comment;
          }
        }
        if (afterDoc) {
          for (let i = 0; i < this.errors.length; ++i)
            doc.errors.push(this.errors[i]);
          for (let i = 0; i < this.warnings.length; ++i)
            doc.warnings.push(this.warnings[i]);
        } else {
          doc.errors = this.errors;
          doc.warnings = this.warnings;
        }
        this.prelude = [];
        this.errors = [];
        this.warnings = [];
      }
      /**
       * Current stream status information.
       *
       * Mostly useful at the end of input for an empty stream.
       */
      streamInfo() {
        return {
          comment: parsePrelude(this.prelude).comment,
          directives: this.directives,
          errors: this.errors,
          warnings: this.warnings
        };
      }
      /**
       * Compose tokens into documents.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *compose(tokens, forceDoc = false, endOffset = -1) {
        for (const token of tokens)
          yield* this.next(token);
        yield* this.end(forceDoc, endOffset);
      }
      /** Advance the composer by one CST token. */
      *next(token) {
        if (node_process.env.LOG_STREAM)
          console.dir(token, { depth: null });
        switch (token.type) {
          case "directive":
            this.directives.add(token.source, (offset, message, warning) => {
              const pos = getErrorPos(token);
              pos[0] += offset;
              this.onError(pos, "BAD_DIRECTIVE", message, warning);
            });
            this.prelude.push(token.source);
            this.atDirectives = true;
            break;
          case "document": {
            const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
            if (this.atDirectives && !doc.directives.docStart)
              this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
            this.decorate(doc, false);
            if (this.doc)
              yield this.doc;
            this.doc = doc;
            this.atDirectives = false;
            break;
          }
          case "byte-order-mark":
          case "space":
            break;
          case "comment":
          case "newline":
            this.prelude.push(token.source);
            break;
          case "error": {
            const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
            const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
            if (this.atDirectives || !this.doc)
              this.errors.push(error);
            else
              this.doc.errors.push(error);
            break;
          }
          case "doc-end": {
            if (!this.doc) {
              const msg = "Unexpected doc-end without preceding document";
              this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
              break;
            }
            this.doc.directives.docEnd = true;
            const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
            this.decorate(this.doc, true);
            if (end.comment) {
              const dc = this.doc.comment;
              this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
            }
            this.doc.range[2] = end.offset;
            break;
          }
          default:
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
        }
      }
      /**
       * Call at end of input to yield any remaining document.
       *
       * @param forceDoc - If the stream contains no document, still emit a final document including any comments and directives that would be applied to a subsequent document.
       * @param endOffset - Should be set if `forceDoc` is also set, to set the document range end and to indicate errors correctly.
       */
      *end(forceDoc = false, endOffset = -1) {
        if (this.doc) {
          this.decorate(this.doc, true);
          yield this.doc;
          this.doc = null;
        } else if (forceDoc) {
          const opts = Object.assign({ _directives: this.directives }, this.options);
          const doc = new Document.Document(void 0, opts);
          if (this.atDirectives)
            this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
          doc.range = [0, endOffset, endOffset];
          this.decorate(doc, false);
          yield doc;
        }
      }
    };
    exports.Composer = Composer;
  }
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS({
  "node_modules/yaml/dist/parse/cst-scalar.js"(exports) {
    "use strict";
    var resolveBlockScalar = require_resolve_block_scalar();
    var resolveFlowScalar = require_resolve_flow_scalar();
    var errors = require_errors();
    var stringifyString = require_stringifyString();
    function resolveAsScalar(token, strict = true, onError) {
      if (token) {
        const _onError = (pos, code, message) => {
          const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
          if (onError)
            onError(offset, code, message);
          else
            throw new errors.YAMLParseError([offset, offset + 1], code, message);
        };
        switch (token.type) {
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
          case "block-scalar":
            return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
        }
      }
      return null;
    }
    function createScalarToken(value, context) {
      const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey,
        indent: indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      const end = context.end ?? [
        { type: "newline", offset: -1, indent, source: "\n" }
      ];
      switch (source[0]) {
        case "|":
        case ">": {
          const he = source.indexOf("\n");
          const head = source.substring(0, he);
          const body = source.substring(he + 1) + "\n";
          const props = [
            { type: "block-scalar-header", offset, indent, source: head }
          ];
          if (!addEndtoBlockProps(props, end))
            props.push({ type: "newline", offset: -1, indent, source: "\n" });
          return { type: "block-scalar", offset, indent, props, source: body };
        }
        case '"':
          return { type: "double-quoted-scalar", offset, indent, source, end };
        case "'":
          return { type: "single-quoted-scalar", offset, indent, source, end };
        default:
          return { type: "scalar", offset, indent, source, end };
      }
    }
    function setScalarValue(token, value, context = {}) {
      let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
      let indent = "indent" in token ? token.indent : null;
      if (afterKey && typeof indent === "number")
        indent += 2;
      if (!type)
        switch (token.type) {
          case "single-quoted-scalar":
            type = "QUOTE_SINGLE";
            break;
          case "double-quoted-scalar":
            type = "QUOTE_DOUBLE";
            break;
          case "block-scalar": {
            const header = token.props[0];
            if (header.type !== "block-scalar-header")
              throw new Error("Invalid block scalar header");
            type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
            break;
          }
          default:
            type = "PLAIN";
        }
      const source = stringifyString.stringifyString({ type, value }, {
        implicitKey: implicitKey || indent === null,
        indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
        inFlow,
        options: { blockQuote: true, lineWidth: -1 }
      });
      switch (source[0]) {
        case "|":
        case ">":
          setBlockScalarValue(token, source);
          break;
        case '"':
          setFlowScalarValue(token, source, "double-quoted-scalar");
          break;
        case "'":
          setFlowScalarValue(token, source, "single-quoted-scalar");
          break;
        default:
          setFlowScalarValue(token, source, "scalar");
      }
    }
    function setBlockScalarValue(token, source) {
      const he = source.indexOf("\n");
      const head = source.substring(0, he);
      const body = source.substring(he + 1) + "\n";
      if (token.type === "block-scalar") {
        const header = token.props[0];
        if (header.type !== "block-scalar-header")
          throw new Error("Invalid block scalar header");
        header.source = head;
        token.source = body;
      } else {
        const { offset } = token;
        const indent = "indent" in token ? token.indent : -1;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, "end" in token ? token.end : void 0))
          props.push({ type: "newline", offset: -1, indent, source: "\n" });
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type: "block-scalar", indent, props, source: body });
      }
    }
    function addEndtoBlockProps(props, end) {
      if (end)
        for (const st of end)
          switch (st.type) {
            case "space":
            case "comment":
              props.push(st);
              break;
            case "newline":
              props.push(st);
              return true;
          }
      return false;
    }
    function setFlowScalarValue(token, source, type) {
      switch (token.type) {
        case "scalar":
        case "double-quoted-scalar":
        case "single-quoted-scalar":
          token.type = type;
          token.source = source;
          break;
        case "block-scalar": {
          const end = token.props.slice(1);
          let oa = source.length;
          if (token.props[0].type === "block-scalar-header")
            oa -= token.props[0].source.length;
          for (const tok of end)
            tok.offset += oa;
          delete token.props;
          Object.assign(token, { type, source, end });
          break;
        }
        case "block-map":
        case "block-seq": {
          const offset = token.offset + source.length;
          const nl = { type: "newline", offset, indent: token.indent, source: "\n" };
          delete token.items;
          Object.assign(token, { type, source, end: [nl] });
          break;
        }
        default: {
          const indent = "indent" in token ? token.indent : -1;
          const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st) => st.type === "space" || st.type === "comment" || st.type === "newline") : [];
          for (const key of Object.keys(token))
            if (key !== "type" && key !== "offset")
              delete token[key];
          Object.assign(token, { type, indent, source, end });
        }
      }
    }
    exports.createScalarToken = createScalarToken;
    exports.resolveAsScalar = resolveAsScalar;
    exports.setScalarValue = setScalarValue;
  }
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS({
  "node_modules/yaml/dist/parse/cst-stringify.js"(exports) {
    "use strict";
    var stringify = (cst) => "type" in cst ? stringifyToken(cst) : stringifyItem(cst);
    function stringifyToken(token) {
      switch (token.type) {
        case "block-scalar": {
          let res = "";
          for (const tok of token.props)
            res += stringifyToken(tok);
          return res + token.source;
        }
        case "block-map":
        case "block-seq": {
          let res = "";
          for (const item of token.items)
            res += stringifyItem(item);
          return res;
        }
        case "flow-collection": {
          let res = token.start.source;
          for (const item of token.items)
            res += stringifyItem(item);
          for (const st of token.end)
            res += st.source;
          return res;
        }
        case "document": {
          let res = stringifyItem(token);
          if (token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
        default: {
          let res = token.source;
          if ("end" in token && token.end)
            for (const st of token.end)
              res += st.source;
          return res;
        }
      }
    }
    function stringifyItem({ start, key, sep, value }) {
      let res = "";
      for (const st of start)
        res += st.source;
      if (key)
        res += stringifyToken(key);
      if (sep)
        for (const st of sep)
          res += st.source;
      if (value)
        res += stringifyToken(value);
      return res;
    }
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS({
  "node_modules/yaml/dist/parse/cst-visit.js"(exports) {
    "use strict";
    var BREAK = /* @__PURE__ */ Symbol("break visit");
    var SKIP = /* @__PURE__ */ Symbol("skip children");
    var REMOVE = /* @__PURE__ */ Symbol("remove item");
    function visit(cst, visitor) {
      if ("type" in cst && cst.type === "document")
        cst = { start: cst.start, value: cst.value };
      _visit(Object.freeze([]), cst, visitor);
    }
    visit.BREAK = BREAK;
    visit.SKIP = SKIP;
    visit.REMOVE = REMOVE;
    visit.itemAtPath = (cst, path2) => {
      let item = cst;
      for (const [field, index] of path2) {
        const tok = item?.[field];
        if (tok && "items" in tok) {
          item = tok.items[index];
        } else
          return void 0;
      }
      return item;
    };
    visit.parentCollection = (cst, path2) => {
      const parent = visit.itemAtPath(cst, path2.slice(0, -1));
      const field = path2[path2.length - 1][0];
      const coll = parent?.[field];
      if (coll && "items" in coll)
        return coll;
      throw new Error("Parent collection not found");
    };
    function _visit(path2, item, visitor) {
      let ctrl = visitor(item, path2);
      if (typeof ctrl === "symbol")
        return ctrl;
      for (const field of ["key", "value"]) {
        const token = item[field];
        if (token && "items" in token) {
          for (let i = 0; i < token.items.length; ++i) {
            const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
            if (typeof ci === "number")
              i = ci - 1;
            else if (ci === BREAK)
              return BREAK;
            else if (ci === REMOVE) {
              token.items.splice(i, 1);
              i -= 1;
            }
          }
          if (typeof ctrl === "function" && field === "key")
            ctrl = ctrl(item, path2);
        }
      }
      return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
    }
    exports.visit = visit;
  }
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS({
  "node_modules/yaml/dist/parse/cst.js"(exports) {
    "use strict";
    var cstScalar = require_cst_scalar();
    var cstStringify = require_cst_stringify();
    var cstVisit = require_cst_visit();
    var BOM = "\uFEFF";
    var DOCUMENT = "";
    var FLOW_END = "";
    var SCALAR2 = "";
    var isCollection2 = (token) => !!token && "items" in token;
    var isScalar3 = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
    function prettyToken(token) {
      switch (token) {
        case BOM:
          return "<BOM>";
        case DOCUMENT:
          return "<DOC>";
        case FLOW_END:
          return "<FLOW_END>";
        case SCALAR2:
          return "<SCALAR>";
        default:
          return JSON.stringify(token);
      }
    }
    function tokenType(source) {
      switch (source) {
        case BOM:
          return "byte-order-mark";
        case DOCUMENT:
          return "doc-mode";
        case FLOW_END:
          return "flow-error-end";
        case SCALAR2:
          return "scalar";
        case "---":
          return "doc-start";
        case "...":
          return "doc-end";
        case "":
        case "\n":
        case "\r\n":
          return "newline";
        case "-":
          return "seq-item-ind";
        case "?":
          return "explicit-key-ind";
        case ":":
          return "map-value-ind";
        case "{":
          return "flow-map-start";
        case "}":
          return "flow-map-end";
        case "[":
          return "flow-seq-start";
        case "]":
          return "flow-seq-end";
        case ",":
          return "comma";
      }
      switch (source[0]) {
        case " ":
        case "	":
          return "space";
        case "#":
          return "comment";
        case "%":
          return "directive-line";
        case "*":
          return "alias";
        case "&":
          return "anchor";
        case "!":
          return "tag";
        case "'":
          return "single-quoted-scalar";
        case '"':
          return "double-quoted-scalar";
        case "|":
        case ">":
          return "block-scalar-header";
      }
      return null;
    }
    exports.createScalarToken = cstScalar.createScalarToken;
    exports.resolveAsScalar = cstScalar.resolveAsScalar;
    exports.setScalarValue = cstScalar.setScalarValue;
    exports.stringify = cstStringify.stringify;
    exports.visit = cstVisit.visit;
    exports.BOM = BOM;
    exports.DOCUMENT = DOCUMENT;
    exports.FLOW_END = FLOW_END;
    exports.SCALAR = SCALAR2;
    exports.isCollection = isCollection2;
    exports.isScalar = isScalar3;
    exports.prettyToken = prettyToken;
    exports.tokenType = tokenType;
  }
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS({
  "node_modules/yaml/dist/parse/lexer.js"(exports) {
    "use strict";
    var cst = require_cst();
    function isEmpty(ch) {
      switch (ch) {
        case void 0:
        case " ":
        case "\n":
        case "\r":
        case "	":
          return true;
        default:
          return false;
      }
    }
    var hexDigits = new Set("0123456789ABCDEFabcdef");
    var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
    var flowIndicatorChars = new Set(",[]{}");
    var invalidAnchorChars = new Set(" ,[]{}\n\r	");
    var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);
    var Lexer2 = class {
      constructor() {
        this.atEnd = false;
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        this.buffer = "";
        this.flowKey = false;
        this.flowLevel = 0;
        this.indentNext = 0;
        this.indentValue = 0;
        this.lineEndPos = null;
        this.next = null;
        this.pos = 0;
      }
      /**
       * Generate YAML tokens from the `source` string. If `incomplete`,
       * a part of the last line may be left as a buffer for the next call.
       *
       * @returns A generator of lexical tokens
       */
      *lex(source, incomplete = false) {
        if (source) {
          if (typeof source !== "string")
            throw TypeError("source is not a string");
          this.buffer = this.buffer ? this.buffer + source : source;
          this.lineEndPos = null;
        }
        this.atEnd = !incomplete;
        let next = this.next ?? "stream";
        while (next && (incomplete || this.hasChars(1)))
          next = yield* this.parseNext(next);
      }
      atLineEnd() {
        let i = this.pos;
        let ch = this.buffer[i];
        while (ch === " " || ch === "	")
          ch = this.buffer[++i];
        if (!ch || ch === "#" || ch === "\n")
          return true;
        if (ch === "\r")
          return this.buffer[i + 1] === "\n";
        return false;
      }
      charAt(n) {
        return this.buffer[this.pos + n];
      }
      continueScalar(offset) {
        let ch = this.buffer[offset];
        if (this.indentNext > 0) {
          let indent = 0;
          while (ch === " ")
            ch = this.buffer[++indent + offset];
          if (ch === "\r") {
            const next = this.buffer[indent + offset + 1];
            if (next === "\n" || !next && !this.atEnd)
              return offset + indent + 1;
          }
          return ch === "\n" || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
        }
        if (ch === "-" || ch === ".") {
          const dt = this.buffer.substr(offset, 3);
          if ((dt === "---" || dt === "...") && isEmpty(this.buffer[offset + 3]))
            return -1;
        }
        return offset;
      }
      getLine() {
        let end = this.lineEndPos;
        if (typeof end !== "number" || end !== -1 && end < this.pos) {
          end = this.buffer.indexOf("\n", this.pos);
          this.lineEndPos = end;
        }
        if (end === -1)
          return this.atEnd ? this.buffer.substring(this.pos) : null;
        if (this.buffer[end - 1] === "\r")
          end -= 1;
        return this.buffer.substring(this.pos, end);
      }
      hasChars(n) {
        return this.pos + n <= this.buffer.length;
      }
      setNext(state) {
        this.buffer = this.buffer.substring(this.pos);
        this.pos = 0;
        this.lineEndPos = null;
        this.next = state;
        return null;
      }
      peek(n) {
        return this.buffer.substr(this.pos, n);
      }
      *parseNext(next) {
        switch (next) {
          case "stream":
            return yield* this.parseStream();
          case "line-start":
            return yield* this.parseLineStart();
          case "block-start":
            return yield* this.parseBlockStart();
          case "doc":
            return yield* this.parseDocument();
          case "flow":
            return yield* this.parseFlowCollection();
          case "quoted-scalar":
            return yield* this.parseQuotedScalar();
          case "block-scalar":
            return yield* this.parseBlockScalar();
          case "plain-scalar":
            return yield* this.parsePlainScalar();
        }
      }
      *parseStream() {
        let line = this.getLine();
        if (line === null)
          return this.setNext("stream");
        if (line[0] === cst.BOM) {
          yield* this.pushCount(1);
          line = line.substring(1);
        }
        if (line[0] === "%") {
          let dirEnd = line.length;
          let cs = line.indexOf("#");
          while (cs !== -1) {
            const ch = line[cs - 1];
            if (ch === " " || ch === "	") {
              dirEnd = cs - 1;
              break;
            } else {
              cs = line.indexOf("#", cs + 1);
            }
          }
          while (true) {
            const ch = line[dirEnd - 1];
            if (ch === " " || ch === "	")
              dirEnd -= 1;
            else
              break;
          }
          const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
          yield* this.pushCount(line.length - n);
          this.pushNewline();
          return "stream";
        }
        if (this.atLineEnd()) {
          const sp = yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - sp);
          yield* this.pushNewline();
          return "stream";
        }
        yield cst.DOCUMENT;
        return yield* this.parseLineStart();
      }
      *parseLineStart() {
        const ch = this.charAt(0);
        if (!ch && !this.atEnd)
          return this.setNext("line-start");
        if (ch === "-" || ch === ".") {
          if (!this.atEnd && !this.hasChars(4))
            return this.setNext("line-start");
          const s = this.peek(3);
          if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
            yield* this.pushCount(3);
            this.indentValue = 0;
            this.indentNext = 0;
            return s === "---" ? "doc" : "stream";
          }
        }
        this.indentValue = yield* this.pushSpaces(false);
        if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
          this.indentNext = this.indentValue;
        return yield* this.parseBlockStart();
      }
      *parseBlockStart() {
        const [ch0, ch1] = this.peek(2);
        if (!ch1 && !this.atEnd)
          return this.setNext("block-start");
        if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
          const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
          this.indentNext = this.indentValue + 1;
          this.indentValue += n;
          return "block-start";
        }
        return "doc";
      }
      *parseDocument() {
        yield* this.pushSpaces(true);
        const line = this.getLine();
        if (line === null)
          return this.setNext("doc");
        let n = yield* this.pushIndicators();
        switch (line[n]) {
          case "#":
            yield* this.pushCount(line.length - n);
          // fallthrough
          case void 0:
            yield* this.pushNewline();
            return yield* this.parseLineStart();
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel = 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            return "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "doc";
          case '"':
          case "'":
            return yield* this.parseQuotedScalar();
          case "|":
          case ">":
            n += yield* this.parseBlockScalarHeader();
            n += yield* this.pushSpaces(true);
            yield* this.pushCount(line.length - n);
            yield* this.pushNewline();
            return yield* this.parseBlockScalar();
          default:
            return yield* this.parsePlainScalar();
        }
      }
      *parseFlowCollection() {
        let nl, sp;
        let indent = -1;
        do {
          nl = yield* this.pushNewline();
          if (nl > 0) {
            sp = yield* this.pushSpaces(false);
            this.indentValue = indent = sp;
          } else {
            sp = 0;
          }
          sp += yield* this.pushSpaces(true);
        } while (nl + sp > 0);
        const line = this.getLine();
        if (line === null)
          return this.setNext("flow");
        if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
          const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
          if (!atFlowEndMarker) {
            this.flowLevel = 0;
            yield cst.FLOW_END;
            return yield* this.parseLineStart();
          }
        }
        let n = 0;
        while (line[n] === ",") {
          n += yield* this.pushCount(1);
          n += yield* this.pushSpaces(true);
          this.flowKey = false;
        }
        n += yield* this.pushIndicators();
        switch (line[n]) {
          case void 0:
            return "flow";
          case "#":
            yield* this.pushCount(line.length - n);
            return "flow";
          case "{":
          case "[":
            yield* this.pushCount(1);
            this.flowKey = false;
            this.flowLevel += 1;
            return "flow";
          case "}":
          case "]":
            yield* this.pushCount(1);
            this.flowKey = true;
            this.flowLevel -= 1;
            return this.flowLevel ? "flow" : "doc";
          case "*":
            yield* this.pushUntil(isNotAnchorChar);
            return "flow";
          case '"':
          case "'":
            this.flowKey = true;
            return yield* this.parseQuotedScalar();
          case ":": {
            const next = this.charAt(1);
            if (this.flowKey || isEmpty(next) || next === ",") {
              this.flowKey = false;
              yield* this.pushCount(1);
              yield* this.pushSpaces(true);
              return "flow";
            }
          }
          // fallthrough
          default:
            this.flowKey = false;
            return yield* this.parsePlainScalar();
        }
      }
      *parseQuotedScalar() {
        const quote2 = this.charAt(0);
        let end = this.buffer.indexOf(quote2, this.pos + 1);
        if (quote2 === "'") {
          while (end !== -1 && this.buffer[end + 1] === "'")
            end = this.buffer.indexOf("'", end + 2);
        } else {
          while (end !== -1) {
            let n = 0;
            while (this.buffer[end - 1 - n] === "\\")
              n += 1;
            if (n % 2 === 0)
              break;
            end = this.buffer.indexOf('"', end + 1);
          }
        }
        const qb = this.buffer.substring(0, end);
        let nl = qb.indexOf("\n", this.pos);
        if (nl !== -1) {
          while (nl !== -1) {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = qb.indexOf("\n", cs);
          }
          if (nl !== -1) {
            end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
          }
        }
        if (end === -1) {
          if (!this.atEnd)
            return this.setNext("quoted-scalar");
          end = this.buffer.length;
        }
        yield* this.pushToIndex(end + 1, false);
        return this.flowLevel ? "flow" : "doc";
      }
      *parseBlockScalarHeader() {
        this.blockScalarIndent = -1;
        this.blockScalarKeep = false;
        let i = this.pos;
        while (true) {
          const ch = this.buffer[++i];
          if (ch === "+")
            this.blockScalarKeep = true;
          else if (ch > "0" && ch <= "9")
            this.blockScalarIndent = Number(ch) - 1;
          else if (ch !== "-")
            break;
        }
        return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
      }
      *parseBlockScalar() {
        let nl = this.pos - 1;
        let indent = 0;
        let ch;
        loop: for (let i2 = this.pos; ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case "\n":
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === "\n")
                break;
            }
            // fallthrough
            default:
              break loop;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("block-scalar");
        if (indent >= this.indentNext) {
          if (this.blockScalarIndent === -1)
            this.indentNext = indent;
          else {
            this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
          }
          do {
            const cs = this.continueScalar(nl + 1);
            if (cs === -1)
              break;
            nl = this.buffer.indexOf("\n", cs);
          } while (nl !== -1);
          if (nl === -1) {
            if (!this.atEnd)
              return this.setNext("block-scalar");
            nl = this.buffer.length;
          }
        }
        let i = nl + 1;
        ch = this.buffer[i];
        while (ch === " ")
          ch = this.buffer[++i];
        if (ch === "	") {
          while (ch === "	" || ch === " " || ch === "\r" || ch === "\n")
            ch = this.buffer[++i];
          nl = i - 1;
        } else if (!this.blockScalarKeep) {
          do {
            let i2 = nl - 1;
            let ch2 = this.buffer[i2];
            if (ch2 === "\r")
              ch2 = this.buffer[--i2];
            const lastChar = i2;
            while (ch2 === " ")
              ch2 = this.buffer[--i2];
            if (ch2 === "\n" && i2 >= this.pos && i2 + 1 + indent > lastChar)
              nl = i2;
            else
              break;
          } while (true);
        }
        yield cst.SCALAR;
        yield* this.pushToIndex(nl + 1, true);
        return yield* this.parseLineStart();
      }
      *parsePlainScalar() {
        const inFlow = this.flowLevel > 0;
        let end = this.pos - 1;
        let i = this.pos - 1;
        let ch;
        while (ch = this.buffer[++i]) {
          if (ch === ":") {
            const next = this.buffer[i + 1];
            if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
              break;
            end = i;
          } else if (isEmpty(ch)) {
            let next = this.buffer[i + 1];
            if (ch === "\r") {
              if (next === "\n") {
                i += 1;
                ch = "\n";
                next = this.buffer[i + 1];
              } else
                end = i;
            }
            if (next === "#" || inFlow && flowIndicatorChars.has(next))
              break;
            if (ch === "\n") {
              const cs = this.continueScalar(i + 1);
              if (cs === -1)
                break;
              i = Math.max(i, cs - 2);
            }
          } else {
            if (inFlow && flowIndicatorChars.has(ch))
              break;
            end = i;
          }
        }
        if (!ch && !this.atEnd)
          return this.setNext("plain-scalar");
        yield cst.SCALAR;
        yield* this.pushToIndex(end + 1, true);
        return inFlow ? "flow" : "doc";
      }
      *pushCount(n) {
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos += n;
          return n;
        }
        return 0;
      }
      *pushToIndex(i, allowEmpty) {
        const s = this.buffer.slice(this.pos, i);
        if (s) {
          yield s;
          this.pos += s.length;
          return s.length;
        } else if (allowEmpty)
          yield "";
        return 0;
      }
      *pushIndicators() {
        let n = 0;
        loop: while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            // this is an error
            case "?":
            // this is an error outside flow collections
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
        return n;
      }
      *pushTag() {
        if (this.charAt(1) === "<") {
          let i = this.pos + 2;
          let ch = this.buffer[i];
          while (!isEmpty(ch) && ch !== ">")
            ch = this.buffer[++i];
          return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
        } else {
          let i = this.pos + 1;
          let ch = this.buffer[i];
          while (ch) {
            if (tagChars.has(ch))
              ch = this.buffer[++i];
            else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
              ch = this.buffer[i += 3];
            } else
              break;
          }
          return yield* this.pushToIndex(i, false);
        }
      }
      *pushNewline() {
        const ch = this.buffer[this.pos];
        if (ch === "\n")
          return yield* this.pushCount(1);
        else if (ch === "\r" && this.charAt(1) === "\n")
          return yield* this.pushCount(2);
        else
          return 0;
      }
      *pushSpaces(allowTabs) {
        let i = this.pos - 1;
        let ch;
        do {
          ch = this.buffer[++i];
        } while (ch === " " || allowTabs && ch === "	");
        const n = i - this.pos;
        if (n > 0) {
          yield this.buffer.substr(this.pos, n);
          this.pos = i;
        }
        return n;
      }
      *pushUntil(test) {
        let i = this.pos;
        let ch = this.buffer[i];
        while (!test(ch))
          ch = this.buffer[++i];
        return yield* this.pushToIndex(i, false);
      }
    };
    exports.Lexer = Lexer2;
  }
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS({
  "node_modules/yaml/dist/parse/line-counter.js"(exports) {
    "use strict";
    var LineCounter2 = class {
      constructor() {
        this.lineStarts = [];
        this.addNewLine = (offset) => this.lineStarts.push(offset);
        this.linePos = (offset) => {
          let low = 0;
          let high = this.lineStarts.length;
          while (low < high) {
            const mid = low + high >> 1;
            if (this.lineStarts[mid] < offset)
              low = mid + 1;
            else
              high = mid;
          }
          if (this.lineStarts[low] === offset)
            return { line: low + 1, col: 1 };
          if (low === 0)
            return { line: 0, col: offset };
          const start = this.lineStarts[low - 1];
          return { line: low, col: offset - start + 1 };
        };
      }
    };
    exports.LineCounter = LineCounter2;
  }
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS({
  "node_modules/yaml/dist/parse/parser.js"(exports) {
    "use strict";
    var node_process = __require("process");
    var cst = require_cst();
    var lexer = require_lexer();
    function includesToken(list, type) {
      for (let i = 0; i < list.length; ++i)
        if (list[i].type === type)
          return true;
      return false;
    }
    function findNonEmptyIndex(list) {
      for (let i = 0; i < list.length; ++i) {
        switch (list[i].type) {
          case "space":
          case "comment":
          case "newline":
            break;
          default:
            return i;
        }
      }
      return -1;
    }
    function isFlowToken(token) {
      switch (token?.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
        case "flow-collection":
          return true;
        default:
          return false;
      }
    }
    function getPrevProps(parent) {
      switch (parent.type) {
        case "document":
          return parent.start;
        case "block-map": {
          const it = parent.items[parent.items.length - 1];
          return it.sep ?? it.start;
        }
        case "block-seq":
          return parent.items[parent.items.length - 1].start;
        /* istanbul ignore next should not happen */
        default:
          return [];
      }
    }
    function getFirstKeyStartProps(prev) {
      if (prev.length === 0)
        return [];
      let i = prev.length;
      loop: while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
      while (prev[++i]?.type === "space") {
      }
      return prev.splice(i, prev.length);
    }
    function arrayPushArray(target, source) {
      if (source.length < 1e5)
        Array.prototype.push.apply(target, source);
      else
        for (let i = 0; i < source.length; ++i)
          target.push(source[i]);
    }
    function fixFlowSeqItems(fc) {
      if (fc.start.type === "flow-seq-start") {
        for (const it of fc.items) {
          if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
            if (it.key)
              it.value = it.key;
            delete it.key;
            if (isFlowToken(it.value)) {
              if (it.value.end)
                arrayPushArray(it.value.end, it.sep);
              else
                it.value.end = it.sep;
            } else
              arrayPushArray(it.start, it.sep);
            delete it.sep;
          }
        }
      }
    }
    var Parser2 = class {
      /**
       * @param onNewLine - If defined, called separately with the start position of
       *   each new line (in `parse()`, including the start of input).
       */
      constructor(onNewLine) {
        this.atNewLine = true;
        this.atScalar = false;
        this.indent = 0;
        this.offset = 0;
        this.onKeyLine = false;
        this.stack = [];
        this.source = "";
        this.type = "";
        this.lexer = new lexer.Lexer();
        this.onNewLine = onNewLine;
      }
      /**
       * Parse `source` as a YAML stream.
       * If `incomplete`, a part of the last line may be left as a buffer for the next call.
       *
       * Errors are not thrown, but yielded as `{ type: 'error', message }` tokens.
       *
       * @returns A generator of tokens representing each directive, document, and other structure.
       */
      *parse(source, incomplete = false) {
        if (this.onNewLine && this.offset === 0)
          this.onNewLine(0);
        for (const lexeme of this.lexer.lex(source, incomplete))
          yield* this.next(lexeme);
        if (!incomplete)
          yield* this.end();
      }
      /**
       * Advance the parser by the `source` of one lexical token.
       */
      *next(source) {
        this.source = source;
        if (node_process.env.LOG_TOKENS)
          console.log("|", cst.prettyToken(source));
        if (this.atScalar) {
          this.atScalar = false;
          yield* this.step();
          this.offset += source.length;
          return;
        }
        const type = cst.tokenType(source);
        if (!type) {
          const message = `Not a YAML token: ${source}`;
          yield* this.pop({ type: "error", offset: this.offset, message, source });
          this.offset += source.length;
        } else if (type === "scalar") {
          this.atNewLine = false;
          this.atScalar = true;
          this.type = "scalar";
        } else {
          this.type = type;
          yield* this.step();
          switch (type) {
            case "newline":
              this.atNewLine = true;
              this.indent = 0;
              if (this.onNewLine)
                this.onNewLine(this.offset + source.length);
              break;
            case "space":
              if (this.atNewLine && source[0] === " ")
                this.indent += source.length;
              break;
            case "explicit-key-ind":
            case "map-value-ind":
            case "seq-item-ind":
              if (this.atNewLine)
                this.indent += source.length;
              break;
            case "doc-mode":
            case "flow-error-end":
              return;
            default:
              this.atNewLine = false;
          }
          this.offset += source.length;
        }
      }
      /** Call at end of input to push out any remaining constructions */
      *end() {
        while (this.stack.length > 0)
          yield* this.pop();
      }
      get sourceToken() {
        const st = {
          type: this.type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
        return st;
      }
      *step() {
        const top = this.peek(1);
        if (this.type === "doc-end" && top?.type !== "doc-end") {
          while (this.stack.length > 0)
            yield* this.pop();
          this.stack.push({
            type: "doc-end",
            offset: this.offset,
            source: this.source
          });
          return;
        }
        if (!top)
          return yield* this.stream();
        switch (top.type) {
          case "document":
            return yield* this.document(top);
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return yield* this.scalar(top);
          case "block-scalar":
            return yield* this.blockScalar(top);
          case "block-map":
            return yield* this.blockMap(top);
          case "block-seq":
            return yield* this.blockSequence(top);
          case "flow-collection":
            return yield* this.flowCollection(top);
          case "doc-end":
            return yield* this.documentEnd(top);
        }
        yield* this.pop();
      }
      peek(n) {
        return this.stack[this.stack.length - n];
      }
      *pop(error) {
        const token = error ?? this.stack.pop();
        if (!token) {
          const message = "Tried to pop an empty stack";
          yield { type: "error", offset: this.offset, source: "", message };
        } else if (this.stack.length === 0) {
          yield token;
        } else {
          const top = this.peek(1);
          if (token.type === "block-scalar") {
            token.indent = "indent" in top ? top.indent : 0;
          } else if (token.type === "flow-collection" && top.type === "document") {
            token.indent = 0;
          }
          if (token.type === "flow-collection")
            fixFlowSeqItems(token);
          switch (top.type) {
            case "document":
              top.value = token;
              break;
            case "block-scalar":
              top.props.push(token);
              break;
            case "block-map": {
              const it = top.items[top.items.length - 1];
              if (it.value) {
                top.items.push({ start: [], key: token, sep: [] });
                this.onKeyLine = true;
                return;
              } else if (it.sep) {
                it.value = token;
              } else {
                Object.assign(it, { key: token, sep: [] });
                this.onKeyLine = !it.explicitKey;
                return;
              }
              break;
            }
            case "block-seq": {
              const it = top.items[top.items.length - 1];
              if (it.value)
                top.items.push({ start: [], value: token });
              else
                it.value = token;
              break;
            }
            case "flow-collection": {
              const it = top.items[top.items.length - 1];
              if (!it || it.value)
                top.items.push({ start: [], key: token, sep: [] });
              else if (it.sep)
                it.value = token;
              else
                Object.assign(it, { key: token, sep: [] });
              return;
            }
            /* istanbul ignore next should not happen */
            default:
              yield* this.pop();
              yield* this.pop(token);
          }
          if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
            const last = token.items[token.items.length - 1];
            if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st) => st.type !== "comment" || st.indent < token.indent))) {
              if (top.type === "document")
                top.end = last.start;
              else
                top.items.push({ start: last.start });
              token.items.splice(-1, 1);
            }
          }
        }
      }
      *stream() {
        switch (this.type) {
          case "directive-line":
            yield { type: "directive", offset: this.offset, source: this.source };
            return;
          case "byte-order-mark":
          case "space":
          case "comment":
          case "newline":
            yield this.sourceToken;
            return;
          case "doc-mode":
          case "doc-start": {
            const doc = {
              type: "document",
              offset: this.offset,
              start: []
            };
            if (this.type === "doc-start")
              doc.start.push(this.sourceToken);
            this.stack.push(doc);
            return;
          }
        }
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML stream`,
          source: this.source
        };
      }
      *document(doc) {
        if (doc.value)
          return yield* this.lineEnd(doc);
        switch (this.type) {
          case "doc-start": {
            if (findNonEmptyIndex(doc.start) !== -1) {
              yield* this.pop();
              yield* this.step();
            } else
              doc.start.push(this.sourceToken);
            return;
          }
          case "anchor":
          case "tag":
          case "space":
          case "comment":
          case "newline":
            doc.start.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(doc);
        if (bv)
          this.stack.push(bv);
        else {
          yield {
            type: "error",
            offset: this.offset,
            message: `Unexpected ${this.type} token in YAML document`,
            source: this.source
          };
        }
      }
      *scalar(scalar) {
        if (this.type === "map-value-ind") {
          const prev = getPrevProps(this.peek(2));
          const start = getFirstKeyStartProps(prev);
          let sep;
          if (scalar.end) {
            sep = scalar.end;
            sep.push(this.sourceToken);
            delete scalar.end;
          } else
            sep = [this.sourceToken];
          const map = {
            type: "block-map",
            offset: scalar.offset,
            indent: scalar.indent,
            items: [{ start, key: scalar, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else
          yield* this.lineEnd(scalar);
      }
      *blockScalar(scalar) {
        switch (this.type) {
          case "space":
          case "comment":
          case "newline":
            scalar.props.push(this.sourceToken);
            return;
          case "scalar":
            scalar.source = this.source;
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine) {
              let nl = this.source.indexOf("\n") + 1;
              while (nl !== 0) {
                this.onNewLine(this.offset + nl);
                nl = this.source.indexOf("\n", nl) + 1;
              }
            }
            yield* this.pop();
            break;
          /* istanbul ignore next should not happen */
          default:
            yield* this.pop();
            yield* this.step();
        }
      }
      *blockMap(map) {
        const it = map.items[map.items.length - 1];
        switch (this.type) {
          case "newline":
            this.onKeyLine = false;
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "space":
          case "comment":
            if (it.value) {
              map.items.push({ start: [this.sourceToken] });
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              if (this.atIndentedComment(it.start, map.indent)) {
                const prev = map.items[map.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  map.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
        }
        if (this.indent >= map.indent) {
          const atMapIndent = !this.onKeyLine && this.indent === map.indent;
          const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
          let start = [];
          if (atNextItem && it.sep && !it.value) {
            const nl = [];
            for (let i = 0; i < it.sep.length; ++i) {
              const st = it.sep[i];
              switch (st.type) {
                case "newline":
                  nl.push(i);
                  break;
                case "space":
                  break;
                case "comment":
                  if (st.indent > map.indent)
                    nl.length = 0;
                  break;
                default:
                  nl.length = 0;
              }
            }
            if (nl.length >= 2)
              start = it.sep.splice(nl[1]);
          }
          switch (this.type) {
            case "anchor":
            case "tag":
              if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start });
                this.onKeyLine = true;
              } else if (it.sep) {
                it.sep.push(this.sourceToken);
              } else {
                it.start.push(this.sourceToken);
              }
              return;
            case "explicit-key-ind":
              if (!it.sep && !it.explicitKey) {
                it.start.push(this.sourceToken);
                it.explicitKey = true;
              } else if (atNextItem || it.value) {
                start.push(this.sourceToken);
                map.items.push({ start, explicitKey: true });
              } else {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [this.sourceToken], explicitKey: true }]
                });
              }
              this.onKeyLine = true;
              return;
            case "map-value-ind":
              if (it.explicitKey) {
                if (!it.sep) {
                  if (includesToken(it.start, "newline")) {
                    Object.assign(it, { key: null, sep: [this.sourceToken] });
                  } else {
                    const start2 = getFirstKeyStartProps(it.start);
                    this.stack.push({
                      type: "block-map",
                      offset: this.offset,
                      indent: this.indent,
                      items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                    });
                  }
                } else if (it.value) {
                  map.items.push({ start: [], key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start, key: null, sep: [this.sourceToken] }]
                  });
                } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                  const start2 = getFirstKeyStartProps(it.start);
                  const key = it.key;
                  const sep = it.sep;
                  sep.push(this.sourceToken);
                  delete it.key;
                  delete it.sep;
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key, sep }]
                  });
                } else if (start.length > 0) {
                  it.sep = it.sep.concat(start, this.sourceToken);
                } else {
                  it.sep.push(this.sourceToken);
                }
              } else {
                if (!it.sep) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else if (it.value || atNextItem) {
                  map.items.push({ start, key: null, sep: [this.sourceToken] });
                } else if (includesToken(it.sep, "map-value-ind")) {
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: [], key: null, sep: [this.sourceToken] }]
                  });
                } else {
                  it.sep.push(this.sourceToken);
                }
              }
              this.onKeyLine = true;
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (atNextItem || it.value) {
                map.items.push({ start, key: fs, sep: [] });
                this.onKeyLine = true;
              } else if (it.sep) {
                this.stack.push(fs);
              } else {
                Object.assign(it, { key: fs, sep: [] });
                this.onKeyLine = true;
              }
              return;
            }
            default: {
              const bv = this.startBlockValue(map);
              if (bv) {
                if (bv.type === "block-seq") {
                  if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                    yield* this.pop({
                      type: "error",
                      offset: this.offset,
                      message: "Unexpected block-seq-ind on same line with key",
                      source: this.source
                    });
                    return;
                  }
                } else if (atMapIndent) {
                  map.items.push({ start });
                }
                this.stack.push(bv);
                return;
              }
            }
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *blockSequence(seq) {
        const it = seq.items[seq.items.length - 1];
        switch (this.type) {
          case "newline":
            if (it.value) {
              const end = "end" in it.value ? it.value.end : void 0;
              const last = Array.isArray(end) ? end[end.length - 1] : void 0;
              if (last?.type === "comment")
                end?.push(this.sourceToken);
              else
                seq.items.push({ start: [this.sourceToken] });
            } else
              it.start.push(this.sourceToken);
            return;
          case "space":
          case "comment":
            if (it.value)
              seq.items.push({ start: [this.sourceToken] });
            else {
              if (this.atIndentedComment(it.start, seq.indent)) {
                const prev = seq.items[seq.items.length - 2];
                const end = prev?.value?.end;
                if (Array.isArray(end)) {
                  arrayPushArray(end, it.start);
                  end.push(this.sourceToken);
                  seq.items.pop();
                  return;
                }
              }
              it.start.push(this.sourceToken);
            }
            return;
          case "anchor":
          case "tag":
            if (it.value || this.indent <= seq.indent)
              break;
            it.start.push(this.sourceToken);
            return;
          case "seq-item-ind":
            if (this.indent !== seq.indent)
              break;
            if (it.value || includesToken(it.start, "seq-item-ind"))
              seq.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
        }
        if (this.indent > seq.indent) {
          const bv = this.startBlockValue(seq);
          if (bv) {
            this.stack.push(bv);
            return;
          }
        }
        yield* this.pop();
        yield* this.step();
      }
      *flowCollection(fc) {
        const it = fc.items[fc.items.length - 1];
        if (this.type === "flow-error-end") {
          let top;
          do {
            yield* this.pop();
            top = this.peek(1);
          } while (top?.type === "flow-collection");
        } else if (fc.end.length === 0) {
          switch (this.type) {
            case "comma":
            case "explicit-key-ind":
              if (!it || it.sep)
                fc.items.push({ start: [this.sourceToken] });
              else
                it.start.push(this.sourceToken);
              return;
            case "map-value-ind":
              if (!it || it.value)
                fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              return;
            case "space":
            case "comment":
            case "newline":
            case "anchor":
            case "tag":
              if (!it || it.value)
                fc.items.push({ start: [this.sourceToken] });
              else if (it.sep)
                it.sep.push(this.sourceToken);
              else
                it.start.push(this.sourceToken);
              return;
            case "alias":
            case "scalar":
            case "single-quoted-scalar":
            case "double-quoted-scalar": {
              const fs = this.flowScalar(this.type);
              if (!it || it.value)
                fc.items.push({ start: [], key: fs, sep: [] });
              else if (it.sep)
                this.stack.push(fs);
              else
                Object.assign(it, { key: fs, sep: [] });
              return;
            }
            case "flow-map-end":
            case "flow-seq-end":
              fc.end.push(this.sourceToken);
              return;
          }
          const bv = this.startBlockValue(fc);
          if (bv)
            this.stack.push(bv);
          else {
            yield* this.pop();
            yield* this.step();
          }
        } else {
          const parent = this.peek(2);
          if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
            yield* this.pop();
            yield* this.step();
          } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            fixFlowSeqItems(fc);
            const sep = fc.end.splice(1, fc.end.length);
            sep.push(this.sourceToken);
            const map = {
              type: "block-map",
              offset: fc.offset,
              indent: fc.indent,
              items: [{ start, key: fc, sep }]
            };
            this.onKeyLine = true;
            this.stack[this.stack.length - 1] = map;
          } else {
            yield* this.lineEnd(fc);
          }
        }
      }
      flowScalar(type) {
        if (this.onNewLine) {
          let nl = this.source.indexOf("\n") + 1;
          while (nl !== 0) {
            this.onNewLine(this.offset + nl);
            nl = this.source.indexOf("\n", nl) + 1;
          }
        }
        return {
          type,
          offset: this.offset,
          indent: this.indent,
          source: this.source
        };
      }
      startBlockValue(parent) {
        switch (this.type) {
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar":
            return this.flowScalar(this.type);
          case "block-scalar-header":
            return {
              type: "block-scalar",
              offset: this.offset,
              indent: this.indent,
              props: [this.sourceToken],
              source: ""
            };
          case "flow-map-start":
          case "flow-seq-start":
            return {
              type: "flow-collection",
              offset: this.offset,
              indent: this.indent,
              start: this.sourceToken,
              items: [],
              end: []
            };
          case "seq-item-ind":
            return {
              type: "block-seq",
              offset: this.offset,
              indent: this.indent,
              items: [{ start: [this.sourceToken] }]
            };
          case "explicit-key-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            start.push(this.sourceToken);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, explicitKey: true }]
            };
          }
          case "map-value-ind": {
            this.onKeyLine = true;
            const prev = getPrevProps(parent);
            const start = getFirstKeyStartProps(prev);
            return {
              type: "block-map",
              offset: this.offset,
              indent: this.indent,
              items: [{ start, key: null, sep: [this.sourceToken] }]
            };
          }
        }
        return null;
      }
      atIndentedComment(start, indent) {
        if (this.type !== "comment")
          return false;
        if (this.indent <= indent)
          return false;
        return start.every((st) => st.type === "newline" || st.type === "space");
      }
      *documentEnd(docEnd) {
        if (this.type !== "doc-mode") {
          if (docEnd.end)
            docEnd.end.push(this.sourceToken);
          else
            docEnd.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
        }
      }
      *lineEnd(token) {
        switch (this.type) {
          case "comma":
          case "doc-start":
          case "doc-end":
          case "flow-seq-end":
          case "flow-map-end":
          case "map-value-ind":
            yield* this.pop();
            yield* this.step();
            break;
          case "newline":
            this.onKeyLine = false;
          // fallthrough
          case "space":
          case "comment":
          default:
            if (token.end)
              token.end.push(this.sourceToken);
            else
              token.end = [this.sourceToken];
            if (this.type === "newline")
              yield* this.pop();
        }
      }
    };
    exports.Parser = Parser2;
  }
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS({
  "node_modules/yaml/dist/public-api.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var errors = require_errors();
    var log = require_log();
    var identity = require_identity();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    function parseOptions(options) {
      const prettyErrors = options.prettyErrors !== false;
      const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter() || null;
      return { lineCounter: lineCounter$1, prettyErrors };
    }
    function parseAllDocuments(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      const docs = Array.from(composer$1.compose(parser$1.parse(source)));
      if (prettyErrors && lineCounter2)
        for (const doc of docs) {
          doc.errors.forEach(errors.prettifyError(source, lineCounter2));
          doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
        }
      if (docs.length > 0)
        return docs;
      return Object.assign([], { empty: true }, composer$1.streamInfo());
    }
    function parseDocument2(source, options = {}) {
      const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
      const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
      const composer$1 = new composer.Composer(options);
      let doc = null;
      for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
        if (!doc)
          doc = _doc;
        else if (doc.options.logLevel !== "silent") {
          doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
          break;
        }
      }
      if (prettyErrors && lineCounter2) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
      return doc;
    }
    function parse2(src, reviver2, options) {
      let _reviver = void 0;
      if (typeof reviver2 === "function") {
        _reviver = reviver2;
      } else if (options === void 0 && reviver2 && typeof reviver2 === "object") {
        options = reviver2;
      }
      const doc = parseDocument2(src, options);
      if (!doc)
        return null;
      doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
      if (doc.errors.length > 0) {
        if (doc.options.logLevel !== "silent")
          throw doc.errors[0];
        else
          doc.errors = [];
      }
      return doc.toJS(Object.assign({ reviver: _reviver }, options));
    }
    function stringify(value, replacer2, options) {
      let _replacer = null;
      if (typeof replacer2 === "function" || Array.isArray(replacer2)) {
        _replacer = replacer2;
      } else if (options === void 0 && replacer2) {
        options = replacer2;
      }
      if (typeof options === "string")
        options = options.length;
      if (typeof options === "number") {
        const indent = Math.round(options);
        options = indent < 1 ? void 0 : indent > 8 ? { indent: 8 } : { indent };
      }
      if (value === void 0) {
        const { keepUndefined } = options ?? replacer2 ?? {};
        if (!keepUndefined)
          return void 0;
      }
      if (identity.isDocument(value) && !_replacer)
        return value.toString(options);
      return new Document.Document(value, _replacer, options).toString(options);
    }
    exports.parse = parse2;
    exports.parseAllDocuments = parseAllDocuments;
    exports.parseDocument = parseDocument2;
    exports.stringify = stringify;
  }
});

// node_modules/yaml/dist/index.js
var require_dist = __commonJS({
  "node_modules/yaml/dist/index.js"(exports) {
    "use strict";
    var composer = require_composer();
    var Document = require_Document();
    var Schema = require_Schema();
    var errors = require_errors();
    var Alias = require_Alias();
    var identity = require_identity();
    var Pair = require_Pair();
    var Scalar = require_Scalar();
    var YAMLMap = require_YAMLMap();
    var YAMLSeq = require_YAMLSeq();
    var cst = require_cst();
    var lexer = require_lexer();
    var lineCounter = require_line_counter();
    var parser = require_parser();
    var publicApi = require_public_api();
    var visit = require_visit();
    exports.Composer = composer.Composer;
    exports.Document = Document.Document;
    exports.Schema = Schema.Schema;
    exports.YAMLError = errors.YAMLError;
    exports.YAMLParseError = errors.YAMLParseError;
    exports.YAMLWarning = errors.YAMLWarning;
    exports.Alias = Alias.Alias;
    exports.isAlias = identity.isAlias;
    exports.isCollection = identity.isCollection;
    exports.isDocument = identity.isDocument;
    exports.isMap = identity.isMap;
    exports.isNode = identity.isNode;
    exports.isPair = identity.isPair;
    exports.isScalar = identity.isScalar;
    exports.isSeq = identity.isSeq;
    exports.Pair = Pair.Pair;
    exports.Scalar = Scalar.Scalar;
    exports.YAMLMap = YAMLMap.YAMLMap;
    exports.YAMLSeq = YAMLSeq.YAMLSeq;
    exports.CST = cst;
    exports.Lexer = lexer.Lexer;
    exports.LineCounter = lineCounter.LineCounter;
    exports.Parser = parser.Parser;
    exports.parse = publicApi.parse;
    exports.parseAllDocuments = publicApi.parseAllDocuments;
    exports.parseDocument = publicApi.parseDocument;
    exports.stringify = publicApi.stringify;
    exports.visit = visit.visit;
    exports.visitAsync = visit.visitAsync;
  }
});

// node_modules/cronstrue/dist/cronstrue.js
var require_cronstrue = __commonJS({
  "node_modules/cronstrue/dist/cronstrue.js"(exports, module) {
    (function webpackUniversalModuleDefinition(root, factory) {
      if (typeof exports === "object" && typeof module === "object")
        module.exports = factory();
      else if (typeof define === "function" && define.amd)
        define("cronstrue", [], factory);
      else if (typeof exports === "object")
        exports["cronstrue"] = factory();
      else
        root["cronstrue"] = factory();
    })(globalThis, () => {
      return (
        /******/
        (() => {
          "use strict";
          var __webpack_modules__ = {
            /***/
            949: (
              /***/
              ((__unused_webpack_module, exports2, __webpack_require__2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                exports2.CronParser = void 0;
                var rangeValidator_1 = __webpack_require__2(515);
                var CronParser = (function() {
                  function CronParser2(expression, dayOfWeekStartIndexZero, monthStartIndexZero) {
                    if (dayOfWeekStartIndexZero === void 0) {
                      dayOfWeekStartIndexZero = true;
                    }
                    if (monthStartIndexZero === void 0) {
                      monthStartIndexZero = false;
                    }
                    this.expression = expression;
                    this.dayOfWeekStartIndexZero = dayOfWeekStartIndexZero;
                    this.monthStartIndexZero = monthStartIndexZero;
                  }
                  CronParser2.prototype.parse = function() {
                    var _a;
                    var parsed;
                    var expression = (_a = this.expression) !== null && _a !== void 0 ? _a : "";
                    if (expression.startsWith("@")) {
                      var special = this.parseSpecial(this.expression);
                      parsed = this.extractParts(special);
                    } else {
                      parsed = this.extractParts(this.expression);
                    }
                    this.normalize(parsed);
                    this.validate(parsed);
                    return parsed;
                  };
                  CronParser2.prototype.parseSpecial = function(expression) {
                    var specialExpressions = {
                      "@yearly": "0 0 1 1 *",
                      "@annually": "0 0 1 1 *",
                      "@monthly": "0 0 1 * *",
                      "@weekly": "0 0 * * 0",
                      "@daily": "0 0 * * *",
                      "@midnight": "0 0 * * *",
                      "@hourly": "0 * * * *"
                    };
                    var special = specialExpressions[expression];
                    if (!special) {
                      throw new Error("Unknown special expression.");
                    }
                    return special;
                  };
                  CronParser2.prototype.extractParts = function(expression) {
                    if (!this.expression) {
                      throw new Error("cron expression is empty");
                    }
                    var parsed = expression.trim().split(/[ ]+/);
                    for (var i = 0; i < parsed.length; i++) {
                      if (parsed[i].includes(",")) {
                        var arrayElement = parsed[i].split(",").map(function(item) {
                          return item.trim();
                        }).filter(function(item) {
                          return item !== "";
                        }).map(function(item) {
                          return !isNaN(Number(item)) ? Number(item) : item;
                        }).filter(function(item) {
                          return item !== null && item !== "";
                        });
                        if (arrayElement.length === 0) {
                          arrayElement.push("*");
                        }
                        arrayElement.sort(function(a, b) {
                          return a !== null && b !== null ? a - b : 0;
                        });
                        parsed[i] = arrayElement.map(function(item) {
                          return item !== null ? item.toString() : "";
                        }).join(",");
                      }
                    }
                    if (parsed.length < 5) {
                      throw new Error("Expression has only ".concat(parsed.length, " part").concat(parsed.length == 1 ? "" : "s", ". At least 5 parts are required."));
                    } else if (parsed.length == 5) {
                      parsed.unshift("");
                      parsed.push("");
                    } else if (parsed.length == 6) {
                      var isYearWithNoSecondsPart = /\d{4}$/.test(parsed[5]) || parsed[4] == "?" || parsed[2] == "?";
                      if (isYearWithNoSecondsPart) {
                        parsed.unshift("");
                      } else {
                        parsed.push("");
                      }
                    } else if (parsed.length > 7) {
                      throw new Error("Expression has ".concat(parsed.length, " parts; too many!"));
                    }
                    return parsed;
                  };
                  CronParser2.prototype.normalize = function(expressionParts) {
                    var _this = this;
                    expressionParts[3] = expressionParts[3].replace("?", "*");
                    expressionParts[5] = expressionParts[5].replace("?", "*");
                    expressionParts[2] = expressionParts[2].replace("?", "*");
                    if (expressionParts[0].indexOf("0/") == 0) {
                      expressionParts[0] = expressionParts[0].replace("0/", "*/");
                    }
                    if (expressionParts[1].indexOf("0/") == 0) {
                      expressionParts[1] = expressionParts[1].replace("0/", "*/");
                    }
                    if (expressionParts[2].indexOf("0/") == 0) {
                      expressionParts[2] = expressionParts[2].replace("0/", "*/");
                    }
                    if (expressionParts[3].indexOf("1/") == 0) {
                      expressionParts[3] = expressionParts[3].replace("1/", "*/");
                    }
                    if (expressionParts[4].indexOf("1/") == 0) {
                      expressionParts[4] = expressionParts[4].replace("1/", "*/");
                    }
                    if (expressionParts[6].indexOf("1/") == 0) {
                      expressionParts[6] = expressionParts[6].replace("1/", "*/");
                    }
                    expressionParts[5] = expressionParts[5].replace(/(^\d)|([^#/\s]\d)/g, function(t) {
                      var dowDigits = t.replace(/\D/, "");
                      var dowDigitsAdjusted = dowDigits;
                      if (_this.dayOfWeekStartIndexZero) {
                        if (dowDigits == "7") {
                          dowDigitsAdjusted = "0";
                        }
                      } else {
                        dowDigitsAdjusted = (parseInt(dowDigits) - 1).toString();
                      }
                      return t.replace(dowDigits, dowDigitsAdjusted);
                    });
                    if (expressionParts[5] == "L") {
                      expressionParts[5] = "6";
                    }
                    if (expressionParts[3] == "?") {
                      expressionParts[3] = "*";
                    }
                    if (expressionParts[3].indexOf("W") > -1 && (expressionParts[3].indexOf(",") > -1 || expressionParts[3].indexOf("-") > -1)) {
                      throw new Error("The 'W' character can be specified only when the day-of-month is a single day, not a range or list of days.");
                    }
                    var days = {
                      SUN: 0,
                      MON: 1,
                      TUE: 2,
                      WED: 3,
                      THU: 4,
                      FRI: 5,
                      SAT: 6
                    };
                    for (var day in days) {
                      expressionParts[5] = expressionParts[5].replace(new RegExp(day, "gi"), days[day].toString());
                    }
                    expressionParts[4] = expressionParts[4].replace(/(^\d{1,2})|([^#/\s]\d{1,2})/g, function(t) {
                      var dowDigits = t.replace(/\D/, "");
                      var dowDigitsAdjusted = dowDigits;
                      if (_this.monthStartIndexZero) {
                        dowDigitsAdjusted = (parseInt(dowDigits) + 1).toString();
                      }
                      return t.replace(dowDigits, dowDigitsAdjusted);
                    });
                    var months = {
                      JAN: 1,
                      FEB: 2,
                      MAR: 3,
                      APR: 4,
                      MAY: 5,
                      JUN: 6,
                      JUL: 7,
                      AUG: 8,
                      SEP: 9,
                      OCT: 10,
                      NOV: 11,
                      DEC: 12
                    };
                    for (var month in months) {
                      expressionParts[4] = expressionParts[4].replace(new RegExp(month, "gi"), months[month].toString());
                    }
                    if (expressionParts[0] == "0") {
                      expressionParts[0] = "";
                    }
                    if (!/\*|\-|\,|\//.test(expressionParts[2]) && (/\*|\//.test(expressionParts[1]) || /\*|\//.test(expressionParts[0]))) {
                      expressionParts[2] += "-".concat(expressionParts[2]);
                    }
                    for (var i = 0; i < expressionParts.length; i++) {
                      if (expressionParts[i].indexOf(",") != -1) {
                        expressionParts[i] = expressionParts[i].split(",").filter(function(str2) {
                          return str2 !== "";
                        }).join(",") || "*";
                      }
                      if (expressionParts[i] == "*/1") {
                        expressionParts[i] = "*";
                      }
                      if (expressionParts[i].indexOf("/") > -1 && !/^\*|\-|\,/.test(expressionParts[i])) {
                        var stepRangeThrough = null;
                        switch (i) {
                          case 4:
                            stepRangeThrough = "12";
                            break;
                          case 5:
                            stepRangeThrough = "6";
                            break;
                          case 6:
                            stepRangeThrough = "9999";
                            break;
                          default:
                            stepRangeThrough = null;
                            break;
                        }
                        if (stepRangeThrough !== null) {
                          var parts = expressionParts[i].split("/");
                          expressionParts[i] = "".concat(parts[0], "-").concat(stepRangeThrough, "/").concat(parts[1]);
                        }
                      }
                    }
                  };
                  CronParser2.prototype.validate = function(parsed) {
                    var standardCronPartCharacters = "0-9,\\-*/";
                    this.validateOnlyExpectedCharactersFound(parsed[0], standardCronPartCharacters);
                    this.validateOnlyExpectedCharactersFound(parsed[1], standardCronPartCharacters);
                    this.validateOnlyExpectedCharactersFound(parsed[2], standardCronPartCharacters);
                    this.validateOnlyExpectedCharactersFound(parsed[3], "0-9,\\-*/LW");
                    this.validateOnlyExpectedCharactersFound(parsed[4], standardCronPartCharacters);
                    this.validateOnlyExpectedCharactersFound(parsed[5], "0-9,\\-*/L#");
                    this.validateOnlyExpectedCharactersFound(parsed[6], standardCronPartCharacters);
                    this.validateAnyRanges(parsed);
                  };
                  CronParser2.prototype.validateAnyRanges = function(parsed) {
                    rangeValidator_1.default.secondRange(parsed[0]);
                    rangeValidator_1.default.minuteRange(parsed[1]);
                    rangeValidator_1.default.hourRange(parsed[2]);
                    rangeValidator_1.default.dayOfMonthRange(parsed[3]);
                    rangeValidator_1.default.monthRange(parsed[4], this.monthStartIndexZero);
                    rangeValidator_1.default.dayOfWeekRange(parsed[5], this.dayOfWeekStartIndexZero);
                  };
                  CronParser2.prototype.validateOnlyExpectedCharactersFound = function(cronPart, allowedCharsExpression) {
                    var invalidChars = cronPart.match(new RegExp("[^".concat(allowedCharsExpression, "]+"), "gi"));
                    if (invalidChars && invalidChars.length) {
                      throw new Error("Expression contains invalid values: '".concat(invalidChars.toString(), "'"));
                    }
                  };
                  return CronParser2;
                })();
                exports2.CronParser = CronParser;
              })
            ),
            /***/
            333: (
              /***/
              ((__unused_webpack_module, exports2, __webpack_require__2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                exports2.ExpressionDescriptor = void 0;
                var stringUtilities_1 = __webpack_require__2(823);
                var cronParser_1 = __webpack_require__2(949);
                var ExpressionDescriptor = (function() {
                  function ExpressionDescriptor2(expression, options) {
                    this.expression = expression;
                    this.options = options;
                    this.expressionParts = new Array(5);
                    if (!this.options.locale && ExpressionDescriptor2.defaultLocale) {
                      this.options.locale = ExpressionDescriptor2.defaultLocale;
                    }
                    if (!ExpressionDescriptor2.locales[this.options.locale]) {
                      var fallBackLocale = Object.keys(ExpressionDescriptor2.locales)[0];
                      console.warn("Locale '".concat(this.options.locale, "' could not be found; falling back to '").concat(fallBackLocale, "'."));
                      this.options.locale = fallBackLocale;
                    }
                    this.i18n = ExpressionDescriptor2.locales[this.options.locale];
                    if (options.use24HourTimeFormat === void 0) {
                      options.use24HourTimeFormat = this.i18n.use24HourTimeFormatByDefault();
                    }
                  }
                  ExpressionDescriptor2.toString = function(expression, _a) {
                    var _b = _a === void 0 ? {} : _a, _c = _b.throwExceptionOnParseError, throwExceptionOnParseError = _c === void 0 ? true : _c, _d = _b.verbose, verbose = _d === void 0 ? false : _d, _e = _b.dayOfWeekStartIndexZero, dayOfWeekStartIndexZero = _e === void 0 ? true : _e, _f = _b.monthStartIndexZero, monthStartIndexZero = _f === void 0 ? false : _f, use24HourTimeFormat = _b.use24HourTimeFormat, _g = _b.locale, locale = _g === void 0 ? null : _g, _h = _b.tzOffset, tzOffset = _h === void 0 ? 0 : _h;
                    var options = {
                      throwExceptionOnParseError,
                      verbose,
                      dayOfWeekStartIndexZero,
                      monthStartIndexZero,
                      use24HourTimeFormat,
                      locale,
                      tzOffset
                    };
                    if (options.tzOffset) {
                      console.warn("'tzOffset' option has been deprecated and will be removed in a future release.");
                    }
                    var descripter = new ExpressionDescriptor2(expression, options);
                    return descripter.getFullDescription();
                  };
                  ExpressionDescriptor2.initialize = function(localesLoader, defaultLocale) {
                    if (defaultLocale === void 0) {
                      defaultLocale = "en";
                    }
                    ExpressionDescriptor2.specialCharacters = ["/", "-", ",", "*"];
                    ExpressionDescriptor2.defaultLocale = defaultLocale;
                    localesLoader.load(ExpressionDescriptor2.locales);
                  };
                  ExpressionDescriptor2.prototype.getFullDescription = function() {
                    var description = "";
                    try {
                      var parser = new cronParser_1.CronParser(this.expression, this.options.dayOfWeekStartIndexZero, this.options.monthStartIndexZero);
                      this.expressionParts = parser.parse();
                      var timeSegment = this.getTimeOfDayDescription();
                      var dayOfMonthDesc = this.getDayOfMonthDescription();
                      var monthDesc = this.getMonthDescription();
                      var dayOfWeekDesc = this.getDayOfWeekDescription();
                      var yearDesc = this.getYearDescription();
                      description += timeSegment + dayOfMonthDesc + dayOfWeekDesc + monthDesc + yearDesc;
                      description = this.transformVerbosity(description, !!this.options.verbose);
                      description = description.charAt(0).toLocaleUpperCase() + description.substr(1);
                    } catch (ex) {
                      if (!this.options.throwExceptionOnParseError) {
                        description = this.i18n.anErrorOccuredWhenGeneratingTheExpressionD();
                      } else {
                        throw "".concat(ex);
                      }
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getTimeOfDayDescription = function() {
                    var secondsExpression = this.expressionParts[0];
                    var minuteExpression = this.expressionParts[1];
                    var hourExpression = this.expressionParts[2];
                    var description = "";
                    if (!stringUtilities_1.StringUtilities.containsAny(minuteExpression, ExpressionDescriptor2.specialCharacters) && !stringUtilities_1.StringUtilities.containsAny(hourExpression, ExpressionDescriptor2.specialCharacters) && !stringUtilities_1.StringUtilities.containsAny(secondsExpression, ExpressionDescriptor2.specialCharacters)) {
                      description += this.i18n.atSpace() + this.formatTime(hourExpression, minuteExpression, secondsExpression);
                    } else if (!secondsExpression && minuteExpression.indexOf("-") > -1 && !(minuteExpression.indexOf(",") > -1) && !(minuteExpression.indexOf("/") > -1) && !stringUtilities_1.StringUtilities.containsAny(hourExpression, ExpressionDescriptor2.specialCharacters)) {
                      var minuteParts = minuteExpression.split("-");
                      description += stringUtilities_1.StringUtilities.format(this.i18n.everyMinuteBetweenX0AndX1(), this.formatTime(hourExpression, minuteParts[0], ""), this.formatTime(hourExpression, minuteParts[1], ""));
                    } else if (!secondsExpression && hourExpression.indexOf(",") > -1 && hourExpression.indexOf("-") == -1 && hourExpression.indexOf("/") == -1 && !stringUtilities_1.StringUtilities.containsAny(minuteExpression, ExpressionDescriptor2.specialCharacters)) {
                      var hourParts = hourExpression.split(",");
                      description += this.i18n.at();
                      for (var i = 0; i < hourParts.length; i++) {
                        description += " ";
                        description += this.formatTime(hourParts[i], minuteExpression, "");
                        if (i < hourParts.length - 2) {
                          description += ",";
                        }
                        if (i == hourParts.length - 2) {
                          description += this.i18n.spaceAnd();
                        }
                      }
                    } else {
                      var secondsDescription = this.getSecondsDescription();
                      var minutesDescription = this.getMinutesDescription();
                      var hoursDescription = this.getHoursDescription();
                      description += secondsDescription;
                      if (description && minutesDescription) {
                        description += ", ";
                      }
                      description += minutesDescription;
                      if (minutesDescription === hoursDescription) {
                        return description;
                      }
                      if (description && hoursDescription) {
                        description += ", ";
                      }
                      description += hoursDescription;
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getSecondsDescription = function() {
                    var _this = this;
                    var description = this.getSegmentDescription(this.expressionParts[0], this.i18n.everySecond(), function(s) {
                      return s;
                    }, function(s) {
                      return stringUtilities_1.StringUtilities.format(_this.i18n.everyX0Seconds(s), s);
                    }, function(s) {
                      return _this.i18n.secondsX0ThroughX1PastTheMinute();
                    }, function(s) {
                      return s == "0" ? "" : parseInt(s) < 20 ? _this.i18n.atX0SecondsPastTheMinute(s) : _this.i18n.atX0SecondsPastTheMinuteGt20() || _this.i18n.atX0SecondsPastTheMinute(s);
                    });
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getMinutesDescription = function() {
                    var _this = this;
                    var secondsExpression = this.expressionParts[0];
                    var hourExpression = this.expressionParts[2];
                    var description = this.getSegmentDescription(this.expressionParts[1], this.i18n.everyMinute(), function(s) {
                      return s;
                    }, function(s) {
                      return stringUtilities_1.StringUtilities.format(_this.i18n.everyX0Minutes(s), s);
                    }, function(s) {
                      return _this.i18n.minutesX0ThroughX1PastTheHour();
                    }, function(s) {
                      try {
                        return s == "0" && hourExpression.indexOf("/") == -1 && secondsExpression == "" ? _this.i18n.everyHour() : parseInt(s) < 20 ? _this.i18n.atX0MinutesPastTheHour(s) : _this.i18n.atX0MinutesPastTheHourGt20() || _this.i18n.atX0MinutesPastTheHour(s);
                      } catch (e) {
                        return _this.i18n.atX0MinutesPastTheHour(s);
                      }
                    });
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getHoursDescription = function() {
                    var _this = this;
                    var expression = this.expressionParts[2];
                    var hourIndex = 0;
                    var rangeEndValues = [];
                    expression.split("/")[0].split(",").forEach(function(range) {
                      var rangeParts = range.split("-");
                      if (rangeParts.length === 2) {
                        rangeEndValues.push({ value: rangeParts[1], index: hourIndex + 1 });
                      }
                      hourIndex += rangeParts.length;
                    });
                    var evaluationIndex = 0;
                    var description = this.getSegmentDescription(expression, this.i18n.everyHour(), function(s) {
                      var match = rangeEndValues.find(function(r) {
                        return r.value === s && r.index === evaluationIndex;
                      });
                      var isRangeEndWithNonZeroMinute = match && _this.expressionParts[1] !== "0";
                      evaluationIndex++;
                      return isRangeEndWithNonZeroMinute ? _this.formatTime(s, "59", "") : _this.formatTime(s, "0", "");
                    }, function(s) {
                      return stringUtilities_1.StringUtilities.format(_this.i18n.everyX0Hours(s), s);
                    }, function(s) {
                      return _this.i18n.betweenX0AndX1();
                    }, function(s) {
                      return _this.i18n.atX0();
                    });
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getDayOfWeekDescription = function() {
                    var _this = this;
                    var daysOfWeekNames = this.i18n.daysOfTheWeek();
                    var description = null;
                    if (this.expressionParts[5] == "*") {
                      description = "";
                    } else {
                      description = this.getSegmentDescription(this.expressionParts[5], this.i18n.commaEveryDay(), function(s, form) {
                        var exp = s;
                        if (s.indexOf("#") > -1) {
                          exp = s.substring(0, s.indexOf("#"));
                        } else if (s.indexOf("L") > -1) {
                          exp = exp.replace("L", "");
                        }
                        var parsedExp = parseInt(exp);
                        if (_this.options.tzOffset) {
                          var hourExpression = _this.expressionParts[2];
                          var hour = parseInt(hourExpression) + (_this.options.tzOffset ? _this.options.tzOffset : 0);
                          if (hour >= 24) {
                            parsedExp++;
                          } else if (hour < 0) {
                            parsedExp--;
                          }
                          if (parsedExp > 6) {
                            parsedExp = 0;
                          } else if (parsedExp < 0) {
                            parsedExp = 6;
                          }
                        }
                        var description2 = _this.i18n.daysOfTheWeekInCase ? _this.i18n.daysOfTheWeekInCase(form)[parsedExp] : daysOfWeekNames[parsedExp];
                        if (s.indexOf("#") > -1) {
                          var dayOfWeekOfMonthDescription = null;
                          var dayOfWeekOfMonthNumber = s.substring(s.indexOf("#") + 1);
                          var dayOfWeekNumber = s.substring(0, s.indexOf("#"));
                          switch (dayOfWeekOfMonthNumber) {
                            case "1":
                              dayOfWeekOfMonthDescription = _this.i18n.first(dayOfWeekNumber);
                              break;
                            case "2":
                              dayOfWeekOfMonthDescription = _this.i18n.second(dayOfWeekNumber);
                              break;
                            case "3":
                              dayOfWeekOfMonthDescription = _this.i18n.third(dayOfWeekNumber);
                              break;
                            case "4":
                              dayOfWeekOfMonthDescription = _this.i18n.fourth(dayOfWeekNumber);
                              break;
                            case "5":
                              dayOfWeekOfMonthDescription = _this.i18n.fifth(dayOfWeekNumber);
                              break;
                          }
                          description2 = dayOfWeekOfMonthDescription + " " + description2;
                        }
                        return description2;
                      }, function(s) {
                        if (parseInt(s) == 1) {
                          return "";
                        } else {
                          return stringUtilities_1.StringUtilities.format(_this.i18n.commaEveryX0DaysOfTheWeek(s), s);
                        }
                      }, function(s) {
                        var beginFrom = s.substring(0, s.indexOf("-"));
                        var domSpecified = _this.expressionParts[3] != "*";
                        return domSpecified ? _this.i18n.commaAndX0ThroughX1(beginFrom) : _this.i18n.commaX0ThroughX1(beginFrom);
                      }, function(s) {
                        var format2 = null;
                        if (s.indexOf("#") > -1) {
                          var dayOfWeekOfMonthNumber = s.substring(s.indexOf("#") + 1);
                          var dayOfWeek = s.substring(0, s.indexOf("#"));
                          format2 = _this.i18n.commaOnThe(dayOfWeekOfMonthNumber, dayOfWeek).trim() + _this.i18n.spaceX0OfTheMonth();
                        } else if (s.indexOf("L") > -1) {
                          format2 = _this.i18n.commaOnTheLastX0OfTheMonth(s.replace("L", ""));
                        } else {
                          var domSpecified = _this.expressionParts[3] != "*";
                          format2 = domSpecified ? _this.i18n.commaAndOnX0() : _this.i18n.commaOnlyOnX0(s);
                        }
                        return format2;
                      });
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getMonthDescription = function() {
                    var _this = this;
                    var monthNames = this.i18n.monthsOfTheYear();
                    var description = this.getSegmentDescription(this.expressionParts[4], "", function(s, form) {
                      return form && _this.i18n.monthsOfTheYearInCase ? _this.i18n.monthsOfTheYearInCase(form)[parseInt(s) - 1] : monthNames[parseInt(s) - 1];
                    }, function(s) {
                      if (parseInt(s) == 1) {
                        return "";
                      } else {
                        return stringUtilities_1.StringUtilities.format(_this.i18n.commaEveryX0Months(s), s);
                      }
                    }, function(s) {
                      return _this.i18n.commaMonthX0ThroughMonthX1() || _this.i18n.commaX0ThroughX1();
                    }, function(s) {
                      return _this.i18n.commaOnlyInMonthX0 ? _this.i18n.commaOnlyInMonthX0() : _this.i18n.commaOnlyInX0();
                    });
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getDayOfMonthDescription = function() {
                    var _this = this;
                    var description = null;
                    var expression = this.expressionParts[3];
                    switch (expression) {
                      case "L":
                        description = this.i18n.commaOnTheLastDayOfTheMonth();
                        break;
                      case "WL":
                      case "LW":
                        description = this.i18n.commaOnTheLastWeekdayOfTheMonth();
                        break;
                      default:
                        var weekDayNumberMatches = expression.match(/(\d{1,2}W)|(W\d{1,2})/);
                        if (weekDayNumberMatches) {
                          var dayNumber = parseInt(weekDayNumberMatches[0].replace("W", ""));
                          var dayString = dayNumber == 1 ? this.i18n.firstWeekday() : stringUtilities_1.StringUtilities.format(this.i18n.weekdayNearestDayX0(), dayNumber.toString());
                          description = stringUtilities_1.StringUtilities.format(this.i18n.commaOnTheX0OfTheMonth(), dayString);
                          break;
                        } else {
                          var lastDayOffSetMatches = expression.match(/L-(\d{1,2})/);
                          if (lastDayOffSetMatches) {
                            var offSetDays = lastDayOffSetMatches[1];
                            description = stringUtilities_1.StringUtilities.format(this.i18n.commaDaysBeforeTheLastDayOfTheMonth(offSetDays), offSetDays);
                            break;
                          } else if (expression == "*" && this.expressionParts[5] != "*") {
                            return "";
                          } else {
                            description = this.getSegmentDescription(expression, this.i18n.commaEveryDay(), function(s) {
                              return s == "L" ? _this.i18n.lastDay() : _this.i18n.dayX0 ? stringUtilities_1.StringUtilities.format(_this.i18n.dayX0(), s) : s;
                            }, function(s) {
                              return s == "1" ? _this.i18n.commaEveryDay() : _this.i18n.commaEveryX0Days(s);
                            }, function(s) {
                              return _this.i18n.commaBetweenDayX0AndX1OfTheMonth(s);
                            }, function(s) {
                              return _this.i18n.commaOnDayX0OfTheMonth(s);
                            });
                          }
                          break;
                        }
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getYearDescription = function() {
                    var _this = this;
                    var description = this.getSegmentDescription(this.expressionParts[6], "", function(s) {
                      return /^\d+$/.test(s) ? new Date(parseInt(s), 1).getFullYear().toString() : s;
                    }, function(s) {
                      return stringUtilities_1.StringUtilities.format(_this.i18n.commaEveryX0Years(s), s);
                    }, function(s) {
                      return _this.i18n.commaYearX0ThroughYearX1() || _this.i18n.commaX0ThroughX1();
                    }, function(s) {
                      return _this.i18n.commaOnlyInYearX0 ? _this.i18n.commaOnlyInYearX0() : _this.i18n.commaOnlyInX0();
                    });
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getSegmentDescription = function(expression, allDescription, getSingleItemDescription, getIncrementDescriptionFormat, getRangeDescriptionFormat, getDescriptionFormat) {
                    var description = null;
                    var doesExpressionContainIncrement = expression.indexOf("/") > -1;
                    var doesExpressionContainRange = expression.indexOf("-") > -1;
                    var doesExpressionContainMultipleValues = expression.indexOf(",") > -1;
                    if (!expression) {
                      description = "";
                    } else if (expression === "*") {
                      description = allDescription;
                    } else if (!doesExpressionContainIncrement && !doesExpressionContainRange && !doesExpressionContainMultipleValues) {
                      description = stringUtilities_1.StringUtilities.format(getDescriptionFormat(expression), getSingleItemDescription(expression));
                    } else if (doesExpressionContainMultipleValues) {
                      var segments = expression.split(",");
                      var descriptionContent = "";
                      for (var i = 0; i < segments.length; i++) {
                        if (i > 0 && segments.length > 2) {
                          descriptionContent += ",";
                          if (i < segments.length - 1) {
                            descriptionContent += " ";
                          }
                        }
                        if (i > 0 && segments.length > 1 && (i == segments.length - 1 || segments.length == 2)) {
                          descriptionContent += "".concat(this.i18n.spaceAnd(), " ");
                        }
                        if (segments[i].indexOf("/") > -1 || segments[i].indexOf("-") > -1) {
                          var isSegmentRangeWithoutIncrement = segments[i].indexOf("-") > -1 && segments[i].indexOf("/") == -1;
                          var currentDescriptionContent = this.getSegmentDescription(segments[i], allDescription, getSingleItemDescription, getIncrementDescriptionFormat, isSegmentRangeWithoutIncrement ? this.i18n.commaX0ThroughX1 : getRangeDescriptionFormat, getDescriptionFormat);
                          if (isSegmentRangeWithoutIncrement) {
                            currentDescriptionContent = currentDescriptionContent.replace(", ", "");
                          }
                          descriptionContent += currentDescriptionContent;
                        } else if (!doesExpressionContainIncrement) {
                          descriptionContent += getSingleItemDescription(segments[i]);
                        } else {
                          descriptionContent += this.getSegmentDescription(segments[i], allDescription, getSingleItemDescription, getIncrementDescriptionFormat, getRangeDescriptionFormat, getDescriptionFormat);
                        }
                      }
                      if (!doesExpressionContainIncrement) {
                        description = stringUtilities_1.StringUtilities.format(getDescriptionFormat(expression), descriptionContent);
                      } else {
                        description = descriptionContent;
                      }
                    } else if (doesExpressionContainIncrement) {
                      var segments = expression.split("/");
                      description = stringUtilities_1.StringUtilities.format(getIncrementDescriptionFormat(segments[1]), segments[1]);
                      if (segments[0].indexOf("-") > -1) {
                        var rangeSegmentDescription = this.generateRangeSegmentDescription(segments[0], getRangeDescriptionFormat, getSingleItemDescription);
                        if (rangeSegmentDescription.indexOf(", ") != 0) {
                          description += ", ";
                        }
                        description += rangeSegmentDescription;
                      } else if (segments[0].indexOf("*") == -1) {
                        var rangeItemDescription = stringUtilities_1.StringUtilities.format(getDescriptionFormat(segments[0]), getSingleItemDescription(segments[0]));
                        rangeItemDescription = rangeItemDescription.replace(", ", "");
                        description += stringUtilities_1.StringUtilities.format(this.i18n.commaStartingX0(), rangeItemDescription);
                      }
                    } else if (doesExpressionContainRange) {
                      description = this.generateRangeSegmentDescription(expression, getRangeDescriptionFormat, getSingleItemDescription);
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.generateRangeSegmentDescription = function(rangeExpression, getRangeDescriptionFormat, getSingleItemDescription) {
                    var description = "";
                    var rangeSegments = rangeExpression.split("-");
                    var rangeSegment1Description = getSingleItemDescription(rangeSegments[0], 1);
                    var rangeSegment2Description = getSingleItemDescription(rangeSegments[1], 2);
                    var rangeDescriptionFormat = getRangeDescriptionFormat(rangeExpression);
                    description += stringUtilities_1.StringUtilities.format(rangeDescriptionFormat, rangeSegment1Description, rangeSegment2Description);
                    return description;
                  };
                  ExpressionDescriptor2.prototype.formatTime = function(hourExpression, minuteExpression, secondExpression) {
                    var hourOffset = 0;
                    var minuteOffset = 0;
                    if (this.options.tzOffset) {
                      hourOffset = this.options.tzOffset > 0 ? Math.floor(this.options.tzOffset) : Math.ceil(this.options.tzOffset);
                      minuteOffset = parseFloat((this.options.tzOffset % 1).toFixed(2));
                      if (minuteOffset != 0) {
                        minuteOffset *= 60;
                      }
                    }
                    var hour = parseInt(hourExpression) + hourOffset;
                    var minute = parseInt(minuteExpression) + minuteOffset;
                    if (minute >= 60) {
                      minute -= 60;
                      hour += 1;
                    } else if (minute < 0) {
                      minute += 60;
                      hour -= 1;
                    }
                    if (hour >= 24) {
                      hour = hour - 24;
                    } else if (hour < 0) {
                      hour = 24 + hour;
                    }
                    var period = "";
                    var setPeriodBeforeTime = false;
                    if (!this.options.use24HourTimeFormat) {
                      setPeriodBeforeTime = !!(this.i18n.setPeriodBeforeTime && this.i18n.setPeriodBeforeTime());
                      period = setPeriodBeforeTime ? "".concat(this.getPeriod(hour), " ") : " ".concat(this.getPeriod(hour));
                      if (hour > 12) {
                        hour -= 12;
                      }
                      if (hour === 0) {
                        hour = 12;
                      }
                    }
                    var second = "";
                    if (secondExpression) {
                      second = ":".concat(("00" + secondExpression).substring(secondExpression.length));
                    }
                    return "".concat(setPeriodBeforeTime ? period : "").concat(("00" + hour.toString()).substring(hour.toString().length), ":").concat(("00" + minute.toString()).substring(minute.toString().length)).concat(second).concat(!setPeriodBeforeTime ? period : "");
                  };
                  ExpressionDescriptor2.prototype.transformVerbosity = function(description, useVerboseFormat) {
                    if (!useVerboseFormat) {
                      description = description.replace(new RegExp(", ".concat(this.i18n.everyMinute()), "g"), "");
                      description = description.replace(new RegExp(", ".concat(this.i18n.everyHour()), "g"), "");
                      description = description.replace(new RegExp(this.i18n.commaEveryDay(), "g"), "");
                      description = description.replace(/\, ?$/, "");
                      if (this.i18n.conciseVerbosityReplacements) {
                        for (var _i = 0, _a = Object.entries(this.i18n.conciseVerbosityReplacements()); _i < _a.length; _i++) {
                          var _b = _a[_i], key = _b[0], value = _b[1];
                          description = description.replace(new RegExp(key, "g"), value);
                        }
                      }
                    }
                    return description;
                  };
                  ExpressionDescriptor2.prototype.getPeriod = function(hour) {
                    return hour >= 12 ? this.i18n.pm && this.i18n.pm() || "PM" : this.i18n.am && this.i18n.am() || "AM";
                  };
                  ExpressionDescriptor2.locales = {};
                  return ExpressionDescriptor2;
                })();
                exports2.ExpressionDescriptor = ExpressionDescriptor;
              })
            ),
            /***/
            747: (
              /***/
              ((__unused_webpack_module, exports2, __webpack_require__2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                exports2.enLocaleLoader = void 0;
                var en_1 = __webpack_require__2(486);
                var enLocaleLoader = (function() {
                  function enLocaleLoader2() {
                  }
                  enLocaleLoader2.prototype.load = function(availableLocales) {
                    availableLocales["en"] = new en_1.en();
                  };
                  return enLocaleLoader2;
                })();
                exports2.enLocaleLoader = enLocaleLoader;
              })
            ),
            /***/
            486: (
              /***/
              ((__unused_webpack_module, exports2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                exports2.en = void 0;
                var en = (function() {
                  function en2() {
                  }
                  en2.prototype.atX0SecondsPastTheMinuteGt20 = function() {
                    return null;
                  };
                  en2.prototype.atX0MinutesPastTheHourGt20 = function() {
                    return null;
                  };
                  en2.prototype.commaMonthX0ThroughMonthX1 = function() {
                    return null;
                  };
                  en2.prototype.commaYearX0ThroughYearX1 = function() {
                    return null;
                  };
                  en2.prototype.use24HourTimeFormatByDefault = function() {
                    return false;
                  };
                  en2.prototype.anErrorOccuredWhenGeneratingTheExpressionD = function() {
                    return "An error occurred when generating the expression description. Check the cron expression syntax.";
                  };
                  en2.prototype.everyMinute = function() {
                    return "every minute";
                  };
                  en2.prototype.everyHour = function() {
                    return "every hour";
                  };
                  en2.prototype.atSpace = function() {
                    return "At ";
                  };
                  en2.prototype.everyMinuteBetweenX0AndX1 = function() {
                    return "Every minute between %s and %s";
                  };
                  en2.prototype.at = function() {
                    return "At";
                  };
                  en2.prototype.spaceAnd = function() {
                    return " and";
                  };
                  en2.prototype.everySecond = function() {
                    return "every second";
                  };
                  en2.prototype.everyX0Seconds = function() {
                    return "every %s seconds";
                  };
                  en2.prototype.secondsX0ThroughX1PastTheMinute = function() {
                    return "seconds %s through %s past the minute";
                  };
                  en2.prototype.atX0SecondsPastTheMinute = function() {
                    return "at %s seconds past the minute";
                  };
                  en2.prototype.everyX0Minutes = function() {
                    return "every %s minutes";
                  };
                  en2.prototype.minutesX0ThroughX1PastTheHour = function() {
                    return "minutes %s through %s past the hour";
                  };
                  en2.prototype.atX0MinutesPastTheHour = function() {
                    return "at %s minutes past the hour";
                  };
                  en2.prototype.everyX0Hours = function() {
                    return "every %s hours";
                  };
                  en2.prototype.betweenX0AndX1 = function() {
                    return "between %s and %s";
                  };
                  en2.prototype.atX0 = function() {
                    return "at %s";
                  };
                  en2.prototype.commaEveryDay = function() {
                    return ", every day";
                  };
                  en2.prototype.commaEveryX0DaysOfTheWeek = function() {
                    return ", every %s days of the week";
                  };
                  en2.prototype.commaX0ThroughX1 = function() {
                    return ", %s through %s";
                  };
                  en2.prototype.commaAndX0ThroughX1 = function() {
                    return ", %s through %s";
                  };
                  en2.prototype.first = function() {
                    return "first";
                  };
                  en2.prototype.second = function() {
                    return "second";
                  };
                  en2.prototype.third = function() {
                    return "third";
                  };
                  en2.prototype.fourth = function() {
                    return "fourth";
                  };
                  en2.prototype.fifth = function() {
                    return "fifth";
                  };
                  en2.prototype.commaOnThe = function() {
                    return ", on the ";
                  };
                  en2.prototype.spaceX0OfTheMonth = function() {
                    return " %s of the month";
                  };
                  en2.prototype.lastDay = function() {
                    return "the last day";
                  };
                  en2.prototype.commaOnTheLastX0OfTheMonth = function() {
                    return ", on the last %s of the month";
                  };
                  en2.prototype.commaOnlyOnX0 = function() {
                    return ", only on %s";
                  };
                  en2.prototype.commaAndOnX0 = function() {
                    return ", and on %s";
                  };
                  en2.prototype.commaEveryX0Months = function() {
                    return ", every %s months";
                  };
                  en2.prototype.commaOnlyInX0 = function() {
                    return ", only in %s";
                  };
                  en2.prototype.commaOnTheLastDayOfTheMonth = function() {
                    return ", on the last day of the month";
                  };
                  en2.prototype.commaOnTheLastWeekdayOfTheMonth = function() {
                    return ", on the last weekday of the month";
                  };
                  en2.prototype.commaDaysBeforeTheLastDayOfTheMonth = function() {
                    return ", %s days before the last day of the month";
                  };
                  en2.prototype.firstWeekday = function() {
                    return "first weekday";
                  };
                  en2.prototype.weekdayNearestDayX0 = function() {
                    return "weekday nearest day %s";
                  };
                  en2.prototype.commaOnTheX0OfTheMonth = function() {
                    return ", on the %s of the month";
                  };
                  en2.prototype.commaEveryX0Days = function() {
                    return ", every %s days";
                  };
                  en2.prototype.commaBetweenDayX0AndX1OfTheMonth = function() {
                    return ", between day %s and %s of the month";
                  };
                  en2.prototype.commaOnDayX0OfTheMonth = function() {
                    return ", on day %s of the month";
                  };
                  en2.prototype.commaEveryHour = function() {
                    return ", every hour";
                  };
                  en2.prototype.commaEveryX0Years = function() {
                    return ", every %s years";
                  };
                  en2.prototype.commaStartingX0 = function() {
                    return ", starting %s";
                  };
                  en2.prototype.daysOfTheWeek = function() {
                    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                  };
                  en2.prototype.monthsOfTheYear = function() {
                    return [
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December"
                    ];
                  };
                  return en2;
                })();
                exports2.en = en;
              })
            ),
            /***/
            515: (
              /***/
              ((__unused_webpack_module, exports2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                function assert(value, message) {
                  if (!value) {
                    throw new Error(message);
                  }
                }
                var RangeValidator = (function() {
                  function RangeValidator2() {
                  }
                  RangeValidator2.secondRange = function(parse2) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var second = parseInt(parsed[i], 10);
                        assert(second >= 0 && second <= 59, "seconds part must be >= 0 and <= 59");
                      }
                    }
                  };
                  RangeValidator2.minuteRange = function(parse2) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var minute = parseInt(parsed[i], 10);
                        assert(minute >= 0 && minute <= 59, "minutes part must be >= 0 and <= 59");
                      }
                    }
                  };
                  RangeValidator2.hourRange = function(parse2) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var hour = parseInt(parsed[i], 10);
                        assert(hour >= 0 && hour <= 23, "hours part must be >= 0 and <= 23");
                      }
                    }
                  };
                  RangeValidator2.dayOfMonthRange = function(parse2) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var dayOfMonth = parseInt(parsed[i], 10);
                        assert(dayOfMonth >= 1 && dayOfMonth <= 31, "DOM part must be >= 1 and <= 31");
                      }
                    }
                  };
                  RangeValidator2.monthRange = function(parse2, monthStartIndexZero) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var month = parseInt(parsed[i], 10);
                        assert(month >= 1 && month <= 12, monthStartIndexZero ? "month part must be >= 0 and <= 11" : "month part must be >= 1 and <= 12");
                      }
                    }
                  };
                  RangeValidator2.dayOfWeekRange = function(parse2, dayOfWeekStartIndexZero) {
                    var parsed = parse2.split(",");
                    for (var i = 0; i < parsed.length; i++) {
                      if (!isNaN(parseInt(parsed[i], 10))) {
                        var dayOfWeek = parseInt(parsed[i], 10);
                        assert(dayOfWeek >= 0 && dayOfWeek <= 6, dayOfWeekStartIndexZero ? "DOW part must be >= 0 and <= 6" : "DOW part must be >= 1 and <= 7");
                      }
                    }
                  };
                  return RangeValidator2;
                })();
                exports2["default"] = RangeValidator;
              })
            ),
            /***/
            823: (
              /***/
              ((__unused_webpack_module, exports2) => {
                Object.defineProperty(exports2, "__esModule", { value: true });
                exports2.StringUtilities = void 0;
                var StringUtilities = (function() {
                  function StringUtilities2() {
                  }
                  StringUtilities2.format = function(template) {
                    var values = [];
                    for (var _i = 1; _i < arguments.length; _i++) {
                      values[_i - 1] = arguments[_i];
                    }
                    return template.replace(/%s/g, function(substring) {
                      var args = [];
                      for (var _i2 = 1; _i2 < arguments.length; _i2++) {
                        args[_i2 - 1] = arguments[_i2];
                      }
                      return values.shift();
                    });
                  };
                  StringUtilities2.containsAny = function(text, searchStrings) {
                    return searchStrings.some(function(c) {
                      return text.indexOf(c) > -1;
                    });
                  };
                  return StringUtilities2;
                })();
                exports2.StringUtilities = StringUtilities;
              })
            )
            /******/
          };
          var __webpack_module_cache__ = {};
          function __webpack_require__(moduleId) {
            var cachedModule = __webpack_module_cache__[moduleId];
            if (cachedModule !== void 0) {
              return cachedModule.exports;
            }
            var module2 = __webpack_module_cache__[moduleId] = {
              /******/
              // no module.id needed
              /******/
              // no module.loaded needed
              /******/
              exports: {}
              /******/
            };
            __webpack_modules__[moduleId](module2, module2.exports, __webpack_require__);
            return module2.exports;
          }
          var __webpack_exports__ = {};
          (() => {
            var exports2 = __webpack_exports__;
            Object.defineProperty(exports2, "__esModule", { value: true });
            exports2.toString = void 0;
            var expressionDescriptor_1 = __webpack_require__(333);
            var enLocaleLoader_1 = __webpack_require__(747);
            expressionDescriptor_1.ExpressionDescriptor.initialize(new enLocaleLoader_1.enLocaleLoader());
            exports2["default"] = expressionDescriptor_1.ExpressionDescriptor;
            var toString = expressionDescriptor_1.ExpressionDescriptor.toString;
            exports2.toString = toString;
          })();
          return __webpack_exports__;
        })()
      );
    });
  }
});

// src/cli.ts
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// node_modules/@actions/expressions/dist/features.js
var allFeatureKeys = [
  "missingInputsQuickfix",
  "blockScalarChompingWarning",
  "allowCaseFunction",
  "allowCopilotRequestsPermission",
  "allowDrivesPermissionAutocomplete",
  "allowBackgroundSteps"
];
var FeatureFlags = class {
  constructor(features) {
    this.features = features ?? {};
  }
  /**
   * Check if an experimental feature is enabled.
   *
   * Resolution order:
   * 1. Explicit feature flag (if set)
   * 2. `all` flag (if set)
   * 3. false (default)
   */
  isEnabled(feature) {
    const explicit = this.features[feature];
    if (explicit !== void 0) {
      return explicit;
    }
    return this.features.all ?? false;
  }
  /**
   * Returns list of all enabled experimental features.
   */
  getEnabledFeatures() {
    return allFeatureKeys.filter((key) => this.isEnabled(key));
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/types.js
var TokenType;
(function(TokenType3) {
  TokenType3[TokenType3["String"] = 0] = "String";
  TokenType3[TokenType3["Sequence"] = 1] = "Sequence";
  TokenType3[TokenType3["Mapping"] = 2] = "Mapping";
  TokenType3[TokenType3["BasicExpression"] = 3] = "BasicExpression";
  TokenType3[TokenType3["InsertExpression"] = 4] = "InsertExpression";
  TokenType3[TokenType3["Boolean"] = 5] = "Boolean";
  TokenType3[TokenType3["Number"] = 6] = "Number";
  TokenType3[TokenType3["Null"] = 7] = "Null";
})(TokenType || (TokenType = {}));
function tokenTypeName(type) {
  switch (type) {
    case TokenType.String:
      return "StringToken";
    case TokenType.Sequence:
      return "SequenceToken";
    case TokenType.Mapping:
      return "MappingToken";
    case TokenType.BasicExpression:
      return "BasicExpressionToken";
    case TokenType.InsertExpression:
      return "InsertExpressionToken";
    case TokenType.Boolean:
      return "BooleanToken";
    case TokenType.Number:
      return "NumberToken";
    case TokenType.Null:
      return "NullToken";
    default: {
      const exhaustiveCheck = type;
      throw new Error(`Unhandled token type: ${type} ${exhaustiveCheck}}`);
    }
  }
}

// node_modules/@actions/workflow-parser/dist/templates/tokens/traversal-state.js
var TraversalState = class {
  constructor(parent, token) {
    this.index = -1;
    this.isKey = false;
    this.parent = parent;
    this._token = token;
    this.current = token;
  }
  moveNext(omitKeys) {
    switch (this._token.templateTokenType) {
      case TokenType.Sequence: {
        const sequence = this._token;
        if (++this.index < sequence.count) {
          this.current = sequence.get(this.index);
          return true;
        }
        this.current = void 0;
        return false;
      }
      case TokenType.Mapping: {
        const mapping = this._token;
        if (this.isKey) {
          this.isKey = false;
          this.currentKey = this.current;
          this.current = mapping.get(this.index).value;
          return true;
        }
        if (++this.index < mapping.count) {
          if (omitKeys) {
            this.isKey = false;
            this.currentKey = mapping.get(this.index).key;
            this.current = mapping.get(this.index).value;
            return true;
          }
          this.isKey = true;
          this.currentKey = void 0;
          this.current = mapping.get(this.index).key;
          return true;
        }
        this.currentKey = void 0;
        this.current = void 0;
        return false;
      }
      default:
        throw new Error(`Unexpected token type '${this._token.templateTokenType}' when traversing state`);
    }
  }
  /**
   * Returns the ancestor tokens from root to the current token's parent container.
   */
  getAncestors() {
    const ancestors = [];
    let state = this.parent;
    while (state) {
      if (state.current) {
        ancestors.unshift(state.current);
      }
      state = state.parent;
    }
    return ancestors;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/template-token.js
var TemplateTokenError = class extends Error {
  constructor(message, token) {
    super(message);
    this.token = token;
  }
};
var TemplateToken = class {
  /**
   * Base class for all template tokens
   */
  constructor(type, file, range, definitionInfo) {
    this.type = type;
    this.file = file;
    this.range = range;
    this.definitionInfo = definitionInfo;
  }
  get templateTokenType() {
    return this.type;
  }
  get line() {
    return this.range?.start.line;
  }
  get col() {
    return this.range?.start.column;
  }
  get definition() {
    return this.definitionInfo?.definition;
  }
  get description() {
    return this._description || this.propertyDefinition?.description || this.definition?.description;
  }
  set description(description) {
    this._description = description;
  }
  typeName() {
    return tokenTypeName(this.type);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertNull(objectDescription) {
    if (this.type === TokenType.Null) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.Null)}' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertBoolean(objectDescription) {
    if (this.type === TokenType.Boolean) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.Boolean)}' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertNumber(objectDescription) {
    if (this.type === TokenType.Number) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.Number)}' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertString(objectDescription) {
    if (this.type === TokenType.String) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.String)}' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertScalar(objectDescription) {
    if (this?.isScalar === true) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type 'ScalarToken' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertSequence(objectDescription) {
    if (this.type === TokenType.Sequence) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.Sequence)}' was expected.`, this);
  }
  /**
   * Asserts expected type and throws a good debug message if unexpected
   */
  assertMapping(objectDescription) {
    if (this.type === TokenType.Mapping) {
      return this;
    }
    throw new TemplateTokenError(`Unexpected type '${this.typeName()}' encountered while reading '${objectDescription}'. The type '${tokenTypeName(TokenType.Mapping)}' was expected.`, this);
  }
  /**
   * Returns all tokens (depth first)
   * @param value The object to traverse
   * @param omitKeys Whether to omit mapping keys
   * @yields A tuple of [parent, token, keyToken, ancestors] for each token in the tree
   */
  static *traverse(value, omitKeys) {
    yield [void 0, value, void 0, []];
    switch (value.templateTokenType) {
      case TokenType.Sequence:
      case TokenType.Mapping: {
        let state = new TraversalState(void 0, value);
        state = new TraversalState(state, value);
        while (state.parent) {
          if (state.moveNext(omitKeys ?? false)) {
            value = state.current;
            yield [state.parent?.current, value, state.currentKey, state.getAncestors()];
            switch (value.type) {
              case TokenType.Sequence:
              case TokenType.Mapping:
                state = new TraversalState(state, value);
                break;
            }
          } else {
            state = state.parent;
          }
        }
        break;
      }
    }
  }
  toJSON() {
    return void 0;
  }
};

// node_modules/@actions/workflow-parser/dist/workflows/file-reference.js
function parseFileReference(ref) {
  if (ref.startsWith("./")) {
    return {
      path: ref.substring(2)
    };
  }
  if (ref.startsWith("$/")) {
    return {
      path: ref.substring(2)
    };
  }
  const [remotePath, version] = ref.split("@");
  const [owner, repository, ...pathSegments] = remotePath.split("/").filter((s) => s.length > 0);
  if (!owner || !repository || !version) {
    throw new Error(`Invalid file reference: ${ref}`);
  }
  return {
    repository,
    owner,
    path: pathSegments.join("/"),
    version
  };
}

// node_modules/@actions/workflow-parser/dist/templates/template-validation-error.js
var TemplateValidationError = class {
  constructor(rawMessage, prefix, code, range) {
    this.rawMessage = rawMessage;
    this.prefix = prefix;
    this.code = code;
    this.range = range;
  }
  get message() {
    if (this.prefix) {
      return `${this.prefix}: ${this.rawMessage}`;
    }
    return this.rawMessage;
  }
  toString() {
    return this.message;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/template-context.js
var TemplateContext = class {
  constructor(errors, schema2, trace) {
    this._fileIds = {};
    this._fileNames = [];
    this.expressionFunctions = [];
    this.expressionNamedContexts = [];
    this.state = {};
    this.errors = errors;
    this.schema = schema2;
    this.trace = trace;
  }
  error(tokenOrFileId, err, tokenRange) {
    const token = tokenOrFileId;
    const range = tokenRange || token?.range;
    const prefix = this.getErrorPrefix(token?.file ?? tokenOrFileId, token?.line, token?.col);
    const message = err?.message ?? String(err);
    const e = new TemplateValidationError(message, prefix, void 0, range);
    this.errors.add(e);
    this.trace.error(e.message);
  }
  /**
   * Gets or adds the file ID
   */
  getFileId(file) {
    const key = file.toUpperCase();
    let id = this._fileIds[key];
    if (id === void 0) {
      id = this._fileNames.length + 1;
      this._fileIds[key] = id;
      this._fileNames.push(file);
    }
    return id;
  }
  /**
   * Looks up a file name by ID. Returns undefined if not found.
   */
  getFileName(fileId) {
    return this._fileNames.length >= fileId ? this._fileNames[fileId - 1] : void 0;
  }
  /**
   * Gets a copy of the file table
   */
  getFileTable() {
    return this._fileNames.slice();
  }
  getErrorPrefix(fileId, line, column) {
    const fileName = fileId !== void 0 ? this.getFileName(fileId) : void 0;
    if (fileName) {
      if (line !== void 0 && column !== void 0) {
        return `${fileName} (Line: ${line}, Col: ${column})`;
      } else {
        return fileName;
      }
    } else if (line !== void 0 && column !== void 0) {
      return `(Line: ${line}, Col: ${column})`;
    } else {
      return "";
    }
  }
};
var TemplateValidationErrors = class {
  constructor(maxErrors, maxMessageLength) {
    this._errors = [];
    this._maxErrors = maxErrors ?? 0;
    this._maxMessageLength = maxMessageLength ?? 0;
  }
  get count() {
    return this._errors.length;
  }
  add(err) {
    for (let e of Array.isArray(err) ? err : [err]) {
      if (this._maxErrors <= 0 || this._errors.length < this._maxErrors) {
        if (this._maxMessageLength > 0 && e.message.length > this._maxMessageLength) {
          e = new TemplateValidationError(e.message.substring(0, this._maxMessageLength) + "[...]", e.prefix, e.code, e.range);
        }
        this._errors.push(e);
      }
    }
  }
  /**
   * Throws if any errors
   * @param prefix The error message prefix
   */
  check(prefix) {
    if (this._errors.length <= 0) {
      return;
    }
    if (!prefix) {
      prefix = "The template is not valid.";
    }
    throw new Error(`${prefix} ${this._errors.map((x) => x.message).join(",")}`);
  }
  clear() {
    this._errors = [];
  }
  getErrors() {
    return this._errors.slice();
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/definition-info.js
var DefinitionInfo = class {
  constructor(schemaOrParent, nameOrDefinition) {
    this.isDefinitionInfo = true;
    const parent = schemaOrParent?.isDefinitionInfo === true ? schemaOrParent : void 0;
    this._schema = parent === void 0 ? schemaOrParent : parent._schema;
    this.definition = typeof nameOrDefinition === "string" ? this._schema.getDefinition(nameOrDefinition) : nameOrDefinition;
    if (this.definition.readerContext.length > 0) {
      this.allowedContext = [];
      const upperSeen = {};
      for (const context of parent?.allowedContext ?? []) {
        this.allowedContext.push(context);
        upperSeen[context.toUpperCase()] = true;
      }
      for (const context of this.definition.readerContext) {
        const upper = context.toUpperCase();
        if (!upperSeen[upper]) {
          this.allowedContext.push(context);
          upperSeen[upper] = true;
        }
      }
    } else {
      this.allowedContext = parent?.allowedContext ?? [];
    }
  }
  getScalarDefinitions() {
    return this._schema.getScalarDefinitions(this.definition);
  }
  getDefinitionsOfType(type) {
    return this._schema.getDefinitionsOfType(this.definition, type);
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/definition-type.js
var DefinitionType;
(function(DefinitionType2) {
  DefinitionType2[DefinitionType2["Null"] = 0] = "Null";
  DefinitionType2[DefinitionType2["Boolean"] = 1] = "Boolean";
  DefinitionType2[DefinitionType2["Number"] = 2] = "Number";
  DefinitionType2[DefinitionType2["String"] = 3] = "String";
  DefinitionType2[DefinitionType2["Sequence"] = 4] = "Sequence";
  DefinitionType2[DefinitionType2["Mapping"] = 5] = "Mapping";
  DefinitionType2[DefinitionType2["OneOf"] = 6] = "OneOf";
  DefinitionType2[DefinitionType2["AllowedValues"] = 7] = "AllowedValues";
})(DefinitionType || (DefinitionType = {}));

// node_modules/@actions/workflow-parser/dist/templates/template-constants.js
var ALLOWED_VALUES = "allowed-values";
var ANY = "any";
var BOOLEAN = "boolean";
var BOOLEAN_DEFINITION = "boolean-definition";
var BOOLEAN_DEFINITION_PROPERTIES = "boolean-definition-properties";
var CLOSE_EXPRESSION = "}}";
var CONSTANT = "constant";
var CONTEXT = "context";
var DEFINITION = "definition";
var DEFINITIONS = "definitions";
var DESCRIPTION = "description";
var IGNORE_CASE = "ignore-case";
var INSERT_DIRECTIVE = "insert";
var IS_EXPRESSION = "is-expression";
var ITEM_TYPE = "item-type";
var LOOSE_KEY_TYPE = "loose-key-type";
var LOOSE_VALUE_TYPE = "loose-value-type";
var MAX_CONSTANT = "MAX";
var MAPPING = "mapping";
var MAPPING_DEFINITION = "mapping-definition";
var MAPPING_DEFINITION_PROPERTIES = "mapping-definition-properties";
var MAPPING_PROPERTY_VALUE = "mapping-property-value";
var NON_EMPTY_STRING = "non-empty-string";
var NULL = "null";
var NULL_DEFINITION = "null-definition";
var NULL_DEFINITION_PROPERTIES = "null-definition-properties";
var NUMBER = "number";
var NUMBER_DEFINITION = "number-definition";
var NUMBER_DEFINITION_PROPERTIES = "number-definition-properties";
var ONE_OF = "one-of";
var ONE_OF_DEFINITION = "one-of-definition";
var OPEN_EXPRESSION = "${{";
var PROPERTY_VALUE = "property-value";
var PROPERTIES = "properties";
var REQUIRED = "required";
var REQUIRE_NON_EMPTY = "require-non-empty";
var SCALAR = "scalar";
var SEQUENCE = "sequence";
var SEQUENCE_DEFINITION = "sequence-definition";
var SEQUENCE_DEFINITION_PROPERTIES = "sequence-definition-properties";
var TYPE = "type";
var SEQUENCE_OF_NON_EMPTY_STRING = "sequence-of-non-empty-string";
var STRING = "string";
var STRING_DEFINITION = "string-definition";
var STRING_DEFINITION_PROPERTIES = "string-definition-properties";
var TEMPLATE_SCHEMA = "template-schema";
var VERSION = "version";

// node_modules/@actions/workflow-parser/dist/templates/tokens/scalar-token.js
var ScalarToken = class extends TemplateToken {
  constructor(type, file, range, definitionInfo) {
    super(type, file, range, definitionInfo);
  }
  get isScalar() {
    return true;
  }
  static trimDisplayString(displayString) {
    let firstLine = displayString.trimStart();
    const firstNewLine = firstLine.indexOf("\n");
    const firstCarriageReturn = firstLine.indexOf("\r");
    if (firstNewLine >= 0 || firstCarriageReturn >= 0) {
      firstLine = firstLine.substr(0, Math.min(firstNewLine >= 0 ? firstNewLine : Number.MAX_VALUE, firstCarriageReturn >= 0 ? firstCarriageReturn : Number.MAX_VALUE));
    }
    return firstLine;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/literal-token.js
var LiteralToken = class extends ScalarToken {
  constructor(type, file, range, definitionInfo) {
    super(type, file, range, definitionInfo);
  }
  get isLiteral() {
    return true;
  }
  get isExpression() {
    return false;
  }
  toDisplayString() {
    return ScalarToken.trimDisplayString(this.toString());
  }
  /**
   * Throws a good debug message when an unexpected literal value is encountered
   */
  assertUnexpectedValue(objectDescription) {
    throw new Error(`Error while reading '${objectDescription}'. Unexpected value '${this.toString()}'`);
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/string-token.js
var StringToken = class _StringToken extends LiteralToken {
  constructor(file, range, value, definitionInfo, source, blockScalarHeader) {
    super(TokenType.String, file, range, definitionInfo);
    this.value = value;
    this.source = source;
    this.blockScalarHeader = blockScalarHeader;
  }
  clone(omitSource) {
    return omitSource ? new _StringToken(void 0, void 0, this.value, this.definitionInfo, this.source, this.blockScalarHeader) : new _StringToken(this.file, this.range, this.value, this.definitionInfo, this.source, this.blockScalarHeader);
  }
  toString() {
    return this.value;
  }
  toJSON() {
    return this.value;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/number-token.js
var NumberToken = class _NumberToken extends LiteralToken {
  constructor(file, range, value, definitionInfo) {
    super(TokenType.Number, file, range, definitionInfo);
    this.num = value;
  }
  get value() {
    return this.num;
  }
  clone(omitSource) {
    return omitSource ? new _NumberToken(void 0, void 0, this.num, this.definitionInfo) : new _NumberToken(this.file, this.range, this.num, this.definitionInfo);
  }
  toString() {
    return `${this.num}`;
  }
  toJSON() {
    return this.num;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/boolean-token.js
var BooleanToken = class _BooleanToken extends LiteralToken {
  constructor(file, range, value, definitionInfo) {
    super(TokenType.Boolean, file, range, definitionInfo);
    this.bool = value;
  }
  get value() {
    return this.bool;
  }
  clone(omitSource) {
    return omitSource ? new _BooleanToken(void 0, void 0, this.bool, this.definitionInfo) : new _BooleanToken(this.file, this.range, this.bool, this.definitionInfo);
  }
  toString() {
    return this.bool ? "true" : "false";
  }
  toJSON() {
    return this.bool;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/null-token.js
var NullToken = class _NullToken extends LiteralToken {
  constructor(file, range, definitionInfo) {
    super(TokenType.Null, file, range, definitionInfo);
  }
  clone(omitSource) {
    return omitSource ? new _NullToken(void 0, void 0, this.definitionInfo) : new _NullToken(this.file, this.range, this.definitionInfo);
  }
  toString() {
    return "";
  }
  toJSON() {
    return null;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/key-value-pair.js
var KeyValuePair = class {
  constructor(key, value) {
    this.key = key;
    this.value = value;
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/sequence-token.js
var SequenceToken = class _SequenceToken extends TemplateToken {
  constructor(file, range, definitionInfo) {
    super(TokenType.Sequence, file, range, definitionInfo);
    this.seq = [];
  }
  get count() {
    return this.seq.length;
  }
  get isScalar() {
    return false;
  }
  get isLiteral() {
    return false;
  }
  get isExpression() {
    return false;
  }
  add(value) {
    this.seq.push(value);
  }
  get(index) {
    return this.seq[index];
  }
  clone(omitSource) {
    const result = omitSource ? new _SequenceToken(void 0, void 0, this.definitionInfo) : new _SequenceToken(this.file, this.range, this.definitionInfo);
    for (const item of this.seq) {
      result.add(item.clone(omitSource));
    }
    return result;
  }
  toJSON() {
    return {
      type: TokenType.Sequence,
      seq: this.seq
    };
  }
  *[Symbol.iterator]() {
    for (const item of this.seq) {
      yield item;
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/mapping-token.js
var MappingToken = class _MappingToken extends TemplateToken {
  constructor(file, range, definitionInfo) {
    super(TokenType.Mapping, file, range, definitionInfo);
    this.map = [];
  }
  get count() {
    return this.map.length;
  }
  get isScalar() {
    return false;
  }
  get isLiteral() {
    return false;
  }
  get isExpression() {
    return false;
  }
  add(key, value) {
    this.map.push(new KeyValuePair(key, value));
  }
  get(index) {
    return this.map[index];
  }
  find(key) {
    const pair = this.map.find((pair2) => pair2.key.toString() === key);
    return pair?.value;
  }
  remove(index) {
    this.map.splice(index, 1);
  }
  clone(omitSource) {
    const result = omitSource ? new _MappingToken(void 0, void 0, this.definitionInfo) : new _MappingToken(this.file, this.range, this.definitionInfo);
    for (const item of this.map) {
      result.add(item.key.clone(omitSource), item.value.clone(omitSource));
    }
    return result;
  }
  toJSON() {
    const items = [];
    for (const item of this.map) {
      items.push({ Key: item.key, Value: item.value });
    }
    return {
      type: TokenType.Mapping,
      map: items
    };
  }
  *[Symbol.iterator]() {
    for (const item of this.map) {
      yield item;
    }
  }
};

// node_modules/@actions/expressions/dist/ast.js
var Expr = class {
};
var Literal = class extends Expr {
  constructor(literal2, token) {
    super();
    this.literal = literal2;
    this.token = token;
  }
  accept(v) {
    return v.visitLiteral(this);
  }
};
var Unary = class extends Expr {
  constructor(operator, expr) {
    super();
    this.operator = operator;
    this.expr = expr;
  }
  accept(v) {
    return v.visitUnary(this);
  }
};
var FunctionCall = class extends Expr {
  constructor(functionName, args) {
    super();
    this.functionName = functionName;
    this.args = args;
  }
  accept(v) {
    return v.visitFunctionCall(this);
  }
};
var Binary = class extends Expr {
  constructor(left, operator, right) {
    super();
    this.left = left;
    this.operator = operator;
    this.right = right;
  }
  accept(v) {
    return v.visitBinary(this);
  }
};
var Logical = class extends Expr {
  constructor(operator, args) {
    super();
    this.operator = operator;
    this.args = args;
  }
  accept(v) {
    return v.visitLogical(this);
  }
};
var Grouping = class extends Expr {
  constructor(group) {
    super();
    this.group = group;
  }
  accept(v) {
    return v.visitGrouping(this);
  }
};
var ContextAccess = class extends Expr {
  constructor(name) {
    super();
    this.name = name;
  }
  accept(v) {
    return v.visitContextAccess(this);
  }
};
var IndexAccess = class extends Expr {
  constructor(expr, index) {
    super();
    this.expr = expr;
    this.index = index;
  }
  accept(v) {
    return v.visitIndexAccess(this);
  }
};
var Star = class extends Expr {
  accept() {
    throw new Error("Method not implemented.");
  }
};

// node_modules/@actions/expressions/dist/data/expressiondata.js
var Kind;
(function(Kind2) {
  Kind2[Kind2["String"] = 0] = "String";
  Kind2[Kind2["Array"] = 1] = "Array";
  Kind2[Kind2["Dictionary"] = 2] = "Dictionary";
  Kind2[Kind2["Boolean"] = 3] = "Boolean";
  Kind2[Kind2["Number"] = 4] = "Number";
  Kind2[Kind2["CaseSensitiveDictionary"] = 5] = "CaseSensitiveDictionary";
  Kind2[Kind2["Null"] = 6] = "Null";
})(Kind || (Kind = {}));
function kindStr(k) {
  switch (k) {
    case Kind.Array:
      return "Array";
    case Kind.Boolean:
      return "Boolean";
    case Kind.Null:
      return "Null";
    case Kind.Number:
      return "Number";
    case Kind.Dictionary:
      return "Object";
    case Kind.String:
      return "String";
  }
  return "unknown";
}

// node_modules/@actions/expressions/dist/data/dictionary.js
var Dictionary = class {
  constructor(...pairs2) {
    this.keys = [];
    this.v = [];
    this.indexMap = {};
    this.kind = Kind.Dictionary;
    this.primitive = false;
    for (const p of pairs2) {
      this.add(p.key, p.value);
    }
  }
  coerceString() {
    return kindStr(this.kind);
  }
  number() {
    return NaN;
  }
  add(key, value) {
    if (key.toLowerCase() in this.indexMap) {
      return;
    }
    this.keys.push(key);
    this.v.push(value);
    this.indexMap[key.toLowerCase()] = this.v.length - 1;
  }
  get(key) {
    const index = this.indexMap[key.toLowerCase()];
    if (index === void 0) {
      return void 0;
    }
    return this.v[index];
  }
  values() {
    return this.v;
  }
  pairs() {
    const result = [];
    for (const key of this.keys) {
      result.push({ key, value: this.v[this.indexMap[key.toLowerCase()]] });
    }
    return result;
  }
};

// node_modules/@actions/expressions/dist/data/index.js
var data_exports = {};
__export(data_exports, {
  Array: () => Array2,
  BooleanData: () => BooleanData,
  Dictionary: () => Dictionary,
  Kind: () => Kind,
  Null: () => Null,
  NumberData: () => NumberData,
  StringData: () => StringData,
  replacer: () => replacer,
  reviver: () => reviver
});

// node_modules/@actions/expressions/dist/data/array.js
var Array2 = class {
  constructor(...data) {
    this.v = [];
    this.kind = Kind.Array;
    this.primitive = false;
    for (const d of data) {
      this.add(d);
    }
  }
  coerceString() {
    return kindStr(this.kind);
  }
  number() {
    return NaN;
  }
  add(value) {
    this.v.push(value);
  }
  get(index) {
    return this.v[index];
  }
  values() {
    return this.v;
  }
};

// node_modules/@actions/expressions/dist/data/boolean.js
var BooleanData = class {
  constructor(value) {
    this.value = value;
    this.kind = Kind.Boolean;
    this.primitive = true;
  }
  coerceString() {
    if (this.value) {
      return "true";
    }
    return "false";
  }
  number() {
    if (this.value) {
      return 1;
    }
    return 0;
  }
};

// node_modules/@actions/expressions/dist/data/null.js
var Null = class {
  constructor() {
    this.kind = Kind.Null;
    this.primitive = true;
  }
  coerceString() {
    return "";
  }
  number() {
    return 0;
  }
};

// node_modules/@actions/expressions/dist/data/number.js
var NumberData = class {
  constructor(value) {
    this.value = value;
    this.kind = Kind.Number;
    this.primitive = true;
  }
  coerceString() {
    if (this.value === 0) {
      return "0";
    }
    return (+this.value.toFixed(15)).toString();
  }
  number() {
    return this.value;
  }
};

// node_modules/@actions/expressions/dist/data/string.js
var StringData = class {
  constructor(value) {
    this.value = value;
    this.kind = Kind.String;
    this.primitive = true;
  }
  coerceString() {
    return this.value;
  }
  number() {
    return Number(this.value);
  }
};

// node_modules/@actions/expressions/dist/data/replacer.js
function replacer(_key, value) {
  if (value instanceof Null) {
    return null;
  }
  if (value instanceof BooleanData) {
    return value.value;
  }
  if (value instanceof NumberData) {
    return value.number();
  }
  if (value instanceof StringData) {
    return value.coerceString();
  }
  if (value instanceof Array2) {
    return value.values();
  }
  if (value instanceof Dictionary) {
    const pairs2 = value.pairs();
    const r = {};
    for (const p of pairs2) {
      r[p.key] = p.value;
    }
    return r;
  }
  return value;
}

// node_modules/@actions/expressions/dist/data/reviver.js
function reviver(_key, val) {
  if (val === null) {
    return new Null();
  }
  if (typeof val === "string") {
    return new StringData(val);
  }
  if (typeof val === "number") {
    return new NumberData(val);
  }
  if (typeof val === "boolean") {
    return new BooleanData(val);
  }
  if (Array.isArray(val)) {
    return new Array2(...val);
  }
  if (typeof val === "object") {
    return new Dictionary(...Object.keys(val).map((k) => ({
      key: k,
      value: val[k]
    })));
  }
  return val;
}

// node_modules/@actions/expressions/dist/filtered_array.js
var FilteredArray = class extends Array2 {
};

// node_modules/@actions/expressions/dist/lexer.js
var TokenType2;
(function(TokenType3) {
  TokenType3[TokenType3["UNKNOWN"] = 0] = "UNKNOWN";
  TokenType3[TokenType3["LEFT_PAREN"] = 1] = "LEFT_PAREN";
  TokenType3[TokenType3["RIGHT_PAREN"] = 2] = "RIGHT_PAREN";
  TokenType3[TokenType3["LEFT_BRACKET"] = 3] = "LEFT_BRACKET";
  TokenType3[TokenType3["RIGHT_BRACKET"] = 4] = "RIGHT_BRACKET";
  TokenType3[TokenType3["COMMA"] = 5] = "COMMA";
  TokenType3[TokenType3["DOT"] = 6] = "DOT";
  TokenType3[TokenType3["BANG"] = 7] = "BANG";
  TokenType3[TokenType3["BANG_EQUAL"] = 8] = "BANG_EQUAL";
  TokenType3[TokenType3["EQUAL_EQUAL"] = 9] = "EQUAL_EQUAL";
  TokenType3[TokenType3["GREATER"] = 10] = "GREATER";
  TokenType3[TokenType3["GREATER_EQUAL"] = 11] = "GREATER_EQUAL";
  TokenType3[TokenType3["LESS"] = 12] = "LESS";
  TokenType3[TokenType3["LESS_EQUAL"] = 13] = "LESS_EQUAL";
  TokenType3[TokenType3["AND"] = 14] = "AND";
  TokenType3[TokenType3["OR"] = 15] = "OR";
  TokenType3[TokenType3["STAR"] = 16] = "STAR";
  TokenType3[TokenType3["NUMBER"] = 17] = "NUMBER";
  TokenType3[TokenType3["STRING"] = 18] = "STRING";
  TokenType3[TokenType3["IDENTIFIER"] = 19] = "IDENTIFIER";
  TokenType3[TokenType3["TRUE"] = 20] = "TRUE";
  TokenType3[TokenType3["FALSE"] = 21] = "FALSE";
  TokenType3[TokenType3["NULL"] = 22] = "NULL";
  TokenType3[TokenType3["EOF"] = 23] = "EOF";
})(TokenType2 || (TokenType2 = {}));
function tokenString(tok) {
  switch (tok.type) {
    case TokenType2.EOF:
      return "EOF";
    case TokenType2.NUMBER:
      return tok.lexeme;
    case TokenType2.STRING:
      return tok.value.toString();
    default:
      return tok.lexeme;
  }
}
var Lexer = class {
  constructor(input) {
    this.input = input;
    this.start = 0;
    this.offset = 0;
    this.line = 0;
    this.lastLineOffset = 0;
    this.tokens = [];
  }
  lex() {
    if (this.input.length > MAX_EXPRESSION_LENGTH) {
      throw new Error("ErrorExceededMaxLength");
    }
    while (!this.atEnd()) {
      this.start = this.offset;
      const c = this.next();
      switch (c) {
        case "(":
          this.addToken(TokenType2.LEFT_PAREN);
          break;
        case ")":
          this.addToken(TokenType2.RIGHT_PAREN);
          break;
        case "[":
          this.addToken(TokenType2.LEFT_BRACKET);
          break;
        case "]":
          this.addToken(TokenType2.RIGHT_BRACKET);
          break;
        case ",":
          this.addToken(TokenType2.COMMA);
          break;
        case ".":
          if (this.previous() != TokenType2.IDENTIFIER && this.previous() != TokenType2.RIGHT_BRACKET && this.previous() != TokenType2.RIGHT_PAREN && this.previous() != TokenType2.STAR) {
            this.consumeNumber();
          } else {
            this.addToken(TokenType2.DOT);
          }
          break;
        case "-":
        case "+":
          this.consumeNumber();
          break;
        case "!":
          this.addToken(this.match("=") ? TokenType2.BANG_EQUAL : TokenType2.BANG);
          break;
        case "=":
          if (!this.match("=")) {
            this.consumeIdentifier();
            break;
          }
          this.addToken(TokenType2.EQUAL_EQUAL);
          break;
        case "<":
          this.addToken(this.match("=") ? TokenType2.LESS_EQUAL : TokenType2.LESS);
          break;
        case ">":
          this.addToken(this.match("=") ? TokenType2.GREATER_EQUAL : TokenType2.GREATER);
          break;
        case "&":
          if (!this.match("&")) {
            this.consumeIdentifier();
            break;
          }
          this.addToken(TokenType2.AND);
          break;
        case "|":
          if (!this.match("|")) {
            this.consumeIdentifier();
            break;
          }
          this.addToken(TokenType2.OR);
          break;
        case "*":
          this.addToken(TokenType2.STAR);
          break;
        // Ignore whitespace.
        case " ":
        case "\r":
        case "	":
          break;
        case "\n":
          ++this.line;
          this.lastLineOffset = this.offset;
          break;
        case "'":
          this.consumeString();
          break;
        default:
          switch (true) {
            case isDigit(c):
              this.consumeNumber();
              break;
            default:
              this.consumeIdentifier();
              break;
          }
      }
    }
    this.tokens.push({
      type: TokenType2.EOF,
      lexeme: "",
      range: this.range()
    });
    return {
      tokens: this.tokens
    };
  }
  pos() {
    return {
      line: this.line,
      column: this.start - this.lastLineOffset
    };
  }
  endPos() {
    return {
      line: this.line,
      column: this.offset - this.lastLineOffset
    };
  }
  range() {
    return {
      start: this.pos(),
      end: this.endPos()
    };
  }
  atEnd() {
    return this.offset >= this.input.length;
  }
  peek() {
    if (this.atEnd()) {
      return "\0";
    }
    return this.input[this.offset];
  }
  peekNext() {
    if (this.offset + 1 >= this.input.length) {
      return "\0";
    }
    return this.input[this.offset + 1];
  }
  previous() {
    const l = this.tokens.length;
    if (l == 0) {
      return TokenType2.EOF;
    }
    return this.tokens[l - 1].type;
  }
  next() {
    return this.input[this.offset++];
  }
  match(expected) {
    if (this.atEnd()) {
      return false;
    }
    if (this.input[this.offset] !== expected) {
      return false;
    }
    this.offset++;
    return true;
  }
  addToken(type, value) {
    this.tokens.push({
      type,
      lexeme: this.input.substring(this.start, this.offset),
      range: this.range(),
      value
    });
  }
  consumeNumber() {
    while (!this.atEnd() && (!isBoundary(this.peek()) || this.peek() == ".")) {
      this.next();
    }
    const lexeme = this.input.substring(this.start, this.offset);
    const value = new StringData(lexeme).number();
    if (isNaN(value)) {
      throw new Error(`Unexpected symbol: '${lexeme}'. Located at position ${this.start + 1} within expression: ${this.input}`);
    }
    this.addToken(TokenType2.NUMBER, value);
  }
  consumeString() {
    while ((this.peek() !== "'" || this.peekNext() === "'") && !this.atEnd()) {
      if (this.peek() === "\n")
        this.line++;
      if (this.peek() === "'" && this.peekNext() === "'") {
        this.next();
      }
      this.next();
    }
    if (this.atEnd()) {
      throw new Error(`Unexpected symbol: '${this.input.substring(this.start)}'. Located at position ${this.start + 1} within expression: ${this.input}`);
    }
    this.next();
    let value = this.input.substring(this.start + 1, this.offset - 1);
    value = value.replace("''", "'");
    this.addToken(TokenType2.STRING, value);
  }
  consumeIdentifier() {
    while (!this.atEnd() && !isBoundary(this.peek())) {
      this.next();
    }
    let tokenType = TokenType2.IDENTIFIER;
    let tokenValue = void 0;
    const lexeme = this.input.substring(this.start, this.offset);
    if (this.previous() != TokenType2.DOT) {
      switch (lexeme) {
        case "true":
          tokenType = TokenType2.TRUE;
          break;
        case "false":
          tokenType = TokenType2.FALSE;
          break;
        case "null":
          tokenType = TokenType2.NULL;
          break;
        case "NaN":
          tokenType = TokenType2.NUMBER;
          tokenValue = NaN;
          break;
        case "Infinity":
          tokenType = TokenType2.NUMBER;
          tokenValue = Infinity;
          break;
      }
    }
    if (!isLegalIdentifier(lexeme)) {
      throw new Error(`Unexpected symbol: '${lexeme}'. Located at position ${this.start + 1} within expression: ${this.input}`);
    }
    this.addToken(tokenType, tokenValue);
  }
};
function isDigit(c) {
  return c >= "0" && c <= "9";
}
function isBoundary(c) {
  switch (c) {
    case "(":
    case "[":
    case ")":
    case "]":
    case ",":
    case ".":
    case "!":
    case ">":
    case "<":
    case "=":
    case "&":
    case "|":
      return true;
  }
  return /\s/.test(c);
}
function isLegalIdentifier(str2) {
  if (str2 == "") {
    return false;
  }
  const first = str2[0];
  if (first >= "a" && first <= "z" || first >= "A" && first <= "Z" || first == "_") {
    for (const c of str2.substring(1).split("")) {
      if (c >= "a" && c <= "z" || c >= "A" && c <= "Z" || c >= "0" && c <= "9" || c == "_" || c == "-") {
      } else {
        return false;
      }
    }
    return true;
  }
  return false;
}

// node_modules/@actions/expressions/dist/errors.js
var MAX_PARSER_DEPTH = 50;
var MAX_EXPRESSION_LENGTH = 21e3;
var ErrorType;
(function(ErrorType2) {
  ErrorType2[ErrorType2["ErrorUnexpectedSymbol"] = 0] = "ErrorUnexpectedSymbol";
  ErrorType2[ErrorType2["ErrorUnrecognizedNamedValue"] = 1] = "ErrorUnrecognizedNamedValue";
  ErrorType2[ErrorType2["ErrorUnexpectedEndOfExpression"] = 2] = "ErrorUnexpectedEndOfExpression";
  ErrorType2[ErrorType2["ErrorExceededMaxDepth"] = 3] = "ErrorExceededMaxDepth";
  ErrorType2[ErrorType2["ErrorExceededMaxLength"] = 4] = "ErrorExceededMaxLength";
  ErrorType2[ErrorType2["ErrorTooFewParameters"] = 5] = "ErrorTooFewParameters";
  ErrorType2[ErrorType2["ErrorTooManyParameters"] = 6] = "ErrorTooManyParameters";
  ErrorType2[ErrorType2["ErrorEvenParameters"] = 7] = "ErrorEvenParameters";
  ErrorType2[ErrorType2["ErrorUnrecognizedContext"] = 8] = "ErrorUnrecognizedContext";
  ErrorType2[ErrorType2["ErrorUnrecognizedFunction"] = 9] = "ErrorUnrecognizedFunction";
})(ErrorType || (ErrorType = {}));
var ExpressionError = class extends Error {
  constructor(typ, tok) {
    super(`${errorDescription(typ)}: '${tokenString(tok)}'`);
    this.typ = typ;
    this.tok = tok;
    this.pos = this.tok.range.start;
  }
};
function errorDescription(typ) {
  switch (typ) {
    case ErrorType.ErrorUnexpectedEndOfExpression:
      return "Unexpected end of expression";
    case ErrorType.ErrorUnexpectedSymbol:
      return "Unexpected symbol";
    case ErrorType.ErrorUnrecognizedNamedValue:
      return "Unrecognized named-value";
    case ErrorType.ErrorExceededMaxDepth:
      return `Exceeded max expression depth ${MAX_PARSER_DEPTH}`;
    case ErrorType.ErrorExceededMaxLength:
      return `Exceeded max expression length ${MAX_EXPRESSION_LENGTH}`;
    case ErrorType.ErrorTooFewParameters:
      return "Too few parameters supplied";
    case ErrorType.ErrorTooManyParameters:
      return "Too many parameters supplied";
    case ErrorType.ErrorEvenParameters:
      return "Even number of parameters supplied, requires an odd number of parameters";
    case ErrorType.ErrorUnrecognizedContext:
      return "Unrecognized named-value";
    case ErrorType.ErrorUnrecognizedFunction:
      return "Unrecognized function";
    default:
      return "Unknown error";
  }
}
var ExpressionEvaluationError = class extends Error {
};

// node_modules/@actions/expressions/dist/funcs/case.js
var caseFunc = {
  name: "case",
  description: "`case( pred1, val1, pred2, val2, ..., default )`\n\nEvaluates predicates in order and returns the value corresponding to the first predicate that evaluates to `true`. If no predicate matches, it returns the last argument as the default value.",
  minArgs: 3,
  maxArgs: Number.MAX_SAFE_INTEGER,
  call: (...args) => {
    for (let i = 0; i < args.length - 1; i += 2) {
      const predicate = args[i];
      if (predicate.kind !== Kind.Boolean) {
        throw new Error("case predicate must evaluate to a boolean value");
      }
      if (predicate.value) {
        return args[i + 1];
      }
    }
    return args[args.length - 1];
  }
};

// node_modules/@actions/expressions/dist/result.js
function falsy(d) {
  switch (d.kind) {
    case Kind.Null:
      return true;
    case Kind.Boolean:
      return !d.value;
    case Kind.Number: {
      const dv = d.value;
      return dv === 0 || isNaN(dv);
    }
    case Kind.String:
      return d.value.length === 0;
  }
  return false;
}
function truthy(d) {
  return !falsy(d);
}
function coerceTypes(li, ri) {
  let lv = li;
  let rv = ri;
  if (li.kind === ri.kind) {
    return [lv, rv];
  }
  switch (li.kind) {
    // Number, String
    case Kind.Number:
      if (ri.kind === Kind.String) {
        rv = new NumberData(ri.number());
        return [lv, rv];
      }
      break;
    // String, Number
    case Kind.String:
      if (ri.kind === Kind.Number) {
        lv = new NumberData(li.number());
        return [lv, rv];
      }
      break;
    // Boolean|Null, Any
    case Kind.Null:
    case Kind.Boolean:
      lv = new NumberData(li.number());
      return coerceTypes(lv, rv);
  }
  switch (ri.kind) {
    case Kind.Null:
    case Kind.Boolean:
      rv = new NumberData(ri.number());
      return coerceTypes(lv, rv);
  }
  return [lv, rv];
}
function equals(lhs, rhs) {
  const [lv, rv] = coerceTypes(lhs, rhs);
  if (lv.kind != rv.kind) {
    return false;
  }
  switch (lv.kind) {
    // Null, Null
    case Kind.Null:
      return true;
    // Number, Number
    case Kind.Number: {
      const ld = lv.value;
      const rd = rv.value;
      if (isNaN(ld) || isNaN(rd)) {
        return false;
      }
      return ld == rd;
    }
    // String, String
    case Kind.String: {
      const ls = lv.value;
      const rs = rv.value;
      return toUpperSpecial(ls) === toUpperSpecial(rs);
    }
    // Boolean, Boolean
    case Kind.Boolean: {
      const lb = lv.value;
      const rb = rv.value;
      return lb == rb;
    }
    // Object, Object
    case Kind.Dictionary:
    case Kind.Array:
      return lv === rv;
  }
  return false;
}
function greaterThan(lhs, rhs) {
  const [lv, rv] = coerceTypes(lhs, rhs);
  if (lv.kind != rv.kind) {
    return false;
  }
  switch (lv.kind) {
    // Number, Number
    case Kind.Number: {
      const lf = lv.value;
      const rf = rv.value;
      if (isNaN(lf) || isNaN(rf)) {
        return false;
      }
      return lf > rf;
    }
    // String, String
    case Kind.String: {
      let ls = lv.value;
      let rs = rv.value;
      ls = toUpperSpecial(ls);
      rs = toUpperSpecial(rs);
      return ls > rs;
    }
    // Boolean, Boolean
    case Kind.Boolean: {
      const lb = lv.value;
      const rb = rv.value;
      return lb && !rb;
    }
  }
  return false;
}
function lessThan(lhs, rhs) {
  const [lv, rv] = coerceTypes(lhs, rhs);
  if (lv.kind != rv.kind) {
    return false;
  }
  switch (lv.kind) {
    // Number, Number
    case Kind.Number: {
      const lf = lv.value;
      const rf = rv.value;
      if (isNaN(lf) || isNaN(rf)) {
        return false;
      }
      return lf < rf;
    }
    // String, String
    case Kind.String: {
      let ls = lv.value;
      let rs = rv.value;
      ls = toUpperSpecial(ls);
      rs = toUpperSpecial(rs);
      return ls < rs;
    }
    // Boolean, Boolean
    case Kind.Boolean: {
      const lb = lv.value;
      const rb = rv.value;
      return !lb && rb;
    }
  }
  return false;
}
function toUpperSpecial(s) {
  const sb = [];
  let i = 0;
  const len = s.length;
  let found = s.indexOf("\u0131");
  while (i < len) {
    if (i < found) {
      sb.push(s.substring(i, found).toUpperCase());
      i = found;
    } else if (i == found) {
      sb.push(s.substring(i, i + 1));
      i += 1;
      found = s.indexOf("\u0131", i);
    } else {
      sb.push(s.substring(i).toUpperCase());
      break;
    }
  }
  return sb.join("");
}

// node_modules/@actions/expressions/dist/funcs/contains.js
var contains = {
  name: "contains",
  description: "`contains( search, item )`\n\nReturns `true` if `search` contains `item`. If `search` is an array, this function returns `true` if the `item` is an element in the array. If `search` is a string, this function returns `true` if the `item` is a substring of `search`. This function is not case sensitive. Casts values to a string.",
  minArgs: 2,
  maxArgs: 2,
  call: (...args) => {
    const left = args[0];
    const right = args[1];
    if (left.primitive) {
      const ls = left.coerceString();
      if (right.primitive) {
        const rs = right.coerceString();
        return new BooleanData(ls.toLowerCase().includes(rs.toLowerCase()));
      }
    } else if (left.kind === Kind.Array) {
      const la = left;
      if (la.values().length === 0) {
        return new BooleanData(false);
      }
      for (const v of la.values()) {
        if (equals(right, v)) {
          return new BooleanData(true);
        }
      }
    }
    return new BooleanData(false);
  }
};

// node_modules/@actions/expressions/dist/funcs/endswith.js
var endswith = {
  name: "endsWith",
  description: "`endsWith( searchString, searchValue )`\n\nReturns `true` if `searchString` ends with `searchValue`. This function is not case sensitive. Casts values to a string.",
  minArgs: 2,
  maxArgs: 2,
  call: (...args) => {
    const left = args[0];
    if (!left.primitive) {
      return new BooleanData(false);
    }
    const right = args[1];
    if (!right.primitive) {
      return new BooleanData(false);
    }
    const ls = toUpperSpecial(left.coerceString());
    const rs = toUpperSpecial(right.coerceString());
    return new BooleanData(ls.endsWith(rs));
  }
};

// node_modules/@actions/expressions/dist/funcs/format.js
var format = {
  name: "format",
  description: "`format( string, replaceValue0, replaceValue1, ..., replaceValueN)`\n\nReplaces values in the `string`, with the variable `replaceValueN`. Variables in the `string` are specified using the `{N}` syntax, where `N` is an integer. You must specify at least one `replaceValue` and `string`. There is no maximum for the number of variables (`replaceValueN`) you can use. Escape curly braces using double braces.",
  minArgs: 1,
  maxArgs: 255,
  call: (...args) => {
    const fs = args[0].coerceString();
    const result = [];
    let index = 0;
    while (index < fs.length) {
      const lbrace = fs.indexOf("{", index);
      const rbrace = fs.indexOf("}", index);
      if (lbrace >= 0 && (rbrace < 0 || rbrace > lbrace)) {
        if (safeCharAt(fs, lbrace + 1) === "{") {
          result.push(fs.substr(index, lbrace - index + 1));
          index = lbrace + 2;
          continue;
        }
        if (rbrace > lbrace + 1) {
          const argIndex = readArgIndex(fs, lbrace + 1);
          if (argIndex.success) {
            if (1 + argIndex.result > args.length - 1) {
              throw new Error(`The following format string references more arguments than were supplied: ${fs}`);
            }
            if (lbrace > index) {
              result.push(fs.substr(index, lbrace - index));
            }
            result.push(`${args[1 + argIndex.result].coerceString()}`);
            index = rbrace + 1;
            continue;
          }
        }
        throw new Error(`The following format string is invalid: ${fs}`);
      } else if (rbrace >= 0) {
        if (safeCharAt(fs, rbrace + 1) === "}") {
          result.push(fs.substr(index, rbrace - index + 1));
          index = rbrace + 2;
        } else {
          throw new Error(`The following format string is invalid: ${fs}`);
        }
      } else {
        result.push(fs.substr(index));
        break;
      }
    }
    return new StringData(result.join(""));
  }
};
function safeCharAt(string, index) {
  if (string.length > index) {
    return string[index];
  }
  return "\0";
}
function readArgIndex(string, startIndex) {
  let length = 0;
  for (; ; ) {
    const nextChar = safeCharAt(string, startIndex + length);
    if (nextChar >= "0" && nextChar <= "9") {
      length++;
    } else {
      break;
    }
  }
  if (length < 1) {
    return {
      success: false
    };
  }
  const endIndex = startIndex + length - 1;
  const result = parseInt(string.substr(startIndex, length));
  return {
    success: !isNaN(result),
    result,
    endIndex
  };
}

// node_modules/@actions/expressions/dist/funcs/fromjson.js
var fromjson = {
  name: "fromJson",
  description: "`fromJSON(value)`\n\nReturns a JSON object or JSON data type for `value`. You can use this function to provide a JSON object as an evaluated expression or to convert environment variables from a string.",
  minArgs: 1,
  maxArgs: 1,
  call: (...args) => {
    const input = args[0];
    const is = input.coerceString();
    if (is.trim() === "") {
      throw new Error("empty input");
    }
    try {
      return JSON.parse(is, reviver);
    } catch (e) {
      throw new ExpressionEvaluationError("Error parsing JSON when evaluating fromJson", { cause: e });
    }
  }
};

// node_modules/@actions/expressions/dist/funcs/join.js
var join = {
  name: "join",
  description: "`join( array, optionalSeparator )`\n\nThe value for `array` can be an array or a string. All values in `array` are concatenated into a string. If you provide `optionalSeparator`, it is inserted between the concatenated values. Otherwise, the default separator `,` is used. Casts values to a string.",
  minArgs: 1,
  maxArgs: 2,
  call: (...args) => {
    if (args[0].primitive) {
      return new StringData(args[0].coerceString());
    }
    if (args[0].kind === Kind.Array) {
      let separator = ",";
      if (args.length > 1 && args[1].primitive) {
        separator = args[1].coerceString();
      }
      return new StringData(args[0].values().map((item) => item.coerceString()).join(separator));
    }
    return new StringData("");
  }
};

// node_modules/@actions/expressions/dist/funcs/startswith.js
var startswith = {
  name: "startsWith",
  description: "`startsWith( searchString, searchValue )`\n\nReturns `true` when `searchString` starts with `searchValue`. This function is not case sensitive. Casts values to a string.",
  minArgs: 2,
  maxArgs: 2,
  call: (...args) => {
    const left = args[0];
    if (!left.primitive) {
      return new BooleanData(false);
    }
    const right = args[1];
    if (!right.primitive) {
      return new BooleanData(false);
    }
    const ls = toUpperSpecial(left.coerceString());
    const rs = toUpperSpecial(right.coerceString());
    return new BooleanData(ls.startsWith(rs));
  }
};

// node_modules/@actions/expressions/dist/funcs/tojson.js
var tojson = {
  name: "toJson",
  description: "`toJSON(value)`\n\nReturns a pretty-print JSON representation of `value`. You can use this function to debug the information provided in contexts.",
  minArgs: 1,
  maxArgs: 1,
  call: (...args) => {
    return new StringData(JSON.stringify(args[0], replacer, "  "));
  }
};

// node_modules/@actions/expressions/dist/funcs.js
var wellKnownFunctions = {
  case: caseFunc,
  contains,
  endswith,
  format,
  fromjson,
  join,
  startswith,
  tojson
};
function validateFunction(context, identifier, argCount) {
  const name = identifier.lexeme.toLowerCase();
  let f;
  f = wellKnownFunctions[name];
  if (!f) {
    f = context.extensionFunctions.get(name);
    if (!f) {
      if (!context.allowUnknownKeywords) {
        throw new ExpressionError(ErrorType.ErrorUnrecognizedFunction, identifier);
      }
      return;
    }
  }
  if (argCount < f.minArgs) {
    throw new ExpressionError(ErrorType.ErrorTooFewParameters, identifier);
  }
  if (argCount > f.maxArgs) {
    throw new ExpressionError(ErrorType.ErrorTooManyParameters, identifier);
  }
  if (name === "case" && argCount % 2 === 0) {
    throw new ExpressionError(ErrorType.ErrorEvenParameters, identifier);
  }
}

// node_modules/@actions/expressions/dist/idxHelper.js
var idxHelper = class {
  constructor(star, idx) {
    this.star = star;
    if (!idx) {
      return;
    }
    if (!star) {
      if (idx.primitive) {
        this.str = idx.coerceString();
      }
      let f = idx.number();
      if (!isNaN(f) && isFinite(f) && f >= 0) {
        f = Math.floor(f);
        this.int = f;
      }
    }
  }
};

// node_modules/@actions/expressions/dist/evaluator.js
var Evaluator = class {
  /**
   * Creates a new evaluator
   * @param n Parsed expression to evaluate
   * @param context Context data to use
   * @param functions Optional map of function implementations. If given, these will be preferred over the built-in functions.
   */
  constructor(n, context, functions) {
    this.n = n;
    this.context = context;
    this.functions = functions;
  }
  evaluate() {
    return this.eval(this.n);
  }
  eval(n) {
    return n.accept(this);
  }
  visitLiteral(literal2) {
    return literal2.literal;
  }
  visitUnary(unary) {
    const r = this.eval(unary.expr);
    if (unary.operator.type === TokenType2.BANG) {
      return new BooleanData(falsy(r));
    }
    throw new Error(`unknown unary operator: ${unary.operator.lexeme}`);
  }
  visitBinary(binary) {
    const left = this.eval(binary.left);
    const right = this.eval(binary.right);
    switch (binary.operator.type) {
      case TokenType2.EQUAL_EQUAL:
        return new BooleanData(equals(left, right));
      case TokenType2.BANG_EQUAL:
        return new BooleanData(!equals(left, right));
      case TokenType2.GREATER:
        return new BooleanData(greaterThan(left, right));
      case TokenType2.GREATER_EQUAL:
        return new BooleanData(equals(left, right) || greaterThan(left, right));
      case TokenType2.LESS:
        return new BooleanData(lessThan(left, right));
      case TokenType2.LESS_EQUAL:
        return new BooleanData(equals(left, right) || lessThan(left, right));
    }
    throw new Error(`unknown binary operator: ${binary.operator.lexeme}`);
  }
  visitLogical(logical) {
    let result;
    for (const arg of logical.args) {
      result = this.eval(arg);
      if (logical.operator.type === TokenType2.AND && falsy(result) || logical.operator.type === TokenType2.OR && truthy(result)) {
        break;
      }
    }
    return result;
  }
  visitGrouping(grouping) {
    return this.eval(grouping.group);
  }
  visitContextAccess(contextAccess) {
    const r = this.context.get(contextAccess.name.lexeme);
    return r;
  }
  visitIndexAccess(ia) {
    let idx;
    if (ia.index instanceof Star) {
      idx = new idxHelper(true, void 0);
    } else {
      let idxResult;
      try {
        idxResult = this.eval(ia.index);
      } catch (e) {
        throw new Error(`could not evaluate index for index access: ${e.message}`, { cause: e });
      }
      idx = new idxHelper(false, idxResult);
    }
    const objResult = this.eval(ia.expr);
    let result;
    switch (objResult.kind) {
      case Kind.Array: {
        const tobjResult = objResult;
        if (tobjResult instanceof FilteredArray) {
          result = filteredArrayAccess(tobjResult, idx);
        } else {
          result = arrayAccess(tobjResult, idx);
        }
        break;
      }
      case Kind.Dictionary: {
        const tobjResult = objResult;
        result = objectAccess(tobjResult, idx);
        break;
      }
      default:
        if (idx.star) {
          result = new FilteredArray();
        } else {
          result = new Null();
        }
    }
    return result;
  }
  visitFunctionCall(functionCall) {
    const args = functionCall.args.map((arg) => this.eval(arg));
    const functionName = functionCall.functionName.lexeme.toLowerCase();
    const f = this.functions?.get(functionName) || wellKnownFunctions[functionName];
    return f.call(...args);
  }
};
function filteredArrayAccess(fa, idx) {
  const result = new FilteredArray();
  for (const item of fa.values()) {
    switch (item.kind) {
      case Kind.Dictionary: {
        const ti = item;
        if (idx.star) {
          for (const v of ti.values()) {
            result.add(v);
          }
        } else if (idx.str !== void 0) {
          const v = ti.get(idx.str);
          if (v !== void 0) {
            result.add(v);
          }
        }
        break;
      }
      case Kind.Array: {
        const ti = item;
        if (idx.star) {
          for (const v of ti.values()) {
            result.add(v);
          }
        } else if (idx.int !== void 0 && idx.int < ti.values().length) {
          result.add(ti.get(idx.int));
        }
        break;
      }
    }
  }
  return result;
}
function arrayAccess(a, idx) {
  if (idx.star) {
    const fa = new FilteredArray();
    for (const item of a.values()) {
      fa.add(item);
    }
    return fa;
  }
  if (idx.int !== void 0 && idx.int < a.values().length) {
    return a.get(idx.int);
  }
  return new Null();
}
function objectAccess(obj, idx) {
  if (idx.star) {
    const fa = new FilteredArray(...obj.values());
    return fa;
  }
  if (idx.str !== void 0) {
    const r = obj.get(idx.str);
    if (r !== void 0) {
      return r;
    }
  }
  return new Null();
}

// node_modules/@actions/expressions/dist/parser.js
var Parser = class {
  /**
   * Constructs a new parser for the given tokens
   *
   * @param tokens Tokens to build a parse tree from
   * @param extensionContexts Available context names
   * @param extensionFunctions Available functions (beyond the built-in ones)
   */
  constructor(tokens, extensionContexts, extensionFunctions) {
    this.tokens = tokens;
    this.offset = 0;
    this.depth = 0;
    this.extContexts = /* @__PURE__ */ new Map();
    this.extFuncs = /* @__PURE__ */ new Map();
    for (const contextName of extensionContexts) {
      this.extContexts.set(contextName.toLowerCase(), true);
    }
    for (const { name, func } of extensionFunctions.map((x) => ({
      name: x.name,
      func: x
    }))) {
      this.extFuncs.set(name.toLowerCase(), func);
    }
    this.context = {
      allowUnknownKeywords: false,
      extensionContexts: this.extContexts,
      extensionFunctions: this.extFuncs
    };
  }
  parse() {
    let result;
    if (this.atEnd()) {
      return result;
    }
    result = this.expression();
    if (!this.atEnd()) {
      throw this.buildError(ErrorType.ErrorUnexpectedSymbol, this.peek());
    }
    return result;
  }
  expression() {
    this.incrDepth();
    try {
      return this.logicalOr();
    } finally {
      this.decrDepth();
    }
  }
  logicalOr() {
    let expr = this.logicalAnd();
    if (this.check(TokenType2.OR)) {
      this.incrDepth();
      try {
        const logical = new Logical(this.peek(), [expr]);
        expr = logical;
        while (this.match(TokenType2.OR)) {
          const right = this.logicalAnd();
          logical.args.push(right);
        }
      } finally {
        this.decrDepth();
      }
    }
    return expr;
  }
  logicalAnd() {
    let expr = this.equality();
    if (this.check(TokenType2.AND)) {
      this.incrDepth();
      try {
        const logical = new Logical(this.peek(), [expr]);
        expr = logical;
        while (this.match(TokenType2.AND)) {
          const right = this.equality();
          logical.args.push(right);
        }
      } finally {
        this.decrDepth();
      }
    }
    return expr;
  }
  equality() {
    let expr = this.comparison();
    while (this.match(TokenType2.BANG_EQUAL, TokenType2.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new Binary(expr, operator, right);
    }
    return expr;
  }
  comparison() {
    let expr = this.unary();
    while (this.match(TokenType2.GREATER, TokenType2.GREATER_EQUAL, TokenType2.LESS, TokenType2.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new Binary(expr, operator, right);
    }
    return expr;
  }
  unary() {
    if (this.match(TokenType2.BANG)) {
      this.incrDepth();
      const operator = this.previous();
      const unary = this.unary();
      try {
        return new Unary(operator, unary);
      } finally {
        this.decrDepth();
      }
    }
    return this.index();
  }
  index() {
    let expr = this.call();
    let depthIncreased = 0;
    if (expr instanceof Grouping || expr instanceof FunctionCall || expr instanceof ContextAccess) {
      let cont = true;
      while (cont) {
        switch (true) {
          case this.match(TokenType2.LEFT_BRACKET): {
            let indexExpr;
            if (this.match(TokenType2.STAR)) {
              indexExpr = new Star();
            } else {
              indexExpr = this.expression();
            }
            this.consume(TokenType2.RIGHT_BRACKET, ErrorType.ErrorUnexpectedSymbol);
            this.incrDepth();
            depthIncreased++;
            expr = new IndexAccess(expr, indexExpr);
            break;
          }
          case this.match(TokenType2.DOT):
            this.incrDepth();
            depthIncreased++;
            if (this.match(TokenType2.IDENTIFIER)) {
              const property = this.previous();
              expr = new IndexAccess(expr, new Literal(new StringData(property.lexeme), property));
            } else if (this.match(TokenType2.STAR)) {
              expr = new IndexAccess(expr, new Star());
            } else {
              throw this.buildError(ErrorType.ErrorUnexpectedSymbol, this.peek());
            }
            break;
          default:
            cont = false;
        }
      }
    }
    for (let i = 0; i < depthIncreased; i++) {
      this.decrDepth();
    }
    return expr;
  }
  call() {
    if (!this.check(TokenType2.IDENTIFIER)) {
      return this.primary();
    }
    const identifier = this.next();
    if (!this.match(TokenType2.LEFT_PAREN)) {
      if (!this.extContexts.has(identifier.lexeme.toLowerCase())) {
        throw this.buildError(ErrorType.ErrorUnrecognizedContext, identifier);
      }
      return new ContextAccess(identifier);
    }
    const args = [];
    while (!this.match(TokenType2.RIGHT_PAREN)) {
      const aexp = this.expression();
      args.push(aexp);
      if (!this.check(TokenType2.RIGHT_PAREN)) {
        this.consume(TokenType2.COMMA, ErrorType.ErrorUnexpectedSymbol);
      }
    }
    validateFunction(this.context, identifier, args.length);
    return new FunctionCall(identifier, args);
  }
  primary() {
    switch (true) {
      case this.match(TokenType2.FALSE):
        return new Literal(new BooleanData(false), this.previous());
      case this.match(TokenType2.TRUE):
        return new Literal(new BooleanData(true), this.previous());
      case this.match(TokenType2.NULL):
        return new Literal(new Null(), this.previous());
      case this.match(TokenType2.NUMBER):
        return new Literal(new NumberData(this.previous().value), this.previous());
      case this.match(TokenType2.STRING):
        return new Literal(new StringData(this.previous().value), this.previous());
      case this.match(TokenType2.LEFT_PAREN): {
        const expr = this.expression();
        if (this.atEnd()) {
          throw this.buildError(ErrorType.ErrorUnexpectedEndOfExpression, this.previous());
        }
        this.consume(TokenType2.RIGHT_PAREN, ErrorType.ErrorUnexpectedSymbol);
        return new Grouping(expr);
      }
      case this.atEnd():
        throw this.buildError(ErrorType.ErrorUnexpectedEndOfExpression, this.previous());
    }
    throw this.buildError(ErrorType.ErrorUnexpectedSymbol, this.peek());
  }
  // match consumes the next token if it matches any of the given types
  match(...tokenTypes) {
    for (const tokenType of tokenTypes) {
      if (this.check(tokenType)) {
        this.next();
        return true;
      }
    }
    return false;
  }
  // check peeks whether the next token is of the given type
  check(tokenType) {
    if (this.atEnd()) {
      return false;
    }
    return this.peek().type == tokenType;
  }
  // atEnd peeks whether the next token is EOF
  atEnd() {
    return this.peek().type == TokenType2.EOF;
  }
  next() {
    if (!this.atEnd()) {
      this.offset++;
    }
    return this.previous();
  }
  peek() {
    return this.tokens[this.offset];
  }
  // previous returns the previous token
  previous() {
    return this.tokens[this.offset - 1];
  }
  // consume attempts to consume the next token if it matches the given type. It returns an error of
  // the given ParseErrorKind otherwise.
  consume(tokenType, errorType) {
    if (this.check(tokenType)) {
      this.next();
      return;
    }
    throw this.buildError(errorType, this.peek());
  }
  incrDepth() {
    this.depth++;
    if (this.depth > MAX_PARSER_DEPTH) {
      throw this.buildError(ErrorType.ErrorExceededMaxDepth, this.peek());
    }
  }
  decrDepth() {
    this.depth--;
  }
  buildError(errType, token) {
    return new ExpressionError(errType, token);
  }
};

// node_modules/@actions/workflow-parser/dist/templates/allowed-context.js
function splitAllowedContext(allowedContext) {
  const FUNCTION_REGEXP = /^([a-zA-Z0-9_]+)\(([0-9]+),([0-9]+|MAX)\)$/;
  const namedContexts = [];
  const functions = [];
  if (allowedContext.length > 0) {
    for (const contextItem of allowedContext) {
      const match = contextItem.match(FUNCTION_REGEXP);
      if (match) {
        const functionName = match[1];
        const minParameters = Number.parseInt(match[2]);
        const maxParametersRaw = match[3];
        const maxParameters = maxParametersRaw === MAX_CONSTANT ? Number.MAX_SAFE_INTEGER : Number.parseInt(maxParametersRaw);
        functions.push({
          name: functionName,
          minArgs: minParameters,
          maxArgs: maxParameters
        });
      } else {
        namedContexts.push(contextItem);
      }
    }
  }
  return {
    namedContexts,
    functions
  };
}

// node_modules/@actions/workflow-parser/dist/templates/tokens/expression-token.js
var ExpressionToken = class extends ScalarToken {
  constructor(type, file, range, directive, definitionInfo) {
    super(type, file, range, definitionInfo);
    this.directive = directive;
  }
  get isLiteral() {
    return false;
  }
  get isExpression() {
    return true;
  }
  static validateExpression(expression, allowedContext) {
    const { namedContexts, functions } = splitAllowedContext(allowedContext);
    const lexer = new Lexer(expression);
    const result = lexer.lex();
    const p = new Parser(result.tokens, namedContexts, functions);
    p.parse();
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/basic-expression-token.js
var BasicExpressionToken = class _BasicExpressionToken extends ExpressionToken {
  /**
   * @param file The file ID where this token originated
   * @param range The range of the entire expression including `${{` and `}}`
   * @param expression The expression string without `${{` and `}}` markers
   * @param definitionInfo Schema definition info for this token
   * @param originalExpressions If transformed from individual expressions (e.g., format()), these are the originals
   * @param source The original source string from the YAML
   * @param expressionRange The range of just the expression, excluding `${{` and `}}`
   * @param blockScalarHeader The block scalar header (e.g., "|", "|-") if parsed from a YAML block scalar
   */
  constructor(file, range, expression, definitionInfo, originalExpressions, source, expressionRange, blockScalarHeader) {
    super(TokenType.BasicExpression, file, range, void 0, definitionInfo);
    this.expr = expression;
    this.source = source;
    this.originalExpressions = originalExpressions;
    this.expressionRange = expressionRange;
    this.blockScalarHeader = blockScalarHeader;
  }
  get expression() {
    return this.expr;
  }
  clone(omitSource) {
    return omitSource ? new _BasicExpressionToken(void 0, void 0, this.expr, this.definitionInfo, this.originalExpressions, this.source, this.expressionRange, this.blockScalarHeader) : new _BasicExpressionToken(this.file, this.range, this.expr, this.definitionInfo, this.originalExpressions, this.source, this.expressionRange, this.blockScalarHeader);
  }
  toString() {
    return `${OPEN_EXPRESSION} ${this.expr} ${CLOSE_EXPRESSION}`;
  }
  toDisplayString() {
    return ScalarToken.trimDisplayString(this.toString());
  }
  toJSON() {
    return {
      type: TokenType.BasicExpression,
      expr: this.expr
    };
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/insert-expression-token.js
var InsertExpressionToken = class _InsertExpressionToken extends ExpressionToken {
  constructor(file, range, definitionInfo) {
    super(TokenType.InsertExpression, file, range, INSERT_DIRECTIVE, definitionInfo);
  }
  clone(omitSource) {
    return omitSource ? new _InsertExpressionToken(void 0, void 0, this.definitionInfo) : new _InsertExpressionToken(this.file, this.range, this.definitionInfo);
  }
  toString() {
    return `${OPEN_EXPRESSION} ${INSERT_DIRECTIVE} ${CLOSE_EXPRESSION}`;
  }
  toDisplayString() {
    return ScalarToken.trimDisplayString(this.toString());
  }
  toJSON() {
    return {
      type: TokenType.InsertExpression,
      expr: "insert"
    };
  }
};

// node_modules/@actions/workflow-parser/dist/templates/tokens/type-guards.js
function isLiteral(t) {
  return t.isLiteral;
}
function isScalar(t) {
  return t.isScalar;
}
function isString(t) {
  return isLiteral(t) && t.templateTokenType === TokenType.String;
}
function isNumber(t) {
  return isLiteral(t) && t.templateTokenType === TokenType.Number;
}
function isBoolean(t) {
  return isLiteral(t) && t.templateTokenType === TokenType.Boolean;
}
function isBasicExpression(t) {
  return isScalar(t) && t.templateTokenType === TokenType.BasicExpression;
}
function isSequence(t) {
  return t instanceof SequenceToken;
}
function isMapping(t) {
  return t instanceof MappingToken;
}

// node_modules/@actions/workflow-parser/dist/templates/template-reader.js
var WHITESPACE_PATTERN = /\s/;
var backgroundStepProperties = /* @__PURE__ */ new Set(["background", "wait", "wait-all", "cancel"]);
var backgroundStepOnlyProperties = /* @__PURE__ */ new Set(["wait", "wait-all", "cancel"]);
function readTemplate(context, type, objectReader, fileId) {
  const reader = new TemplateReader(context, objectReader, fileId);
  let value;
  try {
    objectReader.validateStart();
    const definition = new DefinitionInfo(context.schema, type);
    value = reader.readValue(definition);
    objectReader.validateEnd();
  } catch (err) {
    context.error(fileId, err);
  }
  return value;
}
var TemplateReader = class {
  constructor(context, objectReader, fileId) {
    this._context = context;
    this._schema = context.schema;
    this._objectReader = objectReader;
    this._fileId = fileId;
  }
  readValue(definition) {
    const literal2 = this._objectReader.allowLiteral();
    if (literal2) {
      let scalar = this.parseScalar(literal2, definition);
      scalar = this.validate(scalar, definition);
      return scalar;
    }
    const sequence = this._objectReader.allowSequenceStart();
    if (sequence) {
      const sequenceDefinition = definition.getDefinitionsOfType(DefinitionType.Sequence)[0];
      if (sequenceDefinition) {
        const itemDefinition = new DefinitionInfo(definition, sequenceDefinition.itemType);
        while (!this._objectReader.allowSequenceEnd()) {
          const item = this.readValue(itemDefinition);
          sequence.add(item);
        }
      } else {
        this._context.error(sequence, "A sequence was not expected");
        while (!this._objectReader.allowSequenceEnd()) {
          this.skipValue();
        }
      }
      sequence.definitionInfo = definition;
      return sequence;
    }
    const mapping = this._objectReader.allowMappingStart();
    if (mapping) {
      const mappingDefinitions = definition.getDefinitionsOfType(DefinitionType.Mapping);
      if (mappingDefinitions.length > 0) {
        if (mappingDefinitions.length > 1 || Object.keys(mappingDefinitions[0].properties).length > 0 || !mappingDefinitions[0].looseKeyType) {
          this.handleMappingWithWellKnownProperties(definition, mappingDefinitions, mapping);
        } else {
          const keyDefinition = new DefinitionInfo(definition, mappingDefinitions[0].looseKeyType);
          const valueDefinition = new DefinitionInfo(definition, mappingDefinitions[0].looseValueType);
          this.handleMappingWithAllLooseProperties(definition, keyDefinition, valueDefinition, mappingDefinitions[0], mapping);
        }
      } else {
        this._context.error(mapping, "A mapping was not expected");
        while (!this._objectReader.allowMappingEnd()) {
          this.skipValue();
          this.skipValue();
        }
      }
      if (!mapping.definitionInfo) {
        mapping.definitionInfo = definition;
      }
      return mapping;
    }
    throw new Error("Expected a scalar value, a sequence, or a mapping");
  }
  handleMappingWithWellKnownProperties(definition, mappingDefinitions, mapping) {
    let looseKeyType;
    let looseValueType;
    let looseKeyDefinition;
    let looseValueDefinition;
    if (mappingDefinitions[0].looseKeyType) {
      looseKeyType = mappingDefinitions[0].looseKeyType;
      looseValueType = mappingDefinitions[0].looseValueType;
    }
    const upperKeys = {};
    let hasExpressionKey = false;
    let rawLiteral;
    while (rawLiteral = this._objectReader.allowLiteral()) {
      const nextKeyScalar = this.parseScalar(rawLiteral, definition);
      if (nextKeyScalar.isExpression) {
        hasExpressionKey = true;
        if (definition.allowedContext.length > 0) {
          const anyDefinition = new DefinitionInfo(definition, ANY);
          mapping.add(nextKeyScalar, this.readValue(anyDefinition));
        } else {
          this._context.error(nextKeyScalar, "A template expression is not allowed in this context");
          this.skipValue();
        }
        continue;
      }
      const nextKey = nextKeyScalar.templateTokenType === TokenType.String ? nextKeyScalar : new StringToken(nextKeyScalar.file, nextKeyScalar.range, nextKeyScalar.toString(), nextKeyScalar.definitionInfo);
      if (nextKey.value) {
        const upperKey = nextKey.value.toUpperCase();
        if (upperKeys[upperKey]) {
          this._context.error(nextKey, `'${nextKey.value}' is already defined`);
          this.skipValue();
          continue;
        }
        upperKeys[upperKey] = true;
      }
      const nextPropertyDef = this._schema.matchPropertyAndFilter(mappingDefinitions, nextKey.value);
      if (nextPropertyDef) {
        if (!this.backgroundStepsEnabled() && backgroundStepProperties.has(nextKey.value)) {
          this._context.error(nextKey, `Unexpected value '${nextKey.value}'`);
          this.skipValue();
          continue;
        }
        const nextDefinition = new DefinitionInfo(definition, nextPropertyDef.type);
        nextKey.definitionInfo = nextDefinition;
        if (nextPropertyDef.description) {
          nextKey.description = nextPropertyDef.description;
        }
        const nextValue = this.readValue(nextDefinition);
        mapping.add(nextKey, nextValue);
        continue;
      }
      if (looseKeyType) {
        if (!looseKeyDefinition) {
          looseKeyDefinition = new DefinitionInfo(definition, looseKeyType);
          looseValueDefinition = new DefinitionInfo(definition, looseValueType);
        }
        this.validate(nextKey, looseKeyDefinition);
        const nextDefinition = new DefinitionInfo(definition, mappingDefinitions[0].looseValueType);
        nextKey.definitionInfo = nextDefinition;
        const nextValue = this.readValue(looseValueDefinition);
        mapping.add(nextKey, nextValue);
        continue;
      }
      this._context.error(nextKey, `Unexpected value '${nextKey.value}'`);
      this.skipValue();
    }
    if (mappingDefinitions.length === 1) {
      mapping.definitionInfo = new DefinitionInfo(definition, mappingDefinitions[0]);
    }
    if (mappingDefinitions.length > 1) {
      const hitCount = {};
      for (const mappingDefinition of mappingDefinitions) {
        for (const key of Object.keys(mappingDefinition.properties)) {
          hitCount[key] = (hitCount[key] ?? 0) + 1;
        }
      }
      const nonDuplicates = [];
      for (const key of Object.keys(hitCount)) {
        if (hitCount[key] === 1) {
          nonDuplicates.push(key);
        }
      }
      const properties = this.backgroundStepsEnabled() ? nonDuplicates : nonDuplicates.filter((property) => !backgroundStepOnlyProperties.has(property));
      this._context.error(mapping, `There's not enough info to determine what you meant. Add one of these properties: ${properties.sort().join(", ")}`);
    } else if (mappingDefinitions.length === 1 && !hasExpressionKey) {
      for (const propertyName of Object.keys(mappingDefinitions[0].properties)) {
        const propertyDef = mappingDefinitions[0].properties[propertyName];
        if (propertyDef.required && !upperKeys[propertyName.toUpperCase()]) {
          this._context.error(mapping, `Required property is missing: ${propertyName}`);
        }
      }
    }
    this.expectMappingEnd();
  }
  handleMappingWithAllLooseProperties(definition, keyDefinition, valueDefinition, mappingDefinition, mapping) {
    let nextValue;
    const upperKeys = {};
    let rawLiteral;
    while (rawLiteral = this._objectReader.allowLiteral()) {
      const nextKeyScalar = this.parseScalar(rawLiteral, definition);
      nextKeyScalar.definitionInfo = keyDefinition;
      if (nextKeyScalar.isExpression) {
        if (definition.allowedContext.length > 0) {
          nextValue = this.readValue(valueDefinition);
          mapping.add(nextKeyScalar, nextValue);
        } else {
          this._context.error(nextKeyScalar, "A template expression is not allowed in this context");
          this.skipValue();
        }
        continue;
      }
      const nextKey = nextKeyScalar.templateTokenType === TokenType.String ? nextKeyScalar : new StringToken(nextKeyScalar.file, nextKeyScalar.range, nextKeyScalar.toString(), nextKeyScalar.definitionInfo);
      if (nextKey.value) {
        const upperKey = nextKey.value.toUpperCase();
        if (upperKeys[upperKey]) {
          this._context.error(nextKey, `'${nextKey.value}' is already defined`);
          this.skipValue();
          continue;
        }
        upperKeys[upperKey] = true;
      }
      this.validate(nextKey, keyDefinition);
      const nextDefinition = new DefinitionInfo(definition, mappingDefinition.looseValueType);
      nextKey.definitionInfo = nextDefinition;
      nextValue = this.readValue(valueDefinition);
      mapping.add(nextKey, nextValue);
    }
    this.expectMappingEnd();
  }
  expectMappingEnd() {
    if (!this._objectReader.allowMappingEnd()) {
      throw new Error("Expected mapping end");
    }
  }
  skipValue() {
    if (this._objectReader.allowLiteral()) {
    } else if (this._objectReader.allowSequenceStart()) {
      while (!this._objectReader.allowSequenceEnd()) {
        this.skipValue();
      }
    } else if (this._objectReader.allowMappingStart()) {
      while (!this._objectReader.allowMappingEnd()) {
        this.skipValue();
        this.skipValue();
      }
    } else {
      throw new Error("Expected a scalar value, a sequence, or a mapping");
    }
  }
  validate(scalar, definition) {
    switch (scalar.templateTokenType) {
      case TokenType.Null:
      case TokenType.Boolean:
      case TokenType.Number:
      case TokenType.String: {
        const literal2 = scalar;
        const scalarDefinitions = definition.getScalarDefinitions();
        let relevantDefinition;
        if (relevantDefinition = scalarDefinitions.find((x) => x.isMatch(literal2))) {
          scalar.definitionInfo = new DefinitionInfo(definition, relevantDefinition);
          return scalar;
        }
        if (literal2.templateTokenType !== TokenType.String) {
          const stringLiteral = new StringToken(literal2.file, literal2.range, literal2.toString(), literal2.definitionInfo);
          if (relevantDefinition = scalarDefinitions.find((x) => x.isMatch(stringLiteral))) {
            stringLiteral.definitionInfo = new DefinitionInfo(definition, relevantDefinition);
            return stringLiteral;
          }
        }
        this._context.error(literal2, `Unexpected value '${literal2.toString()}'`);
        return scalar;
      }
      case TokenType.BasicExpression:
        if (definition.allowedContext.length === 0) {
          this._context.error(scalar, "A template expression is not allowed in this context");
        }
        return scalar;
      default:
        this._context.error(scalar, `Unexpected value '${scalar.toString()}'`);
        return scalar;
    }
  }
  parseScalar(token, definitionInfo) {
    if (!isString(token) || !token.value) {
      return token;
    }
    const allowedContext = definitionInfo.allowedContext;
    const isSingleLine = token.range === void 0 || token.range.start.line === token.range.end.line;
    const raw = isSingleLine ? token.value : token.source ?? token.value;
    let startExpression = raw.indexOf(OPEN_EXPRESSION);
    if (startExpression < 0) {
      return token;
    }
    let encounteredError = false;
    const segments = [];
    let i = 0;
    while (i < raw.length) {
      if (i === startExpression) {
        startExpression = i;
        let endExpression = -1;
        let inString = false;
        for (i += OPEN_EXPRESSION.length; i < raw.length; i++) {
          if (raw[i] === "'") {
            inString = !inString;
          } else if (!inString && raw[i] === "}" && raw[i - 1] === "}") {
            endExpression = i;
            i++;
            break;
          }
        }
        if (endExpression < startExpression) {
          this._context.error(token, "The expression is not closed. An unescaped ${{ sequence was found, but the closing }} sequence was not found.");
          return token;
        }
        const rawExpression = raw.substr(startExpression + OPEN_EXPRESSION.length, endExpression - startExpression + 1 - OPEN_EXPRESSION.length - CLOSE_EXPRESSION.length);
        let tr = token.range;
        if (isSingleLine) {
          const offset = (token.source ?? raw).indexOf(OPEN_EXPRESSION) - raw.indexOf(OPEN_EXPRESSION);
          tr = {
            start: { line: tr.start.line, column: tr.start.column + startExpression + offset },
            end: { line: tr.end.line, column: tr.start.column + endExpression + 1 + offset }
          };
        } else {
          const startRaw = raw.substring(0, startExpression);
          const adjustedStartLine = startRaw.split("\n").length;
          const beginningOfLine = startRaw.lastIndexOf("\n");
          const adjustedStart = startExpression - beginningOfLine;
          const adjustedEnd = endExpression - beginningOfLine + 1;
          tr = {
            start: { line: tr.start.line + adjustedStartLine, column: adjustedStart },
            end: { line: tr.start.line + adjustedStartLine, column: adjustedEnd }
          };
        }
        const expression = this.parseIntoExpressionToken(tr, rawExpression, allowedContext, token, definitionInfo);
        if (!expression) {
          encounteredError = true;
        } else {
          if (expression.directive && (startExpression !== 0 || i < raw.length)) {
            this._context.error(token, `The directive '${expression.directive}' is not allowed in this context. Directives are not supported for expressions that are embedded within a string. Directives are only supported when the entire value is an expression.`);
            return token;
          }
          segments.push(expression);
        }
        startExpression = raw.indexOf(OPEN_EXPRESSION, i);
      } else if (i < startExpression) {
        this.addString(segments, token.range, raw.substr(i, startExpression - i), token.definitionInfo);
        i = startExpression;
      } else {
        this.addString(segments, token.range, raw.substr(i), token.definitionInfo);
        break;
      }
    }
    if (encounteredError) {
      return token;
    }
    if (segments.length === 1 && segments[0].templateTokenType === TokenType.BasicExpression) {
      const basicExpression = segments[0];
      const str2 = this.getExpressionString(basicExpression.expression);
      if (str2 !== void 0) {
        return new StringToken(this._fileId, token.range, str2, token.definitionInfo);
      }
    }
    if (segments.length === 1) {
      return segments[0];
    }
    const format2 = [];
    const args = [];
    const expressionTokens = [];
    let argIndex = 0;
    for (const segment of segments) {
      if (isString(segment)) {
        const text = segment.value.replace(/'/g, "''").replace(/\{/g, "{{").replace(/\}/g, "}}");
        format2.push(text);
      } else {
        format2.push(`{${argIndex}}`);
        argIndex++;
        const expression = segment;
        args.push(", ");
        args.push(expression.expression);
        expressionTokens.push(expression);
      }
    }
    return new BasicExpressionToken(this._fileId, token.range, `format('${format2.join("")}'${args.join("")})`, definitionInfo, expressionTokens, raw, void 0, token.blockScalarHeader);
  }
  parseIntoExpressionToken(tr, rawExpression, allowedContext, token, definitionInfo) {
    const parseExpressionResult = this.parseExpression(tr, token, rawExpression, allowedContext, definitionInfo);
    if (parseExpressionResult.error) {
      this._context.error(token, parseExpressionResult.error, tr);
      return void 0;
    }
    return parseExpressionResult.expression;
  }
  parseExpression(range, token, value, allowedContext, definitionInfo) {
    const trimmed = value.trim();
    if (!trimmed) {
      return {
        error: new Error("An expression was expected")
      };
    }
    const matchDirectiveResult = this.matchDirective(trimmed, INSERT_DIRECTIVE, 0);
    if (matchDirectiveResult.isMatch) {
      return {
        expression: new InsertExpressionToken(this._fileId, range, definitionInfo)
      };
    } else if (matchDirectiveResult.error) {
      return {
        error: matchDirectiveResult.error
      };
    }
    try {
      ExpressionToken.validateExpression(trimmed, allowedContext);
    } catch (err) {
      return {
        error: err
      };
    }
    const startTrim = value.length - value.trimStart().length;
    const endTrim = value.length - value.trimEnd().length;
    const expressionRange = {
      start: {
        ...range.start,
        column: range.start.column + OPEN_EXPRESSION.length + startTrim
      },
      end: {
        ...range.end,
        column: range.end.column - CLOSE_EXPRESSION.length - endTrim
      }
    };
    return {
      expression: new BasicExpressionToken(this._fileId, range, trimmed, definitionInfo, void 0, token.source, expressionRange, token.blockScalarHeader),
      error: void 0
    };
  }
  addString(segments, range, value, definition) {
    if (segments.length > 0 && segments[segments.length - 1].templateTokenType === TokenType.String) {
      const lastSegment = segments[segments.length - 1];
      segments[segments.length - 1] = new StringToken(this._fileId, range, `${lastSegment.value}${value}`, definition);
    } else {
      segments.push(new StringToken(this._fileId, range, value, definition));
    }
  }
  matchDirective(trimmed, directive, expectedParameters) {
    const parameters = [];
    if (trimmed.startsWith(directive) && (trimmed.length === directive.length || WHITESPACE_PATTERN.test(trimmed[directive.length]))) {
      let startIndex = directive.length;
      let inString = false;
      let parens = 0;
      for (let i = startIndex; i < trimmed.length; i++) {
        const c = trimmed[i];
        if (WHITESPACE_PATTERN.test(c) && !inString && parens == 0) {
          if (startIndex < 1) {
            parameters.push(trimmed.substr(startIndex, i - startIndex));
          }
          startIndex = i + 1;
        } else if (c === "'") {
          inString = !inString;
        } else if (c === "(" && !inString) {
          parens++;
        } else if (c === ")" && !inString) {
          parens--;
        }
      }
      if (startIndex < trimmed.length) {
        parameters.push(trimmed.substr(startIndex));
      }
      if (expectedParameters != parameters.length) {
        return {
          isMatch: false,
          parameters: [],
          error: new Error(`Exactly ${expectedParameters} parameter(s) were expected following the directive '${directive}'. Actual parameter count: ${parameters.length}`)
        };
      }
      return {
        isMatch: true,
        parameters
      };
    }
    return {
      isMatch: false,
      parameters
    };
  }
  getExpressionString(trimmed) {
    const result = [];
    let inString = false;
    for (let i = 0; i < trimmed.length; i++) {
      const c = trimmed[i];
      if (c === "'") {
        inString = !inString;
        if (inString && i !== 0) {
          result.push(c);
        }
      } else if (!inString) {
        return void 0;
      } else {
        result.push(c);
      }
    }
    return result.join("");
  }
  backgroundStepsEnabled() {
    return this._context.state.featureFlags?.isEnabled("allowBackgroundSteps") ?? false;
  }
};

// node_modules/@actions/workflow-parser/dist/workflows/workflow-constants.js
var WORKFLOW_ROOT = "workflow-root-strict";

// node_modules/@actions/workflow-parser/dist/templates/parse-event.js
var ParseEvent = class {
  constructor(type, token) {
    this.type = type;
    this.token = token;
  }
};
var EventType;
(function(EventType2) {
  EventType2[EventType2["Literal"] = 0] = "Literal";
  EventType2[EventType2["SequenceStart"] = 1] = "SequenceStart";
  EventType2[EventType2["SequenceEnd"] = 2] = "SequenceEnd";
  EventType2[EventType2["MappingStart"] = 3] = "MappingStart";
  EventType2[EventType2["MappingEnd"] = 4] = "MappingEnd";
  EventType2[EventType2["DocumentStart"] = 5] = "DocumentStart";
  EventType2[EventType2["DocumentEnd"] = 6] = "DocumentEnd";
})(EventType || (EventType = {}));

// node_modules/@actions/workflow-parser/dist/templates/json-object-reader.js
var JSONObjectReader = class {
  constructor(fileId, input) {
    this._fileId = fileId;
    const value = JSON.parse(input);
    this._generator = this.getParseEvents(value, true);
    this._current = this._generator.next();
  }
  allowLiteral() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.Literal) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowSequenceStart() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.SequenceStart) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowSequenceEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.SequenceEnd) {
        this._current = this._generator.next();
        return true;
      }
    }
    return false;
  }
  allowMappingStart() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.MappingStart) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowMappingEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.MappingEnd) {
        this._current = this._generator.next();
        return true;
      }
    }
    return false;
  }
  validateEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.DocumentEnd) {
        this._current = this._generator.next();
        return;
      }
    }
    throw new Error("Expected end of reader");
  }
  validateStart() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.DocumentStart) {
        this._current = this._generator.next();
        return;
      }
    }
    throw new Error("Expected start of reader");
  }
  /**
   * Returns all tokens (depth first)
   */
  *getParseEvents(value, root) {
    if (root) {
      yield new ParseEvent(EventType.DocumentStart, void 0);
    }
    switch (typeof value) {
      case "undefined":
        yield new ParseEvent(EventType.Literal, new NullToken(this._fileId, void 0, void 0));
        break;
      case "boolean":
        yield new ParseEvent(EventType.Literal, new BooleanToken(this._fileId, void 0, value, void 0));
        break;
      case "number":
        yield new ParseEvent(EventType.Literal, new NumberToken(this._fileId, void 0, value, void 0));
        break;
      case "string":
        yield new ParseEvent(EventType.Literal, new StringToken(this._fileId, void 0, value, void 0));
        break;
      case "object":
        if (value === null) {
          yield new ParseEvent(EventType.Literal, new NullToken(this._fileId, void 0, void 0));
        } else if (Array.isArray(value)) {
          yield new ParseEvent(EventType.SequenceStart, new SequenceToken(this._fileId, void 0, void 0));
          for (const item of value) {
            for (const e of this.getParseEvents(item)) {
              yield e;
            }
          }
          yield new ParseEvent(EventType.SequenceEnd, void 0);
        } else {
          yield new ParseEvent(EventType.MappingStart, new MappingToken(this._fileId, void 0, void 0));
          for (const key of Object.keys(value)) {
            yield new ParseEvent(EventType.Literal, new StringToken(this._fileId, void 0, key, void 0));
            for (const e of this.getParseEvents(value[key])) {
              yield e;
            }
          }
          yield new ParseEvent(EventType.MappingEnd, void 0);
        }
        break;
      default:
        throw new Error(`Unexpected value type '${typeof value}' when reading object`);
    }
    if (root) {
      yield new ParseEvent(EventType.DocumentEnd, void 0);
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/trace-writer.js
var NoOperationTraceWriter = class {
  error() {
  }
  info() {
  }
  verbose() {
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/definition.js
var Definition = class {
  constructor(key, definition) {
    this.readerContext = [];
    this.evaluatorContext = [];
    this.key = key;
    if (definition) {
      for (let i = 0; i < definition.count; ) {
        const definitionKey = definition.get(i).key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case CONTEXT: {
            const context = definition.get(i).value.assertSequence(`${DEFINITION} ${CONTEXT}`);
            definition.remove(i);
            const seenReaderContext = {};
            const seenEvaluatorContext = {};
            for (const item of context) {
              const itemStr = item.assertString(`${CONTEXT} item`).value;
              const upperItemStr = itemStr.toUpperCase();
              if (seenReaderContext[upperItemStr]) {
                throw new Error(`Duplicate context item '${itemStr}'`);
              }
              seenReaderContext[upperItemStr] = true;
              this.readerContext.push(itemStr);
              const paramIndex = itemStr.indexOf("(");
              const modifiedItemStr = paramIndex > 0 ? itemStr.substr(0, paramIndex + 1) + ")" : itemStr;
              const upperModifiedItemStr = modifiedItemStr.toUpperCase();
              if (seenEvaluatorContext[upperModifiedItemStr]) {
                throw new Error(`Duplicate context item '${modifiedItemStr}'`);
              }
              seenEvaluatorContext[upperModifiedItemStr] = true;
              this.evaluatorContext.push(modifiedItemStr);
            }
            break;
          }
          case DESCRIPTION: {
            const value = definition.get(i).value;
            this.description = value.assertString(DESCRIPTION).value;
            definition.remove(i);
            break;
          }
          default: {
            i++;
            break;
          }
        }
      }
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/scalar-definition.js
var ScalarDefinition = class extends Definition {
  constructor(key, definition) {
    super(key, definition);
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/boolean-definition.js
var BooleanDefinition = class extends ScalarDefinition {
  constructor(key, definition) {
    super(key, definition);
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case BOOLEAN: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${BOOLEAN}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${BOOLEAN} key`);
              switch (mappingKey.value) {
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${BOOLEAN} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.Boolean;
  }
  isMatch(literal2) {
    return literal2.templateTokenType === TokenType.Boolean;
  }
  validate() {
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/property-definition.js
var PropertyDefinition = class {
  constructor(token) {
    this.type = "";
    this.required = false;
    if (token.templateTokenType === TokenType.String) {
      this.type = token.value;
    } else {
      const mapping = token.assertMapping(MAPPING_PROPERTY_VALUE);
      for (const mappingPair of mapping) {
        const mappingKey = mappingPair.key.assertString(`${MAPPING_PROPERTY_VALUE} key`);
        switch (mappingKey.value) {
          case TYPE:
            this.type = mappingPair.value.assertString(`${MAPPING_PROPERTY_VALUE} ${TYPE}`).value;
            break;
          case REQUIRED:
            this.required = mappingPair.value.assertBoolean(`${MAPPING_PROPERTY_VALUE} ${REQUIRED}`).value;
            break;
          case DESCRIPTION:
            this.description = mappingPair.value.assertString(`${MAPPING_PROPERTY_VALUE} ${DESCRIPTION}`).value;
            break;
          default:
            mappingKey.assertUnexpectedValue(`${MAPPING_PROPERTY_VALUE} key`);
        }
      }
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/mapping-definition.js
var MappingDefinition = class extends Definition {
  constructor(key, definition) {
    super(key, definition);
    this.properties = {};
    this.looseKeyType = "";
    this.looseValueType = "";
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case MAPPING: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${MAPPING}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${MAPPING} key`);
              switch (mappingKey.value) {
                case PROPERTIES: {
                  const properties = mappingPair.value.assertMapping(`${DEFINITION} ${MAPPING} ${PROPERTIES}`);
                  for (const propertiesPair of properties) {
                    const propertyName = propertiesPair.key.assertString(`${DEFINITION} ${MAPPING} ${PROPERTIES} key`);
                    this.properties[propertyName.value] = new PropertyDefinition(propertiesPair.value);
                  }
                  break;
                }
                case LOOSE_KEY_TYPE: {
                  const looseKeyType = mappingPair.value.assertString(`${DEFINITION} ${MAPPING} ${LOOSE_KEY_TYPE}`);
                  this.looseKeyType = looseKeyType.value;
                  break;
                }
                case LOOSE_VALUE_TYPE: {
                  const looseValueType = mappingPair.value.assertString(`${DEFINITION} ${MAPPING} ${LOOSE_VALUE_TYPE}`);
                  this.looseValueType = looseValueType.value;
                  break;
                }
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${MAPPING} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.Mapping;
  }
  validate(schema2, name) {
    if (this.looseKeyType) {
      schema2.getDefinition(this.looseKeyType);
      if (this.looseValueType) {
        schema2.getDefinition(this.looseValueType);
      } else {
        throw new Error(`Property '${LOOSE_KEY_TYPE}' is defined but '${LOOSE_VALUE_TYPE}' is not defined on '${name}'`);
      }
    } else if (this.looseValueType) {
      throw new Error(`Property '${LOOSE_VALUE_TYPE}' is defined but '${LOOSE_KEY_TYPE}' is not defined on '${name}'`);
    }
    for (const propertyName of Object.keys(this.properties)) {
      const propertyDef = this.properties[propertyName];
      if (!propertyDef.type) {
        throw new Error(`Type not specified for the property '${propertyName}' on '${name}'`);
      }
      schema2.getDefinition(propertyDef.type);
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/null-definition.js
var NullDefinition = class extends ScalarDefinition {
  constructor(key, definition) {
    super(key, definition);
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case NULL: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${NULL}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${NULL} key`);
              switch (mappingKey.value) {
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${NULL} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.Null;
  }
  isMatch(literal2) {
    return literal2.templateTokenType === TokenType.Null;
  }
  validate() {
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/number-definition.js
var NumberDefinition = class extends ScalarDefinition {
  constructor(key, definition) {
    super(key, definition);
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case NUMBER: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${NUMBER}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${NUMBER} key`);
              switch (mappingKey.value) {
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${NUMBER} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.Number;
  }
  isMatch(literal2) {
    return literal2.templateTokenType === TokenType.Number;
  }
  validate() {
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/one-of-definition.js
var OneOfDefinition = class extends Definition {
  constructor(key, definition) {
    super(key, definition);
    this.oneOf = [];
    this.oneOfPrefix = [];
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case ONE_OF: {
            const oneOf = definitionPair.value.assertSequence(`${DEFINITION} ${ONE_OF}`);
            for (const item of oneOf) {
              const oneOfItem = item.assertString(`${DEFINITION} ${ONE_OF} item`);
              this.oneOf.push(oneOfItem.value);
            }
            break;
          }
          case ALLOWED_VALUES: {
            const oneOf = definitionPair.value.assertSequence(`${DEFINITION} ${ALLOWED_VALUES}`);
            for (const item of oneOf) {
              const oneOfItem = item.assertString(`${DEFINITION} ${ONE_OF} item`);
              this.oneOf.push(this.key + "-" + oneOfItem.value);
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
            break;
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.OneOf;
  }
  validate(schema2, name) {
    if (this.oneOf.length === 0) {
      throw new Error(`'${name}' does not contain any references`);
    }
    let foundLooseKeyType = false;
    const mappingDefinitions = [];
    let allowedValuesDefinition;
    let sequenceDefinition;
    let nullDefinition;
    let booleanDefinition;
    let numberDefinition;
    const stringDefinitions = [];
    const seenNestedTypes = {};
    for (const nestedType of this.oneOf) {
      if (seenNestedTypes[nestedType]) {
        throw new Error(`'${name}' contains duplicate nested type '${nestedType}'`);
      }
      seenNestedTypes[nestedType] = true;
      const nestedDefinition = schema2.getDefinition(nestedType);
      if (nestedDefinition.readerContext.length > 0) {
        throw new Error(`'${name}' is a one-of definition and references another definition that defines context. This is currently not supported.`);
      }
      switch (nestedDefinition.definitionType) {
        case DefinitionType.Mapping: {
          const mappingDefinition = nestedDefinition;
          mappingDefinitions.push(mappingDefinition);
          if (mappingDefinition.looseKeyType) {
            foundLooseKeyType = true;
          }
          break;
        }
        case DefinitionType.Sequence: {
          if (sequenceDefinition) {
            throw new Error(`'${name}' refers to more than one definition of type '${SEQUENCE}'`);
          }
          sequenceDefinition = nestedDefinition;
          break;
        }
        case DefinitionType.Null: {
          if (nullDefinition) {
            throw new Error(`'${name}' refers to more than one definition of type '${NULL}'`);
          }
          nullDefinition = nestedDefinition;
          break;
        }
        case DefinitionType.Boolean: {
          if (booleanDefinition) {
            throw new Error(`'${name}' refers to more than one definition of type '${BOOLEAN}'`);
          }
          booleanDefinition = nestedDefinition;
          break;
        }
        case DefinitionType.Number: {
          if (numberDefinition) {
            throw new Error(`'${name}' refers to more than one definition of type '${NUMBER}'`);
          }
          numberDefinition = nestedDefinition;
          break;
        }
        case DefinitionType.String: {
          const stringDefinition = nestedDefinition;
          if (stringDefinitions.length > 0 && (!stringDefinitions[0].constant || !stringDefinition.constant)) {
            throw new Error(`'${name}' refers to more than one '${SCALAR}', but some do not set '${CONSTANT}'`);
          }
          stringDefinitions.push(stringDefinition);
          break;
        }
        case DefinitionType.OneOf: {
          if (allowedValuesDefinition) {
            throw new Error(`'${name}' contains multiple allowed-values definitions`);
          }
          allowedValuesDefinition = nestedDefinition;
          break;
        }
        default:
          throw new Error(`'${name}' refers to a definition with type '${nestedDefinition.definitionType}'`);
      }
    }
    if (mappingDefinitions.length > 1) {
      if (foundLooseKeyType) {
        throw new Error(`'${name}' refers to two mappings and at least one sets '${LOOSE_KEY_TYPE}'. This is not currently supported.`);
      }
      const seenProperties = {};
      for (const mappingDefinition of mappingDefinitions) {
        for (const propertyName of Object.keys(mappingDefinition.properties)) {
          const newPropertyDef = mappingDefinition.properties[propertyName];
          const existingPropertyDef = seenProperties[propertyName];
          if (existingPropertyDef) {
            if (existingPropertyDef.type === newPropertyDef.type) {
              continue;
            }
            throw new Error(`'${name}' contains two mappings with the same property, but each refers to a different type. All matching properties must refer to the same type.`);
          } else {
            seenProperties[propertyName] = newPropertyDef;
          }
        }
      }
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/sequence-definition.js
var SequenceDefinition = class extends Definition {
  constructor(key, definition) {
    super(key, definition);
    this.itemType = "";
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case SEQUENCE: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${SEQUENCE}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${SEQUENCE} key`);
              switch (mappingKey.value) {
                case ITEM_TYPE: {
                  const itemType = mappingPair.value.assertString(`${DEFINITION} ${SEQUENCE} ${ITEM_TYPE}`);
                  this.itemType = itemType.value;
                  break;
                }
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${SEQUENCE} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.Sequence;
  }
  validate(schema2, name) {
    if (!this.itemType) {
      throw new Error(`'${name}' does not defined '${ITEM_TYPE}'`);
    }
    schema2.getDefinition(this.itemType);
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/string-definition.js
var StringDefinition = class extends ScalarDefinition {
  constructor(key, definition) {
    super(key, definition);
    this.constant = "";
    this.ignoreCase = false;
    this.requireNonEmpty = false;
    this.isExpression = false;
    if (definition) {
      for (const definitionPair of definition) {
        const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
        switch (definitionKey.value) {
          case STRING: {
            const mapping = definitionPair.value.assertMapping(`${DEFINITION} ${STRING}`);
            for (const mappingPair of mapping) {
              const mappingKey = mappingPair.key.assertString(`${DEFINITION} ${STRING} key`);
              switch (mappingKey.value) {
                case CONSTANT: {
                  const constantStringToken = mappingPair.value.assertString(`${DEFINITION} ${STRING} ${CONSTANT}`);
                  this.constant = constantStringToken.value;
                  break;
                }
                case IGNORE_CASE: {
                  const ignoreCaseBooleanToken = mappingPair.value.assertBoolean(`${DEFINITION} ${STRING} ${IGNORE_CASE}`);
                  this.ignoreCase = ignoreCaseBooleanToken.value;
                  break;
                }
                case REQUIRE_NON_EMPTY: {
                  const requireNonEmptyBooleanToken = mappingPair.value.assertBoolean(`${DEFINITION} ${STRING} ${REQUIRE_NON_EMPTY}`);
                  this.requireNonEmpty = requireNonEmptyBooleanToken.value;
                  break;
                }
                case IS_EXPRESSION: {
                  const isExpressionToken = mappingPair.value.assertBoolean(`${DEFINITION} ${STRING} ${IS_EXPRESSION}`);
                  this.isExpression = isExpressionToken.value;
                  break;
                }
                default:
                  mappingKey.assertUnexpectedValue(`${DEFINITION} ${STRING} key`);
                  break;
              }
            }
            break;
          }
          default:
            definitionKey.assertUnexpectedValue(`${DEFINITION} key`);
        }
      }
    }
  }
  get definitionType() {
    return DefinitionType.String;
  }
  isMatch(literal2) {
    if (literal2.templateTokenType === TokenType.String) {
      const value = literal2.value;
      if (this.constant) {
        return this.ignoreCase ? this.constant.toUpperCase() === value.toUpperCase() : this.constant === value;
      } else if (this.requireNonEmpty) {
        return !!value;
      } else {
        return true;
      }
    }
    return false;
  }
  validate() {
    if (this.constant && this.requireNonEmpty) {
      throw new Error(`Properties '${CONSTANT}' and '${REQUIRE_NON_EMPTY}' cannot both be set`);
    }
  }
};

// node_modules/@actions/workflow-parser/dist/templates/schema/template-schema.js
var TemplateSchema = class _TemplateSchema {
  constructor(mapping) {
    this.definitions = {};
    this.version = "";
    this.definitions[NULL] = new NullDefinition(NULL);
    this.definitions[BOOLEAN] = new BooleanDefinition(BOOLEAN);
    this.definitions[NUMBER] = new NumberDefinition(NUMBER);
    this.definitions[STRING] = new StringDefinition(STRING);
    const sequenceDefinition = new SequenceDefinition(SEQUENCE);
    sequenceDefinition.itemType = ANY;
    this.definitions[sequenceDefinition.key] = sequenceDefinition;
    const mappingDefinition = new MappingDefinition(MAPPING);
    mappingDefinition.looseKeyType = STRING;
    mappingDefinition.looseValueType = ANY;
    this.definitions[mappingDefinition.key] = mappingDefinition;
    const anyDefinition = new OneOfDefinition(ANY);
    anyDefinition.oneOf.push(NULL);
    anyDefinition.oneOf.push(BOOLEAN);
    anyDefinition.oneOf.push(NUMBER);
    anyDefinition.oneOf.push(STRING);
    anyDefinition.oneOf.push(SEQUENCE);
    anyDefinition.oneOf.push(MAPPING);
    this.definitions[anyDefinition.key] = anyDefinition;
    if (mapping) {
      for (const pair of mapping) {
        const key = pair.key.assertString(`${TEMPLATE_SCHEMA} key`);
        switch (key.value) {
          case VERSION: {
            this.version = pair.value.assertString(`${TEMPLATE_SCHEMA} ${VERSION}`).value;
            break;
          }
          case DEFINITIONS: {
            const definitions = pair.value.assertMapping(`${TEMPLATE_SCHEMA} ${DEFINITIONS}`);
            for (const definitionsPair of definitions) {
              const definitionsKey = definitionsPair.key.assertString(`${TEMPLATE_SCHEMA} ${DEFINITIONS} key`);
              const definitionsValue = definitionsPair.value.assertMapping(`${TEMPLATE_SCHEMA} ${DEFINITIONS} value`);
              let definition;
              for (const definitionPair of definitionsValue) {
                const definitionKey = definitionPair.key.assertString(`${DEFINITION} key`);
                const mappingToken = definitionsPair.value;
                switch (definitionKey.value) {
                  case NULL:
                    definition = new NullDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case BOOLEAN:
                    definition = new BooleanDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case NUMBER:
                    definition = new NumberDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case STRING:
                    definition = new StringDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case SEQUENCE:
                    definition = new SequenceDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case MAPPING:
                    definition = new MappingDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case ONE_OF:
                    definition = new OneOfDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case ALLOWED_VALUES:
                    for (const item of mappingToken) {
                      if (item.value.templateTokenType === TokenType.Sequence) {
                        const sequenceToken = item.value;
                        for (const activity of sequenceToken) {
                          if (activity.templateTokenType === TokenType.String) {
                            const stringToken = activity;
                            const allowedValuesKey = definitionsKey.value + "-" + stringToken.value;
                            const allowedValuesDef = new StringDefinition(allowedValuesKey);
                            allowedValuesDef.constant = stringToken.toDisplayString();
                            this.definitions[allowedValuesKey] = allowedValuesDef;
                          }
                        }
                      }
                    }
                    definition = new OneOfDefinition(definitionsKey.value, definitionsValue);
                    break;
                  case CONTEXT:
                  case DESCRIPTION:
                    continue;
                  default:
                    definitionKey.assertUnexpectedValue(`${DEFINITION} mapping key`);
                    break;
                }
                break;
              }
              if (!definition) {
                throw new Error(`Not enough information to construct definition '${definitionsKey.value}'`);
              }
              this.definitions[definitionsKey.value] = definition;
            }
            break;
          }
          default:
            key.assertUnexpectedValue(`${TEMPLATE_SCHEMA} key`);
            break;
        }
      }
    }
  }
  /**
   * Looks up a definition by name
   */
  getDefinition(name) {
    const result = this.definitions[name];
    if (result) {
      return result;
    }
    throw new Error(`Schema definition '${name}' not found`);
  }
  /**
   * Expands one-of definitions and returns all scalar definitions
   */
  getScalarDefinitions(definition) {
    const result = [];
    switch (definition.definitionType) {
      case DefinitionType.Null:
      case DefinitionType.Boolean:
      case DefinitionType.Number:
      case DefinitionType.String:
        result.push(definition);
        break;
      case DefinitionType.OneOf: {
        const oneOf = definition;
        for (const nestedName of oneOf.oneOf) {
          const nestedDefinition = this.getDefinition(nestedName);
          result.push(...this.getScalarDefinitions(nestedDefinition));
        }
        break;
      }
    }
    return result;
  }
  /**
   * Expands one-of definitions and returns all matching definitions by type
   */
  getDefinitionsOfType(definition, type) {
    const result = [];
    if (definition.definitionType === type) {
      result.push(definition);
    } else if (definition.definitionType === DefinitionType.OneOf) {
      const oneOf = definition;
      for (const nestedName of oneOf.oneOf) {
        const nestedDefinition = this.getDefinition(nestedName);
        if (nestedDefinition.definitionType === type) {
          result.push(nestedDefinition);
        }
      }
    }
    return result;
  }
  /**
   * Attempts match the property name to a property defined by any of the specified definitions.
   * If matched, any unmatching definitions are filtered from the definitions array.
   * Returns the type information for the matched property.
   */
  matchPropertyAndFilter(definitions, propertyName) {
    let result;
    let notFoundInSome = false;
    for (const definition of definitions) {
      const propertyDef = definition.properties[propertyName];
      if (propertyDef) {
        result = propertyDef;
      } else {
        notFoundInSome = true;
      }
    }
    if (result && notFoundInSome) {
      for (let i = 0; i < definitions.length; ) {
        if (definitions[i].properties[propertyName]) {
          i++;
        } else {
          definitions.splice(i, 1);
        }
      }
    }
    return result;
  }
  validate() {
    const oneOfDefinitions = {};
    for (const name of Object.keys(this.definitions)) {
      if (!name.match(_TemplateSchema._definitionNamePattern)) {
        throw new Error(`Invalid definition name '${name}'`);
      }
      const definition = this.definitions[name];
      if (definition.definitionType === DefinitionType.OneOf) {
        oneOfDefinitions[name] = definition;
      } else {
        definition.validate(this, name);
      }
    }
    for (const name of Object.keys(oneOfDefinitions)) {
      const oneOf = oneOfDefinitions[name];
      oneOf.validate(this, name);
    }
  }
  /**
   * Loads a user-defined schema file
   */
  static load(objectReader) {
    const context = new TemplateContext(new TemplateValidationErrors(10, 500), _TemplateSchema.getInternalSchema(), new NoOperationTraceWriter());
    const template = readTemplate(context, TEMPLATE_SCHEMA, objectReader, void 0);
    context.errors.check();
    const mapping = template.assertMapping(TEMPLATE_SCHEMA);
    const schema2 = new _TemplateSchema(mapping);
    schema2.validate();
    return schema2;
  }
  /**
   * Gets the internal schema used for reading user-defined schema files
   */
  static getInternalSchema() {
    if (_TemplateSchema._internalSchema === void 0) {
      const schema2 = new _TemplateSchema();
      let mappingDefinition = new MappingDefinition(TEMPLATE_SCHEMA);
      mappingDefinition.properties[VERSION] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[DEFINITIONS] = new PropertyDefinition(new StringToken(void 0, void 0, DEFINITIONS, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(DEFINITIONS);
      mappingDefinition.looseKeyType = NON_EMPTY_STRING;
      mappingDefinition.looseValueType = DEFINITION;
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      let oneOfDefinition = new OneOfDefinition(DEFINITION);
      oneOfDefinition.oneOf.push(NULL_DEFINITION);
      oneOfDefinition.oneOf.push(BOOLEAN_DEFINITION);
      oneOfDefinition.oneOf.push(NUMBER_DEFINITION);
      oneOfDefinition.oneOf.push(STRING_DEFINITION);
      oneOfDefinition.oneOf.push(SEQUENCE_DEFINITION);
      oneOfDefinition.oneOf.push(MAPPING_DEFINITION);
      oneOfDefinition.oneOf.push(ONE_OF_DEFINITION);
      schema2.definitions[oneOfDefinition.key] = oneOfDefinition;
      mappingDefinition = new MappingDefinition(NULL_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[NULL] = new PropertyDefinition(new StringToken(void 0, void 0, NULL_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(NULL_DEFINITION_PROPERTIES);
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(BOOLEAN_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[BOOLEAN] = new PropertyDefinition(new StringToken(void 0, void 0, BOOLEAN_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(BOOLEAN_DEFINITION_PROPERTIES);
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(NUMBER_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[NUMBER] = new PropertyDefinition(new StringToken(void 0, void 0, NUMBER_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(NUMBER_DEFINITION_PROPERTIES);
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(STRING_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[STRING] = new PropertyDefinition(new StringToken(void 0, void 0, STRING_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(STRING_DEFINITION_PROPERTIES);
      mappingDefinition.properties[CONSTANT] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[IGNORE_CASE] = new PropertyDefinition(new StringToken(void 0, void 0, BOOLEAN, void 0));
      mappingDefinition.properties[REQUIRE_NON_EMPTY] = new PropertyDefinition(new StringToken(void 0, void 0, BOOLEAN, void 0));
      mappingDefinition.properties[IS_EXPRESSION] = new PropertyDefinition(new StringToken(void 0, void 0, BOOLEAN, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(SEQUENCE_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[SEQUENCE] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(SEQUENCE_DEFINITION_PROPERTIES);
      mappingDefinition.properties[ITEM_TYPE] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(MAPPING_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[MAPPING] = new PropertyDefinition(new StringToken(void 0, void 0, MAPPING_DEFINITION_PROPERTIES, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(MAPPING_DEFINITION_PROPERTIES);
      mappingDefinition.properties[PROPERTIES] = new PropertyDefinition(new StringToken(void 0, void 0, PROPERTIES, void 0));
      mappingDefinition.properties[LOOSE_KEY_TYPE] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[LOOSE_VALUE_TYPE] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(PROPERTIES);
      mappingDefinition.looseKeyType = NON_EMPTY_STRING;
      mappingDefinition.looseValueType = PROPERTY_VALUE;
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      oneOfDefinition = new OneOfDefinition(PROPERTY_VALUE);
      oneOfDefinition.oneOf.push(NON_EMPTY_STRING);
      oneOfDefinition.oneOf.push(MAPPING_PROPERTY_VALUE);
      schema2.definitions[oneOfDefinition.key] = oneOfDefinition;
      mappingDefinition = new MappingDefinition(MAPPING_PROPERTY_VALUE);
      mappingDefinition.properties[TYPE] = new PropertyDefinition(new StringToken(void 0, void 0, NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[REQUIRED] = new PropertyDefinition(new StringToken(void 0, void 0, BOOLEAN, void 0));
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      mappingDefinition = new MappingDefinition(ONE_OF_DEFINITION);
      mappingDefinition.properties[DESCRIPTION] = new PropertyDefinition(new StringToken(void 0, void 0, STRING, void 0));
      mappingDefinition.properties[CONTEXT] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[ONE_OF] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      mappingDefinition.properties[ALLOWED_VALUES] = new PropertyDefinition(new StringToken(void 0, void 0, SEQUENCE_OF_NON_EMPTY_STRING, void 0));
      schema2.definitions[mappingDefinition.key] = mappingDefinition;
      const stringDefinition = new StringDefinition(NON_EMPTY_STRING);
      stringDefinition.requireNonEmpty = true;
      schema2.definitions[stringDefinition.key] = stringDefinition;
      const sequenceDefinition = new SequenceDefinition(SEQUENCE_OF_NON_EMPTY_STRING);
      sequenceDefinition.itemType = NON_EMPTY_STRING;
      schema2.definitions[sequenceDefinition.key] = sequenceDefinition;
      schema2.validate();
      _TemplateSchema._internalSchema = schema2;
    }
    return _TemplateSchema._internalSchema;
  }
};
TemplateSchema._definitionNamePattern = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;

// node_modules/@actions/workflow-parser/dist/workflow-v1.0.min.json
var workflow_v1_0_min_default = { version: "workflow-v1.0", definitions: { "workflow-root": { description: "A workflow file.", mapping: { properties: { on: "on", name: "workflow-name", description: "workflow-description", "run-name": "run-name", defaults: "workflow-defaults", env: "workflow-env", permissions: "permissions", concurrency: "workflow-concurrency", jobs: { type: "jobs", required: true } } } }, "workflow-root-strict": { description: "Workflow file with strict validation", mapping: { properties: { on: { type: "on-strict", required: true }, name: "workflow-name", description: "workflow-description", "run-name": "run-name", defaults: "workflow-defaults", env: "workflow-env", permissions: "permissions", concurrency: "workflow-concurrency", jobs: { type: "jobs", required: true } } } }, "workflow-name": { description: "The name of the workflow that GitHub displays on your repository's 'Actions' tab.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#name)", string: {} }, "workflow-description": { description: "A description for your workflow or reusable workflow", string: {} }, "run-name": { context: ["github", "inputs", "vars"], string: {}, description: "The name for workflow runs generated from the workflow. GitHub displays the workflow run name in the list of workflow runs on your repository's 'Actions' tab.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#run-name)" }, on: { description: "The GitHub event that triggers the workflow. Events can be a single string, array of events, array of event types, or an event configuration map that schedules a workflow or restricts the execution of a workflow to specific files, tags, or branch changes. View a full list of [events that trigger workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows).\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#on)", "one-of": ["string", "sequence", "on-mapping"] }, "on-mapping": { mapping: { properties: { workflow_call: "workflow-call" }, "loose-key-type": "non-empty-string", "loose-value-type": "any" } }, "on-strict": { description: "The GitHub event that triggers the workflow.  Events can be a single string, array of events, array of event types, or an event configuration map that schedules a workflow or restricts the execution of a workflow to specific files, tags, or branch changes. View a full list of [events that trigger workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows).\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#on)", "one-of": ["on-string-strict", "on-sequence-strict", "on-mapping-strict"] }, "on-mapping-strict": { description: "The GitHub event that triggers the workflow.  Events can be a single string, array of events, array of event types, or an event configuration map that schedules a workflow or restricts the execution of a workflow to specific files, tags, or branch changes. View a full list of [events that trigger workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows).\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#on)", mapping: { properties: { branch_protection_rule: "branch-protection-rule", check_run: "check-run", check_suite: "check-suite", create: "create", delete: "delete", deployment: "deployment", deployment_status: "deployment-status", discussion: "discussion", discussion_comment: "discussion-comment", fork: "fork", gollum: "gollum", image_version: "image-version", issue_comment: "issue-comment", issues: "issues", label: "label", merge_group: "merge-group", milestone: "milestone", page_build: "page-build", project: "project", project_card: "project-card", project_column: "project-column", public: "public", pull_request: "pull-request", pull_request_comment: "pull-request-comment", pull_request_review: "pull-request-review", pull_request_review_comment: "pull-request-review-comment", pull_request_target: "pull-request-target", push: "push", registry_package: "registry-package", release: "release", repository_dispatch: "repository-dispatch", schedule: "schedule", status: "status", watch: "watch", workflow_call: "workflow-call", workflow_dispatch: "workflow-dispatch", workflow_run: "workflow-run" } } }, "on-string-strict": { "one-of": ["branch-protection-rule-string", "check-run-string", "check-suite-string", "create-string", "delete-string", "deployment-string", "deployment-status-string", "discussion-string", "discussion-comment-string", "fork-string", "gollum-string", "image-version-string", "issue-comment-string", "issues-string", "label-string", "merge-group-string", "milestone-string", "page-build-string", "project-string", "project-card-string", "project-column-string", "public-string", "pull-request-string", "pull-request-comment-string", "pull-request-review-string", "pull-request-review-comment-string", "pull-request-target-string", "push-string", "registry-package-string", "release-string", "repository-dispatch-string", "schedule-string", "status-string", "watch-string", "workflow-call-string", "workflow-dispatch-string", "workflow-run-string"] }, "on-sequence-strict": { sequence: { "item-type": "on-string-strict" } }, "branch-protection-rule-string": { description: "Runs your workflow when branch protection rules in the workflow repository are changed.", string: { constant: "branch_protection_rule" } }, "branch-protection-rule": { description: "Runs your workflow when branch protection rules in the workflow repository are changed.", "one-of": ["null", "branch-protection-rule-mapping"] }, "branch-protection-rule-mapping": { mapping: { properties: { types: "branch-protection-rule-activity" } } }, "branch-protection-rule-activity": { description: "The types of branch protection rule activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`.", "one-of": ["branch-protection-rule-activity-type", "branch-protection-rule-activity-types"] }, "branch-protection-rule-activity-types": { sequence: { "item-type": "branch-protection-rule-activity-type" } }, "branch-protection-rule-activity-type": { "allowed-values": ["created", "edited", "deleted"] }, "check-run-string": { description: "Runs your workflow when activity related to a check run occurs. A check run is an individual test that is part of a check suite.", string: { constant: "check_run" } }, "check-run": { description: "Runs your workflow when activity related to a check run occurs. A check run is an individual test that is part of a check suite.", "one-of": ["null", "check-run-mapping"] }, "check-run-mapping": { mapping: { properties: { types: "check-run-activity" } } }, "check-run-activity": { description: "The types of check run activity that trigger the workflow. Supported activity types: `created`, `rerequested`, `completed`, `requested_action`.", "one-of": ["check-run-activity-type", "check-run-activity-types"] }, "check-run-activity-types": { sequence: { "item-type": "check-run-activity-type" } }, "check-run-activity-type": { "allowed-values": ["completed", "created", "rerequested", "requested_action"] }, "check-suite-string": { description: "Runs your workflow when check suite activity occurs. A check suite is a collection of the check runs created for a specific commit. Check suites summarize the status and conclusion of the check runs that are in the suite.", string: { constant: "check_suite" } }, "check-suite": { description: "Runs your workflow when check suite activity occurs. A check suite is a collection of the check runs created for a specific commit. Check suites summarize the status and conclusion of the check runs that are in the suite.", "one-of": ["null", "check-suite-mapping"] }, "check-suite-mapping": { mapping: { properties: { types: "check-suite-activity" } } }, "check-suite-activity": { description: "The types of check suite activity that trigger the workflow. Supported activity types: `completed`.", "one-of": ["check-suite-activity-type", "check-suite-activity-types"] }, "check-suite-activity-types": { sequence: { "item-type": "check-suite-activity-type" } }, "check-suite-activity-type": { "allowed-values": ["completed"] }, "create-string": { description: "Runs your workflow when someone creates a Git reference (Git branch or tag) in the workflow's repository.", string: { constant: "create" } }, create: { description: "Runs your workflow when someone creates a Git reference (Git branch or tag) in the workflow's repository.", null: {} }, "delete-string": { description: "Runs your workflow when someone deletes a Git reference (Git branch or tag) in the workflow's repository.", string: { constant: "delete" } }, delete: { description: "Runs your workflow when someone deletes a Git reference (Git branch or tag) in the workflow's repository.", null: {} }, "deployment-string": { description: "Runs your workflow when someone creates a deployment in the workflow's repository. Deployments created with a commit SHA may not have a Git ref.", string: { constant: "deployment" } }, deployment: { description: "Runs your workflow when someone creates a deployment in the workflow's repository. Deployments created with a commit SHA may not have a Git ref.", null: {} }, "deployment-status-string": { description: "Runs your workflow when a third party provides a deployment status. Deployments created with a commit SHA may not have a Git ref.", string: { constant: "deployment_status" } }, "deployment-status": { description: "Runs your workflow when a third party provides a deployment status. Deployments created with a commit SHA may not have a Git ref.", null: {} }, "discussion-string": { description: "Runs your workflow when a discussion in the workflow's repository is created or modified. For activity related to comments on a discussion, use the `discussion_comment` event.", string: { constant: "discussion" } }, discussion: { description: "Runs your workflow when a discussion in the workflow's repository is created or modified. For activity related to comments on a discussion, use the `discussion_comment` event.", "one-of": ["null", "discussion-mapping"] }, "discussion-mapping": { mapping: { properties: { types: "discussion-activity" } } }, "discussion-activity": { description: "The types of discussion activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `category_changed`, `answered`, `unanswered`.", "one-of": ["discussion-activity-type", "discussion-activity-types"] }, "discussion-activity-types": { sequence: { "item-type": "discussion-activity-type" } }, "discussion-activity-type": { "allowed-values": ["created", "edited", "deleted", "transferred", "pinned", "unpinned", "labeled", "unlabeled", "locked", "unlocked", "category_changed", "answered", "unanswered"] }, "discussion-comment-string": { description: "Runs your workflow when a comment on a discussion in the workflow's repository is created or modified. For activity related to a discussion as opposed to comments on the discussion, use the `discussion` event.", string: { constant: "discussion_comment" } }, "discussion-comment": { description: "Runs your workflow when a comment on a discussion in the workflow's repository is created or modified. For activity related to a discussion as opposed to comments on the discussion, use the `discussion` event.", "one-of": ["null", "discussion-comment-mapping"] }, "discussion-comment-mapping": { mapping: { properties: { types: "discussion-comment-activity" } } }, "discussion-comment-activity": { description: "The types of discussion comment activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`.", "one-of": ["discussion-comment-activity-type", "discussion-comment-activity-types"] }, "discussion-comment-activity-types": { sequence: { "item-type": "discussion-comment-activity-type" } }, "discussion-comment-activity-type": { "allowed-values": ["created", "edited", "deleted"] }, "fork-string": { description: "Runs your workflow when someone forks a repository.", string: { constant: "fork" } }, fork: { description: "Runs your workflow when someone forks a repository.", null: {} }, "gollum-string": { description: "Runs your workflow when someone creates or updates a Wiki page.", string: { constant: "gollum" } }, gollum: { description: "Runs your workflow when someone creates or updates a Wiki page.", null: {} }, "image-version-string": { description: "Runs your workflow when an image version is created or changes state.", string: { constant: "image_version" } }, "image-version": { description: "Runs your workflow when an image version is created or changes state.", "one-of": ["null", "image-version-mapping"] }, "image-version-mapping": { mapping: { properties: { types: "image-version-activity", names: "event-names", versions: "event-versions" } } }, "image-version-activity": { description: "The types of image version activity that trigger the workflow. Supported activity types: `created`, `ready`, `deleted`.", "one-of": ["image-version-activity-type", "image-version-activity-types"] }, "image-version-activity-types": { sequence: { "item-type": "image-version-activity-type" } }, "image-version-activity-type": { "allowed-values": ["created", "ready", "deleted"] }, "issue-comment-string": { description: "Runs your workflow when an issue or pull request comment is created, edited, or deleted.", string: { constant: "issue_comment" } }, "issue-comment": { description: "Runs your workflow when an issue or pull request comment is created, edited, or deleted.", "one-of": ["null", "issue-comment-mapping"] }, "issue-comment-mapping": { mapping: { properties: { types: "issue-comment-activity" } } }, "issue-comment-activity": { description: "The types of issue comment activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`.", "one-of": ["issue-comment-activity-type", "issue-comment-activity-types"] }, "issue-comment-activity-types": { sequence: { "item-type": "issue-comment-activity-type" } }, "issue-comment-activity-type": { "allowed-values": ["created", "edited", "deleted"] }, "issues-string": { description: "Runs your workflow when an issue in the workflow's repository is created or modified. For activity related to comments in an issue, use the `issue_comment` event.", string: { constant: "issues" } }, issues: { description: "Runs your workflow when an issue in the workflow's repository is created or modified. For activity related to comments in an issue, use the `issue_comment` event.", "one-of": ["null", "issues-mapping"] }, "issues-mapping": { mapping: { properties: { types: "issues-activity" } } }, "issues-activity": { description: "The types of issue activity that trigger the workflow. Supported activity types: `opened`, `edited`, `deleted`, `transferred`, `pinned`, `unpinned`, `closed`, `reopened`, `assigned`, `unassigned`, `labeled`, `unlabeled`, `locked`, `unlocked`, `milestoned`, `demilestoned`, `field_added`, `field_removed`, `typed`, `untyped`.", "one-of": ["issues-activity-type", "issues-activity-types"] }, "issues-activity-types": { sequence: { "item-type": "issues-activity-type" } }, "issues-activity-type": { "allowed-values": ["opened", "edited", "deleted", "transferred", "pinned", "unpinned", "closed", "reopened", "assigned", "unassigned", "labeled", "unlabeled", "locked", "unlocked", "milestoned", "demilestoned", "field_added", "field_removed", "typed", "untyped"] }, "label-string": { description: "Runs your workflow when a label in your workflow's repository is created or modified.", string: { constant: "label" } }, label: { description: "Runs your workflow when a label in your workflow's repository is created or modified.", "one-of": ["null", "label-mapping"] }, "label-mapping": { mapping: { properties: { types: "label-activity" } } }, "label-activity": { description: "The types of label activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`.", "one-of": ["label-activity-type", "label-activity-types"] }, "label-activity-types": { sequence: { "item-type": "label-activity-type" } }, "label-activity-type": { "allowed-values": ["created", "edited", "deleted"] }, "merge-group-string": { description: "Runs your workflow when a pull request is added to a merge queue, which adds the pull request to a merge group.", string: { constant: "merge_group" } }, "merge-group": { description: "Runs your workflow when a pull request is added to a merge queue, which adds the pull request to a merge group.", "one-of": ["null", "merge-group-mapping"] }, "merge-group-mapping": { mapping: { properties: { types: "merge-group-activity", branches: "event-branches", "branches-ignore": "event-branches-ignore" } } }, "merge-group-activity": { description: "The types of merge group activity that trigger the workflow. Supported activity types: `checks_requested`.", "one-of": ["merge-group-activity-type", "merge-group-activity-types"] }, "merge-group-activity-types": { sequence: { "item-type": "merge-group-activity-type" } }, "merge-group-activity-type": { "allowed-values": ["checks_requested"] }, "milestone-string": { description: "Runs your workflow when a milestone in the workflow's repository is created or modified.", string: { constant: "milestone" } }, milestone: { description: "Runs your workflow when a milestone in the workflow's repository is created or modified.", "one-of": ["null", "milestone-mapping"] }, "milestone-mapping": { mapping: { properties: { types: "milestone-activity" } } }, "milestone-activity": { description: "The types of milestone activity that trigger the workflow. Supported activity types: `created`, `closed`, `opened`, `edited`, `deleted`.", "one-of": ["milestone-activity-type", "milestone-activity-types"] }, "milestone-activity-types": { sequence: { "item-type": "milestone-activity-type" } }, "milestone-activity-type": { "allowed-values": ["created", "closed", "opened", "edited", "deleted"] }, "page-build-string": { description: "Runs your workflow when someone pushes to a branch that is the publishing source for GitHub Pages, if GitHub Pages is enabled for the repository.", string: { constant: "page_build" } }, "page-build": { description: "Runs your workflow when someone pushes to a branch that is the publishing source for GitHub Pages, if GitHub Pages is enabled for the repository.", null: {} }, "project-string": { description: "Runs your workflow when a project board is created or modified. For activity related to cards or columns in a project board, use the `project_card` or `project_column` events instead.", string: { constant: "project" } }, project: { description: "Runs your workflow when a project board is created or modified. For activity related to cards or columns in a project board, use the `project_card` or `project_column` events instead.", "one-of": ["null", "project-mapping"] }, "project-mapping": { mapping: { properties: { types: "project-activity" } } }, "project-activity": { description: "The types of project activity that trigger the workflow. Supported activity types: `created`, `closed`, `reopened`, `edited`, `deleted`.", "one-of": ["project-activity-type", "project-activity-types"] }, "project-activity-types": { sequence: { "item-type": "project-activity-type" } }, "project-activity-type": { "allowed-values": ["created", "closed", "reopened", "edited", "deleted"] }, "project-card-string": { description: "Runs your workflow when a card on a project board is created or modified. For activity related to project boards or columns in a project board, use the `project` or `project_column` event instead.", string: { constant: "project_card" } }, "project-card": { description: "Runs your workflow when a card on a project board is created or modified. For activity related to project boards or columns in a project board, use the `project` or `project_column` event instead.", "one-of": ["null", "project-card-mapping"] }, "project-card-mapping": { mapping: { properties: { types: "project-card-activity" } } }, "project-card-activity": { description: "The types of project card activity that trigger the workflow. Supported activity types: `created`, `moved`, `converted`, `edited`, `deleted`.", "one-of": ["project-card-activity-type", "project-card-activity-types"] }, "project-card-activity-types": { sequence: { "item-type": "project-card-activity-type" } }, "project-card-activity-type": { "allowed-values": ["created", "moved", "converted", "edited", "deleted"] }, "project-column-string": { description: "Runs your workflow when a column on a project board is created or modified. For activity related to project boards or cards in a project board, use the `project` or `project_card` event instead.", string: { constant: "project_column" } }, "project-column": { description: "Runs your workflow when a column on a project board is created or modified. For activity related to project boards or cards in a project board, use the `project` or `project_card` event instead.", "one-of": ["null", "project-column-mapping"] }, "project-column-mapping": { mapping: { properties: { types: "project-column-activity" } } }, "project-column-activity": { description: "The types of project column activity that trigger the workflow. Supported activity types: `created`, `updated`, `moved`, `deleted`.", "one-of": ["project-column-activity-type", "project-column-activity-types"] }, "project-column-activity-types": { sequence: { "item-type": "project-column-activity-type" } }, "project-column-activity-type": { "allowed-values": ["created", "updated", "moved", "deleted"] }, "public-string": { description: "Runs your workflow when your workflow's repository changes from private to public.", string: { constant: "public" } }, public: { description: "Runs your workflow when your workflow's repository changes from private to public.", null: {} }, "pull-request-string": { description: "Runs your workflow when activity on a pull request in the workflow's repository occurs. If no activity types are specified, the workflow runs when a pull request is opened, reopened, or when the head branch of the pull request is updated.", string: { constant: "pull_request" } }, "pull-request": { description: "Runs your workflow when activity on a pull request in the workflow's repository occurs. If no activity types are specified, the workflow runs when a pull request is opened, reopened, or when the head branch of the pull request is updated.", "one-of": ["null", "pull-request-mapping"] }, "pull-request-mapping": { mapping: { properties: { types: "pull-request-activity", branches: "event-branches", "branches-ignore": "event-branches-ignore", paths: "event-paths", "paths-ignore": "event-paths-ignore" } } }, "pull-request-activity": { description: "The types of pull request activity that trigger the workflow. Supported activity types: `assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `locked`, `unlocked`, `enqueued`, `dequeued`, `milestoned`, `demilestoned`, `ready_for_review`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`, `stacked`.", "one-of": ["pull-request-activity-type", "pull-request-activity-types"] }, "pull-request-activity-types": { sequence: { "item-type": "pull-request-activity-type" } }, "pull-request-activity-type": { "allowed-values": ["assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "locked", "unlocked", "enqueued", "dequeued", "milestoned", "demilestoned", "ready_for_review", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled", "stacked"] }, "pull-request-comment-string": { description: "Please use the `issue_comment` event instead.", string: { constant: "pull_request_comment" } }, "pull-request-comment": { description: "Please use the `issue_comment` event instead.", "one-of": ["null", "issue-comment-mapping"] }, "pull-request-review-string": { description: "Runs your workflow when a pull request review is submitted, edited, or dismissed. A pull request review is a group of pull request review comments in addition to a body comment and a state. For activity related to pull request review comments or pull request comments, use the `pull_request_review_comment` or `issue_comment` events instead.", string: { constant: "pull_request_review" } }, "pull-request-review": { description: "Runs your workflow when a pull request review is submitted, edited, or dismissed. A pull request review is a group of pull request review comments in addition to a body comment and a state. For activity related to pull request review comments or pull request comments, use the `pull_request_review_comment` or `issue_comment` events instead.", "one-of": ["null", "pull-request-review-mapping"] }, "pull-request-review-mapping": { mapping: { properties: { types: "pull-request-review-activity" } } }, "pull-request-review-activity": { description: "The types of pull request review activity that trigger the workflow. Supported activity types: `submitted`, `edited`, `dismissed`.", "one-of": ["pull-request-review-activity-type", "pull-request-review-activity-types"] }, "pull-request-review-activity-types": { sequence: { "item-type": "pull-request-review-activity-type" } }, "pull-request-review-activity-type": { "allowed-values": ["submitted", "edited", "dismissed"] }, "pull-request-review-comment-string": { description: "", string: { constant: "pull_request_review_comment" } }, "pull-request-review-comment": { description: "", "one-of": ["null", "pull-request-review-comment-mapping"] }, "pull-request-review-comment-mapping": { mapping: { properties: { types: "pull-request-review-comment-activity" } } }, "pull-request-review-comment-activity": { description: "The types of pull request review comment activity that trigger the workflow. Supported activity types: `created`, `edited`, `deleted`.", "one-of": ["pull-request-review-comment-activity-type", "pull-request-review-comment-activity-types"] }, "pull-request-review-comment-activity-types": { sequence: { "item-type": "pull-request-review-comment-activity-type" } }, "pull-request-review-comment-activity-type": { "allowed-values": ["created", "edited", "deleted"] }, "pull-request-target-string": { description: "Runs your workflow when activity on a pull request in the workflow's repository occurs. If no activity types are specified, the workflow runs when a pull request is opened, reopened, or when the head branch of the pull request is updated.\n\nThis event runs in the context of the base of the pull request, rather than in the context of the merge commit, as the `pull_request` event does. This prevents execution of unsafe code from the head of the pull request that could alter your repository or steal any secrets you use in your workflow. This event allows your workflow to do things like label or comment on pull requests from forks. Avoid using this event if you need to build or run code from the pull request.", string: { constant: "pull_request_target" } }, "pull-request-target": { description: "Runs your workflow when activity on a pull request in the workflow's repository occurs. If no activity types are specified, the workflow runs when a pull request is opened, reopened, or when the head branch of the pull request is updated.\n\nThis event runs in the context of the base of the pull request, rather than in the context of the merge commit, as the `pull_request` event does. This prevents execution of unsafe code from the head of the pull request that could alter your repository or steal any secrets you use in your workflow. This event allows your workflow to do things like label or comment on pull requests from forks. Avoid using this event if you need to build or run code from the pull request.", "one-of": ["null", "pull-request-target-mapping"] }, "pull-request-target-mapping": { mapping: { properties: { types: "pull-request-target-activity", branches: "event-branches", "branches-ignore": "event-branches-ignore", paths: "event-paths", "paths-ignore": "event-paths-ignore" } } }, "pull-request-target-activity": { description: "The types of pull request activity that trigger the workflow. Supported activity types: `assigned`, `unassigned`, `labeled`, `unlabeled`, `opened`, `edited`, `closed`, `reopened`, `synchronize`, `converted_to_draft`, `locked`, `unlocked`, `enqueued`, `dequeued`, `milestoned`, `demilestoned`, `ready_for_review`, `review_requested`, `review_request_removed`, `auto_merge_enabled`, `auto_merge_disabled`, `stacked`.", "one-of": ["pull-request-target-activity-type", "pull-request-target-activity-types"] }, "pull-request-target-activity-types": { sequence: { "item-type": "pull-request-target-activity-type" } }, "pull-request-target-activity-type": { "allowed-values": ["assigned", "unassigned", "labeled", "unlabeled", "opened", "edited", "closed", "reopened", "synchronize", "converted_to_draft", "locked", "unlocked", "enqueued", "dequeued", "milestoned", "demilestoned", "ready_for_review", "review_requested", "review_request_removed", "auto_merge_enabled", "auto_merge_disabled", "stacked"] }, "push-string": { description: "Runs your workflow when you push a commit or tag.", string: { constant: "push" } }, push: { description: "Runs your workflow when you push a commit or tag.", "one-of": ["null", "push-mapping"] }, "push-mapping": { mapping: { properties: { branches: "event-branches", "branches-ignore": "event-branches-ignore", tags: "event-tags", "tags-ignore": "event-tags-ignore", paths: "event-paths", "paths-ignore": "event-paths-ignore" } } }, "registry-package-string": { description: "Runs your workflow when activity related to GitHub Packages occurs in your repository.", string: { constant: "registry_package" } }, "registry-package": { description: "Runs your workflow when activity related to GitHub Packages occurs in your repository.", "one-of": ["null", "registry-package-mapping"] }, "registry-package-mapping": { mapping: { properties: { types: "registry-package-activity" } } }, "registry-package-activity": { description: "The types of registry package activity that trigger the workflow. Supported activity types: `published`, `updated`.", "one-of": ["registry-package-activity-type", "registry-package-activity-types"] }, "registry-package-activity-types": { sequence: { "item-type": "registry-package-activity-type" } }, "registry-package-activity-type": { "allowed-values": ["published", "updated"] }, "release-string": { description: "Runs your workflow when release activity in your repository occurs.", string: { constant: "release" } }, release: { description: "Runs your workflow when release activity in your repository occurs.", "one-of": ["null", "release-mapping"] }, "release-mapping": { mapping: { properties: { types: "release-activity" } } }, "release-activity": { description: "The types of release activity that trigger the workflow. Supported activity types: `published`, `unpublished`, `created`, `edited`, `deleted`, `prereleased`, `released`.", "one-of": ["release-activity-type", "release-activity-types"] }, "release-activity-types": { sequence: { "item-type": "release-activity-type" } }, "release-activity-type": { "allowed-values": ["published", "unpublished", "created", "edited", "deleted", "prereleased", "released"] }, "schedule-string": { description: "The `schedule` event allows you to trigger a workflow at a scheduled time.\n\nYou can schedule a workflow to run at specific UTC times using POSIX cron syntax. Scheduled workflows run on the latest commit on the default or base branch. The shortest interval you can run scheduled workflows is once every 5 minutes. GitHub Actions does not support the non-standard syntax `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly`, and `@reboot`.", string: { constant: "schedule" } }, schedule: { description: "The `schedule` event allows you to trigger a workflow at a scheduled time.\n\nYou can schedule a workflow to run at specific UTC times using POSIX cron syntax. Scheduled workflows run on the latest commit on the default or base branch. The shortest interval you can run scheduled workflows is once every 5 minutes. GitHub Actions does not support the non-standard syntax `@yearly`, `@monthly`, `@weekly`, `@daily`, `@hourly`, and `@reboot`.", sequence: { "item-type": "cron-mapping" } }, "status-string": { description: "Runs your workflow when the status of a Git commit changes. For example, commits can be marked as `error`, `failure`, `pending`, or `success`. If you want to provide more details about the status change, you may want to use the `check_run` event.", string: { constant: "status" } }, status: { description: "Runs your workflow when the status of a Git commit changes. For example, commits can be marked as `error`, `failure`, `pending`, or `success`. If you want to provide more details about the status change, you may want to use the `check_run` event.", null: {} }, "watch-string": { description: "Runs your workflow when the workflow's repository is starred.", string: { constant: "watch" } }, watch: { description: "Runs your workflow when the workflow's repository is starred.", "one-of": ["null", "watch-mapping"] }, "watch-mapping": { mapping: { properties: { types: "watch-activity" } } }, "watch-activity": { description: "The types of watch activity that trigger the workflow. Supported activity types: `started`.", "one-of": ["watch-activity-type", "watch-activity-types"] }, "watch-activity-types": { sequence: { "item-type": "watch-activity-type" } }, "watch-activity-type": { "allowed-values": ["started"] }, "workflow-run-string": { description: "This event occurs when a workflow run is requested or completed. It allows you to execute a workflow based on execution or completion of another workflow. The workflow started by the `workflow_run` event is able to access secrets and write tokens, even if the previous workflow was not. This is useful in cases where the previous workflow is intentionally not privileged, but you need to take a privileged action in a later workflow.", string: { constant: "workflow_run" } }, "workflow-run": { description: "This event occurs when a workflow run is requested or completed. It allows you to execute a workflow based on execution or completion of another workflow. The workflow started by the `workflow_run` event is able to access secrets and write tokens, even if the previous workflow was not. This is useful in cases where the previous workflow is intentionally not privileged, but you need to take a privileged action in a later workflow.", "one-of": ["null", "workflow-run-mapping"] }, "workflow-run-mapping": { mapping: { properties: { types: "workflow-run-activity", workflows: "workflow-run-workflows", branches: "event-branches", "branches-ignore": "event-branches-ignore" } } }, "workflow-run-workflows": { description: "The name of the workflow that triggers the `workflow_run` event. The workflow must be in the same repository as the workflow that uses the `workflow_run` event.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "workflow-run-activity": { description: "The types of workflow run activity that trigger the workflow. Supported activity types: `completed`, `requested`, `in_progress`.", "one-of": ["workflow-run-activity-type", "workflow-run-activity-types"] }, "workflow-run-activity-types": { sequence: { "item-type": "workflow-run-activity-type" } }, "workflow-run-activity-type": { "allowed-values": ["requested", "completed", "in_progress"] }, "event-branches": { description: "Use the `branches` filter when you want to include branch name patterns or when you want to both include and exclude branch name patterns. You cannot use both the `branches` and `branches-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-branches-ignore": { description: "Use the `branches-ignore` filter when you only want to exclude branch name patterns. You cannot use both the `branches` and `branches-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-names": { description: "Use the `names` filter when you want to include names via patterns or when you want to both include and exclude names using patterns. ", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-tags": { description: "Use the `tags` filter when you want to include tag name patterns or when you want to both include and exclude tag names patterns. You cannot use both the `tags` and `tags-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-tags-ignore": { description: "Use the `tags-ignore` filter when you only want to exclude tag name patterns. You cannot use both the `tags` and `tags-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-paths": { description: "Use the `paths` filter when you want to include file path patterns or when you want to both include and exclude file path patterns. You cannot use both the `paths` and `paths-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-paths-ignore": { description: "Use the `paths-ignore` filter when you only want to exclude file path patterns. You cannot use both the `paths` and `paths-ignore` filters for the same event in a workflow.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "event-versions": { description: "Use the `versions` filter when you want to include versions via patterns or when you want to both include and exclude versions using patterns. ", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "repository-dispatch-string": { description: "You can use the GitHub API to trigger a webhook event called `repository_dispatch` when you want to trigger a workflow for activity that happens outside of GitHub.", string: { constant: "branch_protection_rule" } }, "repository-dispatch": { description: "You can use the GitHub API to trigger a webhook event called `repository_dispatch` when you want to trigger a workflow for activity that happens outside of GitHub.", "one-of": ["null", "repository-dispatch-mapping"] }, "repository-dispatch-mapping": { mapping: { properties: { types: "sequence-of-non-empty-string" } } }, "workflow-call-string": { description: "The `workflow_call` event is used to indicate that a workflow can be called by another workflow. When a workflow is triggered with the `workflow_call` event, the event payload in the called workflow is the same event payload from the calling workflow.", string: { constant: "workflow_call" } }, "workflow-call": { description: "The `workflow_call` event is used to indicate that a workflow can be called by another workflow. When a workflow is triggered with the `workflow_call` event, the event payload in the called workflow is the same event payload from the calling workflow.", "one-of": ["null", "workflow-call-mapping"] }, "workflow-call-mapping": { mapping: { properties: { inputs: "workflow-call-inputs", secrets: "workflow-call-secrets", outputs: "workflow-call-outputs" } } }, "workflow-call-inputs": { description: "Inputs that are passed to the called workflow from the caller workflow.", mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "workflow-call-input-definition" } }, "workflow-call-input-definition": { mapping: { properties: { description: { type: "string", description: "A string description of the input parameter." }, type: { type: "workflow-call-input-type", required: true }, required: { type: "boolean", description: "A boolean to indicate whether the action requires the input parameter. Set to `true` when the parameter is required." }, default: "workflow-call-input-default" } } }, "workflow-call-input-type": { description: "Required if input is defined for the `on.workflow_call` keyword. The value of this parameter is a string specifying the data type of the input. This must be one of: `boolean`, `number`, or `string`.", "one-of": ["input-type-string", "input-type-boolean", "input-type-number"] }, "input-type-string": { string: { constant: "string" } }, "input-type-boolean": { string: { constant: "boolean" } }, "input-type-number": { string: { constant: "number" } }, "input-type-choice": { string: { constant: "choice" } }, "input-type-environment": { string: { constant: "environment" } }, "workflow-call-input-default": { description: 'If a `default` parameter is not set, the default value of the input is `false` for boolean, `0` for a number, and `""` for a string.', context: ["github", "inputs", "vars"], "one-of": ["string", "boolean", "number"] }, "workflow-call-secrets": { description: "A map of the secrets that can be used in the called workflow. Within the called workflow, you can use the `secrets` context to refer to a secret.", mapping: { "loose-key-type": "workflow-call-secret-name", "loose-value-type": "workflow-call-secret-definition" } }, "workflow-call-secret-name": { string: { "require-non-empty": true }, description: "A string identifier to associate with the secret." }, "workflow-call-secret-definition": { "one-of": ["null", "workflow-call-secret-mapping-definition"] }, "workflow-call-secret-mapping-definition": { mapping: { properties: { description: { type: "string", description: "A string description of the secret parameter." }, required: { type: "boolean", description: "A boolean specifying whether the secret must be supplied." } } } }, "workflow-call-outputs": { description: "A reusable workflow may generate data that you want to use in the caller workflow. To use these outputs, you must specify them as the outputs of the reusable workflow.", mapping: { "loose-key-type": "workflow-call-output-name", "loose-value-type": "workflow-call-output-definition" } }, "workflow-call-output-name": { string: { "require-non-empty": true }, description: "A string identifier to associate with the output. The value of `<output_id>` is a map of the input's metadata. The `<output_id>` must be a unique identifier within the outputs object and must start with a letter or _ and contain only alphanumeric characters, -, or _." }, "workflow-call-output-definition": { mapping: { properties: { description: { type: "string", description: "A string description of the output parameter." }, value: { type: "workflow-output-context", required: true } } } }, "workflow-output-context": { description: "The value to assign to the output parameter.", context: ["github", "inputs", "vars", "jobs"], string: {} }, "workflow-dispatch-string": { description: "The `workflow_dispatch` event allows you to manually trigger a workflow run. A workflow can be manually triggered using the GitHub API, GitHub CLI, or GitHub browser interface.", string: { constant: "workflow_dispatch" } }, "workflow-dispatch": { description: "The `workflow_dispatch` event allows you to manually trigger a workflow run. A workflow can be manually triggered using the GitHub API, GitHub CLI, or GitHub browser interface.", "one-of": ["null", "workflow-dispatch-mapping"] }, "workflow-dispatch-mapping": { mapping: { properties: { inputs: "workflow-dispatch-inputs" } } }, "workflow-dispatch-inputs": { description: "You can configure custom-defined input properties, default input values, and required inputs for the event directly in your workflow. When you trigger the event, you can provide the `ref` and any `inputs`. When the workflow runs, you can access the input values in the `inputs` context.", mapping: { "loose-key-type": "workflow-dispatch-input-name", "loose-value-type": "workflow-dispatch-input" } }, "workflow-dispatch-input-name": { string: { "require-non-empty": true }, description: "A string identifier to associate with the input. The value of <input_id> is a map of the input's metadata. The <input_id> must be a unique identifier within the inputs object. The <input_id> must start with a letter or _ and contain only alphanumeric characters, -, or _." }, "workflow-dispatch-input": { mapping: { properties: { description: { type: "string", description: "A string description of the input parameter." }, type: { type: "workflow-dispatch-input-type" }, required: { type: "boolean", description: "A boolean to indicate whether the workflow requires the input parameter. Set to true when the parameter is required." }, default: "workflow-dispatch-input-default", options: { type: "sequence-of-string", description: "The options of the dropdown list, if the type is a choice." } } } }, "workflow-dispatch-input-type": { description: "A string representing the type of the input. This must be one of: `boolean`, `number`, `string`, `choice`, or `environment`.", "one-of": ["input-type-string", "input-type-boolean", "input-type-number", "input-type-environment", "input-type-choice"] }, "workflow-dispatch-input-default": { description: "The default value is used when an input parameter isn't specified in a workflow file.", "one-of": ["string", "boolean", "number"] }, permissions: { description: "You can use `permissions` to modify the default permissions granted to the `GITHUB_TOKEN`, adding or removing access as required, so that you only allow the minimum required access.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#permissions)", "one-of": ["permissions-mapping", "permission-level-shorthand-read-all", "permission-level-shorthand-write-all"] }, "permissions-mapping": { mapping: { properties: { actions: { type: "permission-level-any", description: "Actions workflows, workflow runs, and artifacts." }, "artifact-metadata": { type: "permission-level-any", description: "Storage and deployment records for build artifacts." }, attestations: { type: "permission-level-any", description: "Artifact attestations." }, checks: { type: "permission-level-any", description: "Check runs and check suites." }, "code-quality": { type: "permission-level-any", description: "Code quality data." }, contents: { type: "permission-level-any", description: "Repository contents, commits, branches, downloads, releases, and merges." }, "copilot-requests": { type: "permission-level-write-or-no-access", description: "GitHub Copilot requests." }, deployments: { type: "permission-level-any", description: "Deployments and deployment statuses." }, discussions: { type: "permission-level-any", description: "Discussions and related comments and labels." }, drives: { type: "permission-level-any", description: "GitHub Drives persistent workspace storage. Use `read` for checkout and `write` to commit changes." }, "id-token": { type: "permission-level-write-or-no-access", description: "Token to request an OpenID Connect token." }, issues: { type: "permission-level-any", description: "Issues and related comments, assignees, labels, and milestones." }, models: { type: "permission-level-read-or-no-access", description: "Call AI models with GitHub Models." }, packages: { type: "permission-level-any", description: "Packages published to the GitHub Package Platform." }, pages: { type: "permission-level-any", description: "Retrieve Pages statuses, configuration, and builds, as well as create new builds." }, "pull-requests": { type: "permission-level-any", description: "Pull requests and related comments, assignees, labels, milestones, and merges." }, "repository-projects": { type: "permission-level-any", description: "Classic projects within a repository." }, "security-events": { type: "permission-level-any", description: "Code scanning alerts." }, statuses: { type: "permission-level-any", description: "Commit statuses." }, "vulnerability-alerts": { type: "permission-level-read-or-no-access", description: "Dependabot alerts." } } } }, "permission-level-any": { description: "The permission level for the `GITHUB_TOKEN`.", "one-of": ["permission-level-read", "permission-level-write", "permission-level-no-access"] }, "permission-level-read-or-no-access": { "one-of": ["permission-level-read", "permission-level-no-access"] }, "permission-level-write-or-no-access": { "one-of": ["permission-level-write", "permission-level-no-access"] }, "permission-level-read": { description: "The permission level for the `GITHUB_TOKEN`. Grants `read` permission for the specified scope.", string: { constant: "read" } }, "permission-level-write": { description: "The permission level for the `GITHUB_TOKEN`. Grants `write` permission for the specified scope.", string: { constant: "write" } }, "permission-level-no-access": { description: "The permission level for the `GITHUB_TOKEN`. Restricts all access for the specified scope.", string: { constant: "none" } }, "permission-level-shorthand-read-all": { description: "The permission level for the `GITHUB_TOKEN`. Grants `read` access for all scopes.", string: { constant: "read-all" } }, "permission-level-shorthand-write-all": { description: "The permission level for the `GITHUB_TOKEN`. Grants `write` access for all scopes.", string: { constant: "write-all" } }, "workflow-defaults": { description: "Use `defaults` to create a map of default settings that will apply to all jobs in the workflow. You can also set default settings that are only available to a job.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#defaults)", mapping: { properties: { run: "workflow-defaults-run" } } }, "workflow-defaults-run": { mapping: { properties: { shell: "shell", "working-directory": "working-directory" } } }, "workflow-env": { description: "A map of environment variables that are available to the steps of all jobs in the workflow. You can also set environment variables that are only available to the steps of a single job or to a single step.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#env)", context: ["github", "inputs", "vars", "secrets"], mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string" } }, jobs: { description: "A workflow run is made up of one or more `jobs`, which run in parallel by default. To run jobs sequentially, you can define dependencies on other jobs using the `jobs.<job_id>.needs` keyword. Each job runs in a runner environment specified by `runs-on`.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#jobs)", mapping: { "loose-key-type": "job-id", "loose-value-type": "job" } }, "job-id": { string: { "require-non-empty": true }, description: "A unique identifier for the job. The identifier must start with a letter or _ and contain only alphanumeric characters, -, or _." }, job: { description: "Each job must have an id to associate with the job. The key `job_id` is a string and its value is a map of the job's configuration data. You must replace `<job_id>` with a string that is unique to the jobs object. The `<job_id>` must start with a letter or _ and contain only alphanumeric characters, -, or _.", "one-of": ["job-factory", "workflow-job"] }, "job-factory": { mapping: { properties: { needs: "needs", if: "job-if", strategy: "strategy", name: { type: "string-strategy-context", description: "The name of the job displayed on GitHub." }, "runs-on": { type: "runs-on", required: true }, "timeout-minutes": { type: "number-strategy-context", description: "The maximum number of minutes to let a workflow run before GitHub automatically cancels it. Default: 360" }, "cancel-timeout-minutes": "number-strategy-context", "continue-on-error": { type: "boolean-strategy-context", description: "Prevents a workflow run from failing when a job fails. Set to true to allow a workflow run to pass when this job fails." }, container: "container", services: "services", env: "job-env", environment: "job-environment", permissions: "permissions", concurrency: "job-concurrency", outputs: "job-outputs", defaults: "job-defaults", steps: "steps", snapshot: "snapshot" } } }, "workflow-job": { mapping: { properties: { name: { type: "string-strategy-context", description: "The name of the job displayed on GitHub." }, uses: { description: "The location and version of a reusable workflow file to run as a job. Use one of the following formats:\n\n* `{owner}/{repo}/.github/workflows/{filename}@{ref}` for reusable workflows in public and private repositories.\n* `./.github/workflows/{filename}` for reusable workflows in the same repository.\n\n{ref} can be a SHA, a release tag, or a branch name. Using the commit SHA is the safest for stability and security.", type: "non-empty-string", required: true }, with: "workflow-job-with", secrets: "workflow-job-secrets", needs: "needs", if: "job-if", permissions: "permissions", concurrency: "job-concurrency", strategy: "strategy" } } }, "workflow-job-with": { description: "When a job is used to call a reusable workflow, you can use `with` to provide a map of inputs that are passed to the called workflow.\n\nAny inputs that you pass must match the input specifications defined in the called workflow.", mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "scalar-needs-context" } }, "workflow-job-secrets": { description: "When a job is used to call a reusable workflow, you can use `secrets` to provide a map of secrets that are passed to the called workflow.\n\nAny secrets that you pass must match the names defined in the called workflow.", "one-of": ["workflow-job-secrets-mapping", "workflow-job-secrets-inherit"] }, "workflow-job-secrets-mapping": { mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "scalar-needs-context-with-secrets" } }, "workflow-job-secrets-inherit": { string: { constant: "inherit" } }, needs: { description: "Use `needs` to identify any jobs that must complete successfully before this job will run. It can be a string or array of strings. If a job fails, all jobs that need it are skipped unless the jobs use a conditional expression that causes the job to continue. If a run contains a series of jobs that need each other, a failure applies to all jobs in the dependency chain from the point of failure onwards.", "one-of": ["sequence-of-non-empty-string", "non-empty-string"] }, "job-if": { description: "You can use the `if` conditional to prevent a job from running unless a condition is met. You can use any supported context and expression to create a conditional.", context: ["github", "inputs", "vars", "needs", "always(0,0)", "failure(0,MAX)", "cancelled(0,0)", "success(0,MAX)"], string: {} }, "job-if-result": { context: ["github", "inputs", "vars", "needs", "always(0,0)", "failure(0,MAX)", "cancelled(0,0)", "success(0,MAX)"], "one-of": ["null", "boolean", "number", "string", "sequence", "mapping"] }, strategy: { description: "Use `strategy` to use a matrix strategy for your jobs. A matrix strategy lets you use variables in a single job definition to automatically create multiple job runs that are based on the combinations of the variables. ", context: ["github", "inputs", "vars", "needs"], mapping: { properties: { "fail-fast": { type: "boolean", description: "Setting `fail-fast` to `false` prevents GitHub from canceling all in-progress jobs if any matrix job fails. Default: `true`" }, "max-parallel": { type: "number", description: "The maximum number of jobs that can run simultaneously when using a matrix job strategy. By default, GitHub will maximize the number of jobs run in parallel depending on runner availability." }, matrix: "matrix" } } }, matrix: { description: "Use `matrix` to define a matrix of different job configurations. Within your matrix, define one or more variables followed by an array of values.", mapping: { properties: { include: { type: "matrix-filter", description: "Use `include` to expand existing matrix configurations or to add new configurations. The value of `include` is a list of objects.\n\nFor each object in the `include` list, the key:value pairs in the object will be added to each of the matrix combinations if none of the key:value pairs overwrite any of the original matrix values. If the object cannot be added to any of the matrix combinations, a new matrix combination will be created instead. Note that the original matrix values will not be overwritten, but added matrix values can be overwritten." }, exclude: { type: "matrix-filter", description: "To remove specific configurations defined in the matrix, use `exclude`. An excluded configuration only has to be a partial match for it to be excluded." } }, "loose-key-type": "non-empty-string", "loose-value-type": "sequence" } }, "matrix-filter": { sequence: { "item-type": "matrix-filter-item" } }, "matrix-filter-item": { mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "any" } }, snapshot: { description: "Use `snapshot` to define a custom image you want to create or update after your job succeeds by taking a snapshot of your runner.", "one-of": ["non-empty-string", "snapshot-mapping"] }, "snapshot-mapping": { mapping: { properties: { "image-name": { description: "The desired name of the custom image you want to create or update.", type: "non-empty-string", required: true }, if: "snapshot-if", version: { description: "The desired major version updates upon a new custom image version creation.", type: "non-empty-string" } } } }, "snapshot-if": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], description: "Use the if conditional to prevent a snapshot from being taken unless a condition is met. Any supported context and expression can be used to create a conditional. Expressions in an `if` conditional do not require the bracketed expression syntax. When you use expressions in an `if` conditional, you may omit the expression syntax because GitHub automatically evaluates the `if` conditional as an expression.", string: {} }, "runs-on": { description: "Use `runs-on` to define the type of machine to run the job on.\n* The destination machine can be either a GitHub-hosted runner, larger runner, or a self-hosted runner.\n* You can target runners based on the labels assigned to them, or their group membership, or a combination of these.\n* You can provide `runs-on` as a single string or as an array of strings.\n* If you specify an array of strings, your workflow will execute on any runner that matches all of the specified `runs-on` values.\n* If you would like to run your workflow on multiple machines, use `jobs.<job_id>.strategy`.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["non-empty-string", "sequence-of-non-empty-string", "runs-on-mapping"] }, "runs-on-mapping": { mapping: { properties: { group: { description: "The group from which to select a runner.", type: "non-empty-string" }, labels: "runs-on-labels" } } }, "runs-on-labels": { description: "The label by which to filter for available runners.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "job-env": { description: "A map of variables that are available to all steps in the job.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets"], mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string" } }, "workflow-concurrency": { description: "Concurrency ensures that only a single job or workflow using the same concurrency group will run at a time. A concurrency group can be any string or expression.\n\nYou can also specify `concurrency` at the job level.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#concurrency)", context: ["github", "inputs", "vars"], "one-of": ["string", "concurrency-mapping"] }, "job-concurrency": { description: "Concurrency ensures that only a single job using the same concurrency group will run at a time. A concurrency group can be any string or expression. The expression can use any context except for the `secrets` context.\n\nYou can also specify `concurrency` at the workflow level.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["non-empty-string", "concurrency-mapping"] }, "concurrency-mapping": { description: "Concurrency ensures that only a single job or workflow using the same concurrency group will run at a time. A concurrency group can be any string or expression.\n\nYou can also specify `concurrency` at the job level.\n\n[Documentation](https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions#concurrency)", mapping: { properties: { group: { type: "non-empty-string", required: true, description: "When a concurrent job or workflow is queued, if another job or workflow using the same concurrency group in the repository is in progress, the queued job or workflow will be `pending`. Any previously pending job or workflow in the concurrency group will be canceled. To also cancel any currently running job or workflow in the same concurrency group, specify `cancel-in-progress: true`." }, "cancel-in-progress": { type: "boolean", description: "To cancel any currently running job or workflow in the same concurrency group, specify cancel-in-progress: true." }, queue: { type: "concurrency-queue", description: "The queuing mode for the concurrency group. When set to `max`, workflows or jobs will wait in a queue for the concurrency group up to the maximum queue length. Default: `single` meaning at most one item can be pending." } } } }, "concurrency-queue": { "allowed-values": ["single", "max"] }, "job-environment": { description: "The environment that the job references. All environment protection rules must pass before a job referencing the environment is sent to a runner.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["string", "job-environment-mapping"] }, "job-environment-mapping": { mapping: { properties: { name: { type: "job-environment-name", required: true }, url: { type: "string-runner-context-no-secrets", description: "The environment URL, which maps to `environment_url` in the deployments API." }, deployment: { type: "boolean", description: "Whether to create a deployment record for this environment. Defaults to true." } } } }, "job-environment-name": { description: "The name of the environment used by the job.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], string: {} }, "job-defaults": { description: "A map of default settings that will apply to all steps in the job. You can also set default settings for the entire workflow.", mapping: { properties: { run: "job-defaults-run" } } }, "job-defaults-run": { context: ["github", "inputs", "vars", "strategy", "matrix", "needs", "env"], mapping: { properties: { shell: "shell", "working-directory": "working-directory" } } }, "job-outputs": { description: "A map of outputs for a called workflow. Called workflow outputs are available to all downstream jobs in the caller workflow. Each output has an identifier, an optional `description,` and a `value`. The `value` must be set to the value of an output from a job within the called workflow.", mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string-runner-context" } }, steps: { description: "A job contains a sequence of tasks called `steps`. Steps can run commands, run setup tasks, run an action in your repository, a public repository, or an action published in a Docker registry, wait for background steps to complete, or cancel a background step. Not all steps run actions, but all actions run as a step. Each step runs in its own process in the runner environment and has access to the workspace and filesystem. Because steps run in their own process, changes to environment variables are not preserved between steps. GitHub provides built-in steps to set up and complete a job.", sequence: { "item-type": "steps-item" } }, "steps-item": { "one-of": ["run-step", "regular-step", "wait-step", "wait-all-step", "cancel-step", "parallel-step"] }, "run-step": { mapping: { properties: { name: "step-name", id: "step-id", if: "step-if", "timeout-minutes": "step-timeout-minutes", run: { type: "string-steps-context", description: "Runs command-line programs using the operating system's shell. If you do not provide a `name`, the step name will default to the text specified in the `run` command. Commands run using non-login shells by default. You can choose a different shell and customize the shell used to run commands. Each `run` keyword represents a new process and shell in the virtual environment. When you provide multi-line commands, each line runs in the same shell.", required: true }, "continue-on-error": "step-continue-on-error", env: "step-env", "working-directory": "string-steps-context", shell: "shell", background: "step-background" } } }, "regular-step": { mapping: { properties: { name: "step-name", id: "step-id", if: "step-if", "continue-on-error": "step-continue-on-error", "timeout-minutes": "step-timeout-minutes", uses: { type: "step-uses", required: true }, with: "step-with", env: "step-env", background: "step-background" } } }, "wait-step": { mapping: { properties: { name: "step-name", id: "step-id", "continue-on-error": "step-continue-on-error", wait: { type: "step-wait-target", required: true } } } }, "wait-all-step": { mapping: { properties: { name: "step-name", id: "step-id", "continue-on-error": "step-continue-on-error", "wait-all": { type: "step-wait-all-value", required: true } } } }, "cancel-step": { mapping: { properties: { name: "step-name", id: "step-id", "continue-on-error": "step-continue-on-error", cancel: { type: "step-cancel-target", required: true } } } }, "parallel-step": { mapping: { properties: { parallel: { type: "parallel-steps", required: true, description: "Run a group of steps concurrently. All steps in the parallel block run as background steps and the workflow waits for all of them to complete before continuing." } } } }, "parallel-steps": { sequence: { "item-type": "steps-item" } }, "step-uses": { description: "Selects an action to run as part of a step in your job. An action is a reusable unit of code. You can use an action defined in the same repository as the workflow, a public repository, a [private repository with access enabled](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository#allowing-access-to-components-in-a-private-repository), or in a published Docker container image.", string: { "require-non-empty": true } }, "step-background": { boolean: {}, description: "When set to true, runs this step in the background. The workflow continues to the next step immediately without waiting for the background step to finish." }, "step-wait-target": { description: "The step ID or IDs of background steps to wait for.", "one-of": ["non-empty-string", "sequence-of-non-empty-string"] }, "step-wait-all-value": { description: "Wait for all prior background steps to complete. Use as a bare key (`wait-all:`) or with a boolean value.", "one-of": ["null", "boolean"] }, "step-cancel-target": { description: "The step ID of a background step to cancel.", string: { "require-non-empty": true } }, "step-continue-on-error": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], boolean: {}, description: "Prevents a job from failing when a step fails. Set to `true` to allow a job to pass when this step fails." }, "step-id": { string: { "require-non-empty": true }, description: "A unique identifier for the step. You can use the `id` to reference the step in contexts." }, "step-if": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "steps", "job", "runner", "env", "always(0,0)", "failure(0,0)", "cancelled(0,0)", "success(0,0)", "hashFiles(1,255)"], description: "Use the `if` conditional to prevent a step from running unless a condition is met. Any supported context and expression can be used to create a conditional. Expressions in an `if` conditional do not require the bracketed expression syntax. When you use expressions in an `if` conditional, you may omit the expression syntax because GitHub automatically evaluates the `if` conditional as an expression.", string: {} }, "step-if-result": { context: ["github", "inputs", "vars", "strategy", "matrix", "steps", "job", "runner", "env", "always(0,0)", "failure(0,0)", "cancelled(0,0)", "success(0,0)", "hashFiles(1,255)"], "one-of": ["null", "boolean", "number", "string", "sequence", "mapping"] }, "step-env": { description: "Sets variables for steps to use in the runner environment. You can also set variables for the entire workflow or a job.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string" } }, "step-name": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], string: {}, description: "A name for your step to display on GitHub." }, "step-timeout-minutes": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], number: {}, description: "The maximum number of minutes to run the step before killing the process." }, "step-with": { description: "A map of the input parameters defined by the action. Each input parameter is a key/value pair. Input parameters are set as variables. When you specify an input in a workflow file or use a default input value, GitHub creates a variable for the input with the name `INPUT_<VARIABLE_NAME>`. The variable created converts input names to uppercase letters and replaces spaces with `_`.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string" } }, container: { description: "A container to run any steps in a job that don't already specify a container. If you have steps that use both script and container actions, the container actions will run as sibling containers on the same network with the same volume mounts.\n\nIf you do not set a container, all steps will run directly on the host specified by runs-on unless a step refers to an action configured to run in a container.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["string", "container-mapping"] }, "container-mapping": { mapping: { properties: { image: { type: "non-empty-string", description: "Use `jobs.<job_id>.container.image` to define the Docker image to use as the container to run the action. The value can be the Docker Hub image or a registry name." }, options: { type: "string", description: "Use `jobs.<job_id>.container.options` to configure additional Docker container resource options." }, env: "container-env", ports: { type: "sequence-of-non-empty-string", description: "Use `jobs.<job_id>.container.ports` to set an array of ports to expose on the container." }, volumes: { type: "sequence-of-non-empty-string", description: "Use `jobs.<job_id>.container.volumes` to set an array of volumes for the container to use. You can use volumes to share data between services or other steps in a job. You can specify named Docker volumes, anonymous Docker volumes, or bind mounts on the host." }, credentials: "container-registry-credentials" } } }, services: { description: "Additional containers to host services for a job in a workflow. These are useful for creating databases or cache services like redis. The runner on the virtual machine will automatically create a network and manage the life cycle of the service containers. When you use a service container for a job or your step uses container actions, you don't need to set port information to access the service. Docker automatically exposes all ports between containers on the same network. When both the job and the action run in a container, you can directly reference the container by its hostname. The hostname is automatically mapped to the service name. When a step does not use a container action, you must access the service using localhost and bind the ports.", context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "services-container" } }, "services-container": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["non-empty-string", "service-container-mapping"] }, "container-registry-credentials": { description: "If the image's container registry requires authentication to pull the image, you can use `jobs.<job_id>.container.credentials` to set a map of the username and password. The credentials are the same values that you would provide to the `docker login` command.", context: ["github", "inputs", "vars", "secrets", "env"], mapping: { properties: { username: "non-empty-string", password: "non-empty-string" } } }, "container-env": { description: "Use `jobs.<job_id>.container.env` to set a map of variables in the container.", mapping: { "loose-key-type": "non-empty-string", "loose-value-type": "string-runner-context" } }, "non-empty-string": { string: { "require-non-empty": true } }, "sequence-of-non-empty-string": { sequence: { "item-type": "non-empty-string" } }, "sequence-of-string": { sequence: { "item-type": "string" } }, "boolean-needs-context": { context: ["github", "inputs", "vars", "needs"], boolean: {} }, "number-needs-context": { context: ["github", "inputs", "vars", "needs"], number: {} }, "string-needs-context": { context: ["github", "inputs", "vars", "needs"], string: {} }, "scalar-needs-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], "one-of": ["string", "boolean", "number"] }, "scalar-needs-context-with-secrets": { context: ["github", "inputs", "vars", "needs", "secrets", "strategy", "matrix"], "one-of": ["string", "boolean", "number"] }, "boolean-strategy-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], boolean: {} }, "number-strategy-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], number: {} }, "string-strategy-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix"], string: {} }, "boolean-steps-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], boolean: {} }, "number-steps-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], number: {} }, "string-runner-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env"], string: {} }, "string-runner-context-no-secrets": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "steps", "job", "runner", "env"], string: {} }, "string-steps-context": { context: ["github", "inputs", "vars", "needs", "strategy", "matrix", "secrets", "steps", "job", "runner", "env", "hashFiles(1,255)"], string: {} }, shell: { string: { "require-non-empty": true }, description: "Use `shell` to override the default shell settings in the runner's operating system. You can use built-in shell keywords, or you can define a custom set of shell options. The shell command that is run internally executes a temporary file that contains the commands specified in `run`." }, "working-directory": { string: { "require-non-empty": true }, description: "The `working-directory` keyword specifies the working directory where the command is run." }, "cron-mapping": { mapping: { properties: { cron: { type: "cron-pattern", required: true }, timezone: "timezone-string" } } }, "cron-pattern": { description: "A cron expression that represents a schedule. A scheduled workflow will run at most once every 5 minutes.", string: { "require-non-empty": true } }, "timezone-string": { description: "A string that represents the time zone a scheduled workflow will run relative to in IANA format (e.g. 'America/New_York' or 'Europe/London'). If omitted, the workflow will run relative to midnight UTC.", string: { "require-non-empty": true } }, "service-container-mapping": { mapping: { properties: { image: { type: "non-empty-string", description: "The Docker image to use as the container. The value can be the Docker Hub image or a registry name." }, options: { type: "string", description: "Additional Docker container resource options." }, env: "container-env", ports: { type: "sequence-of-non-empty-string", description: "An array of ports to expose on the container." }, volumes: { type: "sequence-of-non-empty-string", description: "An array of volumes for the container to use. You can use volumes to share data between services or other steps in a job. You can specify named Docker volumes, anonymous Docker volumes, or bind mounts on the host." }, credentials: "container-registry-credentials", entrypoint: { type: "string", description: "Override the default ENTRYPOINT in the service container image." }, command: { type: "string", description: "Override the default CMD in the service container image." } } } } } };

// node_modules/@actions/workflow-parser/dist/workflows/workflow-schema.js
var schema;
function getWorkflowSchema() {
  if (schema === void 0) {
    const json = JSON.stringify(workflow_v1_0_min_default);
    schema = TemplateSchema.load(new JSONObjectReader(void 0, json));
  }
  return schema;
}

// node_modules/@actions/workflow-parser/dist/workflows/yaml-object-reader.js
var import_yaml = __toESM(require_dist(), 1);
var YamlObjectReader = class _YamlObjectReader {
  constructor(fileId, content) {
    this.lineCounter = new import_yaml.LineCounter();
    this.errors = [];
    this.doc = (0, import_yaml.parseDocument)(content, {
      lineCounter: this.lineCounter,
      keepSourceTokens: true,
      uniqueKeys: false
      // Uniqueness is validated by the template reader
    });
    for (const err of this.doc.errors) {
      this.errors.push({ message: err.message, range: rangeFromLinePos(err.linePos) });
    }
    this._generator = this.getNodes(this.doc, /* @__PURE__ */ new Set());
    this.fileId = fileId;
  }
  *getNodes(node, aliasResolutionStack) {
    let range = this.getRange(node);
    if ((0, import_yaml.isDocument)(node)) {
      yield new ParseEvent(EventType.DocumentStart);
      for (const item of this.getNodes(node.contents, /* @__PURE__ */ new Set())) {
        yield item;
      }
      yield new ParseEvent(EventType.DocumentEnd);
    }
    if ((0, import_yaml.isCollection)(node)) {
      if ((0, import_yaml.isSeq)(node)) {
        yield new ParseEvent(EventType.SequenceStart, new SequenceToken(this.fileId, range, void 0));
      } else if ((0, import_yaml.isMap)(node)) {
        yield new ParseEvent(EventType.MappingStart, new MappingToken(this.fileId, range, void 0));
      }
      for (const item of node.items) {
        for (const child of this.getNodes(item, aliasResolutionStack)) {
          yield child;
        }
      }
      if ((0, import_yaml.isSeq)(node)) {
        yield new ParseEvent(EventType.SequenceEnd);
      } else if ((0, import_yaml.isMap)(node)) {
        yield new ParseEvent(EventType.MappingEnd);
      }
    }
    if ((0, import_yaml.isScalar)(node)) {
      yield new ParseEvent(EventType.Literal, _YamlObjectReader.getLiteralToken(this.fileId, range, node));
    }
    if ((0, import_yaml.isAlias)(node)) {
      const resolved = node.resolve(this.doc);
      if (resolved) {
        if (aliasResolutionStack.has(resolved)) {
          return;
        }
        const newStack = new Set(aliasResolutionStack);
        newStack.add(resolved);
        yield* this.getNodes(resolved, newStack);
      }
      return;
    }
    if ((0, import_yaml.isPair)(node)) {
      const scalarKey = node.key;
      range = this.getRange(scalarKey);
      const key = scalarKey.value;
      yield new ParseEvent(EventType.Literal, new StringToken(this.fileId, range, key, void 0));
      for (const child of this.getNodes(node.value, aliasResolutionStack)) {
        yield child;
      }
    }
  }
  getRange(node) {
    const range = node?.range ?? [];
    const startPos = range[0];
    const endPos = range[1];
    if (startPos !== void 0 && endPos !== void 0) {
      const slp = this.lineCounter.linePos(startPos);
      const elp = this.lineCounter.linePos(endPos);
      return {
        start: { line: slp.line, column: slp.col },
        end: { line: elp.line, column: elp.col }
      };
    }
    return void 0;
  }
  static getLiteralToken(fileId, range, token) {
    const value = token.value;
    if (value === null || value === void 0) {
      return new NullToken(fileId, range, void 0);
    }
    switch (typeof value) {
      case "number":
        return new NumberToken(fileId, range, value, void 0);
      case "boolean":
        return new BooleanToken(fileId, range, value, void 0);
      case "string": {
        let source;
        let blockScalarHeader;
        if (token.srcToken && "source" in token.srcToken) {
          source = token.srcToken.source;
          if (token.srcToken.type === "block-scalar" && "props" in token.srcToken) {
            const props = token.srcToken.props;
            const headerProp = props.find((p) => p.type === "block-scalar-header");
            if (headerProp?.source) {
              blockScalarHeader = headerProp.source;
            }
          }
        }
        return new StringToken(fileId, range, value, void 0, source, blockScalarHeader);
      }
      default:
        throw new Error(`Unexpected value type '${typeof value}' when reading object`);
    }
  }
  allowLiteral() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.Literal) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowSequenceStart() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.SequenceStart) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowSequenceEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.SequenceEnd) {
        this._current = this._generator.next();
        return true;
      }
    }
    return false;
  }
  allowMappingStart() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.MappingStart) {
        this._current = this._generator.next();
        return parseEvent.token;
      }
    }
    return void 0;
  }
  allowMappingEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.MappingEnd) {
        this._current = this._generator.next();
        return true;
      }
    }
    return false;
  }
  validateEnd() {
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.DocumentEnd) {
        this._current = this._generator.next();
        return;
      }
    }
    throw new Error("Expected end of reader");
  }
  validateStart() {
    if (!this._current) {
      this._current = this._generator.next();
    }
    if (!this._current.done) {
      const parseEvent = this._current.value;
      if (parseEvent.type === EventType.DocumentStart) {
        this._current = this._generator.next();
        return;
      }
    }
    throw new Error("Expected start of reader");
  }
};
function rangeFromLinePos(linePos) {
  if (linePos === void 0) {
    return;
  }
  const start = { line: linePos[0].line, column: linePos[0].col };
  const end = linePos.length == 2 ? { line: linePos[1].line, column: linePos[1].col } : start;
  return { start, end };
}

// node_modules/@actions/workflow-parser/dist/workflows/workflow-parser.js
function parseWorkflow(entryFile, contextOrTrace) {
  const context = contextOrTrace instanceof TemplateContext ? contextOrTrace : new TemplateContext(new TemplateValidationErrors(), getWorkflowSchema(), contextOrTrace);
  const fileId = context.getFileId(entryFile.name);
  const reader = new YamlObjectReader(fileId, entryFile.content);
  if (reader.errors.length > 0) {
    for (const err of reader.errors) {
      context.error(fileId, err.message, err.range);
    }
    return {
      context,
      value: void 0
    };
  }
  const result = readTemplate(context, WORKFLOW_ROOT, reader, fileId);
  return {
    context,
    value: result
  };
}

// node_modules/@actions/workflow-parser/dist/model/converter/concurrency.js
function convertConcurrency(context, token) {
  const result = {};
  if (token.isExpression) {
    return result;
  }
  if (isString(token)) {
    result.group = token;
    return result;
  }
  const concurrencyProperty = token.assertMapping("concurrency group");
  for (const property of concurrencyProperty) {
    const propertyName = property.key.assertString("concurrency group key");
    if (property.key.isExpression || property.value.isExpression) {
      continue;
    }
    switch (propertyName.value) {
      case "group":
        result.group = property.value.assertString("concurrency group");
        break;
      case "cancel-in-progress":
        result.cancelInProgress = property.value.assertBoolean("cancel-in-progress").value;
        break;
      case "queue":
        result.queue = property.value.assertString("queue").value;
        break;
      default:
        context.error(propertyName, `Invalid property name: ${propertyName.value}`);
    }
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/cron.js
var import_cronstrue = __toESM(require_cronstrue(), 1);

// node_modules/@actions/workflow-parser/dist/model/converter/cron-constants.js
var MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};
var DAYS = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6
};
var MINUTE_RANGE = { min: 0, max: 59 };
var HOUR_RANGE = { min: 0, max: 23 };
var DOM_RANGE = { min: 1, max: 31 };
var MONTH_RANGE = { min: 1, max: 12, names: MONTHS };
var DOW_RANGE = { min: 0, max: 6, names: DAYS };

// node_modules/@actions/workflow-parser/dist/model/converter/cron.js
function isValidCron(cron) {
  const parts = cron.split(/ +/);
  if (parts.length != 5) {
    return false;
  }
  const [minutes, hours, dom, months, dow] = parts;
  return validateCronPart(minutes, MINUTE_RANGE) && validateCronPart(hours, HOUR_RANGE) && validateCronPart(dom, DOM_RANGE) && validateCronPart(months, MONTH_RANGE) && validateCronPart(dow, DOW_RANGE);
}
function validateCronPart(value, range, allowSeparators = true) {
  if (range.names && range.names[value.toLowerCase()] !== void 0) {
    return true;
  }
  if (value === "*") {
    return true;
  }
  if (value.includes(",")) {
    if (!allowSeparators) {
      return false;
    }
    return value.split(",").every((v) => v && validateCronPart(v, range));
  }
  if (value.includes("/")) {
    if (!allowSeparators) {
      return false;
    }
    const [start, step, ...rest] = value.split("/");
    const stepNumber = +step;
    if (rest.length > 0 || isNaN(stepNumber) || stepNumber <= 0 || !start || !step) {
      return false;
    }
    return validateCronPart(start, range) && validateCronPart(step, range, false);
  }
  if (value.includes("-")) {
    if (!allowSeparators) {
      return false;
    }
    const [start, end, ...rest] = value.split("-");
    if (rest.length > 0 || !start || !end) {
      return false;
    }
    const startNumber = convertToNumber(start, range.names);
    const endNumber = convertToNumber(end, range.names);
    return validateCronPart(start, range, false) && validateCronPart(end, range, false) && endNumber >= startNumber;
  }
  const number = +value;
  return !isNaN(number) && number >= range.min && number <= range.max;
}
function convertToNumber(value, names) {
  if (names && names[value.toLowerCase()] !== void 0) {
    return +names[value.toLowerCase()];
  } else {
    return +value;
  }
}

// node_modules/@actions/workflow-parser/dist/model/converter/string-list.js
function convertStringList(name, token) {
  const result = [];
  for (const item of token) {
    result.push(item.assertString(`${name} item`).value);
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/workflow-template.js
var InputType;
(function(InputType2) {
  InputType2["string"] = "string";
  InputType2["choice"] = "choice";
  InputType2["boolean"] = "boolean";
  InputType2["environment"] = "environment";
})(InputType || (InputType = {}));

// node_modules/@actions/workflow-parser/dist/model/converter/workflow-call.js
function convertEventWorkflowCall(context, token) {
  const result = {};
  for (const item of token) {
    const key = item.key.assertString("workflow dispatch input key");
    switch (key.value) {
      case "inputs":
        result.inputs = convertWorkflowInputs(context, item.value.assertMapping("workflow dispatch inputs"));
        break;
      case "secrets":
        result.secrets = convertWorkflowCallSecrets(context, item.value.assertMapping("workflow dispatch inputs"));
        break;
      case "outputs":
        break;
    }
  }
  return result;
}
function convertWorkflowInputs(context, token) {
  const result = {};
  for (const item of token) {
    const inputName = item.key.assertString("input name");
    const inputMapping = item.value.assertMapping("input configuration");
    result[inputName.value] = convertWorkflowInput(context, inputMapping);
  }
  return result;
}
function convertWorkflowInput(context, token) {
  const result = {
    type: InputType.string
    // Default to string
  };
  let defaultValue;
  for (const item of token) {
    const key = item.key.assertString("workflow dispatch input key");
    switch (key.value) {
      case "description":
        result.description = item.value.assertString("input description").value;
        break;
      case "required":
        result.required = item.value.assertBoolean("input required").value;
        break;
      case "default":
        defaultValue = item.value.assertScalar("input default");
        break;
      case "type":
        result.type = InputType[item.value.assertString("input type").value];
        break;
      case "options":
        result.options = convertStringList("input options", item.value.assertSequence("input options"));
        break;
      default:
        context.error(item.key, `Invalid key '${key.value}'`);
    }
  }
  if (defaultValue !== void 0 && !defaultValue.isExpression) {
    try {
      switch (result.type) {
        case InputType.boolean:
          result.default = defaultValue.assertBoolean("input default").value;
          break;
        case InputType.string:
        case InputType.choice:
        case InputType.environment:
          result.default = defaultValue.assertString("input default").value;
          break;
      }
    } catch (e) {
      context.error(defaultValue, e);
    }
  }
  if (result.type === InputType.choice) {
    if (result.options === void 0 || result.options.length === 0) {
      context.error(token, "Missing 'options' for choice input");
    }
  } else {
    if (result.options !== void 0) {
      context.error(token, "Input type is not 'choice', but 'options' is defined");
    }
  }
  return result;
}
function convertWorkflowCallSecrets(context, token) {
  const result = {};
  for (const item of token) {
    const secretName = item.key.assertString("secret name");
    result[secretName.value] = convertWorkflowCallSecret(context, item.value);
  }
  return result;
}
function convertWorkflowCallSecret(context, token) {
  const result = {};
  if (isMapping(token)) {
    for (const item of token) {
      const key = item.key.assertString("workflow call secret key");
      switch (key.value) {
        case "description":
          result.description = item.value.assertString("secret description").value;
          break;
        case "required":
          result.required = item.value.assertBoolean("secret required").value;
          break;
      }
    }
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/workflow-dispatch.js
function convertEventWorkflowDispatchInputs(context, token) {
  const result = {};
  for (const item of token) {
    const key = item.key.assertString("workflow dispatch input key");
    switch (key.value) {
      case "inputs":
        result.inputs = convertWorkflowDispatchInputs(context, item.value.assertMapping("workflow dispatch inputs"));
        break;
    }
  }
  return result;
}
function convertWorkflowDispatchInputs(context, token) {
  const result = {};
  for (const item of token) {
    const inputName = item.key.assertString("input name");
    const inputMapping = item.value.assertMapping("input configuration");
    result[inputName.value] = convertWorkflowDispatchInput(context, inputMapping);
  }
  return result;
}
function convertWorkflowDispatchInput(context, token) {
  const result = {
    type: InputType.string
    // Default to string
  };
  let defaultValue;
  for (const item of token) {
    const key = item.key.assertString("workflow dispatch input key");
    switch (key.value) {
      case "description":
        result.description = item.value.assertString("input description").value;
        break;
      case "required":
        result.required = item.value.assertBoolean("input required").value;
        break;
      case "default":
        defaultValue = item.value.assertScalar("input default");
        break;
      case "type":
        result.type = InputType[item.value.assertString("input type").value];
        break;
      case "options":
        result.options = convertStringList("input options", item.value.assertSequence("input options"));
        break;
      default:
        context.error(item.key, `Invalid key '${key.value}'`);
    }
  }
  if (defaultValue !== void 0) {
    try {
      switch (result.type) {
        case InputType.boolean:
          result.default = defaultValue.assertBoolean("input default").value;
          break;
        case InputType.string:
        case InputType.choice:
        case InputType.environment:
          result.default = defaultValue.assertString("input default").value;
          break;
      }
    } catch (e) {
      context.error(defaultValue, e);
    }
  }
  if (result.type === InputType.choice) {
    if (result.options === void 0 || result.options.length === 0) {
      context.error(token, "Missing 'options' for choice input");
    }
  } else {
    if (result.options !== void 0) {
      context.error(token, "Input type is not 'choice', but 'options' is defined");
    }
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/events.js
function convertOn(context, token) {
  if (isLiteral(token)) {
    const event = token.assertString("on");
    return {
      [event.value]: {}
    };
  }
  if (isSequence(token)) {
    const result = {};
    for (const item of token) {
      const event = item.assertString("on");
      result[event.value] = {};
    }
    return result;
  }
  if (isMapping(token)) {
    const result = {};
    for (const item of token) {
      const eventKey = item.key.assertString("event name");
      const eventName = eventKey.value;
      if (item.value.templateTokenType === TokenType.Null) {
        result[eventName] = {};
        continue;
      }
      if (eventName === "schedule") {
        const scheduleToken = item.value.assertSequence(`event ${eventName}`);
        result.schedule = convertSchedule(context, scheduleToken);
        continue;
      }
      const eventToken = item.value.assertMapping(`event ${eventName}`);
      if (eventName === "workflow_call") {
        result.workflow_call = convertEventWorkflowCall(context, eventToken);
        continue;
      }
      if (eventName === "workflow_dispatch") {
        result.workflow_dispatch = convertEventWorkflowDispatchInputs(context, eventToken);
        continue;
      }
      result[eventName] = {
        ...convertPatternFilter("branches", eventToken),
        ...convertPatternFilter("tags", eventToken),
        ...convertPatternFilter("paths", eventToken),
        ...convertFilter("types", eventToken),
        ...convertFilter("versions", eventToken),
        ...convertFilter("names", eventToken),
        ...convertFilter("workflows", eventToken)
      };
    }
    return result;
  }
  context.error(token, "Invalid format for 'on'");
  return {};
}
function convertPatternFilter(name, token) {
  const result = {};
  for (const item of token) {
    const key = item.key.assertString(`${name} filter key`);
    switch (key.value) {
      case name:
        if (isString(item.value)) {
          result[name] = [item.value.value];
        } else {
          result[name] = convertStringList(name, item.value.assertSequence(`${name} list`));
        }
        break;
      case `${name}-ignore`:
        if (isString(item.value)) {
          result[`${name}-ignore`] = [item.value.value];
        } else {
          result[`${name}-ignore`] = convertStringList(`${name}-ignore`, item.value.assertSequence(`${name}-ignore list`));
        }
        break;
    }
  }
  return result;
}
function convertFilter(name, token) {
  const result = {};
  for (const item of token) {
    const key = item.key.assertString(`${name} filter key`);
    switch (key.value) {
      case name:
        if (isString(item.value)) {
          result[name] = [item.value.value];
        } else {
          result[name] = convertStringList(name, item.value.assertSequence(`${name} list`));
        }
        break;
    }
  }
  return result;
}
function convertSchedule(context, token) {
  const result = [];
  for (const item of token) {
    const mappingToken = item.assertMapping(`event schedule`);
    const config = { cron: "" };
    let valid = true;
    for (const entry of mappingToken) {
      const key = entry.key.assertString(`schedule key`);
      if (key.value === "cron") {
        const cron = entry.value.assertString(`schedule cron`);
        if (!isValidCron(cron.value)) {
          context.error(cron, "Invalid cron expression. Expected format: '* * * * *' (minute hour day month weekday)");
        }
        config.cron = cron.value;
      } else if (key.value === "timezone") {
        const timezone = entry.value.assertString(`schedule timezone`);
        config.timezone = timezone.value;
      } else {
        context.error(key, `Invalid schedule key`);
        valid = false;
      }
    }
    if (valid && config.cron) {
      result.push(config);
    } else if (valid && !config.cron) {
      context.error(mappingToken, "Missing required key 'cron' in schedule entry");
    }
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/handle-errors.js
function handleTemplateTokenErrors(root, context, defaultValue, f) {
  let r = defaultValue;
  try {
    r = f();
  } catch (err) {
    if (err instanceof TemplateTokenError) {
      context.error(err.token, err);
    } else {
      context.error(root, err);
    }
  }
  return r;
}

// node_modules/@actions/workflow-parser/dist/model/converter/if-condition.js
function ensureStatusFunction(condition, definitionInfo) {
  const allowedContext = definitionInfo?.allowedContext || [];
  try {
    const { namedContexts, functions } = splitAllowedContext(allowedContext);
    const lexer = new Lexer(condition);
    const result = lexer.lex();
    const parser = new Parser(result.tokens, namedContexts, functions);
    const tree = parser.parse();
    if (walkTreeToFindStatusFunctionCalls(tree)) {
      return condition;
    }
    return `success() && (${condition})`;
  } catch {
    return condition;
  }
}
function convertToIfCondition(context, token) {
  const scalar = token.assertScalar("if condition");
  const allowedContext = token.definitionInfo?.allowedContext || [];
  let condition;
  let source;
  if (scalar instanceof BasicExpressionToken) {
    condition = scalar.expression;
    source = scalar.source;
  } else {
    const stringToken = scalar.assertString("if condition");
    condition = stringToken.value.trim();
    source = stringToken.source;
  }
  let finalCondition;
  if (!condition) {
    finalCondition = "success()";
  } else {
    finalCondition = ensureStatusFunction(condition, token.definitionInfo);
  }
  try {
    ExpressionToken.validateExpression(finalCondition, allowedContext);
  } catch (err) {
    context.error(token, err);
    return void 0;
  }
  return new BasicExpressionToken(token.file, token.range, finalCondition, token.definitionInfo, void 0, source);
}
function walkTreeToFindStatusFunctionCalls(tree) {
  if (!tree) {
    return false;
  }
  if (tree instanceof FunctionCall) {
    const funcName = tree.functionName.lexeme.toLowerCase();
    if (funcName === "success" || funcName === "failure" || funcName === "cancelled" || funcName === "always") {
      return true;
    }
    return tree.args.some((arg) => walkTreeToFindStatusFunctionCalls(arg));
  }
  if (tree instanceof Binary) {
    return walkTreeToFindStatusFunctionCalls(tree.left) || walkTreeToFindStatusFunctionCalls(tree.right);
  }
  if (tree instanceof Unary) {
    return walkTreeToFindStatusFunctionCalls(tree.expr);
  }
  if (tree instanceof Logical) {
    return tree.args.some((arg) => walkTreeToFindStatusFunctionCalls(arg));
  }
  if (tree instanceof Grouping) {
    return walkTreeToFindStatusFunctionCalls(tree.group);
  }
  if (tree instanceof IndexAccess) {
    return walkTreeToFindStatusFunctionCalls(tree.expr) || walkTreeToFindStatusFunctionCalls(tree.index);
  }
  return false;
}

// node_modules/@actions/workflow-parser/dist/model/converter/container.js
function convertToJobContainer(context, container) {
  let image;
  let env;
  let ports;
  let volumes;
  let options;
  for (const [, token] of TemplateToken.traverse(container)) {
    if (token.isExpression) {
      return;
    }
  }
  if (isString(container)) {
    image = container.assertString("container item");
    return { image };
  }
  const mapping = container.assertMapping("container item");
  if (mapping)
    for (const item of mapping) {
      const key = item.key.assertString("container item key");
      const value = item.value;
      switch (key.value) {
        case "image":
          image = value.assertString("container image");
          break;
        case "credentials":
          convertToJobCredentials(context, value);
          break;
        case "env":
          env = value.assertMapping("container env");
          for (const envItem of env) {
            envItem.key.assertString("container env value");
          }
          break;
        case "ports":
          ports = value.assertSequence("container ports");
          for (const port of ports) {
            port.assertString("container port");
          }
          break;
        case "volumes":
          volumes = value.assertSequence("container volumes");
          for (const volume of volumes) {
            volume.assertString("container volume");
          }
          break;
        case "options":
          options = value.assertString("container options");
          break;
        default:
          context.error(key, `Unexpected container item key: ${key.value}`);
      }
    }
  if (!image) {
    context.error(container, "Container image cannot be empty");
  } else {
    return { image, env, ports, volumes, options };
  }
}
function convertToServiceContainer(context, container) {
  let image;
  let env;
  let ports;
  let volumes;
  let options;
  let entrypoint;
  let command;
  for (const [, token] of TemplateToken.traverse(container)) {
    if (token.isExpression) {
      return;
    }
  }
  if (isString(container)) {
    image = container.assertString("container item");
    return { image };
  }
  const mapping = container.assertMapping("container item");
  if (mapping)
    for (const item of mapping) {
      const key = item.key.assertString("container item key");
      const value = item.value;
      switch (key.value) {
        case "image":
          image = value.assertString("container image");
          break;
        case "credentials":
          convertToJobCredentials(context, value);
          break;
        case "env":
          env = value.assertMapping("container env");
          for (const envItem of env) {
            envItem.key.assertString("container env value");
          }
          break;
        case "ports":
          ports = value.assertSequence("container ports");
          for (const port of ports) {
            port.assertString("container port");
          }
          break;
        case "volumes":
          volumes = value.assertSequence("container volumes");
          for (const volume of volumes) {
            volume.assertString("container volume");
          }
          break;
        case "options":
          options = value.assertString("container options");
          break;
        case "entrypoint":
          entrypoint = value.assertString("container entrypoint");
          break;
        case "command":
          command = value.assertString("container command");
          break;
        default:
          context.error(key, `Unexpected container item key: ${key.value}`);
      }
    }
  if (!image) {
    context.error(container, "Container image cannot be empty");
  } else {
    return { image, env, ports, volumes, options, entrypoint, command };
  }
}
function convertToJobServices(context, services) {
  const serviceList = [];
  const mapping = services.assertMapping("services");
  for (const service of mapping) {
    service.key.assertString("service key");
    const container = convertToServiceContainer(context, service.value);
    if (container) {
      serviceList.push(container);
    }
  }
  return serviceList;
}
function convertToJobCredentials(context, value) {
  const mapping = value.assertMapping("credentials");
  let username;
  let password;
  for (const item of mapping) {
    const key = item.key.assertString("credentials item");
    const value2 = item.value;
    switch (key.value) {
      case "username":
        username = value2.assertString("credentials username");
        break;
      case "password":
        password = value2.assertString("credentials password");
        break;
      default:
        context.error(key, `credentials key ${key.value}`);
    }
  }
  return { username, password };
}

// node_modules/@actions/workflow-parser/dist/model/converter/id-builder.js
var SEPARATOR = "_";
var MAX_ATTEMPTS = 1e3;
var MAX_LENGTH = 100;
var IdBuilder = class {
  constructor() {
    this.name = [];
    this.distinctNames = /* @__PURE__ */ new Set();
  }
  appendSegment(value) {
    if (value.length === 0) {
      return;
    }
    if (this.name.length == 0) {
      const first = value[0];
      if (this.isAlpha(first) || first == "_") {
      } else if (this.isNumeric(first) || first == "-") {
        this.name.push("_");
      } else {
      }
    } else {
      this.name.push(SEPARATOR);
    }
    for (const c of value) {
      {
        if (this.isAlphaNumeric(c) || c == "_" || c == "-") {
          this.name.push(c);
        } else {
          this.name.push(SEPARATOR);
        }
      }
    }
  }
  build() {
    const original = this.name.length > 0 ? this.name.join("") : "job";
    let suffix = "";
    for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
      if (attempt === 1) {
        suffix = "";
      } else {
        suffix = `_${attempt}`;
      }
      const candidate = original.substring(0, Math.min(original.length, MAX_LENGTH - suffix.length)) + suffix;
      if (!this.distinctNames.has(candidate)) {
        this.distinctNames.add(candidate);
        this.name = [];
        return candidate;
      }
    }
    throw new Error("Unable to create a unique name");
  }
  /**
   * Adds a known identifier to the set of distinct ids.
   * @param value The value to add
   * @returns An error if the value is invalid, otherwise undefined
   */
  tryAddKnownId(value) {
    if (!value || !this.isValid(value) || value.length >= MAX_LENGTH) {
      return `The identifier '${value}' is invalid. IDs may only contain alphanumeric characters, '_', and '-'. IDs must start with a letter or '_' and and must be less than ${MAX_LENGTH} characters.`;
    }
    if (value.startsWith(SEPARATOR + SEPARATOR)) {
      return `The identifier '${value}' is invalid. IDs starting with '__' are reserved.`;
    }
    if (this.distinctNames.has(value)) {
      return `The identifier '${value}' may not be used more than once within the same scope.`;
    }
    this.distinctNames.add(value);
    return;
  }
  /**
   * A name is valid if it starts with a letter or underscore, and contains only
   * letters, numbers, underscores, and hyphens.
   * @param name The string name to validate
   * @returns Whether the name is valid
   */
  isValid(name) {
    let first = true;
    for (const c of name) {
      if (first) {
        first = false;
        if (!this.isAlpha(c) && c != "_") {
          return false;
        }
        continue;
      }
      if (!this.isAlphaNumeric(c) && c != "_" && c != "-") {
        return false;
      }
    }
    return true;
  }
  isAlphaNumeric(c) {
    return this.isAlpha(c) || this.isNumeric(c);
  }
  isNumeric(c) {
    return c >= "0" && c <= "9";
  }
  isAlpha(c) {
    return c >= "a" && c <= "z" || c >= "A" && c <= "Z";
  }
};

// node_modules/@actions/workflow-parser/dist/model/converter/job/environment.js
function convertToActionsEnvironmentRef(context, token) {
  const result = {};
  if (token.isExpression) {
    return result;
  }
  if (isScalar(token)) {
    result.name = token;
    return result;
  }
  const environmentMapping = token.assertMapping("job environment");
  for (const property of environmentMapping) {
    const propertyName = property.key.assertString("job environment key");
    if (property.key.isExpression || property.value.isExpression) {
      continue;
    }
    switch (propertyName.value) {
      case "name":
        result.name = property.value.assertScalar("job environment name key");
        break;
      case "url":
        result.url = property.value;
        break;
      case "deployment": {
        const deploymentValue = property.value.assertBoolean("job environment deployment");
        if (deploymentValue.value === false) {
          result.skipDeployment = true;
        }
        break;
      }
    }
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/job/runs-on.js
function convertRunsOn(context, token) {
  const labels = convertRunsOnLabels(token);
  if (!isMapping(token)) {
    return {
      labels,
      group: ""
    };
  }
  let group = "";
  for (const item of token) {
    const key = item.key.assertString("job runs-on property name");
    switch (key.value) {
      case "group": {
        if (item.value.isExpression) {
          continue;
        }
        const groupName = item.value.assertString("job runs-on group name").value;
        const names = groupName.split("/");
        switch (names.length) {
          case 1: {
            group = groupName;
            break;
          }
          case 2: {
            if (!["org", "organization", "ent", "enterprise"].includes(names[0])) {
              context.error(item.value, `Invalid runs-on group name '${groupName}. Please use 'organization/' or 'enterprise/' prefix to target a single runner group.'`);
              continue;
            }
            if (!names[1]) {
              context.error(item.value, `Invalid runs-on group name '${groupName}'.`);
              continue;
            }
            group = groupName;
            break;
          }
          default: {
            context.error(item.value, `Invalid runs-on group name '${groupName}. Please use 'organization/' or 'enterprise/' prefix to target a single runner group.'`);
            break;
          }
        }
        break;
      }
      case "labels": {
        const mapLabels = convertRunsOnLabels(item.value);
        for (const label of mapLabels) {
          labels.add(label);
        }
        break;
      }
    }
  }
  return {
    labels,
    group
  };
}
function convertRunsOnLabels(token) {
  const labels = /* @__PURE__ */ new Set();
  if (token.isExpression) {
    return labels;
  }
  if (isString(token)) {
    labels.add(token.value);
    return labels;
  }
  if (isSequence(token)) {
    for (const item of token) {
      if (item.isExpression) {
        continue;
      }
      const label = item.assertString("job runs-on label sequence item");
      labels.add(label.value);
    }
  }
  return labels;
}

// node_modules/@actions/workflow-parser/dist/model/type-guards.js
function isActionStep(step) {
  return step.uses !== void 0;
}
function isReusableWorkflowJob(job) {
  return job.type === "reusableWorkflowJob";
}

// node_modules/@actions/workflow-parser/dist/model/converter/steps.js
function convertSteps(context, steps) {
  if (!isSequence(steps)) {
    context.error(steps, "Invalid format for steps");
    return [];
  }
  const idBuilder = new IdBuilder();
  const knownStepIds = /* @__PURE__ */ new Set();
  const result = [];
  for (const item of steps) {
    const step = handleTemplateTokenErrors(steps, context, void 0, () => convertStep(context, idBuilder, knownStepIds, item));
    if (step) {
      result.push(step);
    }
  }
  for (const step of result) {
    if (step.id) {
      continue;
    }
    let id = "";
    if (isActionStep(step)) {
      id = createActionStepId(step);
    } else if ("wait" in step) {
      id = "wait";
    } else if ("wait-all" in step) {
      id = "wait-all";
    } else if ("cancel" in step) {
      id = "cancel";
    } else if ("parallel" in step) {
      id = "parallel";
    }
    if (!id) {
      id = "run";
    }
    idBuilder.appendSegment(`__${id}`);
    step.id = idBuilder.build();
  }
  return result;
}
function convertStep(context, idBuilder, knownStepIds, step) {
  const mapping = step.assertMapping("steps item");
  let run;
  let id;
  let name;
  let uses;
  let background;
  let wait;
  let waitAll;
  let cancel;
  let parallel;
  let continueOnError;
  let env;
  let ifCondition;
  for (const item of mapping) {
    const key = item.key.assertString("steps item key");
    switch (key.value) {
      case "id":
        id = item.value.assertString("steps item id");
        if (id) {
          const error = idBuilder.tryAddKnownId(id.value);
          if (error) {
            context.error(id, error);
          } else {
            knownStepIds.add(id.value);
          }
        }
        break;
      case "name":
        name = item.value.assertScalar("steps item name");
        break;
      case "run":
        run = item.value.assertScalar("steps item run");
        break;
      case "uses":
        uses = item.value.assertString("steps item uses");
        break;
      case "background":
        background = item.value.assertBoolean("steps item background").value;
        break;
      case "wait":
        wait = convertWaitTargets(context, knownStepIds, item.value, id);
        break;
      case "wait-all":
        waitAll = convertWaitAllValue(context, item.value);
        break;
      case "cancel":
        cancel = item.value.assertString("steps item cancel");
        validateTargetStepId(context, knownStepIds, cancel, id);
        break;
      case "parallel":
        parallel = item.value;
        break;
      case "env":
        env = item.value.assertMapping("step env");
        break;
      case "if":
        ifCondition = convertToIfCondition(context, item.value);
        break;
      case "continue-on-error":
        if (!item.value.isExpression) {
          continueOnError = item.value.assertBoolean("steps item continue-on-error").value;
        } else {
          continueOnError = item.value.assertScalar("steps item continue-on-error");
        }
    }
  }
  if (run) {
    return {
      id: id?.value || "",
      name,
      if: ifCondition || new BasicExpressionToken(void 0, void 0, "success()", void 0, void 0, void 0),
      "continue-on-error": continueOnError,
      env,
      run,
      background
    };
  }
  if (uses) {
    return {
      id: id?.value || "",
      name,
      if: ifCondition || new BasicExpressionToken(void 0, void 0, "success()", void 0, void 0, void 0),
      "continue-on-error": continueOnError,
      env,
      uses,
      background
    };
  }
  if (wait) {
    return {
      id: id?.value || "",
      name: name || createSyntheticStepName("Wait"),
      "continue-on-error": continueOnError,
      wait
    };
  }
  if (waitAll !== void 0) {
    return {
      id: id?.value || "",
      name: name || createSyntheticStepName("Wait for all"),
      "continue-on-error": continueOnError,
      "wait-all": waitAll
    };
  }
  if (cancel) {
    return {
      id: id?.value || "",
      name: name || createSyntheticStepName("Cancel"),
      "continue-on-error": continueOnError,
      cancel
    };
  }
  if (parallel) {
    const parallelSteps = convertSteps(context, parallel);
    for (const ps of parallelSteps) {
      if ("background" in ps && ps.background !== void 0) {
        context.error(step, "'background' is not allowed inside a parallel block. Steps in a parallel block are automatically run as background steps.");
      }
      if ("wait" in ps) {
        context.error(step, "'wait' is not allowed inside a parallel block.");
      }
      if ("wait-all" in ps) {
        context.error(step, "'wait-all' is not allowed inside a parallel block.");
      }
      if ("cancel" in ps) {
        context.error(step, "'cancel' is not allowed inside a parallel block.");
      }
      if ("parallel" in ps) {
        context.error(step, "Nested 'parallel' blocks are not allowed.");
      }
    }
    return {
      id: id?.value || "",
      name: name || createSyntheticStepName("Parallel group"),
      parallel: parallelSteps
    };
  }
  context.error(step, context.state.featureFlags?.isEnabled("allowBackgroundSteps") ? "Expected one of uses, run, wait, wait-all, cancel, or parallel to be defined" : "Expected one of uses or run to be defined");
}
function createActionStepId(step) {
  const uses = step.uses.value;
  if (uses.startsWith("docker://")) {
    return uses.substring("docker://".length);
  }
  if (uses.startsWith("./") || uses.startsWith(".\\")) {
    return "self";
  }
  if (uses.startsWith("$/")) {
    return "self";
  }
  const segments = uses.split("@");
  if (segments.length != 2) {
    return "";
  }
  const pathSegments = segments[0].split(/[\\/]/).filter((s) => s.length > 0);
  const gitRef = segments[1];
  if (pathSegments.length >= 2 && pathSegments[0] && pathSegments[1] && gitRef) {
    return `${pathSegments[0]}/${pathSegments[1]}`;
  }
  return "";
}
function createSyntheticStepName(value) {
  return new StringToken(void 0, void 0, value, void 0, void 0, void 0);
}
function convertWaitTargets(context, knownStepIds, token, ownStepId) {
  if (token instanceof StringToken) {
    validateTargetStepId(context, knownStepIds, token, ownStepId);
    return [token];
  }
  const sequence = token.assertSequence("steps item wait");
  const targets = [];
  for (let i = 0; i < sequence.count; i++) {
    const target = sequence.get(i).assertString("steps item wait item");
    validateTargetStepId(context, knownStepIds, target, ownStepId);
    targets.push(target);
  }
  return targets;
}
function convertWaitAllValue(context, token) {
  if (token instanceof NullToken) {
    return true;
  }
  const value = token.assertBoolean("steps item wait-all").value;
  if (!value) {
    context.error(token, "The value of 'wait-all' must be true or omitted");
  }
  return true;
}
function validateTargetStepId(context, knownStepIds, target, ownStepId) {
  if (target.value.startsWith("__")) {
    context.error(target, `The identifier '${target.value}' is invalid. IDs starting with '__' are reserved.`);
  } else if (ownStepId && target.value.toLowerCase() === ownStepId.value.toLowerCase()) {
    context.error(target, `Step '${ownStepId.value}' cannot reference itself`);
  } else if (!knownStepIds.has(target.value)) {
    context.error(target, `Step references unknown step ID '${target.value}'`);
  }
}

// node_modules/@actions/workflow-parser/dist/model/converter/job.js
function convertJob(context, jobKey, token) {
  const error = new IdBuilder().tryAddKnownId(jobKey.value);
  if (error) {
    context.error(jobKey, error);
  }
  let concurrency, container, env, environment, ifCondition, name, outputs, runsOn, services, strategy, snapshot;
  let needs = void 0;
  let steps = [];
  let workflowJobRef;
  let workflowJobInputs;
  let inheritSecrets = false;
  let workflowJobSecrets;
  for (const item of token) {
    const propertyName = item.key.assertString("job property name");
    switch (propertyName.value) {
      case "concurrency":
        handleTemplateTokenErrors(item.value, context, void 0, () => convertConcurrency(context, item.value));
        concurrency = item.value;
        break;
      case "container":
        convertToJobContainer(context, item.value);
        container = item.value;
        break;
      case "env":
        handleTemplateTokenErrors(item.value, context, void 0, () => {
          env = item.value.assertMapping("job env");
        });
        break;
      case "environment":
        handleTemplateTokenErrors(item.value, context, void 0, () => convertToActionsEnvironmentRef(context, item.value));
        environment = item.value;
        break;
      case "if":
        ifCondition = convertToIfCondition(context, item.value);
        break;
      case "name":
        name = item.value.assertScalar("job name");
        break;
      case "needs": {
        needs = [];
        if (isString(item.value)) {
          const jobNeeds = item.value.assertString("job needs id");
          needs.push(jobNeeds);
        }
        if (isSequence(item.value)) {
          for (const seqItem of item.value) {
            const jobNeeds = seqItem.assertString("job needs id");
            needs.push(jobNeeds);
          }
        }
        break;
      }
      case "outputs":
        handleTemplateTokenErrors(item.value, context, void 0, () => {
          outputs = item.value.assertMapping("job outputs");
        });
        break;
      case "runs-on":
        handleTemplateTokenErrors(item.value, context, void 0, () => convertRunsOn(context, item.value));
        runsOn = item.value;
        break;
      case "services":
        convertToJobServices(context, item.value);
        services = item.value;
        break;
      case "snapshot":
        snapshot = item.value;
        break;
      case "steps":
        steps = convertSteps(context, item.value);
        break;
      case "strategy":
        strategy = item.value;
        break;
      case "uses":
        workflowJobRef = item.value.assertString("job uses value");
        break;
      case "with":
        handleTemplateTokenErrors(item.value, context, void 0, () => {
          workflowJobInputs = item.value.assertMapping("uses-with value");
        });
        break;
      case "secrets":
        if (isString(item.value) && item.value.value === "inherit") {
          inheritSecrets = true;
        } else {
          handleTemplateTokenErrors(item.value, context, void 0, () => {
            workflowJobSecrets = item.value.assertMapping("uses-secrets value");
          });
        }
        break;
    }
  }
  if (workflowJobRef !== void 0) {
    return {
      type: "reusableWorkflowJob",
      id: jobKey,
      name: jobName(name, jobKey),
      needs: needs || [],
      if: ifCondition || new BasicExpressionToken(void 0, void 0, "success()", void 0, void 0, void 0),
      ref: workflowJobRef,
      "input-definitions": void 0,
      "input-values": workflowJobInputs,
      "secret-definitions": void 0,
      "secret-values": workflowJobSecrets,
      "inherit-secrets": inheritSecrets || void 0,
      outputs: void 0,
      concurrency,
      strategy
    };
  } else {
    return {
      type: "job",
      id: jobKey,
      name: jobName(name, jobKey),
      needs,
      if: ifCondition || new BasicExpressionToken(void 0, void 0, "success()", void 0, void 0, void 0),
      env,
      concurrency,
      environment,
      strategy,
      "runs-on": runsOn,
      container,
      services,
      outputs,
      steps,
      snapshot
    };
  }
}
function jobName(name, jobKey) {
  if (name === void 0) {
    return jobKey;
  }
  if (isString(name) && name.value === "") {
    return jobKey;
  }
  return name;
}

// node_modules/@actions/workflow-parser/dist/model/converter/jobs.js
function convertJobs(context, token) {
  if (isMapping(token)) {
    const result = [];
    const jobsWithSatisfiedNeeds = [];
    const alljobsWithUnsatisfiedNeeds = [];
    for (const item of token) {
      const jobKey = item.key.assertString("job name");
      const jobDef = item.value.assertMapping(`job ${jobKey.value}`);
      const job = handleTemplateTokenErrors(token, context, void 0, () => convertJob(context, jobKey, jobDef));
      if (job) {
        result.push(job);
        const node = {
          name: job.id.value,
          needs: Object.assign([], job.needs)
        };
        if (node.needs.length > 0) {
          alljobsWithUnsatisfiedNeeds.push(node);
        } else {
          jobsWithSatisfiedNeeds.push(node);
        }
      }
    }
    validateNeeds(token, context, result, jobsWithSatisfiedNeeds, alljobsWithUnsatisfiedNeeds);
    return result;
  }
  context.error(token, "Invalid format for jobs");
  return [];
}
function validateNeeds(token, context, result, jobsWithSatisfiedNeeds, alljobsWithUnsatisfiedNeeds) {
  if (jobsWithSatisfiedNeeds.length == 0) {
    context.error(token, "The workflow must contain at least one job with no dependencies.");
    return;
  }
  while (jobsWithSatisfiedNeeds.length > 0) {
    const currentJob = jobsWithSatisfiedNeeds.shift();
    if (currentJob == void 0) {
      break;
    }
    for (let i = alljobsWithUnsatisfiedNeeds.length - 1; i >= 0; i--) {
      const unsatisfiedJob = alljobsWithUnsatisfiedNeeds[i];
      for (let j = unsatisfiedJob.needs.length - 1; j >= 0; j--) {
        const need = unsatisfiedJob.needs[j];
        if (need.value == currentJob.name) {
          unsatisfiedJob.needs.splice(j, 1);
          if (unsatisfiedJob.needs.length == 0) {
            jobsWithSatisfiedNeeds.push(unsatisfiedJob);
            alljobsWithUnsatisfiedNeeds.splice(i, 1);
          }
        }
      }
    }
  }
  if (alljobsWithUnsatisfiedNeeds.length > 0) {
    const jobNames = result.map((x) => x.id.value);
    for (const unsatisfiedJob of alljobsWithUnsatisfiedNeeds) {
      for (const need of unsatisfiedJob.needs) {
        if (jobNames.includes(need.value)) {
          context.error(need, `Job '${unsatisfiedJob.name}' depends on job '${need.value}' which creates a cycle in the dependency graph.`);
        } else {
          context.error(need, `Job '${unsatisfiedJob.name}' depends on unknown job '${need.value}'.`);
        }
      }
    }
  }
}

// node_modules/@actions/workflow-parser/dist/model/converter/job/inputs.js
function convertWorkflowJobInputs(context, job) {
  const inputDefinitions = createTokenMap(job["input-definitions"]?.assertMapping("workflow job input definitions"), "inputs");
  const inputValues = createTokenMap(job["input-values"]?.assertMapping("workflow job input values"), "with");
  if (inputDefinitions !== void 0) {
    for (const [, [name, value]] of inputDefinitions) {
      const inputSpec = createTokenMap(value.assertMapping(`input ${name}`), `input ${name} key`);
      const inputTypeToken = inputSpec?.get("type")?.[1];
      if (!inputTypeToken) {
        continue;
      }
      const inputSet = inputValues !== void 0 && inputValues.has(name.toLowerCase());
      const required = inputSpec.get("required")?.[1].assertBoolean(`input ${name} required`).value;
      if (required && !inputSet) {
        context.error(job.ref, `Input ${name} is required, but not provided while calling.`);
      }
    }
  }
  if (inputValues !== void 0) {
    for (const [, [name, value]] of inputValues) {
      if (!inputDefinitions?.has(name.toLowerCase())) {
        context.error(value, `Invalid input, ${name} is not defined in the referenced workflow.`);
      }
    }
  }
}
function createTokenMap(mapping, description) {
  if (!mapping) {
    return void 0;
  }
  const result = /* @__PURE__ */ new Map();
  for (const item of mapping) {
    const name = item.key.assertString(`${description} key`);
    result.set(name.value.toLowerCase(), [name.value, item.value]);
  }
  return result;
}

// node_modules/@actions/workflow-parser/dist/model/converter/job/secrets.js
function convertWorkflowJobSecrets(context, job) {
  if (job["inherit-secrets"]) {
    return;
  }
  const secretDefinitions = createTokenMap(job["secret-definitions"]?.assertMapping("workflow job secret definitions"), "secrets");
  const secretValues = createTokenMap(job["secret-values"]?.assertMapping("workflow job secret values"), "secrets");
  if (secretDefinitions !== void 0) {
    for (const [, [name, value]] of secretDefinitions) {
      if (value instanceof NullToken) {
        continue;
      }
      const secretSpec = createTokenMap(value.assertMapping(`secret ${name}`), `secret ${name} key`);
      const required = secretSpec?.get("required")?.[1].assertBoolean(`secret ${name} required`).value;
      if (required) {
        if (secretValues == void 0 || !secretValues.has(name.toLowerCase())) {
          context.error(job.ref, `Secret ${name} is required, but not provided while calling.`);
        }
      }
    }
  }
  if (secretValues !== void 0) {
    for (const [, [name, value]] of secretValues) {
      if (!secretDefinitions?.has(name.toLowerCase())) {
        context.error(value, `Invalid secret, ${name} is not defined in the referenced workflow.`);
      }
    }
  }
}

// node_modules/@actions/workflow-parser/dist/model/converter/referencedWorkflow.js
function convertReferencedWorkflow(context, referencedWorkflow, job) {
  const mapping = referencedWorkflow.assertMapping("root");
  const tokenForErrors = job.ref;
  for (const pair of mapping) {
    const key = pair.key.assertString("root key");
    switch (key.value) {
      case "on": {
        handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertReferencedWorkflowOn(context, pair.value, job));
        break;
      }
      case "jobs": {
        job.jobs = handleTemplateTokenErrors(tokenForErrors, context, [], () => convertJobs(context, pair.value));
        break;
      }
    }
  }
}
function convertReferencedWorkflowOn(context, on, job) {
  const tokenForErrors = job.ref;
  switch (on.templateTokenType) {
    case TokenType.String: {
      const event = on.assertString("Reference workflow on value").value;
      if (event === "workflow_call") {
        handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobInputs(context, job));
        handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobSecrets(context, job));
        return;
      }
      break;
    }
    case TokenType.Sequence: {
      const events = on.assertSequence("Reference workflow on value");
      for (const eventToken of events) {
        const event = eventToken.assertString(`Reference workflow on value ${eventToken}`).value;
        if (event === "workflow_call") {
          handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobInputs(context, job));
          handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobSecrets(context, job));
          return;
        }
      }
      break;
    }
    case TokenType.Mapping: {
      const eventMapping = on.assertMapping("Reference workflow on value");
      for (const pair of eventMapping) {
        const event = pair.key.assertString(`Reference workflow on value ${pair.key}`).value;
        if (event !== "workflow_call") {
          continue;
        }
        if (pair.value.templateTokenType === TokenType.Null) {
          handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobInputs(context, job));
          handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobSecrets(context, job));
          return;
        }
        const definitions = pair.value.assertMapping(`Reference workflow on value ${pair.key}`);
        for (const definition of definitions) {
          const definitionKey = definition.key.assertString(`on-workflow_call-${definition.key}`).value;
          switch (definitionKey) {
            case "inputs":
              job["input-definitions"] = definition.value.assertMapping(`on-workflow_call-${definition.key}`);
              break;
            case "outputs":
              job.outputs = definition.value.assertMapping(`on-workflow_call-${definition.key}`);
              break;
            case "secrets":
              job["secret-definitions"] = definition.value.assertMapping(`on-workflow_call-${definition.key}`);
              break;
          }
        }
        handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobInputs(context, job));
        handleTemplateTokenErrors(tokenForErrors, context, void 0, () => convertWorkflowJobSecrets(context, job));
        return;
      }
      break;
    }
  }
  context.error(tokenForErrors, "workflow_call key is not defined in the referenced workflow.");
}

// node_modules/@actions/workflow-parser/dist/model/convert.js
var ErrorPolicy;
(function(ErrorPolicy2) {
  ErrorPolicy2[ErrorPolicy2["ReturnErrorsOnly"] = 0] = "ReturnErrorsOnly";
  ErrorPolicy2[ErrorPolicy2["TryConversion"] = 1] = "TryConversion";
})(ErrorPolicy || (ErrorPolicy = {}));
var defaultOptions = {
  maxReusableWorkflowDepth: 4,
  fetchReusableWorkflowDepth: 0,
  errorPolicy: ErrorPolicy.ReturnErrorsOnly,
  featureFlags: new FeatureFlags()
};
async function convertWorkflowTemplate(context, root, fileProvider, options = defaultOptions) {
  const result = {};
  const opts = getOptionsWithDefaults(options);
  context.state.featureFlags = opts.featureFlags;
  if (context.errors.getErrors().length > 0 && opts.errorPolicy === ErrorPolicy.ReturnErrorsOnly) {
    result.errors = context.errors.getErrors().map((x) => ({
      Message: x.message
    }));
    return result;
  }
  if (fileProvider === void 0 && opts.fetchReusableWorkflowDepth > 0) {
    context.error(root, new Error("A file provider is required to fetch reusable workflows"));
  }
  try {
    const rootMapping = root.assertMapping("root");
    for (const item of rootMapping) {
      const key = item.key.assertString("root key");
      switch (key.value) {
        case "on":
          result.events = handleTemplateTokenErrors(root, context, {}, () => convertOn(context, item.value));
          break;
        case "jobs":
          result.jobs = handleTemplateTokenErrors(root, context, [], () => convertJobs(context, item.value));
          break;
        case "concurrency":
          handleTemplateTokenErrors(root, context, {}, () => convertConcurrency(context, item.value));
          result.concurrency = item.value;
          break;
        case "env":
          result.env = item.value;
          break;
      }
    }
    for (const job of result.jobs || []) {
      if (isReusableWorkflowJob(job)) {
        if (opts.maxReusableWorkflowDepth === 0) {
          context.error(job.ref, new Error("Reusable workflows are not allowed"));
          continue;
        }
        if (opts.fetchReusableWorkflowDepth === 0 || fileProvider === void 0) {
          continue;
        }
        try {
          const file = await fileProvider.getFileContent(parseFileReference(job.ref.value));
          const workflow = parseWorkflow(file, context);
          if (!workflow.value) {
            continue;
          }
          convertReferencedWorkflow(context, workflow.value, job);
        } catch {
          context.error(job.ref, new Error("Unable to find reusable workflow"));
        }
      }
    }
  } catch (err) {
    if (err instanceof TemplateTokenError) {
      context.error(err.token, err);
    } else {
      context.error(root, err);
    }
  } finally {
    if (context.errors.getErrors().length > 0) {
      result.errors = context.errors.getErrors().map((x) => ({
        Message: x.message
      }));
    }
  }
  return result;
}
function getOptionsWithDefaults(options) {
  return {
    maxReusableWorkflowDepth: options.maxReusableWorkflowDepth !== void 0 ? options.maxReusableWorkflowDepth : defaultOptions.maxReusableWorkflowDepth,
    fetchReusableWorkflowDepth: options.fetchReusableWorkflowDepth !== void 0 ? options.fetchReusableWorkflowDepth : defaultOptions.fetchReusableWorkflowDepth,
    errorPolicy: options.errorPolicy !== void 0 ? options.errorPolicy : defaultOptions.errorPolicy,
    featureFlags: options.featureFlags ?? defaultOptions.featureFlags
  };
}

// src/engine/workflow.ts
var SUCCESS_WRAPPER = /^success\(\) && \((.*)\)$/s;
async function parseWorkflowFile(content, fileName = "workflow.yml") {
  const result = parseWorkflow({ name: fileName, content }, new NoOperationTraceWriter());
  const errors = result.context.errors.getErrors().map((e) => e.message);
  if (!result.value) return { name: void 0, events: {}, jobs: [], errors: errors.length ? errors : ["The file could not be parsed as a workflow."] };
  let template;
  try {
    template = await convertWorkflowTemplate(result.context, result.value, void 0, { errorPolicy: ErrorPolicy.TryConversion });
  } catch (e) {
    return { name: void 0, events: {}, jobs: [], errors: [...errors, e.message] };
  }
  for (const e of template.errors ?? []) errors.push(e.Message);
  return {
    name: readName(content),
    events: template.events ?? {},
    jobs: (template.jobs ?? []).map(toJob),
    errors: [...new Set(errors)]
  };
}
function toJob(job) {
  const expr = job.if?.expression ?? "success()";
  const m = SUCCESS_WRAPPER.exec(expr);
  const ifSource = job.if?.source ?? (m ? m[1] : expr === "success()" ? void 0 : expr);
  const steps = job.type === "job" ? job.steps.map(toStep) : [];
  const runsOn = job.type === "job" && job["runs-on"] ? tokenText(job["runs-on"]) : void 0;
  return {
    id: job.id.value,
    name: job.name ? tokenText(job.name) : void 0,
    needs: (job.needs ?? []).map((n) => n.value),
    if: expr,
    ifSource,
    line: job.id.line,
    strategy: job.strategy,
    outputs: job.outputs ? Object.fromEntries([...job.outputs].map((p) => [tokenText(p.key), sourceText(p.value)])) : void 0,
    runsOn,
    reusable: job.type === "reusableWorkflowJob",
    steps
  };
}
function toStep(step, index) {
  const anyStep = step;
  const kind = "run" in anyStep ? "run" : "uses" in anyStep ? "uses" : "other";
  const runSource = kind === "run" ? sourceText(anyStep["run"]) : "";
  const summary = kind === "run" ? runSource !== tokenText(anyStep["run"]) ? runSource.split("\n").map((l) => l.trim()).find(Boolean) ?? "" : runSource.split("\n")[0] ?? "" : kind === "uses" ? tokenText(anyStep["uses"]) : Object.keys(anyStep).filter((k) => !["id", "name", "if", "continue-on-error"].includes(k)).join(", ");
  const ifToken = anyStep["if"];
  return {
    id: step.id || `step-${index + 1}`,
    name: step.name ? tokenText(step.name) : void 0,
    if: ifToken?.expression,
    kind,
    summary,
    line: ifToken?.line,
    run: kind === "run" ? runSource : void 0
  };
}
function sourceText(token) {
  const t = token;
  return typeof t.expression === "string" && typeof t.source === "string" ? t.source : tokenText(token);
}
function tokenText(token) {
  if (!token) return "";
  const t = token;
  if (typeof t.value === "string") return t.value;
  if (typeof t.value === "number" || typeof t.value === "boolean") return String(t.value);
  if (typeof t.expression === "string") return "${{ " + t.expression + " }}";
  return t.toString();
}
function readName(content) {
  const m = /^name:\s*(.+?)\s*$/m.exec(content);
  return m ? m[1]?.replace(/^["']|["']$/g, "") : void 0;
}

// src/engine/filters.ts
var DEFAULT_TYPES = {
  pull_request: ["opened", "synchronize", "reopened"],
  pull_request_target: ["opened", "synchronize", "reopened"]
};
var DEFAULT_BRANCH_ONLY = /* @__PURE__ */ new Set(["branch_protection_rule", "check_run", "check_suite", "delete", "discussion", "discussion_comment", "fork", "gollum", "issue_comment", "issues", "label", "milestone", "page_build", "public", "registry_package", "repository_dispatch", "schedule", "status", "watch", "workflow_dispatch", "workflow_run"]);
var FILTERS_BY_EVENT = {
  push: ["branches", "branches-ignore", "tags", "tags-ignore", "paths", "paths-ignore"],
  pull_request: ["branches", "branches-ignore", "paths", "paths-ignore", "types"],
  pull_request_target: ["branches", "branches-ignore", "paths", "paths-ignore", "types"],
  workflow_run: ["branches", "branches-ignore", "workflows", "types"]
};
function validateTriggers(workflow) {
  const problems = [];
  for (const [event, raw] of Object.entries(workflow.events)) {
    const cfg = raw ?? {};
    for (const [a, b] of [["branches", "branches-ignore"], ["tags", "tags-ignore"], ["paths", "paths-ignore"]]) {
      if (cfg[a] !== void 0 && cfg[b] !== void 0) problems.push(`on.${event}: ${a} and ${b} cannot both be used for the same event (docs: workflow syntax; verified: GitHub creates a failed run with no jobs).`);
    }
  }
  return problems;
}
function triggerWarnings(workflow) {
  const warnings = [];
  for (const [event, raw] of Object.entries(workflow.events)) {
    const cfg = raw ?? {};
    for (const key of ["branches", "tags", "paths"]) {
      const list = asStrings(cfg[key]);
      if (list.length && list.every((p) => p.startsWith("!"))) warnings.push(`on.${event}.${key} has only negative patterns: nothing can match, and GitHub creates no run at all (verified with a real push). Add a pattern without ! or use ${key}-ignore.`);
    }
    const allowed = FILTERS_BY_EVENT[event];
    for (const key of Object.keys(cfg)) {
      if (["branches", "branches-ignore", "tags", "tags-ignore", "paths", "paths-ignore"].includes(key) && !(allowed ?? []).includes(key)) warnings.push(`on.${event}.${key}: this filter is not documented for ${event}; not verified what GitHub does with it.`);
    }
  }
  return warnings;
}
function compilePattern(pattern) {
  let re = "";
  let i = 0;
  const src = pattern.startsWith("!") ? pattern.slice(1) : pattern;
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (c === "\\" && next !== void 0) {
      re += escapeRe(next);
      i += 2;
      continue;
    }
    if (c === "*") {
      if (next === "*") {
        if (src[i + 2] === "/") {
          re += "(?:.*/)?";
          i += 3;
          continue;
        }
        re += ".*";
        i += 2;
        continue;
      }
      re += "[^/]*";
      i += 1;
      continue;
    }
    if (c === "?") {
      re = makePrecedingOptional(re);
      i += 1;
      continue;
    }
    if (c === "+") {
      re += "+";
      i += 1;
      continue;
    }
    if (c === "[") {
      const end = src.indexOf("]", i + 1);
      if (end > i) {
        let cls = src.slice(i + 1, end);
        if (cls.startsWith("!")) cls = "^" + cls.slice(1);
        re += `[${cls.replace(/\\/g, "\\\\")}]`;
        i = end + 1;
        continue;
      }
    }
    re += escapeRe(c);
    i += 1;
  }
  return new RegExp(`^(?:${re})$`);
}
function makePrecedingOptional(re) {
  if (re.endsWith("]")) {
    const start = re.lastIndexOf("[");
    return re.slice(0, start) + `(?:${re.slice(start)})?`;
  }
  if (re.endsWith(".*") || re.endsWith("[^/]*")) return re;
  const m = /(\\.|[^\\])$/.exec(re);
  if (!m) return re;
  const atom = m[0];
  return re.slice(0, re.length - atom.length) + `(?:${atom})?`;
}
function escapeRe(c) {
  return /[.*+?^${}()|[\]\\/]/.test(c) ? "\\" + c : c;
}
function matchPatterns(patterns, name) {
  let matched = false;
  const trace = [];
  const hasPositive = patterns.some((p) => !p.startsWith("!"));
  if (!hasPositive && patterns.length) {
    trace.push("only negative patterns: nothing can match (the docs require at least one pattern without !; verified: GitHub creates no run at all)");
  }
  for (const p of patterns) {
    const negative = p.startsWith("!");
    const hit = compilePattern(p).test(name);
    if (negative && hit) {
      matched = false;
      trace.push(`${p} excludes "${name}"`);
    } else if (!negative && hit) {
      matched = true;
      trace.push(`${p} matches "${name}"`);
    } else trace.push(`${p} does not match "${name}"`);
  }
  return { matched, trace };
}
function matchPaths(patterns, files, ignore) {
  const trace = [];
  if (!files.length) {
    trace.push(ignore ? "no changed files known: paths-ignore cannot exclude the run" : "no changed files known: paths filter cannot match (GitHub also skips the run when no file matches)");
    return { matched: ignore, trace };
  }
  let any = false;
  if (!ignore && patterns.length && patterns.every((p) => p.startsWith("!"))) trace.push("only negative patterns: nothing can match (verified: GitHub creates no run at all for this workflow)");
  for (const f of files) {
    const r = matchPatterns(patterns, f);
    const included = ignore ? !r.matched : r.matched;
    if (included) {
      any = true;
      trace.push(ignore ? `"${f}" is not ignored \u2192 runs` : `"${f}" matches \u2192 runs`);
    } else trace.push(ignore ? `"${f}" is ignored` : `"${f}" matches no paths pattern`);
  }
  return { matched: any, trace };
}
function decideTrigger(workflow, input) {
  const cfg = workflow.events[input.event];
  if (cfg === void 0) {
    return { matched: false, reasons: [`The workflow does not listen to ${input.event} (on: ${Object.keys(workflow.events).join(", ") || "nothing"}).`] };
  }
  const reasons = [`on: ${input.event} is present.`];
  const c = cfg ?? {};
  const types = asStrings(c["types"]);
  const defaults = DEFAULT_TYPES[input.event];
  if (input.action && (types.length || defaults)) {
    const allowed = types.length ? types : defaults ?? [];
    if (!allowed.includes(input.action)) {
      reasons.push(`activity type "${input.action}" is not in ${types.length ? "types: [" + allowed.join(", ") + "]" : "the default types (" + allowed.join(", ") + "); other types need an explicit types: list"}.`);
      return { matched: false, reasons };
    }
    reasons.push(`activity type "${input.action}" is ${types.length ? "listed in types" : "one of the default types"}.`);
  } else if (input.action) {
    reasons.push(`activity type "${input.action}": types is omitted, and for ${input.event} every activity type triggers the workflow by default.`);
  }
  const branches = asStrings(c["branches"]);
  const branchesIgnore = asStrings(c["branches-ignore"]);
  const tags = asStrings(c["tags"]);
  const tagsIgnore = asStrings(c["tags-ignore"]);
  const refName = input.event === "pull_request" || input.event === "pull_request_target" ? input.baseBranch : input.refName;
  const refType = input.event === "pull_request" || input.event === "pull_request_target" ? "branch" : input.refType ?? "branch";
  if (input.event === "push") {
    const hasBranchFilter = branches.length || branchesIgnore.length;
    const hasTagFilter = tags.length || tagsIgnore.length;
    if (refType === "tag") {
      if (hasBranchFilter && !hasTagFilter) {
        reasons.push("only branch filters are set, so tag pushes never run this workflow.");
        return { matched: false, reasons };
      }
      if (tags.length) {
        const r = matchPatterns(tags, refName ?? "");
        reasons.push(...r.trace.map((t) => `tags: ${t}`));
        if (!r.matched) return { matched: false, reasons };
      }
      if (tagsIgnore.length) {
        const r = matchPatterns(tagsIgnore, refName ?? "");
        reasons.push(...r.trace.map((t) => `tags-ignore: ${t}`));
        if (r.matched) {
          reasons.push("tag is ignored.");
          return { matched: false, reasons };
        }
      }
    } else {
      if (hasTagFilter && !hasBranchFilter) {
        reasons.push("only tag filters are set, so branch pushes never run this workflow.");
        return { matched: false, reasons };
      }
      if (branches.length) {
        const r = matchPatterns(branches, refName ?? "");
        reasons.push(...r.trace.map((t) => `branches: ${t}`));
        if (!r.matched) return { matched: false, reasons };
      }
      if (branchesIgnore.length) {
        const r = matchPatterns(branchesIgnore, refName ?? "");
        reasons.push(...r.trace.map((t) => `branches-ignore: ${t}`));
        if (r.matched) {
          reasons.push("branch is ignored.");
          return { matched: false, reasons };
        }
      }
    }
  } else if (refName && (branches.length || branchesIgnore.length)) {
    if (branches.length) {
      const r = matchPatterns(branches, refName);
      reasons.push(...r.trace.map((t) => `branches: ${t}`));
      if (!r.matched) return { matched: false, reasons };
    }
    if (branchesIgnore.length) {
      const r = matchPatterns(branchesIgnore, refName);
      reasons.push(...r.trace.map((t) => `branches-ignore: ${t}`));
      if (r.matched) return { matched: false, reasons };
    }
  }
  const paths = asStrings(c["paths"]);
  const pathsIgnore = asStrings(c["paths-ignore"]);
  if (paths.length || pathsIgnore.length) {
    if (refType === "tag" && input.event === "push") {
      reasons.push("paths filters are not evaluated for tag pushes.");
    } else {
      const files = input.changedFiles ?? [];
      if (paths.length) {
        const r = matchPaths(paths, files, false);
        reasons.push(...r.trace.map((t) => `paths: ${t}`));
        if (!r.matched) return { matched: false, reasons };
      }
      if (pathsIgnore.length) {
        const r = matchPaths(pathsIgnore, files, true);
        reasons.push(...r.trace.map((t) => `paths-ignore: ${t}`));
        if (!r.matched) return { matched: false, reasons };
      }
    }
  }
  return { matched: true, reasons };
}
function asStrings(v) {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") return [v];
  return [];
}

// src/engine/evaluate.ts
var CONTEXT_NAMES = ["github", "needs", "inputs", "vars", "secrets", "env", "matrix", "strategy", "runner", "job", "steps"];
var toData = (obj) => JSON.parse(JSON.stringify(obj ?? null), data_exports.reviver);
var bool = (b) => new data_exports.BooleanData(b);
function statusFunctions(opts) {
  const results = Object.values(opts.ancestors ?? opts.needs).map((n) => n.result);
  const cancelled = Boolean(opts.cancelled);
  const success = opts.stepStatus ? !cancelled && opts.stepStatus === "success" : !cancelled && results.every((r) => r === "success");
  const failure = opts.stepStatus ? opts.stepStatus === "failure" : results.some((r) => r === "failure");
  const defs = [
    { name: "success", minArgs: 0, maxArgs: 0, call: () => bool(success) },
    { name: "failure", minArgs: 0, maxArgs: 0, call: () => bool(failure) },
    { name: "cancelled", minArgs: 0, maxArgs: 0, call: () => bool(cancelled) },
    { name: "always", minArgs: 0, maxArgs: 0, call: () => bool(true) },
    { name: "hashFiles", minArgs: 1, maxArgs: 255, call: () => new data_exports.StringData("") }
  ];
  return new Map(defs.map((d) => [d.name, d]));
}
var TracingEvaluator = class extends Evaluator {
  trace = [];
  eval(n) {
    const v = super.eval(n);
    this.trace.push({ node: n, value: v });
    return v;
  }
};
function parseExpression(expression, functions) {
  const tokens = new Lexer(expression).lex().tokens;
  const infos = [...functions.values()].map(({ name, minArgs, maxArgs }) => ({ name, minArgs, maxArgs }));
  return new Parser(tokens, CONTEXT_NAMES, infos).parse();
}
function evaluateCondition(expression, github, opts) {
  const functions = statusFunctions(opts);
  let ast;
  try {
    ast = parseExpression(expression, functions);
  } catch (e) {
    return { ok: false, error: `Invalid expression: ${e.message}` };
  }
  const needsCtx = {};
  for (const [id, n] of Object.entries(opts.needs)) needsCtx[id] = { result: n.result, outputs: n.outputs ?? {} };
  const contexts = { github, needs: needsCtx, inputs: {}, vars: {}, secrets: {}, env: {}, matrix: {}, strategy: {}, runner: {}, job: {}, steps: {}, ...opts.contexts };
  const dict = new data_exports.Dictionary(...Object.entries(contexts).map(([key, value2]) => ({ key, value: toData(value2) })));
  const ev = new TracingEvaluator(ast, dict, functions);
  let value;
  try {
    value = ev.evaluate();
  } catch (e) {
    const msg = e instanceof ExpressionEvaluationError || e instanceof ExpressionError ? e.message : e.message;
    return { ok: false, error: `Evaluation failed: ${msg}` };
  }
  const subValues = ev.trace.filter((t) => !(t.node instanceof Literal)).map((t) => ({ text: exprText(t.node), value: displayValue(t.value), kind: kindStr(t.value.kind), depth: 0 }));
  const truthy2 = isTruthy(value);
  let reason = explain(ast, ev.trace, truthy2);
  const m = /^(success|failure|cancelled)\(\) is (true|false)$/.exec(reason);
  if (m) {
    const scope = opts.ancestors ?? opts.needs;
    const bad = Object.entries(scope).filter(([, n]) => n.result !== "success").map(([id, n]) => `${id}${id in opts.needs ? "" : " (upstream)"} ${n.result === "skipped" ? "was skipped" : n.result === "failure" ? "failed" : "was cancelled"}`);
    if (opts.stepStatus) {
      if (m[1] === "success") reason = m[2] === "true" ? "success() is true: no previous step of this job failed" : "success() is false: a previous step of this job failed";
      else if (m[1] === "failure") reason = m[2] === "true" ? "failure() is true: a previous step of this job failed" : "failure() is false: no previous step of this job failed (step-level status functions ignore needs)";
    } else if (m[1] === "success" && m[2] === "false") reason = opts.cancelled ? "success() is false because the run was cancelled" : bad.length ? `success() is false because ${bad.join(", ")}` : reason;
    else if (m[1] === "failure" && m[2] === "true") reason = `failure() is true because ${bad.filter((b) => b.endsWith("failed")).join(", ") || bad.join(", ")}`;
    else if (m[1] === "failure" && m[2] === "false") reason = Object.keys(scope).length ? "failure() is false: no job upstream failed" : "failure() is false: the job needs nothing that could have failed";
    else if (m[1] === "success" && m[2] === "true") reason = Object.keys(scope).length ? "success() is true: every job upstream succeeded" : "success() is true: the job needs nothing";
  }
  return { ok: true, truthy: truthy2, value: displayValue(value), kind: kindStr(value.kind), subValues, reason };
}
function isTruthy(v) {
  switch (v.kind) {
    case data_exports.Kind.Boolean:
      return v.value;
    case data_exports.Kind.Null:
      return false;
    case data_exports.Kind.Number:
      return v.number() !== 0;
    case data_exports.Kind.String:
      return v.coerceString() !== "";
    default:
      return true;
  }
}
function displayValue(v) {
  switch (v.kind) {
    case data_exports.Kind.String:
      return JSON.stringify(v.coerceString());
    case data_exports.Kind.Null:
      return "null";
    case data_exports.Kind.Boolean:
    case data_exports.Kind.Number:
      return v.coerceString();
    case data_exports.Kind.Array:
      return `[array of ${v.values().length}]`;
    default:
      return "{object}";
  }
}
function exprText(n) {
  if (n instanceof Literal) return n.token.lexeme;
  if (n instanceof ContextAccess) return n.name.lexeme;
  if (n instanceof IndexAccess) {
    const idx = n.index;
    if (idx instanceof Literal && idx.literal.kind === data_exports.Kind.String && /^[A-Za-z_][\w-]*$/.test(idx.literal.coerceString())) return `${exprText(n.expr)}.${idx.literal.coerceString()}`;
    if (idx.constructor.name === "Star") return `${exprText(n.expr)}.*`;
    return `${exprText(n.expr)}[${exprText(idx)}]`;
  }
  if (n instanceof FunctionCall) return `${n.functionName.lexeme}(${n.args.map(exprText).join(", ")})`;
  if (n instanceof Unary) return `${n.operator.lexeme}${exprText(n.expr)}`;
  if (n instanceof Binary) return `${exprText(n.left)} ${n.operator.lexeme} ${exprText(n.right)}`;
  if (n instanceof Logical) return n.args.map(exprText).join(` ${n.operator.lexeme} `);
  if (n instanceof Grouping) return `(${exprText(n.group)})`;
  return "\u2026";
}
function explain(root, trace, truthy2) {
  const valueOf = (n) => trace.find((t) => t.node === n)?.value;
  const isStatusCall = (n) => n instanceof FunctionCall && ["success", "failure", "cancelled", "always"].includes(n.functionName.lexeme.toLowerCase());
  let node = root;
  for (let guard = 0; guard < 50; guard++) {
    if (node instanceof Grouping) {
      node = node.group;
      continue;
    }
    if (node instanceof Logical) {
      const and = node.operator.lexeme === "&&";
      let hit;
      if (and && !truthy2) hit = node.args.find((a) => {
        const v2 = valueOf(a);
        return v2 ? !isTruthy(v2) : false;
      });
      else if (!and && truthy2) hit = node.args.find((a) => {
        const v2 = valueOf(a);
        return v2 ? isTruthy(v2) : false;
      });
      else if (and && truthy2) hit = [...node.args].reverse().find((a) => !isStatusCall(a)) ?? node.args[node.args.length - 1];
      if (hit && hit !== node) {
        node = hit;
        continue;
      }
    }
    break;
  }
  const v = valueOf(node);
  const text = exprText(node);
  const shown = v ? displayValue(v) : truthy2 ? "true" : "false";
  if (node instanceof Binary && v) {
    const sides = [node.left, node.right].filter((s) => !(s instanceof Literal)).map((s) => {
      const sv = valueOf(s);
      return `${exprText(s)} is ${sv ? displayValue(sv) : "?"}`;
    });
    const l = valueOf(node.left);
    const r = valueOf(node.right);
    let hint = "";
    if (l && r && (node.operator.lexeme === "==" || node.operator.lexeme === "!=") && l.kind !== r.kind) {
      hint = ` (loose equality: ${kindStr(l.kind).toLowerCase()} and ${kindStr(r.kind).toLowerCase()} are compared as numbers, null/false/'' count as 0)`;
    } else if (l && r && l.kind === data_exports.Kind.String && r.kind === data_exports.Kind.String && (node.operator.lexeme === "==" || node.operator.lexeme === "!=") && l.coerceString() !== r.coerceString() && l.coerceString().toLowerCase() === r.coerceString().toLowerCase()) {
      hint = " (string comparison is case-insensitive)";
    }
    return `${sides.join(", ")}${sides.length ? " \u2192 " : ""}${text} is ${displayValue(v)}${hint}`;
  }
  if (node instanceof FunctionCall && v && node.functionName.lexeme.toLowerCase() === "contains" && node.args.length === 2) {
    const a = valueOf(node.args[0]);
    return `${exprText(node.args[0])} is ${a ? displayValue(a) : "?"} \u2192 ${text} is ${displayValue(v)}`;
  }
  return `${text} is ${shown}`;
}

// src/engine/availability.ts
var AVAILABILITY = {
  "jobs.<job_id>.if": { contexts: ["github", "needs", "vars", "inputs"], functions: ["always", "cancelled", "success", "failure"] },
  "jobs.<job_id>.steps.if": { contexts: ["github", "needs", "strategy", "matrix", "job", "runner", "env", "vars", "steps", "inputs"], functions: ["always", "cancelled", "success", "failure", "hashFiles"] },
  "jobs.<job_id>.strategy": { contexts: ["github", "needs", "vars", "inputs"], functions: [] },
  "jobs.<job_id>.runs-on": { contexts: ["github", "needs", "strategy", "matrix", "vars", "inputs"], functions: [] },
  "jobs.<job_id>.env": { contexts: ["github", "needs", "strategy", "matrix", "vars", "secrets", "inputs"], functions: [] },
  "jobs.<job_id>.steps.env": { contexts: ["github", "needs", "strategy", "matrix", "job", "runner", "env", "vars", "secrets", "steps", "inputs"], functions: ["hashFiles"] }
};
var GENERAL_FUNCTIONS = /* @__PURE__ */ new Set(["contains", "startsWith", "endsWith", "format", "join", "toJSON", "fromJSON"]);
function collectNames(n, out) {
  if (n instanceof ContextAccess) out.contexts.add(n.name.lexeme);
  else if (n instanceof FunctionCall) {
    out.functions.add(n.functionName.lexeme);
    n.args.forEach((a) => collectNames(a, out));
  } else if (n instanceof IndexAccess) {
    collectNames(n.expr, out);
    collectNames(n.index, out);
  } else if (n instanceof Binary) {
    collectNames(n.left, out);
    collectNames(n.right, out);
  } else if (n instanceof Logical) n.args.forEach((a) => collectNames(a, out));
  else if (n instanceof Unary) collectNames(n.expr, out);
  else if (n instanceof Grouping) collectNames(n.group, out);
}
function checkAvailability(ast, key) {
  const names = { contexts: /* @__PURE__ */ new Set(), functions: /* @__PURE__ */ new Set() };
  collectNames(ast, names);
  const allowed = AVAILABILITY[key];
  const problems = [];
  for (const c of names.contexts) {
    if (!allowed.contexts.includes(c)) problems.push({ kind: "context", name: c, message: `The ${c} context is not available in ${key}; GitHub rejects the workflow file. Allowed here: ${allowed.contexts.join(", ")}.` });
  }
  for (const f of names.functions) {
    const lower = [...GENERAL_FUNCTIONS].some((g) => g.toLowerCase() === f.toLowerCase());
    if (lower) continue;
    if (!allowed.functions.some((g) => g.toLowerCase() === f.toLowerCase())) problems.push({ kind: "function", name: f, message: `${f}() is not available in ${key}; GitHub rejects the workflow file.${allowed.functions.length ? " Allowed here: " + allowed.functions.join(", ") + "." : ""}` });
  }
  return problems;
}

// src/engine/matrix.ts
var MAX_COMBINATIONS = 256;
function combinationKey(jobId, combination) {
  return `${jobId}.${combination.id}`;
}
function hasMatrix(strategy) {
  if (!strategy) return false;
  if (isBasicExpression(strategy)) return true;
  if (!isMapping(strategy)) return false;
  for (const pair of strategy) if (isBasicExpression(pair.key) || keyText(pair.key) === "matrix") return true;
  return false;
}
var StrategyError = class extends Error {
};
var STRATEGY_CONTEXTS = ["github", "needs", "vars", "inputs"];
function expandMatrix(job, ctx) {
  const strategy = job.strategy;
  if (!strategy || !hasMatrix(strategy)) return { kind: "none" };
  const reads = uniqueRefs(collectOutputRefs(strategy)).map((r) => readOutput(r, ctx));
  const missing2 = reads.filter((r) => r.source === "unknown");
  if (missing2.length) {
    const names = missing2.map((r) => `needs.${r.job}.outputs.${r.output}`);
    return { kind: "unknown", reads, reason: `the combinations come from ${names.join(" and ")}, which ${names.length === 1 ? "is" : "are"} whatever ${uniq(missing2.map((r) => r.job)).join(" and ")} writes at run time` };
  }
  const contexts = contextDictionary(ctx);
  const evaluate = (expression) => {
    let ast;
    try {
      ast = new Parser(new Lexer(expression).lex().tokens, STRATEGY_CONTEXTS, []).parse();
    } catch (e) {
      throw new StrategyError(`\${{ ${expression} }} cannot be parsed here: ${e.message}`);
    }
    try {
      return new Evaluator(ast, contexts).evaluate();
    } catch (e) {
      throw new StrategyError(`evaluating \${{ ${expression} }} fails: ${e.message}`);
    }
  };
  try {
    const { settings, matrix } = readStrategy(toData2(strategy, evaluate));
    if (!matrix) return { kind: "none" };
    const built = build(matrix);
    if ("empty" in built) return { kind: "empty", settings, reason: built.empty, reads, recorded: built.recorded };
    nameCombinations(job, built.combinations, settings, ctx);
    return { kind: "combinations", settings, combinations: built.combinations.map(({ name, id, matrix: m, origin }) => ({ name, id, matrix: m, origin })), reads };
  } catch (e) {
    if (e instanceof StrategyError) return { kind: "error", reason: e.message, reads };
    throw e;
  }
}
function contextDictionary(ctx) {
  const needs = {};
  for (const [id, n] of Object.entries(ctx.needs)) needs[id] = { result: n.result, outputs: n.result === "skipped" ? {} : { ...n.outputs ?? {} } };
  const plain2 = { github: ctx.github, needs, vars: ctx.vars, inputs: ctx.inputs };
  return new data_exports.Dictionary(...Object.entries(plain2).map(([key, value]) => ({ key, value: JSON.parse(JSON.stringify(value ?? null), data_exports.reviver) })));
}
function toData2(token, evaluate) {
  if (isBasicExpression(token)) return evaluate(token.expression);
  if (isString(token)) return new data_exports.StringData(token.value);
  if (isNumber(token)) return new data_exports.NumberData(token.value);
  if (isBoolean(token)) return new data_exports.BooleanData(token.value);
  if (token.templateTokenType === TokenType.Null) return new data_exports.Null();
  if (isSequence(token)) {
    const out = new data_exports.Array();
    for (const item of token) out.add(toData2(item, evaluate));
    return out;
  }
  if (isMapping(token)) {
    const out = new data_exports.Dictionary();
    for (const pair of token) out.add(isBasicExpression(pair.key) ? evaluate(pair.key.expression).coerceString() : keyText(pair.key), toData2(pair.value, evaluate));
    return out;
  }
  throw new StrategyError(`${token.typeName()} inside a strategy is not simulated`);
}
function readStrategy(value) {
  if (!(value instanceof data_exports.Dictionary)) throw new StrategyError(`strategy must be a mapping, but it is ${describe(value)}${fromJsonHint(value)}`);
  const settings = { failFast: true, maxParallel: void 0 };
  let matrix;
  for (const { key, value: v } of value.pairs()) {
    if (key === "fail-fast") {
      if (!(v instanceof data_exports.BooleanData)) throw new StrategyError(`fail-fast must be true or false, but it is ${describe(v)}`);
      settings.failFast = v.value;
    } else if (key === "max-parallel") {
      if (!(v instanceof data_exports.NumberData)) throw new StrategyError(`max-parallel must be a number, but it is ${describe(v)}`);
      settings.maxParallel = Math.trunc(v.number());
    } else if (key === "matrix") {
      if (!(v instanceof data_exports.Dictionary)) throw new StrategyError(`matrix must be a mapping, but it is ${describe(v)}${fromJsonHint(v)}`);
      matrix = v;
    } else {
      throw new StrategyError(`unexpected strategy key '${key}'`);
    }
  }
  return { settings, matrix };
}
function build(matrix) {
  const vectors = [];
  const empties = [];
  let includeItems = [];
  let excludeItems = [];
  let hasCrossProductVector = false;
  let hasIncludeVector = false;
  for (const { key, value } of matrix.pairs()) {
    if (key === "include") {
      if (!(value instanceof data_exports.Array)) throw new StrategyError(`matrix include must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      includeItems = value.values();
      hasIncludeVector = includeItems.length > 0;
    } else if (key === "exclude") {
      if (!(value instanceof data_exports.Array)) throw new StrategyError(`matrix exclude must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      excludeItems = value.values();
    } else {
      hasCrossProductVector = true;
      if (!(value instanceof data_exports.Array)) throw new StrategyError(`matrix key '${key}' must be a list, but it is ${describe(value)}${fromJsonHint(value)}`);
      if (value.values().length === 0) empties.push(key);
      else vectors.push({ key, values: value.values() });
    }
  }
  if (empties.length) return { empty: `${empties.map((k) => `'${k}'`).join(" and ")} ${empties.length === 1 ? "is an empty list" : "are empty lists"}`, recorded: true };
  if (!hasCrossProductVector && !hasIncludeVector) return { empty: "it has no keys and nothing in include", recorded: true };
  const vectorKeys = new Set(vectors.map((v) => v.key.toLowerCase()));
  const includes = includeItems.map((item, i) => {
    if (!(item instanceof data_exports.Dictionary)) throw new StrategyError(`include entry ${i + 1} must be a mapping, but it is ${describe(item)}`);
    const filter = [];
    const extra = [];
    for (const p of item.pairs()) (vectorKeys.has(p.key.toLowerCase()) ? filter : extra).push(p);
    if (!filter.length && !extra.length) throw new StrategyError(`include entry ${i + 1} is empty ("Matrix include mapping does not contain any values")`);
    return { filter, extra, tests: leafTests(filter), matched: false };
  });
  const excludes = excludeItems.map((item, i) => {
    if (!(item instanceof data_exports.Dictionary)) throw new StrategyError(`exclude entry ${i + 1} must be a mapping, but it is ${describe(item)}`);
    if (!item.pairs().length) throw new StrategyError(`exclude entry ${i + 1} is empty ("Matrix exclude filter must not be empty")`);
    for (const p of item.pairs()) if (!vectorKeys.has(p.key.toLowerCase())) throw new StrategyError(`Matrix exclude key '${p.key}' does not match any key within the matrix`);
    return leafTests(item.pairs());
  });
  const out = [];
  const ids = new IdBuilder2();
  const productSize = vectors.length ? vectors.reduce((n, v) => n * v.values.length, 1) : 0;
  if (productSize > 65536) throw new StrategyError(`the cross product has ${productSize} combinations; GitHub allows ${MAX_COMBINATIONS} jobs per matrix`);
  for (let index = 0; index < productSize; index++) {
    const pairs2 = [];
    let blockSize = productSize;
    for (const v of vectors) {
      blockSize = blockSize / v.values.length;
      pairs2.push({ key: v.key, value: v.values[Math.floor(index / blockSize) % v.values.length] });
    }
    const combination = new data_exports.Dictionary(...pairs2);
    if (excludes.some((tests) => matches(tests, combination))) continue;
    const extra = /* @__PURE__ */ new Map();
    for (const inc of includes) {
      if (!matches(inc.tests, combination)) continue;
      inc.matched = true;
      for (const p of inc.extra) extra.set(p.key.toLowerCase(), p);
    }
    out.push(configuration(ids, pairs2, [...extra.values()], "product"));
  }
  for (const inc of includes) if (!inc.matched) out.push(configuration(ids, [...inc.filter, ...inc.extra], [], "include"));
  if (out.length > MAX_COMBINATIONS) throw new StrategyError(`the matrix makes ${out.length} jobs; GitHub allows ${MAX_COMBINATIONS} jobs per matrix`);
  if (!out.length) return { empty: "exclude removes every combination", recorded: false };
  return { combinations: out };
}
function leafTests(pairs2) {
  const tests = [];
  const walk = (path2, v) => {
    if (v instanceof data_exports.Dictionary) for (const p of v.pairs()) walk(`${path2}[${quote(p.key)}]`, p.value);
    else if (v instanceof data_exports.Array) v.values().forEach((x, i) => walk(`${path2}[${i}]`, x));
    else tests.push(new Parser(new Lexer(`${path2} == ${literal(v)}`).lex().tokens, ["matrix"], []).parse());
  };
  for (const p of pairs2) walk(`matrix[${quote(p.key)}]`, p.value);
  return tests;
}
function matches(tests, combination) {
  const context = new data_exports.Dictionary({ key: "matrix", value: combination });
  return tests.every((t) => isTruthy(new Evaluator(t, context).evaluate()));
}
function configuration(ids, namePairs, extra, origin) {
  const segments = namePairs.flatMap((p) => segmentsOf(p.value));
  const matrix = plain(new data_exports.Dictionary(...namePairs, ...extra));
  return { name: "", id: ids.build(segments), matrix, origin, segments };
}
function segmentsOf(v) {
  if (v instanceof data_exports.StringData) return v.coerceString() ? [v.coerceString()] : [];
  if (v instanceof data_exports.NumberData) return [v.coerceString()];
  if (v instanceof data_exports.BooleanData) return [v.value ? "true" : "false"];
  if (v instanceof data_exports.Array) return v.values().flatMap(segmentsOf);
  if (v instanceof data_exports.Dictionary) return v.values().flatMap(segmentsOf);
  return [];
}
var IdBuilder2 = class {
  used = /* @__PURE__ */ new Set();
  build(segments, maxLength = 100) {
    let name = "";
    for (const value of segments) {
      if (!value) continue;
      if (!name.length) {
        if (/^[0-9-]/.test(value)) name += "_";
      } else name += "_";
      name += value.replace(/[^A-Za-z0-9_-]/g, "_");
    }
    let original = name.length ? name : "job";
    if (original.startsWith("__")) original = `_${original.replace(/^_+/, "")}`;
    for (let attempt = 1; attempt < 1e3; attempt++) {
      const suffix = attempt === 1 ? "" : original === "_" ? String(attempt) : `_${attempt}`;
      const candidate = original.slice(0, Math.max(0, maxLength - suffix.length)) + suffix;
      if (!this.used.has(candidate.toLowerCase())) {
        this.used.add(candidate.toLowerCase());
        return candidate;
      }
    }
    throw new StrategyError("unable to create a unique id for a combination");
  }
};
function nameCombinations(job, combos, settings, ctx) {
  const raw = job.name && job.name !== job.id ? job.name : job.id;
  const expr = /^\$\{\{\s*([\s\S]*?)\s*\}\}$/.exec(raw)?.[1];
  let ast;
  if (expr) {
    try {
      ast = new Parser(new Lexer(expr).lex().tokens, [...STRATEGY_CONTEXTS, "matrix", "strategy"], []).parse();
    } catch {
      ast = void 0;
    }
  }
  const names = { contexts: /* @__PURE__ */ new Set(), functions: /* @__PURE__ */ new Set() };
  if (ast) collectNames(ast, names);
  const readsMatrix = names.contexts.has("matrix") || names.contexts.has("strategy");
  const base = contextDictionary(ctx);
  combos.forEach((c, i) => {
    let jobName2 = raw;
    if (ast) {
      const dict = new data_exports.Dictionary(
        ...base.pairs(),
        { key: "matrix", value: JSON.parse(JSON.stringify(c.matrix), data_exports.reviver) },
        { key: "strategy", value: JSON.parse(JSON.stringify(strategyContext(settings, i, combos.length)), data_exports.reviver) }
      );
      try {
        jobName2 = new Evaluator(ast, dict).evaluate().coerceString();
      } catch {
        jobName2 = raw;
      }
    }
    let name = readsMatrix || !c.segments.length ? jobName2 : `${jobName2} (${c.segments.join(", ")})`;
    if (name.length > 100) name = `${name.slice(0, 97)}...`;
    c.name = name;
  });
}
function strategyContext(settings, index, total) {
  return { "fail-fast": settings.failFast, "job-index": index, "job-total": total, "max-parallel": settings.maxParallel && settings.maxParallel > 0 ? settings.maxParallel : total };
}
function collectOutputRefs(token) {
  const out = [];
  for (const [, t] of TemplateToken.traverse(token)) {
    if (!isBasicExpression(t)) continue;
    let ast;
    try {
      ast = new Parser(new Lexer(t.expression).lex().tokens, CONTEXT_NAMES, []).parse();
    } catch {
      continue;
    }
    refsIn(ast, out);
  }
  return out;
}
function refsIn(n, out) {
  const ref = asOutputRef(n);
  if (ref) {
    out.push(ref);
    return;
  }
  if (n instanceof IndexAccess) {
    refsIn(n.expr, out);
    refsIn(n.index, out);
  } else if (n instanceof FunctionCall) n.args.forEach((a) => refsIn(a, out));
  else if (n instanceof Binary) {
    refsIn(n.left, out);
    refsIn(n.right, out);
  } else if (n instanceof Logical) n.args.forEach((a) => refsIn(a, out));
  else if (n instanceof Unary) refsIn(n.expr, out);
  else if (n instanceof Grouping) refsIn(n.group, out);
}
function asOutputRef(n) {
  if (!(n instanceof IndexAccess)) return void 0;
  const output = literalString(n.index);
  const outputs = n.expr;
  if (output === void 0 || !(outputs instanceof IndexAccess) || literalString(outputs.index)?.toLowerCase() !== "outputs") return void 0;
  const jobAccess = outputs.expr;
  if (!(jobAccess instanceof IndexAccess) || !(jobAccess.expr instanceof ContextAccess) || jobAccess.expr.name.lexeme.toLowerCase() !== "needs") return void 0;
  const job = literalString(jobAccess.index);
  return job === void 0 ? void 0 : { job, output };
}
var literalString = (n) => n instanceof Literal && n.literal.kind === data_exports.Kind.String ? n.literal.coerceString() : void 0;
function readOutput(ref, ctx) {
  const needId = Object.keys(ctx.needs).find((k) => k.toLowerCase() === ref.job.toLowerCase());
  const need = needId === void 0 ? void 0 : ctx.needs[needId];
  if (!need) return { ...ref, value: null, source: "not-needed" };
  if (need.result === "skipped") return { ...ref, value: null, source: "skipped" };
  const givenKey = Object.keys(need.outputs ?? {}).find((k) => k.toLowerCase() === ref.output.toLowerCase());
  if (givenKey !== void 0) return { ...ref, value: need.outputs[givenKey], source: "given" };
  const declared = ctx.declaredOutputs?.[needId];
  if (declared && !declared.some((d) => d.toLowerCase() === ref.output.toLowerCase())) return { ...ref, value: null, source: "undeclared" };
  return { ...ref, value: void 0, source: "unknown" };
}
function uniqueRefs(refs) {
  const seen = /* @__PURE__ */ new Set();
  return refs.filter((r) => {
    const k = `${r.job.toLowerCase()}.${r.output.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
function outputExample(job, output) {
  const key = Object.keys(job.outputs ?? {}).find((k) => k.toLowerCase() === output.toLowerCase());
  if (key === void 0) return void 0;
  const source = job.outputs[key].trim();
  if (!source.includes("${{")) return source;
  const m = /^\$\{\{\s*steps\.([\w-]+)\.outputs\.([\w-]+)\s*\}\}$/.exec(source);
  if (!m) return void 0;
  const step = job.steps.find((s) => s.id === m[1]);
  return step?.run ? echoedOutput(step.run, m[2]) : void 0;
}
function echoedOutput(script, name) {
  for (const raw of script.split("\n")) {
    const line = raw.trim();
    if (!line.includes("GITHUB_OUTPUT")) continue;
    const m = /^echo\s+(?:-[a-zA-Z]+\s+)*(['"]?)([A-Za-z_][\w-]*)=(.*?)\1\s*>>\s*"?\$\{?GITHUB_OUTPUT\}?"?$/.exec(line);
    if (!m || m[2] !== name) continue;
    const q = m[1];
    let value = m[3];
    if (q !== "'" && /[$`]/.test(value)) continue;
    if (q === '"') value = value.replace(/\\(["\\$`])/g, "$1");
    return value;
  }
  return void 0;
}
function describeStrategy(token) {
  if (!token) return "";
  if (isBasicExpression(token)) return `strategy: \${{ ${token.expression} }}`;
  if (!isMapping(token)) return `strategy: ${flow(token)}`;
  let matrix = "";
  let failFast = "fail-fast: true (default)";
  const rest = [];
  for (const p of token) {
    const key = isBasicExpression(p.key) ? `\${{ ${p.key.expression} }}` : keyText(p.key);
    if (key === "matrix") matrix = describeMatrix(p.value);
    else if (key === "fail-fast") failFast = `fail-fast: ${flow(p.value)}`;
    else if (key === "max-parallel") rest.push(`max-parallel: ${flow(p.value)} (how many run at once; no outcome depends on it)`);
    else rest.push(`${key}: ${flow(p.value)}`);
  }
  return [matrix, failFast, ...rest].filter(Boolean).join(" \xB7 ");
}
function describeMatrix(v) {
  if (!isMapping(v)) return `matrix: ${flow(v)}`;
  const vectors = [];
  const filters = [];
  for (const p of v) {
    const key = isBasicExpression(p.key) ? `\${{ ${p.key.expression} }}` : keyText(p.key);
    if ((key === "include" || key === "exclude") && isSequence(p.value)) filters.push(`${key}: ${p.value.count} entr${p.value.count === 1 ? "y" : "ies"}`);
    else if (key === "include" || key === "exclude") filters.push(`${key}: ${flow(p.value)}`);
    else vectors.push(`${key} ${flow(p.value)}`);
  }
  return `matrix: ${[vectors.join(" \xD7 "), ...filters].filter(Boolean).join(", ")}`;
}
function flow(t) {
  if (isBasicExpression(t)) return `\${{ ${t.expression} }}`;
  if (isString(t)) return t.value;
  if (isNumber(t) || isBoolean(t)) return String(t.value);
  if (t.templateTokenType === TokenType.Null) return "null";
  if (isSequence(t)) return `[${[...t].map(flow).join(", ")}]`;
  if (isMapping(t)) return `{${[...t].map((p) => `${isBasicExpression(p.key) ? flow(p.key) : keyText(p.key)}: ${flow(p.value)}`).join(", ")}}`;
  return t.typeName();
}
function strategyFileProblems(job) {
  const strategy = job.strategy;
  if (!strategy || !isMapping(strategy)) return [];
  const problems = [];
  const at = (t) => `jobs.${job.id}.strategy${t.line ? ` (line ${t.line})` : ""}`;
  let hasExpressions = false;
  let matrixToken;
  const vectors = /* @__PURE__ */ new Set();
  let includeToken;
  let excludeToken;
  for (const pair of strategy) {
    if (isBasicExpression(pair.key)) {
      hasExpressions = true;
      continue;
    }
    const key = keyText(pair.key);
    if ((key === "fail-fast" || key === "max-parallel") && isBasicExpression(pair.value)) hasExpressions = true;
    if (key !== "matrix") continue;
    if (isBasicExpression(pair.value)) {
      hasExpressions = true;
      continue;
    }
    if (!isMapping(pair.value)) continue;
    matrixToken = pair.value;
    if ([...TemplateToken.traverse(pair.value)].some(([, t]) => isBasicExpression(t))) hasExpressions = true;
    let hasCrossProductVector = false;
    let hasIncludeVector = false;
    for (const mp of pair.value) {
      if (isBasicExpression(mp.key)) {
        hasCrossProductVector = true;
        continue;
      }
      const mk = keyText(mp.key);
      const dynamic = [...TemplateToken.traverse(mp.value)].some(([, t]) => isBasicExpression(t));
      if (mk === "include") {
        if (dynamic) {
          hasIncludeVector = true;
          continue;
        }
        if (isSequence(mp.value)) {
          hasIncludeVector = mp.value.count > 0;
          includeToken = mp.value;
        }
      } else if (mk === "exclude") {
        if (!dynamic && isSequence(mp.value)) excludeToken = mp.value;
      } else {
        hasCrossProductVector = true;
        if (dynamic || !isSequence(mp.value)) continue;
        if (mp.value.count === 0) problems.push(`${at(mp.value)}: Matrix vector '${mk}' does not contain any values`);
        else vectors.add(mk.toLowerCase());
      }
    }
    if (!hasCrossProductVector && !hasIncludeVector) problems.push(`${at(pair.value)}: Matrix must define at least one vector`);
  }
  if (matrixToken && !hasExpressions) {
    if (includeToken && isSequence(includeToken)) {
      for (const item of includeToken) if (isMapping(item) && item.count === 0) problems.push(`${at(item)}: Matrix include mapping does not contain any values`);
    }
    if (excludeToken && isSequence(excludeToken)) {
      for (const item of excludeToken) {
        if (!isMapping(item)) continue;
        if (item.count === 0) {
          problems.push(`${at(item)}: Matrix exclude filter must not be empty`);
          continue;
        }
        for (const p of item) if (!vectors.has(keyText(p.key).toLowerCase())) problems.push(`${at(p.key)}: Matrix exclude key '${keyText(p.key)}' does not match any key within the matrix`);
      }
    }
  }
  return problems;
}
function keyText(key) {
  return isString(key) ? key.value : isNumber(key) || isBoolean(key) ? String(key.value) : key.toString();
}
var quote = (s) => `'${s.replace(/'/g, "''")}'`;
function literal(v) {
  if (v instanceof data_exports.StringData) return quote(v.coerceString());
  if (v instanceof data_exports.NumberData) return v.coerceString();
  if (v instanceof data_exports.BooleanData) return v.value ? "true" : "false";
  return "null";
}
function plain(v) {
  return JSON.parse(JSON.stringify(v, data_exports.replacer));
}
function describe(v) {
  if (v instanceof data_exports.StringData) return `the string ${quote(v.coerceString())}`;
  if (v instanceof data_exports.NumberData) return `the number ${v.coerceString()}`;
  if (v instanceof data_exports.BooleanData) return v.value ? "true" : "false";
  if (v instanceof data_exports.Null) return "null";
  if (v instanceof data_exports.Array) return "a list";
  return "a mapping";
}
var fromJsonHint = (v) => v instanceof data_exports.StringData && /^\s*[[{]/.test(v.coerceString()) ? "; a job output is always a string, so read it with fromJSON()" : "";
var uniq = (xs) => [...new Set(xs)];

// src/engine/simulate.ts
function simulate(input) {
  const { workflow } = input;
  const trigger = decideTrigger(workflow, input.trigger);
  const triggerNotes = [];
  if (DEFAULT_BRANCH_ONLY.has(input.trigger.event)) triggerNotes.push(`${input.trigger.event} only triggers workflows whose file exists on the default branch.`);
  if (input.trigger.event === "pull_request" && input.github["event"] && input.github["event"]["pull_request"]?.["head"] && input.github["event"]["pull_request"]["head"]["repo"]?.["fork"]) {
    triggerNotes.push("Pull request from a fork: workflows run with a read-only GITHUB_TOKEN and no secrets unless the repository allows it.");
  }
  triggerNotes.push(...triggerWarnings(workflow));
  const fileProblems = [...workflow.errors, ...validateTriggers(workflow), ...workflow.jobs.flatMap(strategyFileProblems)];
  const declaredOutputs = Object.fromEntries(workflow.jobs.map((j) => [j.id, j.outputs ? Object.keys(j.outputs) : void 0]));
  const known = input.outputs ?? {};
  const { order, graphProblems } = topoOrder(workflow.jobs);
  const rejected = fileProblems.length > 0 || graphProblems.length > 0;
  const ancestorsOf = /* @__PURE__ */ new Map();
  const results = /* @__PURE__ */ new Map();
  const verdicts = /* @__PURE__ */ new Map();
  for (const job of order) {
    const needsResults = {};
    for (const n of job.needs) needsResults[n] = results.get(n) ?? "skipped";
    const ancestors = /* @__PURE__ */ new Set();
    for (const n of job.needs) {
      ancestors.add(n);
      for (const a of ancestorsOf.get(n) ?? []) ancestors.add(a);
    }
    ancestorsOf.set(job.id, ancestors);
    const ancestorResults = {};
    for (const a of ancestors) ancestorResults[a] = results.get(a) ?? "skipped";
    const needsCtx = Object.fromEntries(Object.entries(needsResults).map(([k, v]) => [k, { result: v, outputs: v === "skipped" ? {} : { ...known[k] ?? {} } }]));
    const ancestorsCtx = Object.fromEntries(Object.entries(ancestorResults).map(([k, v]) => [k, { result: v }]));
    const problems = availabilityFor(job.if, "jobs.<job_id>.if", needsResults);
    const evaluation = evaluateCondition(job.if, input.github, { needs: needsCtx, ancestors: ancestorsCtx, cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {} } });
    let outcome;
    let result;
    let headline;
    if (rejected) {
      outcome = "rejected";
      result = "skipped";
      headline = "Not run: GitHub rejects this workflow file, so the run fails before any job starts.";
    } else if (!trigger.matched) {
      outcome = "blocked";
      result = "skipped";
      headline = "The workflow does not run for this event, so no job runs.";
    } else if (!evaluation.ok) {
      outcome = "skipped";
      result = "skipped";
      headline = evaluation.error;
    } else if (!evaluation.truthy) {
      outcome = "skipped";
      result = "skipped";
      headline = `Skipped: ${evaluation.reason}`;
    } else {
      const forced = input.forcedResults?.[job.id];
      result = forced ?? (input.cancelled ? "cancelled" : "success");
      outcome = result === "failure" ? "fails" : result === "cancelled" ? "cancelled" : "runs";
      headline = forced === "failure" ? `Runs, and you marked it as failing.` : forced === "cancelled" ? "Runs, then is cancelled (simulated)." : job.ifSource ? `Runs: ${evaluation.reason}` : "Runs: no condition, and every job it needs succeeded.";
    }
    const stepsFor = (perCombination, matrixUnknown, matrixPattern = /\b(matrix|strategy)\b/) => job.steps.map((s) => {
      const unknownRef = s.if ? /\bsteps\.|\benv\.|\bhashFiles\s*\(/.exec(s.if) : null;
      const matrixRef = s.if && matrixUnknown ? matrixPattern.exec(s.if) : null;
      return {
        id: s.id,
        summary: s.summary,
        if: s.if,
        evaluation: s.if ? evaluateCondition(s.if, input.github, { needs: needsCtx, ancestors: ancestorsCtx, stepStatus: "success", cancelled: input.cancelled, contexts: { inputs: input.inputs, vars: input.vars ?? {}, job: { status: "success" }, runner: { os: "Linux", arch: "X64", name: "GitHub Actions", temp: "/home/runner/work/_temp" }, ...perCombination ?? {} } }) : void 0,
        problems: s.if ? availabilityFor(s.if, "jobs.<job_id>.steps.if", needsResults) : [],
        unknown: unknownRef ? `reads ${unknownRef[0].replace(/\s*\($/, "()")}, which the simulation does not know (step outputs, env and hashFiles are not simulated)` : matrixRef ? `reads ${matrixRef[1]}, which ${matrixUnknown}` : void 0
      };
    });
    let stepVerdicts;
    let matrix;
    const ran = outcome === "runs" || outcome === "fails" || outcome === "cancelled";
    if (job.strategy && hasMatrix(job.strategy) && !ran) {
      matrix = { line: describeStrategy(job.strategy), expansion: { kind: "not-expanded" }, combinations: [] };
      stepVerdicts = stepsFor(void 0, "is not set: the job does not run, so its matrix is never expanded");
    } else if (job.strategy && hasMatrix(job.strategy)) {
      const expansion = expandMatrix(job, { github: input.github, inputs: input.inputs, vars: input.vars ?? {}, needs: needsCtx, declaredOutputs });
      const line = describeStrategy(job.strategy);
      const because = job.ifSource && evaluation.ok ? `Runs: ${evaluation.reason}.` : "Runs: no condition, and every job it needs succeeded.";
      if (expansion.kind === "combinations") {
        const { failFast } = expansion.settings;
        const total = expansion.combinations.length;
        const planned = expansion.combinations.map((c) => {
          const key = combinationKey(job.id, c);
          const forced = input.forcedResults?.[key] ?? input.forcedResults?.[job.id];
          return { c, key, forced, result: forced ?? (input.cancelled ? "cancelled" : "success") };
        });
        const firstFailed = failFast ? planned.find((p) => p.result === "failure") : void 0;
        const combinations = planned.map((p, i) => {
          const cancelledByFailFast2 = firstFailed && p.result === "success";
          const r = cancelledByFailFast2 ? "cancelled" : p.result;
          return {
            combination: p.c,
            key: p.key,
            outcome: r === "failure" ? "fails" : r === "cancelled" ? "cancelled" : "runs",
            result: r,
            headline: cancelledByFailFast2 ? `Cancelled by fail-fast: ${firstFailed.c.name} failed. GitHub cancels the combinations still queued or running at that moment; this assumes they all were.` : p.forced === "failure" ? "Runs, and you marked it as failing." : r === "cancelled" ? "Runs, then is cancelled (simulated)." : "Runs.",
            annotation: cancelledByFailFast2 ? `The strategy configuration was canceled because "${firstFailed.key}" failed.` : void 0,
            stepVerdicts: stepsFor({ matrix: p.c.matrix, strategy: strategyContext(expansion.settings, i, total) })
          };
        });
        result = combinations.some((c) => c.result === "failure") ? "failure" : combinations.some((c) => c.result === "cancelled") ? "cancelled" : "success";
        outcome = result === "failure" ? "fails" : result === "cancelled" ? "cancelled" : "runs";
        const failed = combinations.filter((c) => c.result === "failure");
        const cancelledByFailFast = combinations.filter((c) => c.annotation);
        let summary = `The matrix makes ${total} job${total === 1 ? "" : "s"}`;
        if (failed.length) summary += `; ${failed.map((c) => c.combination.name).join(", ")} ${failed.length === 1 ? "fails" : "fail"}`;
        if (cancelledByFailFast.length) summary += `, and fail-fast cancels the other${cancelledByFailFast.length === 1 ? "" : ` ${cancelledByFailFast.length}`}`;
        else if (failed.length && !failFast && failed.length < total) summary += "; fail-fast is off, so the others run to the end";
        summary += ".";
        if (result !== "success") summary += ` Jobs that need ${job.id} see ${result}.`;
        headline = `${because} ${summary}`;
        matrix = { line, expansion, combinations };
        stepVerdicts = stepsFor(void 0, "differs per combination; see each one");
      } else if (expansion.kind === "empty" || expansion.kind === "error") {
        outcome = "not-created";
        result = "failure";
        const from = readsText(expansion.reads);
        headline = expansion.kind === "empty" && expansion.recorded ? `No job created: the matrix is empty (${expansion.reason}${from}). GitHub creates no job for it, neither failed nor skipped; the run's job list does not show it and no annotation says why. Jobs that need ${job.id} see needs.${job.id}.result == 'failure'.` : expansion.kind === "empty" ? `No job created (assumed): ${expansion.reason}${from}. GitHub's parser does not treat this as an error and no recorded run covers it, so this assumes GitHub does what it does with an empty list: no job, and failure for the jobs that need ${job.id}.` : `No job created: GitHub cannot build this matrix: ${expansion.reason}${from}. Jobs that need ${job.id} see failure. (Not recorded: GitHub's parser fails an empty matrix in the same place, and that one was recorded.)`;
        matrix = { line, expansion, combinations: [] };
        stepVerdicts = [];
      } else if (expansion.kind === "unknown") {
        const names = expansion.reads.filter((r) => r.source === "unknown").map((r) => `needs.${r.job}.outputs.${r.output}`);
        headline = `${headline} Which jobs the matrix makes is unknown: ${expansion.reason}. Give ${names.length === 1 ? "its value" : "their values"} to expand it. If ${names.length === 1 ? "it is" : "they are"} empty, GitHub creates no job for ${job.id} at all and jobs that need it see failure.`;
        matrix = { line, expansion, combinations: [] };
        stepVerdicts = stepsFor(void 0, `is unknown until ${names.join(" and ")} ${names.length === 1 ? "is" : "are"} given`);
      } else {
        stepVerdicts = stepsFor(void 0, NO_MATRIX, /\b(matrix)\./);
      }
    } else {
      stepVerdicts = stepsFor(void 0, NO_MATRIX, /\b(matrix)\./);
    }
    if (outcome !== "rejected" && outcome !== "blocked") {
      const upstream = [...ancestors].map((a) => verdicts.get(a)).filter((v) => !!v);
      const empty = upstream.filter((v) => v.outcome === "not-created").map((v) => v.job.id);
      const unknown = upstream.filter((v) => v.matrix?.expansion.kind === "unknown").map((v) => v.job.id);
      const sentence = (s) => /[.)]$/.test(s) ? s : `${s}.`;
      if (empty.length) headline = `${sentence(headline)} ${empty.join(" and ")} ${empty.length === 1 ? "counts as failed: its matrix makes" : "count as failed: their matrices make"} no job, and GitHub reports that as failure.`;
      if (unknown.length) headline = `${sentence(headline)} This assumes the matrix of ${unknown.join(" and ")} makes at least one job; if it comes out empty, GitHub creates none and reports failure for it.`;
    }
    results.set(job.id, result);
    verdicts.set(job.id, { job, outcome, result, evaluation, headline, needsResults, ancestorResults, problems, stepVerdicts, ...matrix ? { matrix } : {} });
  }
  return { trigger, triggerNotes, fileProblems, jobs: order.map((j) => verdicts.get(j.id)), graphProblems, rejected };
}
var NO_MATRIX = "the simulation does not know in a job without a matrix";
function readsText(reads) {
  const shown = reads.filter((r) => r.source !== "unknown").map((r) => {
    const why = r.source === "skipped" ? `${r.job} was skipped` : r.source === "undeclared" ? `${r.job} declares no such output` : `${r.job} is not in needs`;
    return `needs.${r.job}.outputs.${r.output} is ${typeof r.value === "string" ? `'${r.value}'` : `empty because ${why}`}`;
  });
  return shown.length ? `; ${shown.join(", ")}` : "";
}
function availabilityFor(expression, key, needs) {
  try {
    const ast = parseExpression(expression, statusFunctions({ needs: Object.fromEntries(Object.entries(needs).map(([k, v]) => [k, { result: v }])) }));
    return checkAvailability(ast, key);
  } catch {
    return [];
  }
}
function topoOrder(jobs) {
  const byId = new Map(jobs.map((j) => [j.id, j]));
  const problems = [];
  const indeg = /* @__PURE__ */ new Map();
  const dependents = /* @__PURE__ */ new Map();
  for (const j of jobs) {
    indeg.set(j.id, 0);
  }
  for (const j of jobs) {
    for (const n of j.needs) {
      if (!byId.has(n)) {
        problems.push(`${j.id} needs "${n}", which is not a job in this workflow.`);
        continue;
      }
      indeg.set(j.id, (indeg.get(j.id) ?? 0) + 1);
      dependents.set(n, [...dependents.get(n) ?? [], j.id]);
    }
  }
  const queue = jobs.filter((j) => (indeg.get(j.id) ?? 0) === 0).map((j) => j.id);
  const order = [];
  const seen = /* @__PURE__ */ new Set();
  while (queue.length) {
    const id = queue.shift();
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(byId.get(id));
    for (const d of dependents.get(id) ?? []) {
      indeg.set(d, (indeg.get(d) ?? 1) - 1);
      if ((indeg.get(d) ?? 0) === 0) queue.push(d);
    }
  }
  for (const j of jobs) if (!seen.has(j.id)) {
    order.push(j);
    problems.push(`${j.id} is part of a dependency cycle or depends on a missing job.`);
  }
  return { order, graphProblems: problems };
}

// src/engine/context.ts
var ZERO_SHA = "0000000000000000000000000000000000000000";
function buildGithubContext(payload, sc) {
  const p = structuredClone(payload);
  const notes = [];
  const repoFull = sc.repository ?? str(p["repository"]?.["full_name"]) ?? "octo-org/octo-repo";
  const [owner = "octo-org", repoName = "octo-repo"] = repoFull.split("/");
  const defaultBranch = sc.defaultBranch ?? str(p["repository"]?.["default_branch"]) ?? "main";
  const actor = sc.actor ?? str(p["sender"]?.["login"]) ?? "octocat";
  patchRepository(p, owner, repoName, defaultBranch);
  setPath(p, ["sender", "login"], actor);
  if (sc.action !== void 0 && "action" in p) p["action"] = sc.action;
  const gh = {
    event_name: sc.event,
    event: p,
    repository: repoFull,
    repository_owner: owner,
    repository_id: str(p["repository"]?.["id"]) ?? "1",
    repository_owner_id: str(p["repository"]?.["owner"]?.["id"]) ?? "1",
    actor,
    actor_id: "1",
    triggering_actor: actor,
    workflow: "CI",
    workflow_ref: `${repoFull}/.github/workflows/ci.yml@refs/heads/${defaultBranch}`,
    workflow_sha: ZERO_SHA,
    job: "",
    run_id: "1",
    run_number: "1",
    run_attempt: "1",
    retention_days: "90",
    action: "",
    action_path: "",
    action_ref: "",
    action_repository: "",
    action_status: "",
    server_url: "https://github.com",
    api_url: "https://api.github.com",
    graphql_url: "https://api.github.com/graphql",
    workspace: "/home/runner/work/" + repoName + "/" + repoName,
    path: "",
    env: "",
    secret_source: "Actions",
    token: "***",
    head_ref: "",
    base_ref: "",
    ref_protected: false
  };
  const setRef = (ref, sha = ZERO_SHA) => {
    gh["ref"] = ref;
    gh["sha"] = sha;
    gh["ref_name"] = ref.replace(/^refs\/(heads|tags|pull)\//, "");
    gh["ref_type"] = ref.startsWith("refs/tags/") ? "tag" : "branch";
  };
  switch (sc.event) {
    case "push": {
      const ref = sc.tag ? `refs/tags/${sc.tag}` : `refs/heads/${sc.branch ?? defaultBranch}`;
      p["ref"] = ref;
      if (sc.commitMessage !== void 0) setPath(p, ["head_commit", "message"], sc.commitMessage);
      for (const c of [p["head_commit"], ...Array.isArray(p["commits"]) ? p["commits"] : []]) {
        if (c && typeof c === "object") for (const k of ["added", "modified", "removed"]) delete c[k];
      }
      notes.push("push: github.event.head_commit and github.event.commits carry no added/modified/removed lists in Actions (they are stripped from the webhook payload); paths filters use the files you typed.");
      setRef(ref, str(p["after"]) ?? ZERO_SHA);
      gh["base_ref"] = str(p["base_ref"]) ?? "";
      notes.push(`push: github.ref is the pushed ref (${ref}); github.sha is the commit after the push.`);
      break;
    }
    case "pull_request":
    case "pull_request_target":
    case "pull_request_review":
    case "pull_request_review_comment": {
      const pr = p["pull_request"] ?? {};
      p["pull_request"] = pr;
      const number = Number(p["number"] ?? pr["number"] ?? 1);
      p["number"] = number;
      pr["number"] = number;
      const base = sc.branch ?? str(pr["base"]?.["ref"]) ?? defaultBranch;
      const head = sc.headBranch ?? str(pr["head"]?.["ref"]) ?? "feature";
      setPath(pr, ["base", "ref"], base);
      setPath(pr, ["head", "ref"], head);
      setPath(pr, ["head", "repo", "fork"], sc.fork ?? Boolean(pr["head"]?.["repo"]?.["fork"]));
      if (sc.fork) setPath(pr, ["head", "repo", "full_name"], `${actor}/${repoName}`);
      else setPath(pr, ["head", "repo", "full_name"], repoFull);
      if (sc.draft !== void 0) pr["draft"] = sc.draft;
      if (sc.labels) pr["labels"] = sc.labels.map((name, i) => ({ id: 1e3 + i, name, color: "ededed", default: false, description: null }));
      if (sc.action === "labeled" && sc.labels?.length) p["label"] = { id: 1e3, name: sc.labels[sc.labels.length - 1], color: "ededed" };
      const baseSha = str(pr["base"]?.["sha"]) ?? ZERO_SHA;
      if (sc.event === "pull_request") {
        setRef(`refs/pull/${number}/merge`, "merge" + ZERO_SHA.slice(5));
        notes.push(`pull_request: github.ref is refs/pull/${number}/merge and github.sha is the merge commit, not the head commit.`);
      } else if (sc.event === "pull_request_target") {
        setRef(`refs/heads/${base}`, baseSha);
        notes.push(`pull_request_target: github.ref is the base branch (refs/heads/${base}) and github.sha its last commit; the workflow runs with the base branch's code.`);
      } else {
        setRef(`refs/pull/${number}/merge`, "merge" + ZERO_SHA.slice(5));
      }
      gh["head_ref"] = head;
      gh["base_ref"] = base;
      break;
    }
    case "release": {
      const rel = p["release"] ?? {};
      p["release"] = rel;
      const tag = sc.tag ?? str(rel["tag_name"]) ?? "v1.0.0";
      rel["tag_name"] = tag;
      setRef(`refs/tags/${tag}`);
      notes.push(`release: github.ref is the tag of the release (refs/tags/${tag}).`);
      break;
    }
    case "create":
    case "delete": {
      const isTag = Boolean(sc.tag) || p["ref_type"] === "tag";
      const name = sc.tag ?? sc.branch ?? str(p["ref"]) ?? defaultBranch;
      p["ref"] = name;
      p["ref_type"] = isTag ? "tag" : "branch";
      setRef(sc.event === "create" ? isTag ? `refs/tags/${name}` : `refs/heads/${name}` : `refs/heads/${defaultBranch}`);
      notes.push(sc.event === "create" ? `create: github.ref is the created ref.` : `delete: github.ref is the default branch, because the deleted ref no longer exists.`);
      break;
    }
    case "workflow_run": {
      const wr = p["workflow_run"] ?? {};
      const branch = sc.branch ?? str(wr["head_branch"]) ?? defaultBranch;
      setPath(p, ["workflow_run", "head_branch"], branch);
      setRef(`refs/heads/${defaultBranch}`, str(wr["head_sha"]) ?? ZERO_SHA);
      notes.push(`workflow_run: github.ref is the default branch; the triggering run's branch is github.event.workflow_run.head_branch (${branch}).`);
      break;
    }
    case "merge_group": {
      const mg = p["merge_group"] ?? {};
      const ref = str(mg["head_ref"]) ?? `refs/heads/gh-readonly-queue/${defaultBranch}/pr-1-${ZERO_SHA}`;
      setRef(ref, str(mg["head_sha"]) ?? ZERO_SHA);
      gh["base_ref"] = str(mg["base_ref"]) ?? `refs/heads/${defaultBranch}`;
      notes.push("merge_group: github.ref is the temporary merge queue branch (gh-readonly-queue/...).");
      break;
    }
    default: {
      const branch = sc.branch ?? defaultBranch;
      setRef(`refs/heads/${branch}`);
      if (sc.event === "issues" || sc.event === "issue_comment") {
        const issue = p["issue"] ?? {};
        p["issue"] = issue;
        if (sc.labels) issue["labels"] = sc.labels.map((name, i) => ({ id: 1e3 + i, name, color: "ededed" }));
        if (sc.action === "labeled" && sc.labels?.length) p["label"] = { id: 1e3, name: sc.labels[sc.labels.length - 1], color: "ededed" };
      }
      if (sc.event === "workflow_dispatch") {
        p["inputs"] = stringifyInputs(sc.inputs ?? {});
        p["ref"] = `refs/heads/${branch}`;
      }
      notes.push(`${sc.event}: github.ref is the branch the workflow ran on (refs/heads/${branch})${sc.event === "schedule" || sc.event === "issues" || sc.event === "issue_comment" || sc.event === "discussion" || sc.event === "label" || sc.event === "repository_dispatch" ? ", which for this event is always the default branch" : ""}.`);
    }
  }
  const inputs = sc.inputs ? typedInputs(sc.inputs) : {};
  Object.assign(gh, sc.overrides ?? {});
  return { github: gh, inputs, notes };
}
function typedInputs(inputs) {
  const out = {};
  for (const [k, v] of Object.entries(inputs)) out[k] = v;
  return out;
}
function stringifyInputs(inputs) {
  const out = {};
  for (const [k, v] of Object.entries(inputs)) out[k] = String(v);
  return out;
}
function patchRepository(p, owner, name, defaultBranch) {
  const repo = p["repository"] ?? {};
  p["repository"] = repo;
  repo["name"] = name;
  repo["full_name"] = `${owner}/${name}`;
  repo["default_branch"] = defaultBranch;
  const o = repo["owner"] ?? {};
  repo["owner"] = o;
  o["login"] = owner;
}
function setPath(obj, path2, value) {
  let cur = obj;
  for (let i = 0; i < path2.length - 1; i++) {
    const key = path2[i];
    const next = cur[key];
    if (!next || typeof next !== "object") cur[key] = {};
    cur = cur[key];
  }
  cur[path2[path2.length - 1]] = value;
}
function str(v) {
  return v === void 0 || v === null ? void 0 : String(v);
}

// data/webhooks/push.json
var push_default = { actions: [], payload: { ref: "refs/tags/simple-tag", before: "0000000000000000000000000000000000000000", after: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", created: true, deleted: false, forced: false, base_ref: null, compare: "https://github.com/Codertocat/Hello-World/compare/simple-tag", commits: [], head_commit: { id: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", tree_id: "4b825dc642cb6eb9a060e54bf8d69288fbee4904", distinct: true, message: "Adding a .gitignore file", timestamp: "2019-05-15T15:20:41Z", url: "https://github.com/Codertocat/Hello-World/commit/6113728f27ae82c7b1a177c8d03f9e96e0adf246", author: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com", username: "Codertocat" }, committer: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com", username: "Codertocat" }, added: [".gitignore"], removed: [], modified: [] }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com", login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://github.com/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: 1557933565, updated_at: "2019-05-15T15:20:41Z", pushed_at: 1557933657, git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master", stargazers: 0, master_branch: "master" }, pusher: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/pull_request.json
var pull_request_default = { actions: ["assigned", "closed", "converted_to_draft", "labeled", "locked", "opened", "ready_for_review", "reopened", "review_request_removed", "review_requested", "synchronize", "unassigned", "unlabeled", "unlocked"], payload: { action: "opened", number: 2, pull_request: { url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, node_id: "MDExOlB1bGxSZXF1ZXN0Mjc5MTQ3NDM3", html_url: "https://github.com/Codertocat/Hello-World/pull/2", diff_url: "https://github.com/Codertocat/Hello-World/pull/2.diff", patch_url: "https://github.com/Codertocat/Hello-World/pull/2.patch", issue_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2", number: 2, state: "open", locked: false, title: "Update the README with new information.", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: "This is a pretty simple change that we need to pull into master.", created_at: "2019-05-15T15:20:33Z", updated_at: "2019-05-15T15:20:33Z", closed_at: null, merged_at: null, merge_commit_sha: null, assignee: null, assignees: [], requested_reviewers: [], requested_teams: [], labels: [], milestone: null, commits_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits", review_comments_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments", review_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821", head: { label: "Codertocat:changes", ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, base: { label: "Codertocat:master", ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, _links: { self: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" }, html: { href: "https://github.com/Codertocat/Hello-World/pull/2" }, issue: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2" }, comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments" }, review_comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments" }, review_comment: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}" }, commits: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits" }, statuses: { href: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821" } }, author_association: "OWNER", draft: false, merged: false, mergeable: null, rebaseable: null, mergeable_state: "unknown", merged_by: null, comments: 0, review_comments: 0, maintainer_can_modify: false, commits: 1, additions: 1, deletions: 1, changed_files: 1 }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/pull_request_target.json
var pull_request_target_default = { actions: ["assigned", "closed", "converted_to_draft", "labeled", "locked", "opened", "ready_for_review", "reopened", "review_request_removed", "review_requested", "synchronize", "unassigned", "unlabeled", "unlocked"], payload: { action: "opened", number: 2, pull_request: { url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, node_id: "MDExOlB1bGxSZXF1ZXN0Mjc5MTQ3NDM3", html_url: "https://github.com/Codertocat/Hello-World/pull/2", diff_url: "https://github.com/Codertocat/Hello-World/pull/2.diff", patch_url: "https://github.com/Codertocat/Hello-World/pull/2.patch", issue_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2", number: 2, state: "open", locked: false, title: "Update the README with new information.", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: "This is a pretty simple change that we need to pull into master.", created_at: "2019-05-15T15:20:33Z", updated_at: "2019-05-15T15:20:33Z", closed_at: null, merged_at: null, merge_commit_sha: null, assignee: null, assignees: [], requested_reviewers: [], requested_teams: [], labels: [], milestone: null, commits_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits", review_comments_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments", review_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821", head: { label: "Codertocat:changes", ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, base: { label: "Codertocat:master", ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, _links: { self: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" }, html: { href: "https://github.com/Codertocat/Hello-World/pull/2" }, issue: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2" }, comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments" }, review_comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments" }, review_comment: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}" }, commits: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits" }, statuses: { href: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821" } }, author_association: "OWNER", draft: false, merged: false, mergeable: null, rebaseable: null, mergeable_state: "unknown", merged_by: null, comments: 0, review_comments: 0, maintainer_can_modify: false, commits: 1, additions: 1, deletions: 1, changed_files: 1 }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:32Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/pull_request_review.json
var pull_request_review_default = { actions: ["dismissed", "submitted"], payload: { action: "submitted", review: { id: 237895671, node_id: "MDE3OlB1bGxSZXF1ZXN0UmV2aWV3MjM3ODk1Njcx", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: null, commit_id: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", submitted_at: "2019-05-15T15:20:38Z", state: "commented", html_url: "https://github.com/Codertocat/Hello-World/pull/2#pullrequestreview-237895671", pull_request_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", author_association: "OWNER", _links: { html: { href: "https://github.com/Codertocat/Hello-World/pull/2#pullrequestreview-237895671" }, pull_request: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" } } }, pull_request: { url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, node_id: "MDExOlB1bGxSZXF1ZXN0Mjc5MTQ3NDM3", html_url: "https://github.com/Codertocat/Hello-World/pull/2", diff_url: "https://github.com/Codertocat/Hello-World/pull/2.diff", patch_url: "https://github.com/Codertocat/Hello-World/pull/2.patch", issue_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2", number: 2, state: "open", locked: false, title: "Update the README with new information.", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: "This is a pretty simple change that we need to pull into master.", created_at: "2019-05-15T15:20:33Z", updated_at: "2019-05-15T15:20:38Z", closed_at: null, merged_at: null, merge_commit_sha: "c4295bd74fb0f4fda03689c3df3f2803b658fd85", assignee: null, assignees: [], requested_reviewers: [], requested_teams: [], labels: [], milestone: null, commits_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits", review_comments_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments", review_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821", head: { label: "Codertocat:changes", ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, base: { label: "Codertocat:master", ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, _links: { self: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" }, html: { href: "https://github.com/Codertocat/Hello-World/pull/2" }, issue: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2" }, comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments" }, review_comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments" }, review_comment: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}" }, commits: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits" }, statuses: { href: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821" } }, author_association: "OWNER" }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/pull_request_review_comment.json
var pull_request_review_comment_default = { actions: ["created", "deleted", "edited"], payload: { action: "created", comment: { url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments/284312630", pull_request_review_id: 237895671, id: 284312630, node_id: "MDI0OlB1bGxSZXF1ZXN0UmV2aWV3Q29tbWVudDI4NDMxMjYzMA==", diff_hunk: "@@ -1 +1 @@\n-# Hello-World", path: "README.md", position: 1, original_position: 1, commit_id: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", original_commit_id: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: "Maybe you should use more emoji on this line.", created_at: "2019-05-15T15:20:37Z", updated_at: "2019-05-15T15:20:38Z", html_url: "https://github.com/Codertocat/Hello-World/pull/2#discussion_r284312630", pull_request_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", author_association: "OWNER", _links: { self: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments/284312630" }, html: { href: "https://github.com/Codertocat/Hello-World/pull/2#discussion_r284312630" }, pull_request: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" } } }, pull_request: { url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, node_id: "MDExOlB1bGxSZXF1ZXN0Mjc5MTQ3NDM3", html_url: "https://github.com/Codertocat/Hello-World/pull/2", diff_url: "https://github.com/Codertocat/Hello-World/pull/2.diff", patch_url: "https://github.com/Codertocat/Hello-World/pull/2.patch", issue_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2", number: 2, state: "open", locked: false, title: "Update the README with new information.", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, body: "This is a pretty simple change that we need to pull into master.", created_at: "2019-05-15T15:20:33Z", updated_at: "2019-05-15T15:20:38Z", closed_at: null, merged_at: null, merge_commit_sha: "c4295bd74fb0f4fda03689c3df3f2803b658fd85", assignee: null, assignees: [], requested_reviewers: [], requested_teams: [], labels: [], milestone: null, commits_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits", review_comments_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments", review_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821", head: { label: "Codertocat:changes", ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, base: { label: "Codertocat:master", ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, repo: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master", allow_squash_merge: true, allow_merge_commit: true, allow_rebase_merge: true, delete_branch_on_merge: false } }, _links: { self: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2" }, html: { href: "https://github.com/Codertocat/Hello-World/pull/2" }, issue: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2" }, comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/issues/2/comments" }, review_comments: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/comments" }, review_comment: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/comments{/number}" }, commits: { href: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2/commits" }, statuses: { href: "https://api.github.com/repos/Codertocat/Hello-World/statuses/ec26c3e57ca3a959ca5aad62de7213c562f8c821" } }, author_association: "OWNER" }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:34Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/workflow_dispatch.json
var workflow_dispatch_default = { actions: [], payload: { inputs: {}, organization: { avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", description: null, events_url: "https://api.github.com/orgs/octo-org/events", hooks_url: "https://api.github.com/orgs/octo-org/hooks", id: 79927191, issues_url: "https://api.github.com/orgs/octo-org/issues", login: "octo-org", members_url: "https://api.github.com/orgs/octo-org/members{/member}", node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI", public_members_url: "https://api.github.com/orgs/octo-org/public_members{/member}", repos_url: "https://api.github.com/orgs/octo-org/repos", url: "https://api.github.com/orgs/octo-org" }, ref: "refs/heads/main", repository: { allow_forking: true, archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", archived: false, assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", clone_url: "https://github.com/octo-org/octo-repo.git", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", created_at: "2021-08-16T21:34:28Z", default_branch: "main", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", description: null, disabled: false, downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", fork: false, forks: 1, forks_count: 1, forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", full_name: "octo-org/octo-repo", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", git_url: "git://github.com/octo-org/octo-repo.git", has_downloads: true, has_issues: true, has_pages: false, has_projects: true, has_wiki: true, homepage: null, hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", html_url: "https://github.com/octo-org/octo-repo", id: 6811672, is_template: false, issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", language: null, languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", license: null, merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", mirror_url: null, name: "octo-repo", node_id: "MDEwOlJlcG9zaXRvcnkzOTY5ODA4MTI=", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", open_issues: 97, open_issues_count: 97, owner: { avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", events_url: "https://api.github.com/users/octo-org/events{/privacy}", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/octo-org", id: 79927191, login: "octo-org", node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI9", organizations_url: "https://api.github.com/users/octo-org/orgs", received_events_url: "https://api.github.com/users/octo-org/received_events", repos_url: "https://api.github.com/users/octo-org/repos", site_admin: false, starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", type: "Organization", url: "https://api.github.com/users/octo-org" }, private: false, pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", pushed_at: "2022-01-07T21:57:21Z", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", size: 144, ssh_url: "git@github.com:octo-org/octo-repo.git", stargazers_count: 0, stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", svn_url: "https://github.com/octo-org/octo-repo", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", topics: [], trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", updated_at: "2022-01-07T21:57:24Z", url: "https://api.github.com/repos/octo-org/octo-repo", visibility: "public", watchers: 0, watchers_count: 0 }, sender: { avatar_url: "https://avatars.githubusercontent.com/u/25328854?v=4", events_url: "https://api.github.com/users/octocat/events{/privacy}", followers_url: "https://api.github.com/users/octocat/followers", following_url: "https://api.github.com/users/octocat/following{/other_user}", gists_url: "https://api.github.com/users/octocat/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/octocat", id: 25328754, login: "octocat", node_id: "MDQ6VXNlcjI1MzI4ODU0", organizations_url: "https://api.github.com/users/octocat/orgs", received_events_url: "https://api.github.com/users/octocat/received_events", repos_url: "https://api.github.com/users/octocat/repos", site_admin: true, starred_url: "https://api.github.com/users/octocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octocat/subscriptions", type: "User", url: "https://api.github.com/users/octocat" }, workflow: ".github/workflows/hello-world-workflow.yml" } };

// data/webhooks/schedule.json
var schedule_default = { actions: [], payload: { schedule: "0 6 * * 1", repository: { name: "octo-repo", full_name: "octo-org/octo-repo", default_branch: "main", owner: { login: "octo-org" } }, sender: { login: "octocat" } } };

// data/webhooks/release.json
var release_default = { actions: ["created", "deleted", "edited", "prereleased", "published", "released"], payload: { action: "published", release: { url: "https://api.github.com/repos/Codertocat/Hello-World/releases/17372790", assets_url: "https://api.github.com/repos/Codertocat/Hello-World/releases/17372790/assets", upload_url: "https://uploads.github.com/repos/Codertocat/Hello-World/releases/17372790/assets{?name,label}", html_url: "https://github.com/Codertocat/Hello-World/releases/tag/0.0.1", id: 17372790, node_id: "MDc6UmVsZWFzZTE3MzcyNzkw", tag_name: "0.0.1", target_commitish: "master", name: null, draft: false, author: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, prerelease: false, created_at: "2019-05-15T15:19:25Z", published_at: "2019-05-15T15:20:53Z", assets: [], tarball_url: "https://api.github.com/repos/Codertocat/Hello-World/tarball/0.0.1", zipball_url: "https://api.github.com/repos/Codertocat/Hello-World/zipball/0.0.1", body: null }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:52Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/issues.json
var issues_default = { actions: ["assigned", "deleted", "demilestoned", "edited", "labeled", "locked", "milestoned", "opened", "pinned", "reopened", "transferred", "unassigned", "unlabeled", "unlocked", "unpinned"], payload: { action: "opened", issue: { url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1", repository_url: "https://api.github.com/repos/Codertocat/Hello-World", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/labels{/name}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/comments", events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/events", html_url: "https://github.com/Codertocat/Hello-World/issues/1", id: 444500041, node_id: "MDU6SXNzdWU0NDQ1MDAwNDE=", number: 1, title: "Spelling error in the README file", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, labels: [{ id: 1362934389, node_id: "MDU6TGFiZWwxMzYyOTM0Mzg5", url: "https://api.github.com/repos/Codertocat/Hello-World/labels/bug", name: "bug", color: "d73a4a", default: true, description: "Something isn't working" }], state: "open", locked: false, assignee: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, assignees: [{ login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }], milestone: { url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1", html_url: "https://github.com/Codertocat/Hello-World/milestone/1", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1/labels", id: 4317517, node_id: "MDk6TWlsZXN0b25lNDMxNzUxNw==", number: 1, title: "v1.0", description: "Add new space flight simulator", creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, open_issues: 1, closed_issues: 0, state: "closed", created_at: "2019-05-15T15:20:17Z", updated_at: "2019-05-15T15:20:18Z", due_on: "2019-05-23T07:00:00Z", closed_at: "2019-05-15T15:20:18Z" }, comments: 0, created_at: "2019-05-15T15:20:18Z", updated_at: "2019-05-15T15:20:18Z", closed_at: null, author_association: "OWNER", active_lock_reason: null, body: "It looks like you accidently spelled 'commit' with two 't's.", reactions: { url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/reactions", total_count: 0, "+1": 0, "-1": 0, laugh: 0, hooray: 0, confused: 0, heart: 0, rocket: 0, eyes: 0 }, draft: false }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:13Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 1, license: null, forks: 0, open_issues: 1, watchers: 0, default_branch: "master", is_template: false, topics: [], visibility: "public", web_commit_signoff_required: false, custom_properties: {} }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/issue_comment.json
var issue_comment_default = { actions: ["created", "deleted", "edited"], payload: { action: "created", issue: { url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1", repository_url: "https://api.github.com/repos/Codertocat/Hello-World", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/labels{/name}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/comments", events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1/events", html_url: "https://github.com/Codertocat/Hello-World/issues/1", id: 444500041, node_id: "MDU6SXNzdWU0NDQ1MDAwNDE=", number: 1, title: "Spelling error in the README file", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, labels: [{ id: 1362934389, node_id: "MDU6TGFiZWwxMzYyOTM0Mzg5", url: "https://api.github.com/repos/Codertocat/Hello-World/labels/bug", name: "bug", color: "d73a4a", default: true }], state: "open", locked: false, assignee: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, assignees: [{ login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }], milestone: { url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1", html_url: "https://github.com/Codertocat/Hello-World/milestone/1", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1/labels", id: 4317517, node_id: "MDk6TWlsZXN0b25lNDMxNzUxNw==", number: 1, title: "v1.0", description: "Add new space flight simulator", creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, open_issues: 1, closed_issues: 0, state: "closed", created_at: "2019-05-15T15:20:17Z", updated_at: "2019-05-15T15:20:18Z", due_on: "2019-05-23T07:00:00Z", closed_at: "2019-05-15T15:20:18Z" }, comments: 0, created_at: "2019-05-15T15:20:18Z", updated_at: "2019-05-15T15:20:21Z", closed_at: null, author_association: "OWNER", body: "It looks like you accidently spelled 'commit' with two 't's." }, comment: { url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments/492700400", html_url: "https://github.com/Codertocat/Hello-World/issues/1#issuecomment-492700400", issue_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/1", id: 492700400, node_id: "MDEyOklzc3VlQ29tbWVudDQ5MjcwMDQwMA==", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, created_at: "2019-05-15T15:20:21Z", updated_at: "2019-05-15T15:20:21Z", author_association: "OWNER", body: "You are totally right! I'll get this fixed right away." }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:13Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 1, license: null, forks: 0, open_issues: 1, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/create.json
var create_default = { actions: [], payload: { ref: "simple-tag", ref_type: "tag", master_branch: "master", description: null, pusher_type: "user", repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:56Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/delete.json
var delete_default = { actions: [], payload: { ref: "simple-tag", ref_type: "tag", pusher_type: "user", repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:57Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/workflow_run.json
var workflow_run_default = { actions: ["completed", "requested"], payload: { action: "completed", organization: { avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", description: "", events_url: "https://api.github.com/orgs/Octocoders/events", hooks_url: "https://api.github.com/orgs/Octocoders/hooks", id: 33435682, issues_url: "https://api.github.com/orgs/Octocoders/issues", login: "Codertocat", members_url: "https://api.github.com/orgs/Octocoders/members{/member}", node_id: "MDQ6VXNlcjIxMDMxMDY3", public_members_url: "https://api.github.com/orgs/Octocoders/public_members{/member}", repos_url: "https://api.github.com/orgs/Octocoders/repos", url: "https://api.github.com/orgs/Codertocat" }, repository: { archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", archived: false, assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", clone_url: "https://github.com/Codertocat/Hello-World.git", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", created_at: "2020-07-29T09:57:16Z", default_branch: "main", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", description: null, disabled: false, downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", fork: false, forks: 0, forks_count: 0, forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", full_name: "Codertocat/Hello-World", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_url: "git://github.com/Codertocat/Hello-World.git", has_downloads: true, has_issues: true, has_pages: false, has_projects: true, has_wiki: true, homepage: null, hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", html_url: "https://github.com/Codertocat/Hello-World", id: 283462325, issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", language: null, languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", license: null, merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", mirror_url: null, name: "Hello-World", node_id: "MDEwOlJlcG9zaXRvcnkyODM0NjIzMjU=", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", open_issues: 0, open_issues_count: 0, owner: { avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/Codertocat", id: 33435682, login: "Codertocat", node_id: "MDEyOk9yZ2FuaXphdGlvbjMzNDM1Njgy", organizations_url: "https://api.github.com/users/Codertocat/orgs", received_events_url: "https://api.github.com/users/Codertocat/received_events", repos_url: "https://api.github.com/users/Codertocat/repos", site_admin: false, starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", type: "Organization", url: "https://api.github.com/users/Codertocat" }, private: true, pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", pushed_at: "2020-07-29T10:06:16Z", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", size: 0, ssh_url: "git@github.com:Codertocat/Hello-World.git", stargazers_count: 0, stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", svn_url: "https://github.com/Codertocat/Hello-World", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", updated_at: "2020-07-29T10:06:18Z", url: "https://api.github.com/repos/Codertocat/Hello-World", watchers: 0, watchers_count: 0 }, sender: { avatar_url: "https://avatars3.githubusercontent.com/u/54248166?v=4", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/Codertocat", id: 54248166, login: "Codertocat", node_id: "MDEwOkNoZWNrU3VpdGUxMTg1NzgxNDc=", organizations_url: "https://api.github.com/users/Codertocat/orgs", received_events_url: "https://api.github.com/users/Codertocat/received_events", repos_url: "https://api.github.com/users/Codertocat/repos", site_admin: true, starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", type: "User", url: "https://api.github.com/users/Codertocat" }, workflow: { badge_url: "https://github.com/octo-org/octo-repo/workflows/Manually%20triggered%20workflow/badge.svg", created_at: "2021-12-15T20:11:38.000Z", html_url: "https://github.com/octo-org/octo-repo/blob/main/.github/workflows/syntax.yml", id: 16340987, name: "Manually triggered workflow", node_id: "W_kwDOF6lyTM4A-Vf7", path: ".github/workflows/syntax.yml", state: "active", updated_at: "2021-12-16T18:40:41.000Z", url: "https://api.github.com/repos/octo-org/octo-repo/actions/workflows/16340987" }, workflow_run: { artifacts_url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559/artifacts", cancel_url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559/cancel", check_suite_id: 4683454167, check_suite_node_id: "CS_kwDOF6lyTM8AAAABFyfW1w", check_suite_url: "https://api.github.com/repos/octo-org/octo-repo/check-suites/4683454167", conclusion: null, created_at: "2021-12-16T19:37:22Z", event: "workflow_dispatch", head_branch: "main", head_commit: { author: { email: "octocat@github.com", name: "Mona Lisa" }, committer: { email: "noreply@github.com", name: "GitHub" }, id: "5779607b49aab1200488439f02372c57b4f75444", message: "Update milestone-created.yml", timestamp: "2021-12-16T19:37:14Z", tree_id: "8181cee091cf9627ac07c3cc4b94c015a1d56706" }, head_repository: { archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", description: null, downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", fork: false, forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", full_name: "octo-org/octo-repo", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", html_url: "https://github.com/octo-org/octo-repo", id: 396980812, issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", name: "octo-repo", node_id: "MDEwOlJlcG9zaXRvcnkzOTY5ODA4MTI=", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", owner: { avatar_url: "https://avatars.githubusercontent.com/u/79927191?v=4", events_url: "https://api.github.com/users/octo-org/events{/privacy}", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/octo-org", id: 79927191, login: "octo-org", node_id: "MDEyOk9yZ2FuaXphdGlvbjc5OTI3MTkx", organizations_url: "https://api.github.com/users/octo-org/orgs", received_events_url: "https://api.github.com/users/octo-org/received_events", repos_url: "https://api.github.com/users/octo-org/repos", site_admin: false, starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", type: "Organization", url: "https://api.github.com/users/octo-org" }, private: true, pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", url: "https://api.github.com/repos/octo-org/octo-repo" }, head_sha: "5779607b49aab1200488439f02372c57b4f75444", html_url: "https://github.com/octo-org/octo-repo/actions/runs/1589141559", id: 1589141559, jobs_url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559/jobs", logs_url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559/logs", name: "Manually triggered workflow", node_id: "WFR_kwLOF6lyTM5euGA3", previous_attempt_url: null, pull_requests: [], repository: { archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", description: null, downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", fork: false, forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", full_name: "octo-org/octo-repo", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", html_url: "https://github.com/octo-org/octo-repo", id: 396980812, issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", name: "octo-repo", node_id: "MDEwOlJlcG9zaXRvcnkzOTY5ODA4MTI=", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", owner: { avatar_url: "https://avatars.githubusercontent.com/u/79927191?v=4", events_url: "https://api.github.com/users/octo-org/events{/privacy}", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", gravatar_id: "", html_url: "https://github.com/octo-org", id: 79927191, login: "octo-org", node_id: "MDEyOk9yZ2FuaXphdGlvbjc5OTI3MTkx", organizations_url: "https://api.github.com/users/octo-org/orgs", received_events_url: "https://api.github.com/users/octo-org/received_events", repos_url: "https://api.github.com/users/octo-org/repos", site_admin: false, starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", type: "Organization", url: "https://api.github.com/users/octo-org" }, private: true, pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", url: "https://api.github.com/repos/octo-org/octo-repo" }, rerun_url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559/rerun", run_attempt: 1, run_number: 36, run_started_at: "2021-12-16T19:37:22Z", status: "queued", updated_at: "2021-12-16T19:37:22Z", url: "https://api.github.com/repos/octo-org/octo-repo/actions/runs/1589141559", workflow_id: 16340987, workflow_url: "https://api.github.com/repos/octo-org/octo-repo/actions/workflows/16340987" } } };

// data/webhooks/merge_group.json
var merge_group_default = { actions: ["checks_requested"], payload: { action: "checks_requested", merge_group: { head_sha: "2ffea6db159f6b6c47a24e778fb9ef40cf6b1c7d", head_ref: "refs/heads/gh-readonly-queue/main/pr-104-929f8209d40f77f4abc622a499c93a83babdbe64", base_sha: "380387fbc80638b734a49e1be1c4dfec1c01b33c", base_ref: "refs/heads/main", head_commit: { id: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", tree_id: "31b122c26a97cf9af023e9ddab94a82c6e77b0ea", message: "Merge pull request #2048 from octo-repo/update-readme\n\nUpdate README.md", timestamp: "2019-05-15T15:20:30Z", author: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com" }, committer: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com" } } }, repository: { id: 17273051, node_id: "MDEwOlJlcG9zaXRvcnkxNzI3MzA1MQ==", name: "octo-repo", full_name: "octo-org/octo-repo", private: true, owner: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", gravatar_id: "", url: "https://api.github.com/users/octo-org", html_url: "https://github.com/octo-org", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", organizations_url: "https://api.github.com/users/octo-org/orgs", repos_url: "https://api.github.com/users/octo-org/repos", events_url: "https://api.github.com/users/octo-org/events{/privacy}", received_events_url: "https://api.github.com/users/octo-org/received_events", type: "Organization", site_admin: false }, html_url: "https://github.com/octo-org/octo-repo", description: "My first repo on GitHub!", fork: false, url: "https://api.github.com/repos/octo-org/octo-repo", forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", created_at: "2014-02-28T02:42:51Z", updated_at: "2021-03-11T14:54:13Z", pushed_at: "2021-03-11T14:54:10Z", git_url: "git://github.com/octo-org/octo-repo.git", ssh_url: "org-6811672@github.com:octo-org/octo-repo.git", clone_url: "https://github.com/octo-org/octo-repo.git", svn_url: "https://github.com/octo-org/octo-repo", homepage: "", size: 300, stargazers_count: 0, watchers_count: 0, language: "JavaScript", has_issues: true, has_projects: false, has_downloads: true, has_wiki: false, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 39, license: null, forks: 0, open_issues: 39, watchers: 0, default_branch: "main" }, organization: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", url: "https://api.github.com/orgs/octo-org", repos_url: "https://api.github.com/orgs/octo-org/repos", events_url: "https://api.github.com/orgs/octo-org/events", hooks_url: "https://api.github.com/orgs/octo-org/hooks", issues_url: "https://api.github.com/orgs/octo-org/issues", members_url: "https://api.github.com/orgs/octo-org/members{/member}", public_members_url: "https://api.github.com/orgs/octo-org/public_members{/member}", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", description: "Working better together!" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, installation: { id: 1, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=" } } };

// data/webhooks/repository_dispatch.json
var repository_dispatch_default = { actions: ["on-demand-test"], payload: { action: "on-demand-test", branch: "master", client_payload: {}, repository: { id: 17273051, node_id: "MDEwOlJlcG9zaXRvcnkxNzI3MzA1MQ==", name: "octo-repo", full_name: "octo-org/octo-repo", private: true, owner: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", avatar_url: "https://avatars3.githubusercontent.com/u/6811672?v=4", gravatar_id: "", url: "https://api.github.com/users/octo-org", html_url: "https://github.com/octo-org", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", organizations_url: "https://api.github.com/users/octo-org/orgs", repos_url: "https://api.github.com/users/octo-org/repos", events_url: "https://api.github.com/users/octo-org/events{/privacy}", received_events_url: "https://api.github.com/users/octo-org/received_events", type: "Organization", site_admin: false }, html_url: "https://github.com/octo-org/octo-repo", description: "My first repo on GitHub!", fork: false, url: "https://api.github.com/repos/octo-org/octo-repo", forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", created_at: "2014-02-28T02:42:51Z", updated_at: "2018-10-10T15:58:51Z", pushed_at: "2018-10-10T15:58:47Z", git_url: "git://github.com/octo-org/octo-repo.git", ssh_url: "git@github.com:octo-org/octo-repo.git", clone_url: "https://github.com/octo-org/octo-repo.git", svn_url: "https://github.com/octo-org/octo-repo", homepage: "", size: 59, stargazers_count: 0, watchers_count: 0, language: "JavaScript", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: false, forks_count: 1, mirror_url: null, archived: false, open_issues_count: 23, license: null, forks: 1, open_issues: 23, watchers: 0, default_branch: "master" }, organization: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", url: "https://api.github.com/orgs/octo-org", repos_url: "https://api.github.com/orgs/octo-org/repos", events_url: "https://api.github.com/orgs/octo-org/events", hooks_url: "https://api.github.com/orgs/octo-org/hooks", issues_url: "https://api.github.com/orgs/octo-org/issues", members_url: "https://api.github.com/orgs/octo-org/members{/member}", public_members_url: "https://api.github.com/orgs/octo-org/public_members{/member}", avatar_url: "https://avatars3.githubusercontent.com/u/6811672?v=4", description: "Working better together!" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, installation: { id: 375706, node_id: "MDIzOkludGVncmF0aW9uSW5zdGFsbGF0aW9uMzc1NzA2" } } };

// data/webhooks/discussion.json
var discussion_default = { actions: ["answered", "category_changed", "created", "edited", "labeled", "locked", "pinned", "transferred", "unanswered", "unlabeled", "unlocked"], payload: { action: "created", discussion: { repository_url: "https://api.github.com/repos/octo-org/octo-repo", category: { id: 32784361, node_id: "DIC_kwAqGA", repository_id: 17273051, emoji: ":speech_balloon:", name: "General", description: "Chat about anything and everything here", created_at: "2021-03-24T12:41:54.000-05:00", updated_at: "2021-03-24T12:41:54.000-05:00", slug: "general", is_answerable: false }, answer_html_url: null, answer_chosen_at: null, answer_chosen_by: null, html_url: "https://github.com/octo-org/octo-repo/discussions/90", id: 3297442, node_id: "MDEwOkRpc2N1c3Npb24zMjk3NDQy", number: 90, title: "Welcome to discussions!", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, state: "open", locked: false, comments: 0, created_at: "2021-03-29T14:16:08Z", updated_at: "2021-03-29T14:16:08Z", author_association: "COLLABORATOR", active_lock_reason: null, body: "We're glad to have you here!" }, repository: { id: 17273051, node_id: "MDEwOlJlcG9zaXRvcnkxNzI3MzA1MQ==", name: "octo-repo", full_name: "octo-org/octo-repo", private: true, owner: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", gravatar_id: "", url: "https://api.github.com/users/octo-org", html_url: "https://github.com/octo-org", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", organizations_url: "https://api.github.com/users/octo-org/orgs", repos_url: "https://api.github.com/users/octo-org/repos", events_url: "https://api.github.com/users/octo-org/events{/privacy}", received_events_url: "https://api.github.com/users/octo-org/received_events", type: "Organization", site_admin: false }, html_url: "https://github.com/octo-org/octo-repo", description: "My first repo on GitHub!", fork: false, url: "https://api.github.com/repos/octo-org/octo-repo", forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", created_at: "2014-02-28T02:42:51Z", updated_at: "2021-03-11T14:54:13Z", pushed_at: "2021-03-11T14:54:10Z", git_url: "git://github.com/octo-org/octo-repo.git", ssh_url: "org-6811672@github.com:octo-org/octo-repo.git", clone_url: "https://github.com/octo-org/octo-repo.git", svn_url: "https://github.com/octo-org/octo-repo", homepage: "", size: 300, stargazers_count: 0, watchers_count: 0, language: "JavaScript", has_issues: true, has_projects: false, has_downloads: true, has_wiki: false, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 39, license: null, forks: 0, open_issues: 39, watchers: 0, default_branch: "main" }, organization: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", url: "https://api.github.com/orgs/octo-org", repos_url: "https://api.github.com/orgs/octo-org/repos", events_url: "https://api.github.com/orgs/octo-org/events", hooks_url: "https://api.github.com/orgs/octo-org/hooks", issues_url: "https://api.github.com/orgs/octo-org/issues", members_url: "https://api.github.com/orgs/octo-org/members{/member}", public_members_url: "https://api.github.com/orgs/octo-org/public_members{/member}", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", description: "Working better together!" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/discussion_comment.json
var discussion_comment_default = { actions: ["created", "deleted", "edited"], payload: { action: "created", comment: { id: 544078, node_id: "MDE3OkRpc2N1c3Npb25Db21tZW50NTQ0MDc4", html_url: "https://github.com/octo-org/octo-repo/discussions/90#discussioncomment-544078", parent_id: null, child_comment_count: 0, repository_url: "octo-org/octo-repo", discussion_id: 3297442, author_association: "COLLABORATOR", user: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, created_at: "2021-03-29T14:16:31Z", updated_at: "2021-03-29T14:16:31Z", body: "I have so many questions to ask you!" }, discussion: { repository_url: "https://api.github.com/repos/octo-org/octo-repo", category: { id: 32784361, node_id: "DIC_kwAqGA", repository_id: 17273051, emoji: ":speech_balloon:", name: "General", description: "Chat about anything and everything here", created_at: "2021-03-24T12:41:54.000-05:00", updated_at: "2021-03-24T12:41:54.000-05:00", slug: "general", is_answerable: false }, answer_html_url: null, answer_chosen_at: null, answer_chosen_by: null, html_url: "https://github.com/octo-org/octo-repo/discussions/90", id: 3297442, node_id: "MDEwOkRpc2N1c3Npb24zMjk3NDQy", number: 90, title: "Welcome to discussions!", user: { login: "Codertocat", id: 14935376, node_id: "MDQ6VXNlcjE0OTM1Mzc2", avatar_url: "https://avatars.githubusercontent.com/u/14935376?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: true }, state: "open", locked: false, comments: 1, created_at: "2021-03-29T14:16:08Z", updated_at: "2021-03-29T14:16:31Z", author_association: "COLLABORATOR", active_lock_reason: null, body: "We're glad to have you here!" }, repository: { id: 17273051, node_id: "MDEwOlJlcG9zaXRvcnkxNzI3MzA1MQ==", name: "octo-repo", full_name: "octo-org/octo-repo", private: true, owner: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", gravatar_id: "", url: "https://api.github.com/users/octo-org", html_url: "https://github.com/octo-org", followers_url: "https://api.github.com/users/octo-org/followers", following_url: "https://api.github.com/users/octo-org/following{/other_user}", gists_url: "https://api.github.com/users/octo-org/gists{/gist_id}", starred_url: "https://api.github.com/users/octo-org/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/octo-org/subscriptions", organizations_url: "https://api.github.com/users/octo-org/orgs", repos_url: "https://api.github.com/users/octo-org/repos", events_url: "https://api.github.com/users/octo-org/events{/privacy}", received_events_url: "https://api.github.com/users/octo-org/received_events", type: "Organization", site_admin: false }, html_url: "https://github.com/octo-org/octo-repo", description: "My first repo on GitHub!", fork: false, url: "https://api.github.com/repos/octo-org/octo-repo", forks_url: "https://api.github.com/repos/octo-org/octo-repo/forks", keys_url: "https://api.github.com/repos/octo-org/octo-repo/keys{/key_id}", collaborators_url: "https://api.github.com/repos/octo-org/octo-repo/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/octo-org/octo-repo/teams", hooks_url: "https://api.github.com/repos/octo-org/octo-repo/hooks", issue_events_url: "https://api.github.com/repos/octo-org/octo-repo/issues/events{/number}", events_url: "https://api.github.com/repos/octo-org/octo-repo/events", assignees_url: "https://api.github.com/repos/octo-org/octo-repo/assignees{/user}", branches_url: "https://api.github.com/repos/octo-org/octo-repo/branches{/branch}", tags_url: "https://api.github.com/repos/octo-org/octo-repo/tags", blobs_url: "https://api.github.com/repos/octo-org/octo-repo/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/octo-org/octo-repo/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/octo-org/octo-repo/git/refs{/sha}", trees_url: "https://api.github.com/repos/octo-org/octo-repo/git/trees{/sha}", statuses_url: "https://api.github.com/repos/octo-org/octo-repo/statuses/{sha}", languages_url: "https://api.github.com/repos/octo-org/octo-repo/languages", stargazers_url: "https://api.github.com/repos/octo-org/octo-repo/stargazers", contributors_url: "https://api.github.com/repos/octo-org/octo-repo/contributors", subscribers_url: "https://api.github.com/repos/octo-org/octo-repo/subscribers", subscription_url: "https://api.github.com/repos/octo-org/octo-repo/subscription", commits_url: "https://api.github.com/repos/octo-org/octo-repo/commits{/sha}", git_commits_url: "https://api.github.com/repos/octo-org/octo-repo/git/commits{/sha}", comments_url: "https://api.github.com/repos/octo-org/octo-repo/comments{/number}", issue_comment_url: "https://api.github.com/repos/octo-org/octo-repo/issues/comments{/number}", contents_url: "https://api.github.com/repos/octo-org/octo-repo/contents/{+path}", compare_url: "https://api.github.com/repos/octo-org/octo-repo/compare/{base}...{head}", merges_url: "https://api.github.com/repos/octo-org/octo-repo/merges", archive_url: "https://api.github.com/repos/octo-org/octo-repo/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/octo-org/octo-repo/downloads", issues_url: "https://api.github.com/repos/octo-org/octo-repo/issues{/number}", pulls_url: "https://api.github.com/repos/octo-org/octo-repo/pulls{/number}", milestones_url: "https://api.github.com/repos/octo-org/octo-repo/milestones{/number}", notifications_url: "https://api.github.com/repos/octo-org/octo-repo/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/octo-org/octo-repo/labels{/name}", releases_url: "https://api.github.com/repos/octo-org/octo-repo/releases{/id}", deployments_url: "https://api.github.com/repos/octo-org/octo-repo/deployments", created_at: "2014-02-28T02:42:51Z", updated_at: "2021-03-11T14:54:13Z", pushed_at: "2021-03-11T14:54:10Z", git_url: "git://github.com/octo-org/octo-repo.git", ssh_url: "org-6811672@github.com:octo-org/octo-repo.git", clone_url: "https://github.com/octo-org/octo-repo.git", svn_url: "https://github.com/octo-org/octo-repo", homepage: "", size: 300, stargazers_count: 0, watchers_count: 0, language: "JavaScript", has_issues: true, has_projects: false, has_downloads: true, has_wiki: false, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 39, license: null, forks: 0, open_issues: 39, watchers: 0, default_branch: "main" }, organization: { login: "octo-org", id: 6811672, node_id: "MDEyOk9yZ2FuaXphdGlvbjY4MTE2NzI=", url: "https://api.github.com/orgs/octo-org", repos_url: "https://api.github.com/orgs/octo-org/repos", events_url: "https://api.github.com/orgs/octo-org/events", hooks_url: "https://api.github.com/orgs/octo-org/hooks", issues_url: "https://api.github.com/orgs/octo-org/issues", members_url: "https://api.github.com/orgs/octo-org/members{/member}", public_members_url: "https://api.github.com/orgs/octo-org/public_members{/member}", avatar_url: "https://avatars.githubusercontent.com/u/6811672?v=4", description: "Working better together!" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/label.json
var label_default = { actions: ["created", "deleted", "edited"], payload: { action: "created", label: { id: 1362937026, node_id: "MDU6TGFiZWwxMzYyOTM3MDI2", url: "https://api.github.com/repos/Codertocat/Hello-World/labels/:bug:%20Bugfix", name: ":bug: Bugfix", description: "Fixes a bug", color: "cb1f00", default: false }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:21:03Z", pushed_at: "2019-05-15T15:20:57Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: "", size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master", is_template: false, topics: [], visibility: "public", web_commit_signoff_required: false, custom_properties: {} }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/fork.json
var fork_default = { actions: [], payload: { forkee: { id: 186853261, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMyNjE=", name: "Hello-World", full_name: "Octocoders/Hello-World", private: false, owner: { login: "Octocoders", id: 38302899, node_id: "MDEyOk9yZ2FuaXphdGlvbjM4MzAyODk5", avatar_url: "https://avatars1.githubusercontent.com/u/38302899?v=4", gravatar_id: "", url: "https://api.github.com/users/Octocoders", html_url: "https://github.com/Octocoders", followers_url: "https://api.github.com/users/Octocoders/followers", following_url: "https://api.github.com/users/Octocoders/following{/other_user}", gists_url: "https://api.github.com/users/Octocoders/gists{/gist_id}", starred_url: "https://api.github.com/users/Octocoders/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Octocoders/subscriptions", organizations_url: "https://api.github.com/users/Octocoders/orgs", repos_url: "https://api.github.com/users/Octocoders/repos", events_url: "https://api.github.com/users/Octocoders/events{/privacy}", received_events_url: "https://api.github.com/users/Octocoders/received_events", type: "Organization", site_admin: false }, html_url: "https://github.com/Octocoders/Hello-World", description: null, fork: true, url: "https://api.github.com/repos/Octocoders/Hello-World", forks_url: "https://api.github.com/repos/Octocoders/Hello-World/forks", keys_url: "https://api.github.com/repos/Octocoders/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Octocoders/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Octocoders/Hello-World/teams", hooks_url: "https://api.github.com/repos/Octocoders/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Octocoders/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Octocoders/Hello-World/events", assignees_url: "https://api.github.com/repos/Octocoders/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Octocoders/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Octocoders/Hello-World/tags", blobs_url: "https://api.github.com/repos/Octocoders/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Octocoders/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Octocoders/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Octocoders/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Octocoders/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Octocoders/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Octocoders/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Octocoders/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Octocoders/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Octocoders/Hello-World/subscription", commits_url: "https://api.github.com/repos/Octocoders/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Octocoders/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Octocoders/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Octocoders/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Octocoders/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Octocoders/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Octocoders/Hello-World/merges", archive_url: "https://api.github.com/repos/Octocoders/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Octocoders/Hello-World/downloads", issues_url: "https://api.github.com/repos/Octocoders/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Octocoders/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Octocoders/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Octocoders/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Octocoders/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Octocoders/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Octocoders/Hello-World/deployments", created_at: "2019-05-15T15:20:42Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Octocoders/Hello-World.git", ssh_url: "git@github.com:Octocoders/Hello-World.git", clone_url: "https://github.com/Octocoders/Hello-World.git", svn_url: "https://github.com/Octocoders/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: false, has_projects: true, has_downloads: true, has_wiki: true, has_pages: false, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 0, license: null, forks: 0, open_issues: 0, watchers: 0, default_branch: "master", public: true }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Octocoders", id: 38302899, node_id: "MDEyOk9yZ2FuaXphdGlvbjM4MzAyODk5", avatar_url: "https://avatars1.githubusercontent.com/u/38302899?v=4", gravatar_id: "", url: "https://api.github.com/users/Octocoders", html_url: "https://github.com/Octocoders", followers_url: "https://api.github.com/users/Octocoders/followers", following_url: "https://api.github.com/users/Octocoders/following{/other_user}", gists_url: "https://api.github.com/users/Octocoders/gists{/gist_id}", starred_url: "https://api.github.com/users/Octocoders/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Octocoders/subscriptions", organizations_url: "https://api.github.com/users/Octocoders/orgs", repos_url: "https://api.github.com/users/Octocoders/repos", events_url: "https://api.github.com/users/Octocoders/events{/privacy}", received_events_url: "https://api.github.com/users/Octocoders/received_events", type: "Organization", site_admin: false } } };

// data/webhooks/watch.json
var watch_default = { actions: ["started"], payload: { action: "started", repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:40Z", pushed_at: "2019-05-15T15:20:33Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 1, watchers_count: 1, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 1, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/milestone.json
var milestone_default = { actions: ["closed", "created", "deleted"], payload: { action: "created", milestone: { url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1", html_url: "https://github.com/Codertocat/Hello-World/milestone/1", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones/1/labels", id: 4317517, node_id: "MDk6TWlsZXN0b25lNDMxNzUxNw==", number: 1, title: "v1.0", description: "Add new space flight simulator", creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, open_issues: 0, closed_issues: 0, state: "open", created_at: "2019-05-15T15:20:17Z", updated_at: "2019-05-15T15:20:17Z", due_on: "2019-05-23T07:00:00Z", closed_at: null }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:19:27Z", pushed_at: "2019-05-15T15:20:13Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: null, has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 0, license: null, forks: 0, open_issues: 0, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/check_run.json
var check_run_default = { actions: ["completed", "created", "requested_action", "rerequested"], payload: { action: "created", check_run: { id: 128620228, node_id: "MDg6Q2hlY2tSdW4xMjg2MjAyMjg=", head_sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", external_id: "", url: "https://api.github.com/repos/Codertocat/Hello-World/check-runs/128620228", html_url: "https://github.com/Codertocat/Hello-World/runs/128620228", details_url: "https://octocoders.github.io", status: "queued", conclusion: null, started_at: "2019-05-15T15:21:12Z", completed_at: null, output: { title: null, summary: null, text: null, annotations_count: 0, annotations_url: "https://api.github.com/repos/Codertocat/Hello-World/check-runs/128620228/annotations" }, name: "Octocoders-linter", check_suite: { id: 118578147, node_id: "MDEwOkNoZWNrU3VpdGUxMTg1NzgxNDc=", head_branch: "changes", head_sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", status: "queued", conclusion: null, url: "https://api.github.com/repos/Codertocat/Hello-World/check-suites/118578147", before: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", after: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", pull_requests: [{ url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, number: 2, head: { ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } }, base: { ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } } }], app: { id: 29310, node_id: "MDM6QXBwMjkzMTA=", owner: { login: "Octocoders", id: 38302899, node_id: "MDEyOk9yZ2FuaXphdGlvbjM4MzAyODk5", avatar_url: "https://avatars1.githubusercontent.com/u/38302899?v=4", gravatar_id: "", url: "https://api.github.com/users/Octocoders", html_url: "https://github.com/Octocoders", followers_url: "https://api.github.com/users/Octocoders/followers", following_url: "https://api.github.com/users/Octocoders/following{/other_user}", gists_url: "https://api.github.com/users/Octocoders/gists{/gist_id}", starred_url: "https://api.github.com/users/Octocoders/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Octocoders/subscriptions", organizations_url: "https://api.github.com/users/Octocoders/orgs", repos_url: "https://api.github.com/users/Octocoders/repos", events_url: "https://api.github.com/users/Octocoders/events{/privacy}", received_events_url: "https://api.github.com/users/Octocoders/received_events", type: "Organization", site_admin: false }, name: "octocoders-linter", description: "", external_url: "https://octocoders.github.io", html_url: "https://github.com/apps/octocoders-linter", created_at: "2019-04-19T19:36:24Z", updated_at: "2019-04-19T19:36:56Z", permissions: { administration: "write", checks: "write", contents: "write", deployments: "write", issues: "write", members: "write", metadata: "read", organization_administration: "write", organization_hooks: "write", organization_plan: "read", organization_projects: "write", organization_user_blocking: "write", pages: "write", pull_requests: "write", repository_hooks: "write", repository_projects: "write", statuses: "write", team_discussions: "write", vulnerability_alerts: "read" }, events: [] }, created_at: "2019-05-15T15:20:31Z", updated_at: "2019-05-15T15:20:31Z" }, app: { id: 29310, node_id: "MDM6QXBwMjkzMTA=", owner: { login: "Octocoders", id: 38302899, node_id: "MDEyOk9yZ2FuaXphdGlvbjM4MzAyODk5", avatar_url: "https://avatars1.githubusercontent.com/u/38302899?v=4", gravatar_id: "", url: "https://api.github.com/users/Octocoders", html_url: "https://github.com/Octocoders", followers_url: "https://api.github.com/users/Octocoders/followers", following_url: "https://api.github.com/users/Octocoders/following{/other_user}", gists_url: "https://api.github.com/users/Octocoders/gists{/gist_id}", starred_url: "https://api.github.com/users/Octocoders/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Octocoders/subscriptions", organizations_url: "https://api.github.com/users/Octocoders/orgs", repos_url: "https://api.github.com/users/Octocoders/repos", events_url: "https://api.github.com/users/Octocoders/events{/privacy}", received_events_url: "https://api.github.com/users/Octocoders/received_events", type: "Organization", site_admin: false }, name: "octocoders-linter", description: "", external_url: "https://octocoders.github.io", html_url: "https://github.com/apps/octocoders-linter", created_at: "2019-04-19T19:36:24Z", updated_at: "2019-04-19T19:36:56Z", permissions: { administration: "write", checks: "write", contents: "write", deployments: "write", issues: "write", members: "write", metadata: "read", organization_administration: "write", organization_hooks: "write", organization_plan: "read", organization_projects: "write", organization_user_blocking: "write", pages: "write", pull_requests: "write", repository_hooks: "write", repository_projects: "write", statuses: "write", team_discussions: "write", vulnerability_alerts: "read" }, events: [] }, pull_requests: [{ url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, number: 2, head: { ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } }, base: { ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } } }], deployment: { url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/326191728", id: 326191728, node_id: "MDEwOkRlcGxveW1lbnQzMjYxOTE3Mjg=", task: "deploy", original_environment: "lab", environment: "lab", description: null, created_at: "2021-02-18T08:22:48Z", updated_at: "2021-02-18T09:47:16Z", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/326191728/statuses", repository_url: "https://api.github.com/repos/Codertocat/Hello-World" } }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:21:03Z", pushed_at: "2019-05-15T15:20:57Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/check_suite.json
var check_suite_default = { actions: ["completed", "requested", "rerequested"], payload: { action: "completed", check_suite: { id: 118578147, node_id: "MDEwOkNoZWNrU3VpdGUxMTg1NzgxNDc=", head_branch: "changes", head_sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", status: "completed", conclusion: "success", url: "https://api.github.com/repos/Codertocat/Hello-World/check-suites/118578147", before: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", after: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", pull_requests: [{ url: "https://api.github.com/repos/Codertocat/Hello-World/pulls/2", id: 279147437, number: 2, head: { ref: "changes", sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } }, base: { ref: "master", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", repo: { id: 186853002, url: "https://api.github.com/repos/Codertocat/Hello-World", name: "Hello-World" } } }], app: { id: 29310, node_id: "MDM6QXBwMjkzMTA=", owner: { login: "Octocoders", id: 38302899, node_id: "MDEyOk9yZ2FuaXphdGlvbjM4MzAyODk5", avatar_url: "https://avatars1.githubusercontent.com/u/38302899?v=4", gravatar_id: "", url: "https://api.github.com/users/Octocoders", html_url: "https://github.com/Octocoders", followers_url: "https://api.github.com/users/Octocoders/followers", following_url: "https://api.github.com/users/Octocoders/following{/other_user}", gists_url: "https://api.github.com/users/Octocoders/gists{/gist_id}", starred_url: "https://api.github.com/users/Octocoders/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Octocoders/subscriptions", organizations_url: "https://api.github.com/users/Octocoders/orgs", repos_url: "https://api.github.com/users/Octocoders/repos", events_url: "https://api.github.com/users/Octocoders/events{/privacy}", received_events_url: "https://api.github.com/users/Octocoders/received_events", type: "Organization", site_admin: false }, name: "octocoders-linter", description: "", external_url: "https://octocoders.github.io", html_url: "https://github.com/apps/octocoders-linter", created_at: "2019-04-19T19:36:24Z", updated_at: "2019-04-19T19:36:56Z", permissions: { administration: "write", checks: "write", contents: "write", deployments: "write", issues: "write", members: "write", metadata: "read", organization_administration: "write", organization_hooks: "write", organization_plan: "read", organization_projects: "write", organization_user_blocking: "write", pages: "write", pull_requests: "write", repository_hooks: "write", repository_projects: "write", statuses: "write", team_discussions: "write", vulnerability_alerts: "read" }, events: [] }, created_at: "2019-05-15T15:20:31Z", updated_at: "2019-05-15T15:21:14Z", latest_check_runs_count: 1, check_runs_url: "https://api.github.com/repos/Codertocat/Hello-World/check-suites/118578147/check-runs", head_commit: { id: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", tree_id: "31b122c26a97cf9af023e9ddab94a82c6e77b0ea", message: "Update README.md", timestamp: "2019-05-15T15:20:30Z", author: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com" }, committer: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com" } } }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:21:14Z", pushed_at: "2019-05-15T15:20:57Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 0, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 0, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/deployment.json
var deployment_default = { actions: ["created"], payload: { action: "created", deployment: { url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746", id: 145988746, node_id: "MDEwOkRlcGxveW1lbnQxNDU5ODg3NDY=", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", ref: "master", task: "deploy", payload: {}, original_environment: "production", environment: "production", description: null, creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, created_at: "2019-05-15T15:20:53Z", updated_at: "2019-05-15T15:20:53Z", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746/statuses", repository_url: "https://api.github.com/repos/Codertocat/Hello-World" }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:52Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/deployment_status.json
var deployment_status_default = { actions: ["created"], payload: { action: "created", deployment_status: { url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746/statuses/209916254", id: 209916254, node_id: "MDE2OkRlcGxveW1lbnRTdGF0dXMyMDk5MTYyNTQ=", state: "success", creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, description: "", environment: "production", target_url: "", created_at: "2019-05-15T15:20:55Z", updated_at: "2019-05-15T15:20:55Z", deployment_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746", repository_url: "https://api.github.com/repos/Codertocat/Hello-World" }, deployment: { url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746", id: 145988746, node_id: "MDEwOkRlcGxveW1lbnQxNDU5ODg3NDY=", sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", ref: "master", task: "deploy", payload: {}, original_environment: "production", environment: "production", description: null, creator: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, created_at: "2019-05-15T15:20:53Z", updated_at: "2019-05-15T15:20:55Z", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments/145988746/statuses", repository_url: "https://api.github.com/repos/Codertocat/Hello-World" }, repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:52Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// data/webhooks/status.json
var status_default = { actions: [], payload: { id: 6805126730, sha: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", name: "Codertocat/Hello-World", target_url: null, context: "default", description: null, state: "success", commit: { sha: "6113728f27ae82c7b1a177c8d03f9e96e0adf246", node_id: "MDY6Q29tbWl0MTg2ODUzMDAyOjYxMTM3MjhmMjdhZTgyYzdiMWExNzdjOGQwM2Y5ZTk2ZTBhZGYyNDY=", commit: { author: { name: "Codertocat", email: "21031067+Codertocat@users.noreply.github.com", date: "2019-05-15T15:19:25Z" }, committer: { name: "GitHub", email: "noreply@github.com", date: "2019-05-15T15:19:25Z" }, message: "Initial commit", tree: { sha: "1b13fc88733f95cc8cb16170f6990ef30d78acf4", url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees/1b13fc88733f95cc8cb16170f6990ef30d78acf4" }, url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits/6113728f27ae82c7b1a177c8d03f9e96e0adf246", comment_count: 1, verification: { verified: true, reason: "valid", signature: "-----BEGIN PGP SIGNATURE-----\n\nwsBcBAABCAAQBQJc3C39CRBK7hj4Ov3rIwAAdHIIABvaC0PQWgtUDQ5cz8ISR/Gf\npQYSuDMeeRa90wXzafPYowzID+UNU2eaRD4ak1bhb7kYVsZnPhUt5jTLKzr4Zuq8\nvt9ucrUvLDQWUZe2jX4wipM8ykWIlDho+9OAoocbVAn0kPBZEqJK74fH0Uj8vUfw\nIX71oq7XYsd2iGi9iMrYczr3aTe4EyQoYj/R+aAuRlLwU5LVciuyl0AmxMQXJ+qn\nowTpROWvXb1HijQZgx2x1lAEBzvahOiayOsJ+ZZ1DZX1lpXaSoeAjth1t2ckHlWW\n907fehmtX2cfccfrTLJC55QdhWU305ZtUoNRTp7TrdUecXnQcWKFcMmE/Yx1vps=\n=LQlK\n-----END PGP SIGNATURE-----\n", payload: "tree 1b13fc88733f95cc8cb16170f6990ef30d78acf4\nauthor Codertocat <21031067+Codertocat@users.noreply.github.com> 1557933565 -0500\ncommitter GitHub <noreply@github.com> 1557933565 -0500\n\nInitial commit" } }, url: "https://api.github.com/repos/Codertocat/Hello-World/commits/6113728f27ae82c7b1a177c8d03f9e96e0adf246", html_url: "https://github.com/Codertocat/Hello-World/commit/6113728f27ae82c7b1a177c8d03f9e96e0adf246", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/commits/6113728f27ae82c7b1a177c8d03f9e96e0adf246/comments", author: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, committer: { login: "web-flow", id: 19864447, node_id: "MDQ6VXNlcjE5ODY0NDQ3", avatar_url: "https://avatars3.githubusercontent.com/u/19864447?v=4", gravatar_id: "", url: "https://api.github.com/users/web-flow", html_url: "https://github.com/web-flow", followers_url: "https://api.github.com/users/web-flow/followers", following_url: "https://api.github.com/users/web-flow/following{/other_user}", gists_url: "https://api.github.com/users/web-flow/gists{/gist_id}", starred_url: "https://api.github.com/users/web-flow/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/web-flow/subscriptions", organizations_url: "https://api.github.com/users/web-flow/orgs", repos_url: "https://api.github.com/users/web-flow/repos", events_url: "https://api.github.com/users/web-flow/events{/privacy}", received_events_url: "https://api.github.com/users/web-flow/received_events", type: "User", site_admin: false }, parents: [] }, branches: [{ name: "master", commit: { sha: "f95f852bd8fca8fcc58a9a2d6c842781e32a215e", url: "https://api.github.com/repos/Codertocat/Hello-World/commits/f95f852bd8fca8fcc58a9a2d6c842781e32a215e" }, protected: false }, { name: "changes", commit: { sha: "ec26c3e57ca3a959ca5aad62de7213c562f8c821", url: "https://api.github.com/repos/Codertocat/Hello-World/commits/ec26c3e57ca3a959ca5aad62de7213c562f8c821" }, protected: false }, { name: "gh-pages", commit: { sha: "507fc9acd0d04ac4a9db87d12cb228c052cd813a", url: "https://api.github.com/repos/Codertocat/Hello-World/commits/507fc9acd0d04ac4a9db87d12cb228c052cd813a" }, protected: false }], created_at: "2019-05-15T15:20:55+00:00", updated_at: "2019-05-15T15:20:55+00:00", repository: { id: 186853002, node_id: "MDEwOlJlcG9zaXRvcnkxODY4NTMwMDI=", name: "Hello-World", full_name: "Codertocat/Hello-World", private: false, owner: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false }, html_url: "https://github.com/Codertocat/Hello-World", description: null, fork: false, url: "https://api.github.com/repos/Codertocat/Hello-World", forks_url: "https://api.github.com/repos/Codertocat/Hello-World/forks", keys_url: "https://api.github.com/repos/Codertocat/Hello-World/keys{/key_id}", collaborators_url: "https://api.github.com/repos/Codertocat/Hello-World/collaborators{/collaborator}", teams_url: "https://api.github.com/repos/Codertocat/Hello-World/teams", hooks_url: "https://api.github.com/repos/Codertocat/Hello-World/hooks", issue_events_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/events{/number}", events_url: "https://api.github.com/repos/Codertocat/Hello-World/events", assignees_url: "https://api.github.com/repos/Codertocat/Hello-World/assignees{/user}", branches_url: "https://api.github.com/repos/Codertocat/Hello-World/branches{/branch}", tags_url: "https://api.github.com/repos/Codertocat/Hello-World/tags", blobs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/blobs{/sha}", git_tags_url: "https://api.github.com/repos/Codertocat/Hello-World/git/tags{/sha}", git_refs_url: "https://api.github.com/repos/Codertocat/Hello-World/git/refs{/sha}", trees_url: "https://api.github.com/repos/Codertocat/Hello-World/git/trees{/sha}", statuses_url: "https://api.github.com/repos/Codertocat/Hello-World/statuses/{sha}", languages_url: "https://api.github.com/repos/Codertocat/Hello-World/languages", stargazers_url: "https://api.github.com/repos/Codertocat/Hello-World/stargazers", contributors_url: "https://api.github.com/repos/Codertocat/Hello-World/contributors", subscribers_url: "https://api.github.com/repos/Codertocat/Hello-World/subscribers", subscription_url: "https://api.github.com/repos/Codertocat/Hello-World/subscription", commits_url: "https://api.github.com/repos/Codertocat/Hello-World/commits{/sha}", git_commits_url: "https://api.github.com/repos/Codertocat/Hello-World/git/commits{/sha}", comments_url: "https://api.github.com/repos/Codertocat/Hello-World/comments{/number}", issue_comment_url: "https://api.github.com/repos/Codertocat/Hello-World/issues/comments{/number}", contents_url: "https://api.github.com/repos/Codertocat/Hello-World/contents/{+path}", compare_url: "https://api.github.com/repos/Codertocat/Hello-World/compare/{base}...{head}", merges_url: "https://api.github.com/repos/Codertocat/Hello-World/merges", archive_url: "https://api.github.com/repos/Codertocat/Hello-World/{archive_format}{/ref}", downloads_url: "https://api.github.com/repos/Codertocat/Hello-World/downloads", issues_url: "https://api.github.com/repos/Codertocat/Hello-World/issues{/number}", pulls_url: "https://api.github.com/repos/Codertocat/Hello-World/pulls{/number}", milestones_url: "https://api.github.com/repos/Codertocat/Hello-World/milestones{/number}", notifications_url: "https://api.github.com/repos/Codertocat/Hello-World/notifications{?since,all,participating}", labels_url: "https://api.github.com/repos/Codertocat/Hello-World/labels{/name}", releases_url: "https://api.github.com/repos/Codertocat/Hello-World/releases{/id}", deployments_url: "https://api.github.com/repos/Codertocat/Hello-World/deployments", created_at: "2019-05-15T15:19:25Z", updated_at: "2019-05-15T15:20:41Z", pushed_at: "2019-05-15T15:20:52Z", git_url: "git://github.com/Codertocat/Hello-World.git", ssh_url: "git@github.com:Codertocat/Hello-World.git", clone_url: "https://github.com/Codertocat/Hello-World.git", svn_url: "https://github.com/Codertocat/Hello-World", homepage: null, size: 0, stargazers_count: 0, watchers_count: 0, language: "Ruby", has_issues: true, has_projects: true, has_downloads: true, has_wiki: true, has_pages: true, forks_count: 1, mirror_url: null, archived: false, disabled: false, open_issues_count: 2, license: null, forks: 1, open_issues: 2, watchers: 0, default_branch: "master" }, sender: { login: "Codertocat", id: 21031067, node_id: "MDQ6VXNlcjIxMDMxMDY3", avatar_url: "https://avatars1.githubusercontent.com/u/21031067?v=4", gravatar_id: "", url: "https://api.github.com/users/Codertocat", html_url: "https://github.com/Codertocat", followers_url: "https://api.github.com/users/Codertocat/followers", following_url: "https://api.github.com/users/Codertocat/following{/other_user}", gists_url: "https://api.github.com/users/Codertocat/gists{/gist_id}", starred_url: "https://api.github.com/users/Codertocat/starred{/owner}{/repo}", subscriptions_url: "https://api.github.com/users/Codertocat/subscriptions", organizations_url: "https://api.github.com/users/Codertocat/orgs", repos_url: "https://api.github.com/users/Codertocat/repos", events_url: "https://api.github.com/users/Codertocat/events{/privacy}", received_events_url: "https://api.github.com/users/Codertocat/received_events", type: "User", site_admin: false } } };

// src/ui/payloads.ts
var PAYLOADS = {
  push: push_default,
  pull_request: pull_request_default,
  pull_request_target: pull_request_target_default,
  pull_request_review: pull_request_review_default,
  pull_request_review_comment: pull_request_review_comment_default,
  workflow_dispatch: workflow_dispatch_default,
  schedule: schedule_default,
  release: release_default,
  issues: issues_default,
  issue_comment: issue_comment_default,
  create: create_default,
  delete: delete_default,
  workflow_run: workflow_run_default,
  merge_group: merge_group_default,
  repository_dispatch: repository_dispatch_default,
  discussion: discussion_default,
  discussion_comment: discussion_comment_default,
  label: label_default,
  fork: fork_default,
  watch: watch_default,
  milestone: milestone_default,
  check_run: check_run_default,
  check_suite: check_suite_default,
  deployment: deployment_default,
  deployment_status: deployment_status_default,
  status: status_default
};
var EVENT_ORDER = [
  "push",
  "pull_request",
  "pull_request_target",
  "workflow_dispatch",
  "schedule",
  "release",
  "issues",
  "issue_comment",
  "create",
  "delete",
  "workflow_run",
  "merge_group",
  "repository_dispatch",
  "pull_request_review",
  "pull_request_review_comment",
  "discussion",
  "discussion_comment",
  "label",
  "fork",
  "watch",
  "milestone",
  "check_run",
  "check_suite",
  "deployment",
  "deployment_status",
  "status"
];

// src/ui/scenario.ts
var DEFAULT_STATE = {
  event: "push",
  action: "",
  refType: "branch",
  branch: "main",
  tag: "v1.0.0",
  headBranch: "feature/login",
  baseBranch: "main",
  fork: false,
  draft: false,
  labels: "",
  actor: "octocat",
  repository: "octo-org/octo-repo",
  defaultBranch: "main",
  changedFiles: "src/app.ts",
  commitMessage: "Update app",
  inputs: {},
  forcedResults: {},
  cancelled: false,
  jobOutputs: {}
};
var PR_EVENTS = /* @__PURE__ */ new Set(["pull_request", "pull_request_target", "pull_request_review", "pull_request_review_comment"]);
var LABEL_EVENTS = /* @__PURE__ */ new Set(["pull_request", "pull_request_target", "issues", "issue_comment", "discussion"]);
function defaultAction(event) {
  const actions = PAYLOADS[event]?.actions ?? [];
  if (!actions.length) return "";
  for (const pref of ["opened", "created", "published", "completed", "submitted", "started"]) if (actions.includes(pref)) return pref;
  return actions[0] ?? "";
}
function parseLabels(s) {
  return s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean);
}
function parseFiles(s) {
  return s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);
}
function dispatchInputs(state, workflow) {
  const defs = workflow.events["workflow_dispatch"]?.inputs ?? {};
  const out = {};
  for (const [name, def] of Object.entries(defs)) {
    const raw = state.inputs[name];
    const fallback = def.default;
    const v = raw !== void 0 ? raw : fallback;
    if (def.type === "boolean") out[name] = v === true || v === "true";
    else if (def.type === "number") out[name] = v === void 0 || v === "" ? 0 : Number(v);
    else out[name] = v === void 0 ? "" : String(v);
  }
  return out;
}
function toEngineInputs(state, workflow) {
  const file = PAYLOADS[state.event];
  const payload = file?.payload ?? { repository: {}, sender: {} };
  const isPr = PR_EVENTS.has(state.event);
  const inputs = state.event === "workflow_dispatch" ? dispatchInputs(state, workflow) : {};
  const sc = {
    event: state.event,
    action: state.action || void 0,
    branch: isPr ? state.baseBranch : state.event === "push" && state.refType === "tag" ? void 0 : state.branch,
    tag: state.event === "push" && state.refType === "tag" || state.event === "release" || (state.event === "create" || state.event === "delete") && state.refType === "tag" ? state.tag : void 0,
    headBranch: isPr ? state.headBranch : void 0,
    fork: isPr ? state.fork : void 0,
    draft: isPr ? state.draft : void 0,
    labels: LABEL_EVENTS.has(state.event) ? parseLabels(state.labels) : void 0,
    actor: state.actor || void 0,
    changedFiles: parseFiles(state.changedFiles),
    commitMessage: state.event === "push" ? state.commitMessage : void 0,
    inputs,
    repository: state.repository || void 0,
    defaultBranch: state.defaultBranch || void 0
  };
  const built = buildGithubContext(payload, sc);
  const refType = String(built.github["ref"] ?? "").startsWith("refs/tags/") ? "tag" : "branch";
  const trigger = {
    event: state.event,
    action: state.action || void 0,
    refName: String(built.github["ref_name"] ?? ""),
    refType,
    baseBranch: isPr ? state.baseBranch : void 0,
    changedFiles: parseFiles(state.changedFiles)
  };
  return { github: built.github, inputs: built.inputs, trigger, notes: built.notes };
}

// src/cli.ts
var USAGE = `why-didnt-my-job-run: which of this repository's GitHub Actions jobs would run, and why

Run it inside a git repository. It reads .github/workflows/*.yml and *.yaml from the working tree
(uncommitted edits included), takes the branch, the commit and the changed files from git, and
prints per workflow whether the event starts it, then per job: runs, skipped, fails, cancelled,
blocked (the workflow does not start) or rejected (GitHub refuses the file).

Usage: why-didnt-my-job-run [options]

Event
  --event <name>          push (default), pull_request, pull_request_target, workflow_dispatch,
                          schedule, release, issues, ... (every event the page offers)
  --action <type>         activity type, e.g. opened, labeled, synchronize (default: the page's)
  --branch <name>         the branch GitHub sees: the pushed branch, the pull request's head branch,
                          the branch picked for workflow_dispatch (default: the current branch;
                          for schedule, issues and similar events, the default branch)
  --tag <name>            a tag push (with --event push), or the release's tag
  --base <ref>            push: the commit before the push (default: the head's first parent)
                          pull_request: the branch it targets (default: origin/HEAD)
  --head <ref>            the pushed commit, or the pull request's head (default: HEAD)
  --label <name>          a label on the pull request or issue (repeatable)
  --fork, --draft         the pull request comes from a fork / is a draft
  --actor <login>         github.actor (default: octocat)

Things git cannot know
  --input <key=value>     a workflow_dispatch input (repeatable)
  --output <job.key=value>
                          an output of a job, read by needs.<job>.outputs.<key> (repeatable)
  --var <NAME=value>      a configuration variable, read by vars.NAME (repeatable)
  --fail <job>            that job fails (repeatable). For one job of a matrix, name it as GitHub
                          lists it, "test (linux, 20)", or as test:linux,20

Overrides (normally read from git)
  --sha <sha>             github.sha (default: the head commit)
  --repo <owner/name>     github.repository (default: from the origin remote's URL)
  --default-branch <name> the repository's default branch (default: origin/HEAD)

Output
  --workflow <file>       only this workflow (a path, or a file name in .github/workflows; repeatable)
  --json                  machine-readable output
  --expect-run <job>      exit with 1 unless that job (or matrix combination, named as for --fail)
                          runs; a job you marked with --fail counts, since it starts (repeatable)
  -h, --help              this text

Exit codes: 0 done, and every --expect-run job runs; 1 an --expect-run job does not run;
2 the simulation could not be done (not a git repository, unknown flag, unknown job, ...).`;
var OPTIONS = {
  event: { type: "string" },
  action: { type: "string" },
  branch: { type: "string" },
  tag: { type: "string" },
  base: { type: "string" },
  head: { type: "string" },
  label: { type: "string", multiple: true },
  fork: { type: "boolean" },
  draft: { type: "boolean" },
  actor: { type: "string" },
  input: { type: "string", multiple: true },
  output: { type: "string", multiple: true },
  var: { type: "string", multiple: true },
  fail: { type: "string", multiple: true },
  sha: { type: "string" },
  repo: { type: "string" },
  "default-branch": { type: "string" },
  workflow: { type: "string", multiple: true },
  json: { type: "boolean" },
  "expect-run": { type: "string", multiple: true },
  help: { type: "boolean", short: "h" }
};
var CURRENT_BRANCH_EVENTS = /* @__PURE__ */ new Set(["push", "workflow_dispatch", "workflow_run", "create", "delete"]);
var GITHUB_DIFF_LIMIT = 300;
var UsageError = class extends Error {
};
async function main(argv, io = {}) {
  const out = io.out ?? ((s) => {
    process.stdout.write(s + "\n");
  });
  const err = io.err ?? ((s) => {
    process.stderr.write(s + "\n");
  });
  const cwd = io.cwd ?? process.cwd();
  let values;
  try {
    values = parse(argv);
  } catch (e) {
    err(`why-didnt-my-job-run: ${e.message}
Run with --help for the options.`);
    return 2;
  }
  if (values.help) {
    out(USAGE);
    return 0;
  }
  try {
    const report = await buildReport(values, cwd);
    out(values.json ? JSON.stringify(report, null, 2) : formatReport(report));
    return report.expectations.every((x) => x.runs) ? 0 : 1;
  } catch (e) {
    if (e instanceof UsageError) {
      err(`why-didnt-my-job-run: ${e.message}`);
      return 2;
    }
    throw e;
  }
}
function parse(argv) {
  return parseArgs({ args: argv, options: OPTIONS, strict: true, allowPositionals: false }).values;
}
async function buildReport(values, cwd) {
  const event = values.event ?? "push";
  if (!EVENT_ORDER.includes(event)) throw new UsageError(`--event ${event} is not an event the simulator knows. Known: ${EVENT_ORDER.join(", ")}.`);
  const actions = PAYLOADS[event]?.actions ?? [];
  if (values.action !== void 0 && !actions.includes(values.action)) {
    throw new UsageError(actions.length ? `--action ${values.action} is not an activity type of ${event}. Known: ${actions.join(", ")}.` : `${event} has no activity types, so --action does not apply.`);
  }
  const action = values.action ?? (defaultAction(event) || void 0);
  const inputs = pairs(values.input ?? [], "--input", "=");
  const vars = pairs(values.var ?? [], "--var", "=");
  const outputs = jobOutputs(values.output ?? []);
  const failing = values.fail ?? [];
  const expected = values["expect-run"] ?? [];
  const facts = readRepository(values, cwd, event, action);
  const files = workflowFiles(facts.root, cwd, values.workflow);
  if (!files.length) throw new UsageError(`no workflow files in ${path.join(facts.root, ".github", "workflows")}.`);
  const workflows = [];
  const sims = [];
  const allJobs = /* @__PURE__ */ new Set();
  const failsFound = /* @__PURE__ */ new Set();
  const expectFound = new Map(expected.map((e) => [e, []]));
  let ref = "";
  for (const file of files) {
    const rel = path.relative(facts.root, file).split(path.sep).join("/");
    const wf = await parseWorkflowFile(readFileSync(file, "utf8"), rel);
    const ids = new Set(wf.jobs.map((j) => j.id));
    for (const id of ids) allJobs.add(id);
    const state = {
      ...DEFAULT_STATE,
      event,
      action: action ?? "",
      refType: facts.refType,
      branch: facts.branch,
      tag: facts.tag ?? DEFAULT_STATE.tag,
      headBranch: facts.branch,
      baseBranch: facts.baseBranch ?? facts.defaultBranch,
      fork: Boolean(values.fork),
      draft: Boolean(values.draft),
      labels: (values.label ?? []).join("\n"),
      actor: values.actor ?? DEFAULT_STATE.actor,
      repository: facts.repository,
      defaultBranch: facts.defaultBranch,
      changedFiles: (facts.changedFiles ?? []).join("\n"),
      commitMessage: facts.message ?? DEFAULT_STATE.commitMessage,
      inputs,
      forcedResults: {},
      cancelled: false
    };
    const engine = toEngineInputs(state, wf);
    engine.trigger.changedFiles = facts.changedFiles ?? [];
    patchFromGit(engine.github, facts, wf.name ?? rel, rel);
    ref = String(engine.github["ref"] ?? "");
    const notes = [];
    const declared = Object.keys(wf.events["workflow_dispatch"]?.inputs ?? {});
    if (event === "workflow_dispatch") {
      for (const k of Object.keys(inputs)) if (!declared.includes(k)) notes.push(`--input ${k}: this workflow declares no such input, so it is ignored.`);
    }
    const forcedResults = {};
    for (const f of failing) if (ids.has(f)) {
      forcedResults[f] = "failure";
      failsFound.add(f);
    }
    const run = () => simulate({ workflow: wf, github: engine.github, inputs: engine.inputs, trigger: engine.trigger, forcedResults, vars, outputs });
    let sim = run();
    const oneCombination = failing.filter((f) => !ids.has(f));
    if (oneCombination.length) {
      for (const f of oneCombination) {
        const c = findCombination(sim, f);
        if (c) {
          forcedResults[c.key] = "failure";
          failsFound.add(f);
        }
      }
      sim = run();
    }
    for (const e of expected) {
      const job = ids.has(e) ? sim.jobs.find((j) => j.job.id === e) : void 0;
      const c = job ? void 0 : findCombination(sim, e);
      if (job || c) expectFound.get(e).push({ file: rel, outcome: (job ?? c).outcome });
    }
    sims.push({ file: rel, sim });
    workflows.push(toCliWorkflow(rel, wf.name, sim, notes, wf.jobs));
  }
  const where = files.length === 1 ? "this workflow" : "these workflows";
  for (const f of failing) if (!failsFound.has(f)) throw new UsageError(`--fail ${f}: ${missing(f, sims, allJobs, where)}`);
  for (const job of Object.keys(outputs)) if (!allJobs.has(job)) throw new UsageError(`--output ${job}.*: no job with that id in ${where}.`);
  const expectations = [];
  for (const e of expected) {
    const found = expectFound.get(e);
    if (!found.length) throw new UsageError(`--expect-run ${e}: ${missing(e, sims, allJobs, where)}`);
    expectations.push({ job: e, runs: found.some((f) => ranOutcome(f.outcome)), found });
  }
  return { event, action, ref, facts, workflows, expectations };
}
var normalized = (s) => s.toLowerCase().replace(/\s+/g, "");
function findCombination(sim, ref) {
  const i = ref.indexOf(":");
  const jobs = i < 0 ? sim.jobs : sim.jobs.filter((j) => j.job.id === ref.slice(0, i));
  const wanted = normalized(i < 0 ? ref : ref.slice(i + 1));
  for (const v of jobs) {
    for (const c of v.matrix?.combinations ?? []) {
      const values = /\(([^()]*)\)$/.exec(c.combination.name)?.[1] ?? "";
      const names = i < 0 ? [c.combination.name, c.key] : [values, c.combination.id, c.combination.name];
      if (names.some((n) => normalized(n) === wanted)) return c;
    }
  }
  return void 0;
}
function missing(ref, sims, allJobs, where) {
  const i = ref.indexOf(":");
  const job = i < 0 ? void 0 : ref.slice(0, i);
  if (job === void 0 || !allJobs.has(job)) return `no job or matrix combination with that name in ${where}.`;
  const verdicts = sims.flatMap((s) => s.sim.jobs.filter((j) => j.job.id === job));
  const combos = verdicts.flatMap((v) => v.matrix?.combinations ?? []);
  if (combos.length) return `${job} has no such combination. Its combinations: ${combos.map((c) => `${job}:${/\(([^()]*)\)$/.exec(c.combination.name)?.[1] ?? c.combination.id}`).join(", ")}.`;
  if (verdicts.every((v) => !v.matrix)) return `${job} has no matrix; use ${job} alone.`;
  return `the combinations of ${job} are not known here (${verdicts.map((v) => v.outcome === "runs" || v.outcome === "fails" ? "its matrix could not be expanded; see the output" : "the job does not run, so its matrix is never expanded").join("; ")}).`;
}
var ranOutcome = (o) => o === "runs" || o === "fails";
function git(cwd, args) {
  return execFileSync("git", ["-c", "core.quotepath=false", ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024 }).replace(/\r?\n$/, "");
}
function tryGit(cwd, args) {
  try {
    return git(cwd, args);
  } catch {
    return void 0;
  }
}
function commitOf(root, ref, flag) {
  const sha = tryGit(root, ["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]);
  if (sha) return sha;
  throw new UsageError(`${flag} ${ref}: git knows no such commit.`);
}
function branchNameOf(root, ref, remotes) {
  const full = tryGit(root, ["rev-parse", "--symbolic-full-name", ref]);
  if (full?.startsWith("refs/heads/")) return full.slice("refs/heads/".length);
  if (full?.startsWith("refs/remotes/")) {
    const rest = full.slice("refs/remotes/".length);
    const remote = remotes.find((r) => rest.startsWith(r + "/"));
    return remote ? rest.slice(remote.length + 1) : rest;
  }
  return void 0;
}
function repositoryFromUrl(url) {
  const m = /^(?:[a-z+]+:\/\/)?(?:[^@/]+@)?[^/:]+[/:](?:\d+\/)?(.+?)(?:\.git)?\/?$/i.exec(url.trim());
  const parts = m?.[1]?.split("/").filter(Boolean) ?? [];
  return parts.length >= 2 ? parts.slice(-2).join("/") : void 0;
}
function changedBetween(root, from, to) {
  return git(root, ["diff", "--name-only", "--no-renames", "-z", from, to]).split("\0").filter(Boolean);
}
function readRepository(values, cwd, event, action) {
  const root = tryGit(cwd, ["rev-parse", "--show-toplevel"]);
  if (!root) throw new UsageError(`${cwd} is not inside a git repository (git rev-parse --show-toplevel failed).`);
  const notes = [];
  const remotes = (tryGit(root, ["remote"]) ?? "").split("\n").filter(Boolean);
  const remote = remotes.includes("origin") ? "origin" : remotes[0];
  let repository = values.repo;
  let repoSource = "flag";
  if (!repository) {
    const url = remote ? tryGit(root, ["remote", "get-url", remote]) : void 0;
    repository = url ? repositoryFromUrl(url) : void 0;
    repoSource = "git";
    if (!repository) {
      repository = DEFAULT_STATE.repository;
      repoSource = "default";
      notes.push(`No remote URL to read the repository name from; using ${repository} (pass --repo owner/name).`);
    }
  } else if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new UsageError(`--repo ${repository}: expected owner/name.`);
  }
  let defaultBranch = values["default-branch"];
  let defaultSource = "flag";
  if (!defaultBranch) {
    defaultSource = "git";
    const symbolic = remote ? tryGit(root, ["symbolic-ref", "--quiet", `refs/remotes/${remote}/HEAD`]) : void 0;
    if (symbolic?.startsWith(`refs/remotes/${remote}/`)) defaultBranch = symbolic.slice(`refs/remotes/${remote}/`.length);
    else {
      const exists = (b) => Boolean(tryGit(root, ["rev-parse", "--verify", "--quiet", `refs/heads/${b}`]) ?? (remote ? tryGit(root, ["rev-parse", "--verify", "--quiet", `refs/remotes/${remote}/${b}`]) : void 0));
      defaultBranch = ["main", "master"].find(exists);
      if (defaultBranch) notes.push(`${remote ? `${remote}/HEAD is not set` : "No remote"}, so the default branch is taken to be ${defaultBranch} because that branch exists${remote ? ` (git remote set-head ${remote} --auto records the real one)` : ""}; --default-branch overrides.`);
      else {
        defaultBranch = tryGit(root, ["symbolic-ref", "--quiet", "--short", "HEAD"]) ?? "main";
        defaultSource = "default";
        notes.push(`Could not tell the default branch; assuming ${defaultBranch} (pass --default-branch).`);
      }
    }
  }
  const isPr = PR_EVENTS.has(event);
  const refType = values.tag !== void 0 && (event === "push" || event === "create" || event === "delete") ? "tag" : "branch";
  const localTag = values.tag !== void 0 && tryGit(root, ["rev-parse", "--verify", "--quiet", `refs/tags/${values.tag}^{commit}`]) ? `refs/tags/${values.tag}` : void 0;
  const headRef = values.head ?? localTag ?? "HEAD";
  const sha = commitOf(root, headRef, "--head");
  let branch = values.branch;
  let branchSource = "flag";
  if (!branch) {
    if (refType === "tag") {
      branch = defaultBranch;
      branchSource = "default";
    } else if (CURRENT_BRANCH_EVENTS.has(event) || isPr) {
      branch = branchNameOf(root, headRef, remotes);
      branchSource = "git";
      if (!branch) {
        branch = defaultBranch;
        branchSource = "default";
        notes.push(`${headRef} is not a branch (detached HEAD or a commit); assuming the branch is ${branch} (pass --branch).`);
      }
    } else {
      branch = defaultBranch;
      branchSource = defaultSource;
    }
  }
  let baseBranch;
  let baseSha;
  let mergeBase;
  let diff;
  let changedFiles;
  const short = (s) => s.slice(0, 7);
  if (event === "push" && refType === "branch") {
    if (values.base !== void 0) {
      baseSha = commitOf(root, values.base, "--base");
      changedFiles = changedBetween(root, baseSha, sha);
      diff = `git diff ${short(baseSha)}..${short(sha)} (--base ${values.base})`;
    } else {
      baseSha = tryGit(root, ["rev-parse", "--verify", "--quiet", `${sha}^1`]);
      if (baseSha) {
        changedFiles = changedBetween(root, baseSha, sha);
        diff = `git diff ${short(baseSha)}..${short(sha)} (the head's first parent; --base for a push of several commits)`;
      } else if (tryGit(root, ["rev-parse", "--is-shallow-repository"]) === "true") {
        throw new UsageError(`${short(sha)} has no parent in this clone because the clone is shallow. Fetch more history (actions/checkout with fetch-depth: 0 or 2) or pass --base.`);
      } else {
        changedFiles = git(root, ["diff-tree", "--root", "--no-commit-id", "--name-only", "-r", "--no-renames", "-z", sha]).split("\0").filter(Boolean);
        diff = `${short(sha)} is the first commit, so every file in it counts as changed`;
      }
    }
  } else if (isPr) {
    let baseRef = values.base;
    if (baseRef === void 0) {
      baseRef = remote && tryGit(root, ["rev-parse", "--verify", "--quiet", `refs/remotes/${remote}/${defaultBranch}`]) ? `${remote}/${defaultBranch}` : defaultBranch;
    }
    baseSha = commitOf(root, baseRef, "--base");
    baseBranch = branchNameOf(root, baseRef, remotes);
    if (!baseBranch) {
      baseBranch = defaultBranch;
      notes.push(`--base ${baseRef} is not a branch, so the pull request is taken to target ${baseBranch}.`);
    }
    mergeBase = tryGit(root, ["merge-base", baseSha, sha]);
    if (!mergeBase) throw new UsageError(`${baseRef} and ${headRef} share no history (no merge base), so there is no pull request diff. Fetch more history or pass another --base.`);
    changedFiles = changedBetween(root, mergeBase, sha);
    diff = `git diff ${baseRef}...${values.head ?? "HEAD"} (from the merge base ${short(mergeBase)}, as GitHub diffs a pull request)`;
    if (mergeBase === sha) notes.push(`${headRef} is already contained in ${baseRef}: the pull request would have no changes.`);
  } else if (values.base !== void 0) {
    notes.push(`--base is ignored for ${event}${event === "push" ? " of a tag (paths filters do not apply to tags)" : ""}.`);
  }
  if (changedFiles && changedFiles.length > GITHUB_DIFF_LIMIT) notes.push(`${changedFiles.length} files changed. GitHub looks at only the first ${GITHUB_DIFF_LIMIT} files of a diff for paths filters, so a real run may disagree with this one.`);
  if ((values.input ?? []).length && event !== "workflow_dispatch") notes.push(`--input only applies to workflow_dispatch; ignored for ${event}.`);
  const message = tryGit(root, ["log", "-1", "--no-show-signature", "--format=%B", sha])?.trim();
  return {
    root,
    event,
    action,
    refType,
    branch,
    tag: values.tag ?? (event === "release" ? tryGit(root, ["describe", "--tags", "--exact-match", sha]) : void 0),
    baseBranch,
    sha: values.sha ?? sha,
    baseSha,
    mergeBase,
    diff,
    changedFiles,
    message,
    repository,
    defaultBranch,
    sources: { branch: branchSource, sha: values.sha ? "flag" : "git", changedFiles: changedFiles ? "git" : "default", repository: repoSource, defaultBranch: defaultSource },
    notes
  };
}
function patchFromGit(github, facts, workflowName, file) {
  const ev = github["event"] ?? {};
  github["workflow"] = workflowName;
  github["workflow_ref"] = `${facts.repository}/${file}@${github["ref"] ?? ""}`;
  if (facts.event === "push") {
    github["sha"] = facts.sha;
    ev["after"] = facts.sha;
    if (facts.baseSha) ev["before"] = facts.baseSha;
    const head = ev["head_commit"];
    if (head && typeof head === "object") head["id"] = facts.sha;
  } else if (PR_EVENTS.has(facts.event)) {
    const pr = ev["pull_request"];
    const set = (side, sha) => {
      const s = pr?.[side];
      if (sha && s && typeof s === "object") s["sha"] = sha;
    };
    set("head", facts.sha);
    set("base", facts.baseSha);
  } else if (facts.event === "workflow_dispatch" || facts.event === "workflow_run" || facts.event === "create") {
    github["sha"] = facts.sha;
  }
}
function workflowFiles(root, cwd, only) {
  if (only?.length) {
    return only.map((f) => {
      for (const candidate of [path.resolve(cwd, f), path.join(root, ".github", "workflows", f), path.resolve(root, f)]) {
        if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
      }
      throw new UsageError(`--workflow ${f}: no such file (looked in ${cwd} and in .github/workflows).`);
    });
  }
  const dir = path.join(root, ".github", "workflows");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => /\.ya?ml$/i.test(f)).sort().map((f) => path.join(dir, f));
}
function pairs(list, flag, sep) {
  const out = {};
  for (const item of list) {
    const i = item.indexOf(sep);
    if (i <= 0) throw new UsageError(`${flag} ${item}: expected key${sep}value.`);
    out[item.slice(0, i)] = item.slice(i + 1);
  }
  return out;
}
function jobOutputs(list) {
  const out = {};
  for (const item of list) {
    const m = /^([^.=]+)\.([^=]+)=(.*)$/s.exec(item);
    if (!m) throw new UsageError(`--output ${item}: expected job.key=value, e.g. --output plan.targets='["a","b"]'.`);
    (out[m[1]] ??= {})[m[2]] = m[3];
  }
  return out;
}
function toCliWorkflow(file, name, sim, notes, jobs) {
  return {
    file,
    name,
    triggers: sim.trigger.matched && !sim.rejected,
    triggerReasons: sim.trigger.reasons,
    triggerNotes: sim.triggerNotes,
    rejected: sim.rejected,
    fileProblems: [...sim.fileProblems, ...sim.graphProblems],
    notes,
    jobs: sim.jobs.map((v) => toCliJob(v, jobs))
  };
}
function toCliJob(v, jobs) {
  const ran = v.outcome === "runs" || v.outcome === "fails" || v.outcome === "cancelled";
  return {
    id: v.job.id,
    name: v.job.name,
    outcome: v.outcome,
    result: v.result,
    if: v.job.ifSource,
    evaluatedAs: v.job.if,
    headline: v.headline,
    reason: v.evaluation ? v.evaluation.ok ? v.evaluation.reason : v.evaluation.error : void 0,
    needs: v.needsResults,
    problems: v.problems.map((p) => p.message),
    steps: ran && !v.matrix?.combinations.length ? v.stepVerdicts.map(toCliStep) : [],
    ...v.matrix ? { matrix: toCliMatrix(v.matrix, jobs) } : {}
  };
}
function toCliMatrix(m, jobs) {
  const e = m.expansion;
  const reads = "reads" in e ? e.reads : [];
  return {
    strategy: m.line,
    expansion: e.kind,
    reason: "reason" in e ? e.reason : void 0,
    reads,
    // The flags that would expand a matrix that reads job outputs nobody gave, with the value the file itself
    // writes when there is one (echo 'x=[...]' >> "$GITHUB_OUTPUT"), so the reader can copy it.
    missingOutputs: reads.filter((r) => r.source === "unknown").map((r) => {
      const example = outputExample(jobs.find((j) => j.id === r.job) ?? { outputs: void 0, steps: [] }, r.output);
      return `--output ${r.job}.${r.output}=${example !== void 0 ? shellQuote(example) : "<value>"}`;
    }),
    combinations: m.combinations.map((c) => ({
      name: c.combination.name,
      id: c.combination.id,
      key: c.key,
      matrix: c.combination.matrix,
      origin: c.combination.origin,
      outcome: c.outcome,
      result: c.result,
      headline: c.headline,
      annotation: c.annotation,
      steps: c.stepVerdicts.map(toCliStep)
    }))
  };
}
function shellQuote(s) {
  return /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replace(/'/g, `'\\''`)}'`;
}
function toCliStep(s) {
  const ev = s.evaluation;
  const verdict = !s.if ? "runs" : s.unknown || !ev || !ev.ok ? "unknown" : ev.truthy ? "runs" : "skipped";
  return { id: s.id, summary: s.summary, if: s.if, verdict, reason: s.unknown ?? (ev ? ev.ok ? ev.reason : ev.error : void 0) };
}
var PER_FILE = /^(paths|paths-ignore): "/;
var PLAIN_RUN = "Runs: no condition, and every job it needs succeeded.";
function condense(reasons, keep = 3) {
  const out = [];
  let group = [];
  const flush = () => {
    if (!group.length) return;
    const hits = group.filter((r) => r.endsWith("\u2192 runs"));
    const shown = (hits.length ? hits : group).slice(0, keep);
    out.push(...shown);
    const rest = group.length - shown.length;
    if (rest > 0) out.push(`${group[0].slice(0, group[0].indexOf(":"))}: ${rest} more file${rest === 1 ? "" : "s"} (--json lists every one)`);
    group = [];
  };
  for (const r of reasons) {
    if (PER_FILE.test(r)) {
      if (group.length && r.slice(0, r.indexOf(":")) !== group[0].slice(0, group[0].indexOf(":"))) flush();
      group.push(r);
    } else {
      flush();
      out.push(r);
    }
  }
  flush();
  return out;
}
function formatReport(r) {
  const f = r.facts;
  const lines = [];
  const short = (s) => s && /^[0-9a-f]{40}$/.test(s) ? s.slice(0, 7) : s ?? "";
  const what = PR_EVENTS.has(r.event) ? `${r.event}${r.action ? ` (${r.action})` : ""} from ${f.branch} into ${f.baseBranch}, head ${short(f.sha)}` : f.refType === "tag" && (r.event === "push" || r.event === "create" || r.event === "delete") ? `${r.event} of tag ${f.tag} at ${short(f.sha)}` : `${r.event}${r.action ? ` (${r.action})` : ""} ${r.event === "push" ? "to" : "on"} ${f.branch}${r.event === "push" || r.event === "workflow_dispatch" ? ` at ${short(f.sha)}` : ""}`;
  lines.push(`${what} \xB7 ${f.repository} \xB7 default branch ${f.defaultBranch}`);
  if (f.changedFiles) {
    lines.push(`${f.changedFiles.length} changed file${f.changedFiles.length === 1 ? "" : "s"}: ${f.diff}`);
    const shown = f.changedFiles.slice(0, 10);
    for (const file of shown) lines.push(`  ${file}`);
    if (f.changedFiles.length > shown.length) lines.push(`  ... ${f.changedFiles.length - shown.length} more`);
  }
  for (const n of f.notes) lines.push(`note: ${n}`);
  for (const w of r.workflows) {
    lines.push("");
    lines.push(`${w.file}${w.name ? ` \xB7 ${w.name}` : ""}`);
    if (w.rejected) {
      lines.push("  rejected: GitHub refuses this file, so a push creates a failed run with no jobs");
      for (const p of w.fileProblems) lines.push(`    ${p}`);
    } else {
      lines.push(`  ${w.triggers ? "triggers" : "does not trigger"}`);
      for (const reason of condense(w.triggerReasons)) lines.push(`    ${reason}`);
    }
    for (const n of [...w.triggerNotes, ...w.notes]) lines.push(`  note: ${n}`);
    const width = Math.max(...w.jobs.map((j) => j.id.length), 0);
    const col = Math.max(10, ...w.jobs.flatMap((j) => [j.outcome, ...(j.matrix?.combinations ?? []).map((c) => c.outcome)]).map((o) => o.length + 2));
    const pad = " ".repeat(2 + col + width + 2);
    for (const j of w.jobs) {
      const cond = j.if !== void 0 ? `if: ${j.if.replace(/\s*\n\s*/g, " ")}` : "";
      lines.push(`  ${j.outcome.padEnd(col)}${j.id.padEnd(width)}  ${cond}`.trimEnd());
      if (j.outcome === "blocked" || j.outcome === "rejected") continue;
      if (j.if !== void 0 || j.outcome !== "runs" || j.matrix || j.headline !== PLAIN_RUN) for (const l of jobReason(j)) lines.push(`${pad}${l}`);
      for (const p of j.problems) lines.push(`${pad}problem: ${p}`);
      if (j.matrix && j.matrix.expansion !== "not-expanded") {
        lines.push(`${pad}${j.matrix.strategy}`);
        for (const c of j.matrix.combinations) {
          lines.push(`${pad}${c.outcome.padEnd(col)}${c.name}`);
          if (c.annotation) lines.push(`${pad}${" ".repeat(col)}${c.annotation}`);
        }
        for (const flag of j.matrix.missingOutputs) lines.push(`${pad}to expand it: ${flag}`);
      }
    }
  }
  if (r.expectations.length) {
    lines.push("");
    for (const x of r.expectations) {
      const where = x.found.map((f2) => `${f2.outcome} in ${f2.file}`).join(", ");
      lines.push(`expect-run ${x.job}: ${x.runs ? "ok" : "FAILED"} (${where})`);
    }
  }
  return lines.join("\n");
}
function jobReason(j) {
  const lines = [`\u2192 ${j.headline.replace(/^(Runs|Skipped): /, "")}`];
  if (j.if !== void 0 && j.reason && !j.headline.includes(j.reason)) lines.unshift(`\u2192 ${j.reason}`);
  return lines;
}
function invokedDirectly() {
  if (!process.argv[1]) return false;
  try {
    const self = realpathSync(fileURLToPath(import.meta.url));
    const argv1 = realpathSync(process.argv[1]);
    return process.platform === "win32" ? self.toLowerCase() === argv1.toLowerCase() : self === argv1;
  } catch {
    return false;
  }
}
if (invokedDirectly()) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`why-didnt-my-job-run: ${e.stack ?? String(e)}
`);
      process.exitCode = 2;
    }
  );
}
export {
  USAGE,
  buildReport,
  formatReport,
  main,
  repositoryFromUrl
};
