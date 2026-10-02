// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by an MIT license that can be
// found in the LICENSE file.

var GradientParser = (GradientParser || {});

GradientParser.stringify = (function() {

  var visitor = {

    'visit_linear-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_repeating-linear-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_radial-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_repeating-radial-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_conic-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_repeating-conic-gradient': function(node) {
      return visitor.visit_gradient(node);
    },

    'visit_gradient': function(node) {
      var orientation = visitor.visit(node.orientation);
      if (orientation) {
        orientation += ', ';
      }

      return node.type + '(' + orientation + visitor.visit(node.colorStops) + ')';
    },

    'visit_shape': function(node) {
      var result = node.value,
          at = visitor.visit(node.at),
          style = visitor.visit(node.style);

      if (style) {
        result += ' ' + style;
      }

      if (at) {
        result += ' at ' + at;
      }

      return result;
    },

    'visit_default-radial': function(node) {
      var result = '',
          at = visitor.visit(node.at);

      if (at) {
        if (node.hasAtKeyword) {
          result += 'at ' + at;
        } else {
          result += at;
        }
      }
      return result;
    },

    'visit_extent-keyword': function(node) {
      var result = node.value,
          at = visitor.visit(node.at);

      if (at) {
        result += ' at ' + at;
      }

      return result;
    },

    'visit_position-keyword': function(node) {
      return node.value;
    },

    'visit_position': function(node) {
      return visitor.visit(node.value.x) + ' ' + visitor.visit(node.value.y);
    },

    'visit_%': function(node) {
      return node.value + '%';
    },

    'visit_em': function(node) {
      return node.value + 'em';
    },

    'visit_px': function(node) {
      return node.value + 'px';
    },

    'visit_rem': function(node) {
      return node.value + 'rem';
    },

    'visit_vw': function(node) {
      return node.value + 'vw';
    },

    'visit_vh': function(node) {
      return node.value + 'vh';
    },

    'visit_vmin': function(node) {
      return node.value + 'vmin';
    },

    'visit_vmax': function(node) {
      return node.value + 'vmax';
    },

    'visit_ch': function(node) {
      return node.value + 'ch';
    },

    'visit_ex': function(node) {
      return node.value + 'ex';
    },

    'visit_calc': function(node) {
      return 'calc(' + node.value + ')';
    },

    'visit_literal': function(node) {
      return visitor.visit_color(node.value, node);
    },

    'visit_hex': function(node) {
      return visitor.visit_color('#' + node.value, node);
    },

    'visit_rgb': function(node) {
      return visitor.visit_color('rgb(' + node.value.join(', ') + ')', node);
    },

    'visit_rgba': function(node) {
      return visitor.visit_color('rgba(' + node.value.join(', ') + ')', node);
    },

    'visit_hsl': function(node) {
      return visitor.visit_color('hsl(' + node.value[0] + ', ' + node.value[1] + '%, ' + node.value[2] + '%)', node);
    },

    'visit_hsla': function(node) {
      return visitor.visit_color('hsla(' + node.value[0] + ', ' + node.value[1] + '%, ' + node.value[2] + '%, ' + node.value[3] + ')', node);
    },

    'visit_var': function(node) {
      return visitor.visit_color('var(' + node.value + ')', node);
    },

    'visit_color': function(resultColor, node) {
      var result = resultColor,
          length = visitor.visit(node.length);

      if (length) {
        result += ' ' + length;
      }
      var length2 = visitor.visit(node.length2);
      if (length2) {
        result += ' ' + length2;
      }
      return result;
    },

    'visit_angular': function(node) {
      return node.value + (node.unit || 'deg');
    },

    'visit_directional': function(node) {
      return 'to ' + node.value;
    },

    'visit_conic': function(node) {
      var result = '';
      if (node.angle) {
        result += 'from ' + visitor.visit(node.angle);
      }
      if (node.at) {
        if (result) {
          result += ' ';
        }
        result += 'at ' + visitor.visit(node.at);
      }
      return result;
    },

    'visit_array': function(elements) {
      var result = '',
          size = elements.length;

      elements.forEach(function(element, i) {
        result += visitor.visit(element);
        if (i < size - 1) {
          result += ', ';
        }
      });

      return result;
    },

    'visit_object': function(obj) {
      if (obj.width && obj.height) {
        return visitor.visit(obj.width) + ' ' + visitor.visit(obj.height);
      }
      return '';
    },

    'visit': function(element) {
      if (!element) {
        return '';
      }
      var result = '';

      if (element instanceof Array) {
        return visitor.visit_array(element);
      } else if (typeof element === 'object' && !element.type) {
        return visitor.visit_object(element);
      } else if (element.type) {
        var nodeVisitor = visitor['visit_' + element.type];
        if (nodeVisitor) {
          return nodeVisitor(element);
        } else {
          throw Error('Missing visitor visit_' + element.type);
        }
      } else {
        throw Error('Invalid node.');
      }
    }

  };

  return function(root) {
    return visitor.visit(root);
  };
})();

