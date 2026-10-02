'use strict';

var expect = require('expect.js');
var gradients = require('../build/node');

function pprint(ast) {
  console.log(JSON.stringify(ast, true, 2));
}

describe('lib/stringify.js', function () {
  var subject;

  it('should exist', function () {
    expect(typeof gradients.stringify).to.equal('function');
  });

  describe('serialization', function() {
    it('should handle array input without error', function() {
      const nodes = [{
        type: 'linear-gradient',
        colorStops: [{ type: 'literal', value: 'red' }, { type: 'literal', value: 'blue' }],
        orientation: null
      }];
      
      expect(function() {
        const result = gradients.stringify(nodes);
        expect(result).to.equal('linear-gradient(red, blue)');
      }).to.not.throwException();
    });


    it('if tree is null', function() {
      expect(gradients.stringify(null)).to.equal('');
    });

    it('should serialize a simple gradient', function() {
      var gradientDef = 'linear-gradient(black, white)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with hex', function() {
      var gradientDef = 'linear-gradient(#fff, white)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with var', function() {
      var gradientDef = 'linear-gradient(var(--color-black), white)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with rgb', function() {
      var gradientDef = 'linear-gradient(rgb(1, 2, 3), white)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with rgba', function() {
      var gradientDef = 'linear-gradient(rgba(1, 2, 3, .0), white)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with deg', function() {
      var gradientDef = 'linear-gradient(45deg, #fff, transparent)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    it('should serialize gradient with directional', function() {
      var gradientDef = 'linear-gradient(to left, #fff, transparent)';
      expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
    });

    describe('all metric values', function() {
      [
        'px',
        'em',
        '%'
      ].forEach(function(metric) {
        var expectedResult;

        describe('stringify color stop for metric '+ metric, function() {
          beforeEach(function() {
            expectedResult = 'linear-gradient(blue 10.3' + metric + ', transparent)';
            var ast = gradients.parse(expectedResult);
            subject = gradients.stringify(ast);
          });

          it('should result as expected', function() {
            expect(subject).to.equal(expectedResult);
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
        'farthest-corner, red, blue',
        'farthest-corner at 87.23px -58.3px, red, blue'
      ].forEach(function(declaration) {

        it('should parse ' + declaration + ' declaration', function() {
          var expectedResult = 'radial-gradient(' + declaration + ', red, blue)';
          var ast = gradients.parse(expectedResult);
          subject = gradients.stringify(ast);

          expect(subject).to.equal(expectedResult);
        });

      });
    });

    describe('angle unit preservation', function() {
      it('should round-trip rad values', function() {
        var gradientDef = 'linear-gradient(1rad, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip grad values', function() {
        var gradientDef = 'linear-gradient(100grad, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip turn values', function() {
        var gradientDef = 'linear-gradient(0.25turn, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip deg values', function() {
        var gradientDef = 'linear-gradient(45deg, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });
    });

    describe('conic-gradient serialization', function() {
      it('should round-trip simple conic-gradient', function() {
        var gradientDef = 'conic-gradient(red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip conic-gradient with from angle', function() {
        var gradientDef = 'conic-gradient(from 45deg, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip conic-gradient with at position', function() {
        var gradientDef = 'conic-gradient(at 50% 50%, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip conic-gradient with from and at', function() {
        var gradientDef = 'conic-gradient(from 90deg at 25% 75%, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip repeating-conic-gradient', function() {
        var gradientDef = 'repeating-conic-gradient(from 0deg, red 0%, blue 25%)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });
    });

    describe('additional length units', function() {
      [
        'rem',
        'vw',
        'vh',
        'vmin',
        'vmax',
        'ch',
        'ex'
      ].forEach(function(unit) {
        it('should round-trip ' + unit + ' unit', function() {
          var gradientDef = 'linear-gradient(blue 10' + unit + ', transparent)';
          expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
        });
      });
    });

    describe('radial with explicit at keyword', function() {
      it('should round-trip radial-gradient with at position', function() {
        var gradientDef = 'radial-gradient(at 57% 50%, red, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });
    });

    describe('dual color stop positions', function() {
      it('should round-trip dual percentage positions', function() {
        var gradientDef = 'linear-gradient(red 10% 30%, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });

      it('should round-trip dual px positions', function() {
        var gradientDef = 'linear-gradient(red 10px 50px, blue)';
        expect(gradients.stringify(gradients.parse(gradientDef))).to.equal(gradientDef);
      });
    });

  });

});
