'use strict';

var expect = require('expect.js');
var gradients = require('../build/node');


describe('lib/parser.js', function () {
  var ast,
    subject;

  it('should exist', function () {
    expect(typeof gradients.parse).to.equal('function');
  });

  describe('error cases', function() {
    it('one more comma in definitions', function() {
      expect(function() {
        gradients.parse('-webkit-linear-gradient(red, blue),');
      }).to.throwException(/One extra comma/);
    });

    it('one more comma in colors', function() {
      expect(function() {
        gradients.parse('-o-linear-gradient(red, blue,)');
      }).to.throwException(/Expected color definition/);
    });

    it('invalid input', function() {
      expect(function() {
        gradients.parse('linear-gradient(red, blue) aaa');
      }).to.throwException(/Invalid input not EOF/);
    });

    it('missing open call', function() {
      expect(function() {
        gradients.parse('linear-gradient red, blue');
      }).to.throwException(/Missing \(/);
    });

    it('missing comma before color stops', function() {
      expect(function() {
        gradients.parse('linear-gradient(to right red, blue)');
      }).to.throwException(/Missing comma before color stops/);
    });

    it('missing color stops', function() {
      expect(function() {
        gradients.parse('linear-gradient(to right, )');
      }).to.throwException(/Expected color definition/);
    });

    it('missing closing call', function() {
      expect(function() {
        gradients.parse('linear-gradient(to right, red, blue aaa');
      }).to.throwException(/Missing \)/);
    });
  });

  describe('when parsing a simple definition', function() {
    beforeEach(function() {
      ast = gradients.parse('linear-gradient(red, blue)');
      subject = ast[0];
    });

    it('should get the gradient type', function () {
      expect(subject.type).to.equal('linear-gradient');
    });

    it('should get the orientation', function() {
      expect(subject.orientation).to.be(undefined);
    });

    describe('colors', function() {
      it('should get all colors', function() {
        expect(subject.colorStops).to.have.length(2);
      });

      describe('first color', function() {
        beforeEach(function() {
          subject = subject.colorStops[0];
        });

        it('should get literal type', function() {
          expect(subject.type).to.equal('literal');
        });

        it('should get the right color', function() {
          expect(subject.value).to.equal('red');
        });
      });

      describe('second color', function() {
        beforeEach(function() {
          subject = subject.colorStops[1];
        });

        it('should get literal type', function() {
          expect(subject.type).to.equal('literal');
        });

        it('should get the right color', function() {
          expect(subject.value).to.equal('blue');
        });
      });
    });
  });

  describe('parse all metric values', function() {
    [
      'px',
      'em',
      '%'
    ].forEach(function(metric) {
      describe('parse color stop for metric '+ metric, function() {
        beforeEach(function() {
          ast = gradients.parse('linear-gradient(blue 10.3' + metric + ', transparent)');
          subject = ast[0];
        });

        describe('the first color', function() {
          beforeEach(function() {
            subject = subject.colorStops[0];
          });

          it('should have the length', function() {
            expect(subject.length.type).to.equal(metric);
            expect(subject.length.value).to.equal('10.3');
          });
        });
      });
    });
  });

  describe('parse all linear directional', function() {
    [
      {type: 'angular', unparsedValue: '-145deg', value: '-145'},
      {type: 'angular', unparsedValue: '1rad', value: '1'},
      {type: 'directional', unparsedValue: 'to left top', value: 'left top'},
      {type: 'directional', unparsedValue: 'to top left', value: 'top left'},
      {type: 'directional', unparsedValue: 'to top right', value: 'top right'},
      {type: 'directional', unparsedValue: 'to bottom left', value: 'bottom left'},
      {type: 'directional', unparsedValue: 'to bottom right', value: 'bottom right'},
      {type: 'directional', unparsedValue: 'to bottom', value: 'bottom'}, // Test modern syntax
      {type: 'directional', unparsedValue: 'bottom', value: 'bottom'} // Test legacy syntax
    ].forEach(function(orientation) {
      describe('parse orientation ' + orientation.type, function() {
        beforeEach(function() {
          ast = gradients.parse('linear-gradient(' + orientation.unparsedValue + ', blue, green)');
          subject = ast[0].orientation;
        });

        it('should parse value', function() {
          expect(subject.type).to.equal(orientation.type);
          expect(subject.value).to.equal(orientation.value);
        });
      });
    });
    
    it('should correctly parse directional value without "to" keyword (legacy syntax)', function() {
      // This uses the legacy syntax without "to" keyword (e.g., "right" instead of "to right")
      const parsed = gradients.parse('-webkit-linear-gradient(right, rgb(248, 6, 234) 71%, rgb(202, 74, 208) 78%)');
      let subject = parsed[0];
      
      // It should properly identify the orientation as directional "right"
      expect(subject.orientation).to.be.an('object');
      expect(subject.orientation.type).to.equal('directional');
      expect(subject.orientation.value).to.equal('right');
      
      // And it should have only 2 color stops
      expect(subject.colorStops).to.have.length(2);
      expect(subject.colorStops[0].type).to.equal('rgb');
      expect(subject.colorStops[0].value).to.eql(['248', '6', '234']);
      expect(subject.colorStops[0].length.type).to.equal('%');
      expect(subject.colorStops[0].length.value).to.equal('71');
      
      expect(subject.colorStops[1].type).to.equal('rgb');
      expect(subject.colorStops[1].value).to.eql(['202', '74', '208']);
      expect(subject.colorStops[1].length.type).to.equal('%');
      expect(subject.colorStops[1].length.value).to.equal('78');
    });
    
    // Additional test cases for other legacy directional keywords
    it('should correctly parse legacy syntax with "top" direction', function() {
      const parsed = gradients.parse('-webkit-linear-gradient(top, #ff0000, #0000ff)');
      let subject = parsed[0];
      
      expect(subject.orientation).to.be.an('object');
      expect(subject.orientation.type).to.equal('directional');
      expect(subject.orientation.value).to.equal('top');
      
      expect(subject.colorStops).to.have.length(2);
      expect(subject.colorStops[0].type).to.equal('hex');
      expect(subject.colorStops[0].value).to.equal('ff0000');
      expect(subject.colorStops[1].type).to.equal('hex');
      expect(subject.colorStops[1].value).to.equal('0000ff');
    });
    
    it('should correctly parse "to bottom" direction (modern syntax)', function() {
      const parsed = gradients.parse('linear-gradient(to bottom, rgb(0, 91, 154), rgb(230, 193, 61))');
      let subject = parsed[0];
      
      expect(subject.orientation).to.be.an('object');
      expect(subject.orientation.type).to.equal('directional');
      expect(subject.orientation.value).to.equal('bottom');
      
      expect(subject.colorStops).to.have.length(2);
      expect(subject.colorStops[0].type).to.equal('rgb');
      expect(subject.colorStops[0].value).to.eql(['0', '91', '154']);
      expect(subject.colorStops[1].type).to.equal('rgb');
      expect(subject.colorStops[1].value).to.eql(['230', '193', '61']);
    });

    it('should correctly parse legacy syntax with "left" direction', function() {
      const parsed = gradients.parse('-webkit-linear-gradient(left, rgba(255, 0, 0, 0.5), rgba(0, 0, 255, 0.8))');
      let subject = parsed[0];
      
      expect(subject.orientation).to.be.an('object');
      expect(subject.orientation.type).to.equal('directional');
      expect(subject.orientation.value).to.equal('left');
      
      expect(subject.colorStops).to.have.length(2);
      expect(subject.colorStops[0].type).to.equal('rgba');
      expect(subject.colorStops[0].value).to.eql(['255', '0', '0', '0.5']);
      expect(subject.colorStops[1].type).to.equal('rgba');
      expect(subject.colorStops[1].value).to.eql(['0', '0', '255', '0.8']);
    });
    
    it('should correctly parse legacy syntax with "bottom" direction', function() {
      const parsed = gradients.parse('-webkit-linear-gradient(bottom, hsla(0, 100%, 50%, 0.3), hsla(240, 100%, 50%, 0.7))');
      let subject = parsed[0];
      
      expect(subject.orientation).to.be.an('object');
      expect(subject.orientation.type).to.equal('directional');
      expect(subject.orientation.value).to.equal('bottom');
      
      expect(subject.colorStops).to.have.length(2);
      expect(subject.colorStops[0].type).to.equal('hsla');
      expect(subject.colorStops[0].value).to.eql(['0', '100', '50', '0.3']);
      expect(subject.colorStops[1].type).to.equal('hsla');
      expect(subject.colorStops[1].value).to.eql(['240', '100', '50', '0.7']);
    });
  });

  describe('parse all color types', function() {
    [
      {type: 'literal', unparsedValue: 'red', value: 'red'},
      {type: 'hex', unparsedValue: '#c2c2c2', value: 'c2c2c2'},
      {type: 'rgb', unparsedValue: 'rgb(243, 226, 195)', value: ['243', '226', '195']},
      {type: 'rgba', unparsedValue: 'rgba(243, 226, 195)', value: ['243', '226', '195']},
      {type: 'hsl', unparsedValue: 'hsl(120, 60%, 70%)', value: ['120', '60', '70']},
      {type: 'hsla', unparsedValue: 'hsla(120, 60%, 70%, 0.3)', value: ['120', '60', '70', '0.3']},
      {type: 'hsla', unparsedValue: 'hsla(240, 100%, 50%, 0.5)', value: ['240', '100', '50', '0.5']},
      {type: 'var', unparsedValue: 'var(--color-red)', value: '--color-red'},
    ].forEach(function(color) {
      describe('parse color type '+ color.type, function() {
        beforeEach(function() {
            ast = gradients.parse('linear-gradient(12deg, ' + color.unparsedValue + ', blue, green)');
            subject = ast[0].colorStops[0];
          });

          it('should parse value', function() {
            expect(subject.type).to.equal(color.type);
            expect(subject.value).to.eql(color.value);
          });
      });
    });

    describe('error cases for HSL/HSLA', function() {
      it('should error on missing percentage for saturation', function() {
        expect(function() {
          gradients.parse('linear-gradient(hsl(120, 60, 70%))');
        }).to.throwException(/Expected percentage value/);
      });

      it('should error on missing percentage for lightness', function() {
        expect(function() {
          gradients.parse('linear-gradient(hsl(120, 60%, 70))');
        }).to.throwException(/Expected percentage value/);
      });

      it('should error on percentage for hue', function() {
        expect(function() {
          gradients.parse('linear-gradient(hsl(120%, 60%, 70%))');
        }).to.throwException(/HSL hue value must be a number in degrees \(0-360\) or normalized \(-360 to 360\), not a percentage/);
      });
    });
  });

  describe('parse linear gradients', function() {
    [
      'linear-gradient',
      'radial-gradient',
      'repeating-linear-gradient',
      'repeating-radial-gradient'
    ].forEach(function(gradient) {
      describe('parse ' + gradient + ' gradient', function() {
        beforeEach(function() {
          ast = gradients.parse(gradient + '(red, blue)');
          subject = ast[0];
        });

        it('should parse the gradient', function() {
          expect(subject.type).to.equal(gradient);
        });
      });
    });
  });

  describe('different radial declarations', function() {
    [
      'ellipse farthest-corner',
      'ellipse cover',
      'circle cover',
      'center bottom, ellipse cover',
      'circle at 87.23px -58.3px',
      'farthest-side, red, blue',
      'farthest-corner, red, blue',
      'farthest-corner at 87.23px -58.3px, red, blue'
    ].forEach(function(declaration) {

      it('should parse ' + declaration + ' declaration', function() {
        ast = gradients.parse('radial-gradient(' + declaration + ', red, blue)');
      });

    });
    
    it('should parse ellipse with dimensions and position', function() {
      const gradient = 'repeating-radial-gradient(ellipse 40px 134px at 50% 96%, rgb(0, 165, 223) 0%, rgb(62, 20, 123) 6.6%)';
      const ast = gradients.parse(gradient);
      
      expect(ast[0].type).to.equal('repeating-radial-gradient');
      expect(ast[0].orientation[0].type).to.equal('shape');
      expect(ast[0].orientation[0].value).to.equal('ellipse');
      
      // Check the style (size dimensions)
      expect(ast[0].orientation[0].style.type).to.equal('position');
      expect(ast[0].orientation[0].style.value.x.type).to.equal('px');
      expect(ast[0].orientation[0].style.value.x.value).to.equal('40');
      expect(ast[0].orientation[0].style.value.y.type).to.equal('px');
      expect(ast[0].orientation[0].style.value.y.value).to.equal('134');
      
      // Check the position
      expect(ast[0].orientation[0].at.type).to.equal('position');
      expect(ast[0].orientation[0].at.value.x.type).to.equal('%');
      expect(ast[0].orientation[0].at.value.x.value).to.equal('50');
      expect(ast[0].orientation[0].at.value.y.type).to.equal('%');
      expect(ast[0].orientation[0].at.value.y.value).to.equal('96');
      
      // Check the color stops
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['0', '165', '223']);
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length.value).to.equal('0');
      
      expect(ast[0].colorStops[1].type).to.equal('rgb');
      expect(ast[0].colorStops[1].value).to.eql(['62', '20', '123']);
      expect(ast[0].colorStops[1].length.type).to.equal('%');
      expect(ast[0].colorStops[1].length.value).to.equal('6.6');
    });
    
    it('should parse full Pride flag gradient', function() {
      const gradient = 'repeating-radial-gradient(ellipse 40px 134px at 50% 96%,rgb(0, 165, 223) 0%,rgb(62, 20, 123) 6.6%,rgb(226, 0, 121) 13.2%,rgb(223, 19, 44) 18.8%,rgb(243, 239, 21) 24.1%,rgb(0, 152, 71) 33.3%)';
      const ast = gradients.parse(gradient);
      
      expect(ast[0].type).to.equal('repeating-radial-gradient');
      expect(ast[0].orientation[0].type).to.equal('shape');
      expect(ast[0].orientation[0].value).to.equal('ellipse');
      
      // Check dimensions and position
      expect(ast[0].orientation[0].style.type).to.equal('position');
      expect(ast[0].orientation[0].at.type).to.equal('position');
      
      // Verify all color stops are present (Pride flag colors)
      expect(ast[0].colorStops).to.have.length(6);
      
      // Check the first and last color stops
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['0', '165', '223']);
      
      expect(ast[0].colorStops[5].type).to.equal('rgb');
      expect(ast[0].colorStops[5].value).to.eql(['0', '152', '71']);
      expect(ast[0].colorStops[5].length.type).to.equal('%');
      expect(ast[0].colorStops[5].length.value).to.equal('33.3');
    });

    it('should parse radial-gradient with position only (no shape/extent)', function() {
      const gradient = 'radial-gradient(at 57% 50%, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)';
      const ast = gradients.parse(gradient);
      
      expect(ast[0].type).to.equal('radial-gradient');
      
      // Verify the orientation (position only)
      expect(ast[0].orientation[0].type).to.equal('default-radial');
      expect(ast[0].orientation[0].at.type).to.equal('position');
      expect(ast[0].orientation[0].at.value.x.type).to.equal('%');
      expect(ast[0].orientation[0].at.value.x.value).to.equal('57');
      expect(ast[0].orientation[0].at.value.y.type).to.equal('%');
      expect(ast[0].orientation[0].at.value.y.value).to.equal('50');
      
      // Verify color stops
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['102', '126', '234']);
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length.value).to.equal('0');
      
      expect(ast[0].colorStops[1].type).to.equal('rgb');
      expect(ast[0].colorStops[1].value).to.eql(['118', '75', '162']);
      expect(ast[0].colorStops[1].length.type).to.equal('%');
      expect(ast[0].colorStops[1].length.value).to.equal('100');
    });
  });

  describe('parse gradient strings with trailing semicolons', function() {
    it('should parse linear-gradient with trailing semicolon', function() {
      const inputWithSemicolon = 'linear-gradient(red, blue);';
      const ast = gradients.parse(inputWithSemicolon);
      expect(ast[0].type).to.equal('linear-gradient');
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].value).to.equal('red');
      expect(ast[0].colorStops[1].value).to.equal('blue');
    });

    it('should parse radial-gradient with trailing semicolon', function() {
      const inputWithSemicolon = 'radial-gradient(circle, red, blue);';
      const ast = gradients.parse(inputWithSemicolon);
      expect(ast[0].type).to.equal('radial-gradient');
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].value).to.equal('red');
      expect(ast[0].colorStops[1].value).to.equal('blue');
    });

    it('should parse complex gradient with trailing semicolon', function() {
      const inputWithSemicolon = 'linear-gradient(to right, rgb(22, 234, 174) 0%, rgb(126, 32, 207) 100%);';
      const ast = gradients.parse(inputWithSemicolon);
      expect(ast[0].type).to.equal('linear-gradient');
      expect(ast[0].orientation.type).to.equal('directional');
      expect(ast[0].orientation.value).to.equal('right');
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length.value).to.equal('0');
      expect(ast[0].colorStops[1].type).to.equal('rgb');
      expect(ast[0].colorStops[1].length.type).to.equal('%');
      expect(ast[0].colorStops[1].length.value).to.equal('100');
    });
  });

  describe('parse gradient strings', function() {
    it('should parse repeating linear gradient with bottom right direction', function() {
      const gradient = 'repeating-linear-gradient(to bottom right,rgb(254, 158, 150) 0%,rgb(172, 79, 115) 100%)';
      const ast = gradients.parse(gradient);
      
      expect(ast[0].type).to.equal('repeating-linear-gradient');
      expect(ast[0].orientation.type).to.equal('directional');
      expect(ast[0].orientation.value).to.equal('bottom right');
      
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['254', '158', '150']);
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length.value).to.equal('0');
      
      expect(ast[0].colorStops[1].type).to.equal('rgb');
      expect(ast[0].colorStops[1].value).to.eql(['172', '79', '115']);
      expect(ast[0].colorStops[1].length.type).to.equal('%');
      expect(ast[0].colorStops[1].length.value).to.equal('100');
    });

    describe('parse different color formats', function() {
      const testGradients = [
        'linear-gradient(red, blue)',
        'linear-gradient(red, #00f)',
        'linear-gradient(red, #0000ff)',
        'linear-gradient(red, rgb(0, 0, 255))',
        'linear-gradient(red, rgba(0, 0, 255, 1))',
        'linear-gradient(red, hsl(240, 50%, 100%))',
        'linear-gradient(red, hsla(240, 50%, 100%, 1))'
      ];

      testGradients.forEach(function(gradient) {
        it('should parse ' + gradient, function() {
          const result = gradients.parse(gradient);
          expect(result[0].type).to.equal('linear-gradient');
          expect(result[0].colorStops).to.have.length(2);
          expect(result[0].colorStops[0].type).to.equal('literal');
          expect(result[0].colorStops[0].value).to.equal('red');
        });
      });
    });

    describe('parse calc expressions', function() {
      it('should parse linear gradient with calc in color stop position', function() {
        const gradient = 'linear-gradient(to right, red calc(10% + 20px), blue 50%)';
        const ast = gradients.parse(gradient);
        
        expect(ast[0].type).to.equal('linear-gradient');
        expect(ast[0].orientation.type).to.equal('directional');
        expect(ast[0].orientation.value).to.equal('right');
        
        expect(ast[0].colorStops).to.have.length(2);
        expect(ast[0].colorStops[0].type).to.equal('literal');
        expect(ast[0].colorStops[0].value).to.equal('red');
        expect(ast[0].colorStops[0].length.type).to.equal('calc');
        expect(ast[0].colorStops[0].length.value).to.equal('10% + 20px');
        
        expect(ast[0].colorStops[1].type).to.equal('literal');
        expect(ast[0].colorStops[1].value).to.equal('blue');
        expect(ast[0].colorStops[1].length.type).to.equal('%');
        expect(ast[0].colorStops[1].length.value).to.equal('50');
      });

      it('should parse radial gradient with calc in position', function() {
        const gradient = 'radial-gradient(circle at calc(50% + 25px) 50%, red, blue)';
        const ast = gradients.parse(gradient);
        
        expect(ast[0].type).to.equal('radial-gradient');
        expect(ast[0].orientation[0].type).to.equal('shape');
        expect(ast[0].orientation[0].value).to.equal('circle');
        
        // Check the position
        expect(ast[0].orientation[0].at.type).to.equal('position');
        expect(ast[0].orientation[0].at.value.x.type).to.equal('calc');
        expect(ast[0].orientation[0].at.value.x.value).to.equal('50% + 25px');
        expect(ast[0].orientation[0].at.value.y.type).to.equal('%');
        expect(ast[0].orientation[0].at.value.y.value).to.equal('50');
        
        // Check the color stops
        expect(ast[0].colorStops).to.have.length(2);
        expect(ast[0].colorStops[0].value).to.equal('red');
        expect(ast[0].colorStops[1].value).to.equal('blue');
      });

      it('should parse calc expressions with multiple operations', function() {
        const gradient = 'linear-gradient(90deg, yellow calc(100% - 50px), green calc(100% - 20px))';
        const ast = gradients.parse(gradient);
        
        expect(ast[0].type).to.equal('linear-gradient');
        expect(ast[0].orientation.type).to.equal('angular');
        expect(ast[0].orientation.value).to.equal('90');
        
        expect(ast[0].colorStops).to.have.length(2);
        expect(ast[0].colorStops[0].type).to.equal('literal');
        expect(ast[0].colorStops[0].value).to.equal('yellow');
        expect(ast[0].colorStops[0].length.type).to.equal('calc');
        expect(ast[0].colorStops[0].length.value).to.equal('100% - 50px');
        
        expect(ast[0].colorStops[1].type).to.equal('literal');
        expect(ast[0].colorStops[1].value).to.equal('green');
        expect(ast[0].colorStops[1].length.type).to.equal('calc');
        expect(ast[0].colorStops[1].length.value).to.equal('100% - 20px');
      });
      
      it('should parse calc expressions with nested parentheses', function() {
        const gradient = 'linear-gradient(to bottom, red calc(50% + (25px * 2)), blue)';
        const ast = gradients.parse(gradient);
        
        expect(ast[0].type).to.equal('linear-gradient');
        expect(ast[0].orientation.type).to.equal('directional');
        expect(ast[0].orientation.value).to.equal('bottom');
        
        expect(ast[0].colorStops).to.have.length(2);
        expect(ast[0].colorStops[0].type).to.equal('literal');
        expect(ast[0].colorStops[0].value).to.equal('red');
        expect(ast[0].colorStops[0].length.type).to.equal('calc');
        expect(ast[0].colorStops[0].length.value).to.equal('50% + (25px * 2)');
      });
      
      it('should parse multiple calc expressions in the same gradient', function() {
        const gradient = 'radial-gradient(circle at calc(50% - 10px) calc(50% + 10px), red calc(20% + 10px), blue)';
        const ast = gradients.parse(gradient);
        
        expect(ast[0].type).to.equal('radial-gradient');
        expect(ast[0].orientation[0].type).to.equal('shape');
        expect(ast[0].orientation[0].value).to.equal('circle');
        
        // Check the position
        expect(ast[0].orientation[0].at.type).to.equal('position');
        expect(ast[0].orientation[0].at.value.x.type).to.equal('calc');
        expect(ast[0].orientation[0].at.value.x.value).to.equal('50% - 10px');
        expect(ast[0].orientation[0].at.value.y.type).to.equal('calc');
        expect(ast[0].orientation[0].at.value.y.value).to.equal('50% + 10px');
        
        // Check the color stops
        expect(ast[0].colorStops).to.have.length(2);
        expect(ast[0].colorStops[0].type).to.equal('literal');
        expect(ast[0].colorStops[0].value).to.equal('red');
        expect(ast[0].colorStops[0].length.type).to.equal('calc');
        expect(ast[0].colorStops[0].length.value).to.equal('20% + 10px');
      });

      it('should throw an error for unbalanced parentheses in calc expressions', function() {
        // Different test cases throw different errors, so we need to be more specific
        expect(function() {
          gradients.parse('linear-gradient(to right, red calc(50% + (25px), blue)');
        }).to.throwException();
        
        expect(function() {
          gradients.parse('radial-gradient(circle at calc(50% + 25px, red, blue)');
        }).to.throwException(/Missing comma before color stops/);
        
        expect(function() {
          gradients.parse('linear-gradient(90deg, yellow calc(100% - (50px - 20px), green)');
        }).to.throwException();
      });
    });
  });

  describe('parse conic gradients', function() {
    it('should parse simple conic-gradient', function() {
      var ast = gradients.parse('conic-gradient(red, blue)');
      expect(ast[0].type).to.equal('conic-gradient');
      expect(ast[0].colorStops).to.have.length(2);
      expect(ast[0].colorStops[0].value).to.equal('red');
      expect(ast[0].colorStops[1].value).to.equal('blue');
    });

    it('should parse conic-gradient with from angle', function() {
      var ast = gradients.parse('conic-gradient(from 45deg, red, blue)');
      expect(ast[0].type).to.equal('conic-gradient');
      expect(ast[0].orientation.type).to.equal('conic');
      expect(ast[0].orientation.angle.type).to.equal('angular');
      expect(ast[0].orientation.angle.value).to.equal('45');
      expect(ast[0].orientation.angle.unit).to.equal('deg');
    });

    it('should parse conic-gradient with at position', function() {
      var ast = gradients.parse('conic-gradient(at 50% 50%, red, blue)');
      expect(ast[0].type).to.equal('conic-gradient');
      expect(ast[0].orientation.type).to.equal('conic');
      expect(ast[0].orientation.at.type).to.equal('position');
      expect(ast[0].orientation.at.value.x.value).to.equal('50');
      expect(ast[0].orientation.at.value.y.value).to.equal('50');
    });

    it('should parse conic-gradient with from angle and at position', function() {
      var ast = gradients.parse('conic-gradient(from 90deg at 25% 75%, red, yellow, blue)');
      expect(ast[0].type).to.equal('conic-gradient');
      expect(ast[0].orientation.angle.value).to.equal('90');
      expect(ast[0].orientation.angle.unit).to.equal('deg');
      expect(ast[0].orientation.at.type).to.equal('position');
      expect(ast[0].orientation.at.value.x.value).to.equal('25');
      expect(ast[0].orientation.at.value.y.value).to.equal('75');
      expect(ast[0].colorStops).to.have.length(3);
    });

    it('should parse repeating-conic-gradient', function() {
      var ast = gradients.parse('repeating-conic-gradient(from 0deg, red 0%, blue 25%)');
      expect(ast[0].type).to.equal('repeating-conic-gradient');
      expect(ast[0].orientation.angle.value).to.equal('0');
      expect(ast[0].colorStops).to.have.length(2);
    });
  });

  describe('parse additional angle units', function() {
    it('should parse grad angle unit', function() {
      var ast = gradients.parse('linear-gradient(100grad, red, blue)');
      expect(ast[0].orientation.type).to.equal('angular');
      expect(ast[0].orientation.value).to.equal('100');
      expect(ast[0].orientation.unit).to.equal('grad');
    });

    it('should parse turn angle unit', function() {
      var ast = gradients.parse('linear-gradient(0.25turn, red, blue)');
      expect(ast[0].orientation.type).to.equal('angular');
      expect(ast[0].orientation.value).to.equal('0.25');
      expect(ast[0].orientation.unit).to.equal('turn');
    });

    it('should preserve deg unit in AST', function() {
      var ast = gradients.parse('linear-gradient(45deg, red, blue)');
      expect(ast[0].orientation.unit).to.equal('deg');
    });

    it('should preserve rad unit in AST', function() {
      var ast = gradients.parse('linear-gradient(1rad, red, blue)');
      expect(ast[0].orientation.unit).to.equal('rad');
    });
  });

  describe('parse additional CSS length units', function() {
    [
      {unit: 'rem', input: '2rem'},
      {unit: 'vw', input: '50vw'},
      {unit: 'vh', input: '100vh'},
      {unit: 'vmin', input: '10vmin'},
      {unit: 'vmax', input: '90vmax'},
      {unit: 'ch', input: '5ch'},
      {unit: 'ex', input: '3ex'}
    ].forEach(function(tc) {
      it('should parse ' + tc.unit + ' unit in color stop', function() {
        var ast = gradients.parse('linear-gradient(red ' + tc.input + ', blue)');
        expect(ast[0].colorStops[0].length.type).to.equal(tc.unit);
      });
    });
  });

  describe('parse CSS Color Level 4 space-separated syntax', function() {
    it('should parse rgb with space-separated values', function() {
      var ast = gradients.parse('linear-gradient(rgb(255 0 128), blue)');
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['255', '0', '128']);
    });

    it('should parse rgb with slash alpha', function() {
      var ast = gradients.parse('linear-gradient(rgb(255 0 128 / 0.5), blue)');
      expect(ast[0].colorStops[0].type).to.equal('rgba');
      expect(ast[0].colorStops[0].value).to.eql(['255', '0', '128', '0.5']);
    });

    it('should parse hsl with space-separated values', function() {
      var ast = gradients.parse('linear-gradient(hsl(120 60% 70%), blue)');
      expect(ast[0].colorStops[0].type).to.equal('hsl');
      expect(ast[0].colorStops[0].value).to.eql(['120', '60', '70']);
    });

    it('should parse hsl with slash alpha', function() {
      var ast = gradients.parse('linear-gradient(hsl(120 60% 70% / 0.5), blue)');
      expect(ast[0].colorStops[0].type).to.equal('hsla');
      expect(ast[0].colorStops[0].value).to.eql(['120', '60', '70', '0.5']);
    });

    it('should still parse legacy comma-separated rgb', function() {
      var ast = gradients.parse('linear-gradient(rgb(255, 0, 128), blue)');
      expect(ast[0].colorStops[0].type).to.equal('rgb');
      expect(ast[0].colorStops[0].value).to.eql(['255', '0', '128']);
    });

    it('should parse legacy comma-separated rgb with alpha as rgba', function() {
      var ast = gradients.parse('linear-gradient(rgb(255, 0, 128, 0.5), blue)');
      expect(ast[0].colorStops[0].type).to.equal('rgba');
      expect(ast[0].colorStops[0].value).to.eql(['255', '0', '128', '0.5']);
    });

    it('should still parse legacy comma-separated hsl', function() {
      var ast = gradients.parse('linear-gradient(hsl(120, 60%, 70%), blue)');
      expect(ast[0].colorStops[0].type).to.equal('hsl');
      expect(ast[0].colorStops[0].value).to.eql(['120', '60', '70']);
    });
  });

  describe('parse dual color stop positions', function() {
    it('should parse color stop with two positions', function() {
      var ast = gradients.parse('linear-gradient(red 10% 30%, blue)');
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length.value).to.equal('10');
      expect(ast[0].colorStops[0].length2.type).to.equal('%');
      expect(ast[0].colorStops[0].length2.value).to.equal('30');
    });

    it('should parse dual positions with px', function() {
      var ast = gradients.parse('linear-gradient(red 10px 50px, blue)');
      expect(ast[0].colorStops[0].length.type).to.equal('px');
      expect(ast[0].colorStops[0].length.value).to.equal('10');
      expect(ast[0].colorStops[0].length2.type).to.equal('px');
      expect(ast[0].colorStops[0].length2.value).to.equal('50');
    });

    it('should not set length2 for single position', function() {
      var ast = gradients.parse('linear-gradient(red 50%, blue)');
      expect(ast[0].colorStops[0].length.type).to.equal('%');
      expect(ast[0].colorStops[0].length2).to.be(undefined);
    });
  });

  describe('hex color validation', function() {
    it('should parse 3-digit hex', function() {
      var ast = gradients.parse('linear-gradient(#fff, blue)');
      expect(ast[0].colorStops[0].value).to.equal('fff');
    });

    it('should parse 4-digit hex (with alpha)', function() {
      var ast = gradients.parse('linear-gradient(#fffa, blue)');
      expect(ast[0].colorStops[0].value).to.equal('fffa');
    });

    it('should parse 6-digit hex', function() {
      var ast = gradients.parse('linear-gradient(#ff00ff, blue)');
      expect(ast[0].colorStops[0].value).to.equal('ff00ff');
    });

    it('should parse 8-digit hex (with alpha)', function() {
      var ast = gradients.parse('linear-gradient(#ff00ff80, blue)');
      expect(ast[0].colorStops[0].value).to.equal('ff00ff80');
    });

    it('should reject invalid hex lengths', function() {
      expect(function() {
        gradients.parse('linear-gradient(#ff, blue)');
      }).to.throwException();
      expect(function() {
        gradients.parse('linear-gradient(#fffff, blue)');
      }).to.throwException();
      expect(function() {
        gradients.parse('linear-gradient(#fffffff, blue)');
      }).to.throwException();
    });
  });

});