// Copyright (c) 2014 Rafael Caricio. All rights reserved.
// Use of this source code is governed by an MIT license that can be
// found in the LICENSE file.

var GradientParser = (GradientParser || {});

GradientParser.parse = (function() {

  var tokens = {
    linearGradient: /^(\-(webkit|o|ms|moz)\-)?(linear\-gradient)/i,
    repeatingLinearGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-linear\-gradient)/i,
    radialGradient: /^(\-(webkit|o|ms|moz)\-)?(radial\-gradient)/i,
    repeatingRadialGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-radial\-gradient)/i,
    conicGradient: /^(\-(webkit|o|ms|moz)\-)?(conic\-gradient)/i,
    repeatingConicGradient: /^(\-(webkit|o|ms|moz)\-)?(repeating\-conic\-gradient)/i,
    sideOrCorner: /^to (left (top|bottom)|right (top|bottom)|top (left|right)|bottom (left|right)|left|right|top|bottom)/i,
    extentKeywords: /^(closest\-side|closest\-corner|farthest\-side|farthest\-corner|contain|cover)/,
    positionKeywords: /^(left|center|right|top|bottom)/i,
    pixelValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))px/,
    percentageValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))\%/,
    emValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))em/,
    remValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))rem/,
    vwValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))vw/,
    vhValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))vh/,
    vminValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))vmin/,
    vmaxValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))vmax/,
    chValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))ch/,
    exValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))ex/,
    angleValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))deg/,
    radianValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))rad/,
    gradianValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))grad/,
    turnValue: /^(-?(([0-9]*\.[0-9]+)|([0-9]+\.?)))turn/,
    startCall: /^\(/,
    endCall: /^\)/,
    comma: /^,/,
    slash: /^\//,
    hexColor: /^\#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/,
    literalColor: /^([a-zA-Z]+)/,
    rgbColor: /^rgb/i,
    rgbaColor: /^rgba/i,
    varColor: /^var/i,
    calcValue: /^calc/i,
    variableName: /^(--[a-zA-Z0-9-,\s\#]+)/,
    number: /^(([0-9]*\.[0-9]+)|([0-9]+\.?))/,
    hslColor: /^hsl/i,
    hslaColor: /^hsla/i,
  };

  var input = '';

  function error(msg) {
    var err = new Error(input + ': ' + msg);
    err.source = input;
    throw err;
  }

  function getAST() {
    var ast = matchListDefinitions();

    if (input.length > 0) {
      error('Invalid input not EOF');
    }

    return ast;
  }

  function matchListDefinitions() {
    return matchListing(matchDefinition);
  }

  function matchDefinition() {
    return matchGradient(
            'linear-gradient',
            tokens.linearGradient,
            matchLinearOrientation) ||

          matchGradient(
            'repeating-linear-gradient',
            tokens.repeatingLinearGradient,
            matchLinearOrientation) ||

          matchGradient(
            'radial-gradient',
            tokens.radialGradient,
            matchListRadialOrientations) ||

          matchGradient(
            'repeating-radial-gradient',
            tokens.repeatingRadialGradient,
            matchListRadialOrientations) ||

          matchGradient(
            'conic-gradient',
            tokens.conicGradient,
            matchConicOrientation) ||

          matchGradient(
            'repeating-conic-gradient',
            tokens.repeatingConicGradient,
            matchConicOrientation);
  }

  function matchGradient(gradientType, pattern, orientationMatcher) {
    return matchCall(pattern, function(captures) {

      var orientation = orientationMatcher();
      if (orientation) {
        if (!scan(tokens.comma)) {
          error('Missing comma before color stops');
        }
      }

      return {
        type: gradientType,
        orientation: orientation,
        colorStops: matchListing(matchColorStop)
      };
    });
  }

  function matchCall(pattern, callback) {
    var captures = scan(pattern);

    if (captures) {
      if (!scan(tokens.startCall)) {
        error('Missing (');
      }

      var result = callback(captures);

      if (!scan(tokens.endCall)) {
        error('Missing )');
      }

      return result;
    }
  }

  function matchLinearOrientation() {
    // Check for standard CSS3 "to" direction
    var sideOrCorner = matchSideOrCorner();
    if (sideOrCorner) {
      return sideOrCorner;
    }
    
    // Check for legacy single keyword direction (e.g., "right", "top")
    var legacyDirection = match('position-keyword', tokens.positionKeywords, 1);
    if (legacyDirection) {
      // For legacy syntax, we convert to the directional type
      return {
        type: 'directional',
        value: legacyDirection.value
      };
    }
    
    // If neither, check for angle
    return matchAngle();
  }

  function matchConicOrientation() {
    var angle = matchFrom();
    var atPosition = matchAtPosition();

    if (angle || atPosition) {
      return {
        type: 'conic',
        angle: angle || undefined,
        at: atPosition || undefined
      };
    }
  }

  function matchFrom() {
    if (match('from', /^from/, 0)) {
      var angle = matchAngle();
      if (!angle) {
        error('Missing angle after "from" in conic-gradient');
      }
      return angle;
    }
  }

  function matchSideOrCorner() {
    return match('directional', tokens.sideOrCorner, 1);
  }

  function matchAngle() {
    return matchAngularWithUnit('deg', tokens.angleValue) ||
      matchAngularWithUnit('rad', tokens.radianValue) ||
      matchAngularWithUnit('grad', tokens.gradianValue) ||
      matchAngularWithUnit('turn', tokens.turnValue);
  }

  function matchAngularWithUnit(unit, pattern) {
    var captures = scan(pattern);
    if (captures) {
      return {
        type: 'angular',
        value: captures[1],
        unit: unit
      };
    }
  }

  function matchListRadialOrientations() {
    var radialOrientations,
        radialOrientation = matchRadialOrientation(),
        lookaheadCache;

    if (radialOrientation) {
      radialOrientations = [];
      radialOrientations.push(radialOrientation);

      lookaheadCache = input;
      if (scan(tokens.comma)) {
        radialOrientation = matchRadialOrientation();
        if (radialOrientation) {
          radialOrientations.push(radialOrientation);
        } else {
          input = lookaheadCache;
        }
      }
    }

    return radialOrientations;
  }

  function matchRadialOrientation() {
    var radialType = matchCircle() ||
      matchEllipse();

    if (radialType) {
      radialType.at = matchAtPosition();
    } else {
      var extent = matchExtentKeyword();
      if (extent) {
        radialType = extent;
        var positionAt = matchAtPosition();
        if (positionAt) {
          radialType.at = positionAt;
        }
      } else {
        // Check for "at" position first, which is a common browser output format
        var atPosition = matchAtPosition();
        if (atPosition) {
          radialType = {
            type: 'default-radial',
            at: atPosition,
            hasAtKeyword: true
          };
        } else {
          var defaultPosition = matchPositioning();
          if (defaultPosition) {
            radialType = {
              type: 'default-radial',
              at: defaultPosition
            };
          }
        }
      }
    }

    return radialType;
  }

  function matchCircle() {
    var circle = match('shape', /^(circle)/i, 0);

    if (circle) {
      circle.style = matchLength() || matchExtentKeyword();
    }

    return circle;
  }

  function matchEllipse() {
    var ellipse = match('shape', /^(ellipse)/i, 0);

    if (ellipse) {
      ellipse.style = matchPositioning() || matchDistance() || matchExtentKeyword();
    }

    return ellipse;
  }

  function matchExtentKeyword() {
    return match('extent-keyword', tokens.extentKeywords, 1);
  }

  function matchAtPosition() {
    if (match('position', /^at/, 0)) {
      var positioning = matchPositioning();

      if (!positioning) {
        error('Missing positioning value');
      }

      return positioning;
    }
  }

  function matchPositioning() {
    var location = matchCoordinates();

    if (location.x || location.y) {
      return {
        type: 'position',
        value: location
      };
    }
  }

  function matchCoordinates() {
    return {
      x: matchDistance(),
      y: matchDistance()
    };
  }

  function matchListing(matcher) {
    var captures = matcher(),
      result = [];

    if (captures) {
      result.push(captures);
      while (scan(tokens.comma)) {
        captures = matcher();
        if (captures) {
          result.push(captures);
        } else {
          error('One extra comma');
        }
      }
    }

    return result;
  }

  function matchColorStop() {
    var color = matchColor();

    if (!color) {
      error('Expected color definition');
    }

    color.length = matchDistance();
    if (color.length) {
      color.length2 = matchDistance();
    }
    return color;
  }

  function matchColor() {
    return matchHexColor() ||
      matchHSLAColor() ||
      matchHSLColor() ||
      matchRGBAColor() ||
      matchRGBColor() ||
      matchVarColor() ||
      matchLiteralColor();
  }

  function matchLiteralColor() {
    return match('literal', tokens.literalColor, 0);
  }

  function matchHexColor() {
    return match('hex', tokens.hexColor, 1);
  }

  function matchRGBColor() {
    return matchCall(tokens.rgbColor, function() {
      return matchRGBValues('rgb');
    });
  }

  function matchRGBAColor() {
    return matchCall(tokens.rgbaColor, function() {
      return matchRGBValues('rgba');
    });
  }

  function matchRGBValues(baseType) {
    var r = matchNumber();
    if (scan(tokens.comma)) {
      // Legacy comma-separated syntax: rgb(r, g, b) or rgba(r, g, b, a)
      var g = matchNumber();
      scan(tokens.comma);
      var b = matchNumber();
      var values = [r, g, b];
      if (scan(tokens.comma)) {
        values.push(matchNumber());
        return { type: 'rgba', value: values };
      }
      return { type: baseType, value: values };
    } else {
      // Modern space-separated syntax: rgb(r g b) or rgb(r g b / a)
      var g = matchNumber();
      var b = matchNumber();
      var values = [r, g, b];
      if (scan(tokens.slash)) {
        values.push(matchNumber());
        return { type: 'rgba', value: values };
      }
      return { type: baseType, value: values };
    }
  }

  function matchVarColor() {
    return matchCall(tokens.varColor, function () {
      return {
        type: 'var',
        value: matchVariableName()
      };
    });
  }

  function matchHSLColor() {
    return matchCall(tokens.hslColor, function() {
      return matchHSLValues('hsl');
    });
  }

  function matchHSLAColor() {
    return matchCall(tokens.hslaColor, function() {
      return matchHSLValues('hsla');
    });
  }

  function matchHSLValues(baseType) {
    // Check for percentage before trying to parse the hue
    var lookahead = scan(tokens.percentageValue);
    if (lookahead) {
      error('HSL hue value must be a number in degrees (0-360) or normalized (-360 to 360), not a percentage');
    }

    var hue = matchNumber();
    if (scan(tokens.comma)) {
      // Legacy comma-separated syntax: hsl(h, s%, l%) or hsla(h, s%, l%, a)
      var captures = scan(tokens.percentageValue);
      var sat = captures ? captures[1] : null;
      scan(tokens.comma);
      captures = scan(tokens.percentageValue);
      var light = captures ? captures[1] : null;
      if (!sat || !light) {
        error('Expected percentage value for saturation and lightness in HSL');
      }
      if (scan(tokens.comma)) {
        var alpha = matchNumber();
        return { type: 'hsla', value: [hue, sat, light, alpha] };
      }
      return { type: baseType, value: [hue, sat, light] };
    } else {
      // Modern space-separated syntax: hsl(h s% l%) or hsl(h s% l% / a)
      var captures = scan(tokens.percentageValue);
      var sat = captures ? captures[1] : null;
      captures = scan(tokens.percentageValue);
      var light = captures ? captures[1] : null;
      if (!sat || !light) {
        error('Expected percentage value for saturation and lightness in HSL');
      }
      if (scan(tokens.slash)) {
        var alpha = matchNumber();
        return { type: 'hsla', value: [hue, sat, light, alpha] };
      }
      return { type: baseType, value: [hue, sat, light] };
    }
  }

  function matchPercentage() {
    var captures = scan(tokens.percentageValue);
    return captures ? captures[1] : null;
  }

  function matchVariableName() {
    return scan(tokens.variableName)[1];
  }

  function matchNumber() {
    return scan(tokens.number)[1];
  }

  function matchDistance() {
    return match('%', tokens.percentageValue, 1) ||
      matchPositionKeyword() ||
      matchCalc() ||
      matchLength();
  }

  function matchPositionKeyword() {
    return match('position-keyword', tokens.positionKeywords, 1);
  }

  function matchCalc() {
    return matchCall(tokens.calcValue, function() {
      var openParenCount = 1; // Start with the opening parenthesis from calc(
      var i = 0;
      
      // Parse through the content looking for balanced parentheses
      while (openParenCount > 0 && i < input.length) {
        var char = input.charAt(i);
        if (char === '(') {
          openParenCount++;
        } else if (char === ')') {
          openParenCount--;
        }
        i++;
      }
      
      // If we exited because we ran out of input but still have open parentheses, error
      if (openParenCount > 0) {
        error('Missing closing parenthesis in calc() expression');
      }
      
      // Get the content inside the calc() without the last closing paren
      var calcContent = input.substring(0, i - 1);
      
      // Consume the calc expression content
      consume(i - 1); // -1 because we don't want to consume the closing parenthesis
      
      return {
        type: 'calc',
        value: calcContent
      };
    });
  }

  function matchLength() {
    return match('px', tokens.pixelValue, 1) ||
      match('em', tokens.emValue, 1) ||
      match('rem', tokens.remValue, 1) ||
      match('vw', tokens.vwValue, 1) ||
      match('vh', tokens.vhValue, 1) ||
      match('vmin', tokens.vminValue, 1) ||
      match('vmax', tokens.vmaxValue, 1) ||
      match('ch', tokens.chValue, 1) ||
      match('ex', tokens.exValue, 1);
  }

  function match(type, pattern, captureIndex) {
    var captures = scan(pattern);
    if (captures) {
      return {
        type: type,
        value: captures[captureIndex]
      };
    }
  }

  function scan(regexp) {
    var captures,
        blankCaptures;

    blankCaptures = /^[\n\r\t\s]+/.exec(input);
    if (blankCaptures) {
        consume(blankCaptures[0].length);
    }

    captures = regexp.exec(input);
    if (captures) {
        consume(captures[0].length);
    }

    return captures;
  }

  function consume(size) {
    input = input.substring(size);
  }

  return function(code) {
    input = code.toString().trim();
    // Remove trailing semicolon if present
    if (input.endsWith(';')) {
      input = input.slice(0, -1);
    }
    return getAST();
  };
})();

exports.parse = GradientParser.parse;
exports.stringify = GradientParser.stringify;
