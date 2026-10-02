"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exportNames = {
  arrow: true,
  autoPlacement: true,
  autoUpdate: true,
  computePosition: true,
  detectOverflow: true,
  flip: true,
  getOverflowAncestors: true,
  hide: true,
  inline: true,
  limitShift: true,
  offset: true,
  platform: true,
  shift: true,
  size: true
};
Object.defineProperty(exports, "arrow", {
  enumerable: true,
  get: function () {
    return _reactDom.arrow;
  }
});
Object.defineProperty(exports, "autoPlacement", {
  enumerable: true,
  get: function () {
    return _reactDom.autoPlacement;
  }
});
Object.defineProperty(exports, "autoUpdate", {
  enumerable: true,
  get: function () {
    return _reactDom.autoUpdate;
  }
});
Object.defineProperty(exports, "computePosition", {
  enumerable: true,
  get: function () {
    return _reactDom.computePosition;
  }
});
Object.defineProperty(exports, "detectOverflow", {
  enumerable: true,
  get: function () {
    return _reactDom.detectOverflow;
  }
});
Object.defineProperty(exports, "flip", {
  enumerable: true,
  get: function () {
    return _reactDom.flip;
  }
});
Object.defineProperty(exports, "getOverflowAncestors", {
  enumerable: true,
  get: function () {
    return _reactDom.getOverflowAncestors;
  }
});
Object.defineProperty(exports, "hide", {
  enumerable: true,
  get: function () {
    return _reactDom.hide;
  }
});
Object.defineProperty(exports, "inline", {
  enumerable: true,
  get: function () {
    return _reactDom.inline;
  }
});
Object.defineProperty(exports, "limitShift", {
  enumerable: true,
  get: function () {
    return _reactDom.limitShift;
  }
});
Object.defineProperty(exports, "offset", {
  enumerable: true,
  get: function () {
    return _reactDom.offset;
  }
});
Object.defineProperty(exports, "platform", {
  enumerable: true,
  get: function () {
    return _reactDom.platform;
  }
});
Object.defineProperty(exports, "shift", {
  enumerable: true,
  get: function () {
    return _reactDom.shift;
  }
});
Object.defineProperty(exports, "size", {
  enumerable: true,
  get: function () {
    return _reactDom.size;
  }
});
var _ = require(".");
Object.keys(_).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  if (key in exports && exports[key] === _[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function () {
      return _[key];
    }
  });
});
var _reactDom = require("@floating-ui/react-dom");