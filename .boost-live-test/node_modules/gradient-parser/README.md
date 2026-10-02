# Gradient Parser

[![npm version](https://badge.fury.io/js/gradient-parser.svg)](https://badge.fury.io/js/gradient-parser)

## About

Parse CSS gradient definitions and return an AST `object`.

## Examples

```JavaScript
  var gradient = require('gradient-parser');
  var obj = gradient.parse('linear-gradient(30deg, #000, transparent)');
  console.log(JSON.stringify(obj, null, 2));
```

Results in:

```JSON
[
  {
    "type": "linear-gradient",
    "orientation": {
      "type": "angular",
      "value": "30",
      "unit": "deg"
    },
    "colorStops": [
      {
        "type": "hex",
        "value": "000"
      },
      {
        "type": "literal",
        "value": "transparent"
      }
    ]
  }
]
```

## Installation

Install via npm:
```bash
npm install gradient-parser
```

Import in Node.js (CommonJS):
```javascript
const gradient = require('gradient-parser');
```

Import in Node.js (ESM):
```javascript
import { parse, stringify } from 'gradient-parser';
```

For browser usage:
```html
<script src="node_modules/gradient-parser/build/web.js"></script>
```

Or [download the zip](https://github.com/rafaelcaricio/gradient-parser/archive/master.zip)

## Development

### Project Status

Gradient-parser has been modernized (as of v1.1.0):
- Removed Bower support in favor of npm exclusively
- Replaced Grunt with a modern build system using esbuild
- Added minification support
- Updated dependencies to specific versions
- Improved npm scripts for better developer experience

### Build

Gradient-parser uses a modern build system with esbuild for building and minification.

```bash
# Build both Node.js and web bundles
npm run build

# Build only Node.js bundle
npm run build:node

# Build only web bundle
npm run build:web

# Build minified bundles
npm run build:minify
```

### Testing

Run the test suite with:

```bash
npm test
```

The build step runs automatically before tests via the `pretest` script.

### Starting a local server

You can run a simple HTTP server for development:

```bash
npm start
```

## API

### gradient.parse(gradientString)

Accepts a CSS gradient definition as declared in `background-image` and returns an AST as an `Array` of gradient nodes.

```javascript
var ast = gradient.parse('linear-gradient(to right, red, blue)');
```

### gradient.stringify(ast)

Accepts an AST (as returned by `parse`) and serializes it back into a CSS gradient string.

```javascript
var css = gradient.stringify(ast);
// => 'linear-gradient(to right, red, blue)'
```

Round-trip is supported:
```javascript
gradient.stringify(gradient.parse(input)) === input
```

## AST

### Common properties

All nodes have the following properties.

#### type

`String`. The possible values are the ones listed in the Types section below.

### Types

The available values of `node.type` are listed below, as well as the available properties of each node (other than the common properties listed above).

### linear-gradient

- orientation: `Object` or `undefined`. Possible types `directional` or `angular`.
- colorStops: `Array` of color stops.

### repeating-linear-gradient

- orientation: `Object` or `undefined`. Possible types `directional` or `angular`.
- colorStops: `Array` of color stops.

### radial-gradient

- orientation: `Array` or `undefined`. `Array` of possible types `shape`, `default-radial`, `extent-keyword`.
- colorStops: `Array` of color stops.

### repeating-radial-gradient

- orientation: `Array` or `undefined`. `Array` of possible types `shape`, `default-radial`, `extent-keyword`.
- colorStops: `Array` of color stops.

### conic-gradient

- orientation: `Object` or `undefined` of type `conic`.
- colorStops: `Array` of color stops.

### repeating-conic-gradient

- orientation: `Object` or `undefined` of type `conic`.
- colorStops: `Array` of color stops.

### Color Stops

Each color stop has the following properties:

- type: `String` one of `literal`, `hex`, `rgb`, `rgba`, `hsl`, `hsla`, `var`.
- value: the color value (type varies, see color types below).
- length: `Object` or `undefined`. Position of the color stop (see length types).
- length2: `Object` or `undefined`. Second position for dual-position color stops.

### directional

- value: `String` possible values `left`, `top`, `bottom`, `right`, `left top`, `left bottom`, `right top`, `right bottom`, `top left`, `top right`, `bottom left`, `bottom right`.

### angular

- value: `String` numeric value of the angle.
- unit: `String` one of `deg`, `rad`, `grad`, `turn`.

### conic

- angle: `Object` or `undefined` of type `angular`.
- at: `Object` or `undefined` of type `position`.

### literal

- value: `String` literal name of the color.

### hex

- value: `String` hex value (3, 4, 6, or 8 digits, without `#` prefix).

### rgb

- value: `Array` of length 3 of `String` numbers.

### rgba

- value: `Array` of length 4 of `String` numbers.

### hsl

- value: `Array` of length 3: `[hue, saturation, lightness]`. Hue is a `String` number, saturation and lightness are `String` numbers without the `%` suffix.

### hsla

- value: `Array` of length 4: `[hue, saturation, lightness, alpha]`. Same as `hsl` with an additional alpha `String` number.

### var

- value: `String` the CSS custom property name (e.g. `--color-red`).

### calc

- type: `'calc'`
- value: `String` the raw calc expression content (e.g. `50% + 25px`).

### shape

- style: `Object` or `undefined` possible types `extent-keyword`, `px`, `em`, `rem`, `%`, `position`, or `position-keyword`.
- value: `String` possible values `ellipse` or `circle`.
- at: `Object` or `undefined` of type `position`.

### default-radial

- at: `Object` of type `position`.

### position

- value: `Object` with `x` and `y` properties, each a length/keyword node.

### position-keyword

- value: `String` possible values `center`, `left`, `top`, `bottom`, or `right`.

### extent-keyword

- value: `String` possible values `closest-side`, `closest-corner`, `farthest-side`, `farthest-corner`, `contain`, or `cover`.

### Length types

Length nodes can be any of: `px`, `em`, `rem`, `vw`, `vh`, `vmin`, `vmax`, `ch`, `ex`, `%`, `calc`.

- value: `String` numeric value (for `calc`, the expression string).

## License

(The MIT License)

Copyright (c) 2014-2025 Rafael Caricio rafael@caricio.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
