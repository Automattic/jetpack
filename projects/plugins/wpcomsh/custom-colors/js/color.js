/*! Color.js - v1.1.0 - 2015-12-17
* https://github.com/Automattic/Color.js
* Copyright (c) 2015 Matt Wiebe; Licensed GPLv2 */
(function(global, undef) {

	var Color = function( color, type ) {
		if ( ! ( this instanceof Color ) ) {
			return new Color( color, type );
		}

		return this._init( color, type );
	};

	Color.fn = Color.prototype = {
		_color: 0,
		_alpha: 1,
		error: false,
		// for preserving hue/sat in fromHsl().toHsl() flows
		_hsl: { h: 0, s: 0, l: 0 },
		// for preserving hue/sat in fromHsv().toHsv() flows
		_hsv: { h: 0, s: 0, v: 0 },
		// for setting hsl or hsv space - needed for .h() & .s() functions to function properly
		_hSpace: 'hsl',
		_init: function( color ) {
			var func = 'noop';
			switch ( typeof color ) {
				case 'object':
					// alpha?
					if ( color.a !== undef ) {
						this.a( color.a );
					}
					func = ( color.r !== undef ) ? 'fromRgb' :
						( color.l !== undef ) ? 'fromHsl' :
						( color.v !== undef ) ? 'fromHsv' : func;
						return this[func]( color );
				case 'string':
						return this.fromCSS( color );
				case 'number':
						return this.fromInt( parseInt( color, 10 ) );
			}
			return this;
		},

		_error: function() {
			this.error = true;
			return this;
		},

		clone: function() {
			var newColor = new Color( this.toInt() ),
				copy     = ['_alpha', '_hSpace', '_hsl', '_hsv', 'error'];
			for ( var i = copy.length - 1; i >= 0; i-- ) {
				newColor[ copy[i] ] = this[ copy[i] ];
			}
			return newColor;
		},

		setHSpace: function( space ) {
			this._hSpace = ( space === 'hsv' ) ? space : 'hsl';
			return this;
		},

		noop: function() {
			return this;
		},

		fromCSS: function( color ) {
			var list,
				leadingRE = /^(rgb|hs(l|v))a?\(/;
			this.error    = false;

			// whitespace and semicolon trim
			color = color.replace( /^\s+/, '' ).replace( /\s+$/, '' ).replace( /;$/, '' );

			if ( color.match( leadingRE ) && color.match( /\)$/ ) ) {
				list = color.replace( /(\s|%)/g, '' ).replace( leadingRE, '' ).replace( /,?\);?$/, '' ).split( ',' );

				if ( list.length < 3 ) {
					return this._error();
				}

				if ( list.length === 4 ) {
					this.a( parseFloat( list.pop() ) );
					// error state has been set to true in .a() if we passed NaN
					if ( this.error ) {
						return this;
					}
				}

				for (var i = list.length - 1; i >= 0; i--) {
					list[i] = parseInt( list[i], 10 );
					if ( isNaN( list[i] ) ) {
						return this._error();
					}
				}

				if ( color.match( /^rgb/ ) ) {
					return this.fromRgb(
						{
							r: list[0],
							g: list[1],
							b: list[2]
						}
					);
				} else if ( color.match( /^hsv/ ) ) {
					return this.fromHsv(
						{
							h: list[0],
							s: list[1],
							v: list[2]
						}
					);
				} else {
					return this.fromHsl(
						{
							h: list[0],
							s: list[1],
							l: list[2]
						}
					);
				}
			} else {
				// must be hex amirite?
				return this.fromHex( color );
			}
		},

		fromRgb: function( rgb, preserve ) {
			if ( typeof rgb !== 'object' || rgb.r === undef || rgb.g === undef || rgb.b === undef ) {
				return this._error();
			}

			this.error = false;
			return this.fromInt( parseInt( ( rgb.r << 16 ) + ( rgb.g << 8 ) + rgb.b, 10 ), preserve );
		},

		fromHex: function( color ) {
			color = color.replace( /^#/, '' ).replace( /^0x/, '' );
			if ( color.length === 3 ) {
				color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
			}

			// rough error checking - this is where things go squirrely the most
			this.error = ! /^[0-9A-F]{6}$/i.test( color );
			return this.fromInt( parseInt( color, 16 ) );
		},

		fromHsl: function( hsl ) {
			var r, g, b, q, p, h, s, l;

			if ( typeof hsl !== 'object' || hsl.h === undef || hsl.s === undef || hsl.l === undef ) {
				return this._error();
			}

			this._hsl    = hsl; // store it
			this._hSpace = 'hsl'; // implicit
			h            = hsl.h / 360; s = hsl.s / 100; l = hsl.l / 100;
			if ( s === 0 ) {
				r = g = b = l; // achromatic
			} else {
				q = l < 0.5 ? l * ( 1 + s ) : l + s - l * s;
				p = 2 * l - q;
				r = this.hue2rgb( p, q, h + 1 / 3 );
				g = this.hue2rgb( p, q, h );
				b = this.hue2rgb( p, q, h - 1 / 3 );
			}
			return this.fromRgb(
				{
					r: r * 255,
					g: g * 255,
					b: b * 255
				},
				true
			); // true preserves hue/sat
		},

		fromHsv: function( hsv ) {
			var h, s, v, r, g, b, i, f, p, q, t;
			if ( typeof hsv !== 'object' || hsv.h === undef || hsv.s === undef || hsv.v === undef ) {
				return this._error();
			}

			this._hsv    = hsv; // store it
			this._hSpace = 'hsv'; // implicit

			h = hsv.h / 360; s = hsv.s / 100; v = hsv.v / 100;
			i                                   = Math.floor( h * 6 );
			f                                   = h * 6 - i;
			p                                   = v * ( 1 - s );
			q                                   = v * ( 1 - f * s );
			t                                   = v * ( 1 - ( 1 - f ) * s );

			switch ( i % 6 ) {
				case 0:
					r = v; g = t; b = p;
					break;
				case 1:
					r = q; g = v; b = p;
					break;
				case 2:
					r = p; g = v; b = t;
					break;
				case 3:
					r = p; g = q; b = v;
					break;
				case 4:
					r = t; g = p; b = v;
					break;
				case 5:
					r = v; g = p; b = q;
					break;
			}

			return this.fromRgb(
				{
					r: r * 255,
					g: g * 255,
					b: b * 255
				},
				true
			); // true preserves hue/sat

		},
		// everything comes down to fromInt
		fromInt: function( color, preserve ) {
			this._color = parseInt( color, 10 );

			if ( isNaN( this._color ) ) {
				this._color = 0;
			}

			// let's coerce things
			if ( this._color > 16777215 ) {
				this._color = 16777215;
			} else if ( this._color < 0 ) {
				this._color = 0;
			}

			// let's not do weird things
			if ( preserve === undef ) {
				this._hsv.h = this._hsv.s = this._hsl.h = this._hsl.s = 0;
			}
			// EVENT GOES HERE
			return this;
		},

		hue2rgb: function( p, q, t ) {
			if ( t < 0 ) {
				t += 1;
			}
			if ( t > 1 ) {
				t -= 1;
			}
			if ( t < 1 / 6 ) {
				return p + ( q - p ) * 6 * t;
			}
			if ( t < 1 / 2 ) {
				return q;
			}
			if ( t < 2 / 3 ) {
				return p + ( q - p ) * ( 2 / 3 - t ) * 6;
			}
			return p;
		},

		toString: function() {
			var hex = parseInt( this._color, 10 ).toString( 16 );
			if ( this.error ) {
				return '';
			}
			// maybe left pad it
			if ( hex.length < 6 ) {
				for (var i = 6 - hex.length - 1; i >= 0; i--) {
					hex = '0' + hex;
				}
			}
			return '#' + hex;
		},

		toCSS: function( type, alpha ) {
			type  = type || 'hex';
			alpha = parseFloat( alpha || this._alpha );
			switch ( type ) {
				case 'rgb':
				case 'rgba':
					var rgb = this.toRgb();
					if ( alpha < 1 ) {
						return "rgba( " + rgb.r + ", " + rgb.g + ", " + rgb.b + ", " + alpha + " )";
					} else {
						return "rgb( " + rgb.r + ", " + rgb.g + ", " + rgb.b + " )";
					}
					break;
				case 'hsl':
				case 'hsla':
					var hsl = this.toHsl();
					if ( alpha < 1 ) {
						return "hsla( " + hsl.h + ", " + hsl.s + "%, " + hsl.l + "%, " + alpha + " )";
					} else {
						return "hsl( " + hsl.h + ", " + hsl.s + "%, " + hsl.l + "% )";
					}
					break;
				default:
					return this.toString();
			}
		},

		toRgb: function() {
			return {
				r: 255 & ( this._color >> 16 ),
				g: 255 & ( this._color >> 8 ),
				b: 255 & ( this._color )
			};
		},

		toHsl: function() {
			var rgb     = this.toRgb();
			var r       = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
			var max     = Math.max( r, g, b ), min = Math.min( r, g, b );
			var h, s, l = ( max + min ) / 2;

			if ( max === min ) {
				h = s = 0; // achromatic
			} else {
				var d = max - min;
				s     = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
				switch ( max ) {
					case r: h = ( g - b ) / d + ( g < b ? 6 : 0 );
						break;
					case g: h = ( b - r ) / d + 2;
						break;
					case b: h = ( r - g ) / d + 4;
						break;
				}
				h /= 6;
			}

			// maintain hue & sat if we've been manipulating things in the HSL space.
			h = Math.round( h * 360 );
			if ( h === 0 && this._hsl.h !== h ) {
				h = this._hsl.h;
			}
			s = Math.round( s * 100 );
			if ( s === 0 && this._hsl.s ) {
				s = this._hsl.s;
			}

			return {
				h: h,
				s: s,
				l: Math.round( l * 100 )
			};

		},

		toHsv: function() {
			var rgb     = this.toRgb();
			var r       = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
			var max     = Math.max( r, g, b ), min = Math.min( r, g, b );
			var h, s, v = max;
			var d       = max - min;
			s           = max === 0 ? 0 : d / max;

			if ( max === min ) {
				h = s = 0; // achromatic
			} else {
				switch ( max ) {
					case r:
						h = ( g - b ) / d + ( g < b ? 6 : 0 );
						break;
					case g:
						h = ( b - r ) / d + 2;
						break;
					case b:
						h = ( r - g ) / d + 4;
						break;
				}
				h /= 6;
			}

			// maintain hue & sat if we've been manipulating things in the HSV space.
			h = Math.round( h * 360 );
			if ( h === 0 && this._hsv.h !== h ) {
				h = this._hsv.h;
			}
			s = Math.round( s * 100 );
			if ( s === 0 && this._hsv.s ) {
				s = this._hsv.s;
			}

			return {
				h: h,
				s: s,
				v: Math.round( v * 100 )
			};
		},

		toInt: function() {
			return this._color;
		},

		toIEOctoHex: function() {
			// AARRBBGG
			var hex = this.toString();
			var AA  = parseInt( 255 * this._alpha, 10 ).toString( 16 );
			if ( AA.length === 1 ) {
				AA = '0' + AA;
			}
			return '#' + AA + hex.replace( /^#/, '' );
		},

		// http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
		toLuminosity: function() {
			var rgb = this.toRgb();
			var lum = {};
			for ( var i in rgb ) {
				if ( ! rgb.hasOwnProperty( i ) ) {
					continue;
				}
				var chan = rgb[ i ] / 255;
				lum[ i ] = ( chan <= 0.03928 ) ? chan / 12.92 : Math.pow( ( ( chan + 0.055 ) / 1.055 ), 2.4 );
			}

			return 0.2126 * lum.r + 0.7152 * lum.g + 0.0722 * lum.b;
		},

		// http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef
		getDistanceLuminosityFrom: function( color ) {
			if ( ! ( color instanceof Color ) ) {
				throw 'getDistanceLuminosityFrom requires a Color object';
			}
			var lum1 = this.toLuminosity();
			var lum2 = color.toLuminosity();
			if ( lum1 > lum2 ) {
				return ( lum1 + 0.05 ) / ( lum2 + 0.05 );
			} else {
				return ( lum2 + 0.05 ) / ( lum1 + 0.05 );
			}
		},

		getMaxContrastColor: function() {
			var withBlack = this.getDistanceLuminosityFrom( new Color( '#000' ) );
			var withWhite = this.getDistanceLuminosityFrom( new Color( '#fff' ) );
			var hex       = ( withBlack >= withWhite ) ? '#000' : '#fff';
			return new Color( hex );
		},

		getReadableContrastingColor: function( bgColor, minContrast ) {
			if ( ! ( bgColor instanceof Color ) ) {
				return this;
			}

			// you shouldn't use less than 5, but you might want to.
			var targetContrast = ( minContrast === undef ) ? 5 : minContrast,
				contrast       = bgColor.getDistanceLuminosityFrom( this ),
				maxContrastColor, maxContrast, incr;

			// if we have sufficient contrast already, cool
			if ( contrast >= targetContrast ) {
				return this;
			}

			maxContrastColor = bgColor.getMaxContrastColor();
			maxContrast      = maxContrastColor.getDistanceLuminosityFrom( bgColor );

			// if current max contrast is less than the target contrast, we had wishful thinking.
			// still, go max
			if ( maxContrast <= targetContrast ) {
				return maxContrastColor;
			}

			incr = ( 0 === maxContrastColor.toInt() ) ? -1 : 1;
			while ( contrast < targetContrast ) {
				this.l( incr, true ); // 2nd arg turns this into an incrementer
				contrast = this.getDistanceLuminosityFrom( bgColor );
				// infininite loop prevention: you never know.
				if ( this._color === 0 || this._color === 16777215 ) {
					break;
				}
			}

			return this;
		},

		a: function( val ) {
			if ( val === undef ) {
				return this._alpha;
			}

			var a = parseFloat( val );

			if ( isNaN( a ) ) {
				return this._error();
			}

			this._alpha = a;
			return this;
		},

		// TRANSFORMS

		darken: function( amount ) {
			amount = amount || 5;
			return this.l( - amount, true );
		},

		lighten: function( amount ) {
			amount = amount || 5;
			return this.l( amount, true );
		},

		saturate: function( amount ) {
			amount = amount || 15;
			return this.s( amount, true );
		},

		desaturate: function( amount ) {
			amount = amount || 15;
			return this.s( - amount, true );
		},

		toGrayscale: function() {
			return this.setHSpace( 'hsl' ).s( 0 );
		},

		getComplement: function() {
			return this.h( 180, true );
		},

		getSplitComplement: function( step ) {
			step     = step || 1;
			var incr = 180 + ( step * 30 );
			return this.h( incr, true );
		},

		getAnalog: function( step ) {
			step     = step || 1;
			var incr = step * 30;
			return this.h( incr, true );
		},

		getTetrad: function( step ) {
			step     = step || 1;
			var incr = step * 60;
			return this.h( incr, true );
		},

		getTriad: function( step ) {
			step     = step || 1;
			var incr = step * 120;
			return this.h( incr, true );
		},

		_partial: function( key ) {
			var prop = shortProps[key];
			return function( val, incr ) {
				var color = this._spaceFunc( 'to', prop.space );

				// GETTER
				if ( val === undef ) {
					return color[key];
				}

				// INCREMENT
				if ( incr === true ) {
					val = color[key] + val;
				}

				// MOD & RANGE
				if ( prop.mod ) {
					val = val % prop.mod;
				}
				if ( prop.range ) {
					val = ( val < prop.range[0] ) ? prop.range[0] : ( val > prop.range[1] ) ? prop.range[1] : val;
				}

				// NEW VALUE
				color[key] = val;

				return this._spaceFunc( 'from', prop.space, color );
			};
		},

		_spaceFunc: function( dir, s, val ) {
			var space    = s || this._hSpace,
				funcName = dir + space.charAt( 0 ).toUpperCase() + space.substr( 1 );
			return this[funcName]( val );
		}
	};

	var shortProps = {
		h: {
			mod: 360
		},
		s: {
			range: [0,100]
		},
		l: {
			space: 'hsl',
			range: [0,100]
		},
		v: {
			space: 'hsv',
			range: [0,100]
		},
		r: {
			space: 'rgb',
			range: [0,255]
		},
		g: {
			space: 'rgb',
			range: [0,255]
		},
		b: {
			space: 'rgb',
			range: [0,255]
		}
	};

	for ( var key in shortProps ) {
		if ( shortProps.hasOwnProperty( key ) ) {
			Color.fn[key] = Color.fn._partial( key );
		}
	}

	// play nicely with Node + browser
	if ( typeof exports === 'object' ) {
		module.exports = Color;
	} else {
		global.Color = Color;
	}

}(this));
