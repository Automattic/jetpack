'use strict';
Object.defineProperty( exports, '__esModule', { value: ! 0 } ), ( exports.default = void 0 );
const _react = _interopRequireWildcard( require( 'react' ) ),
	_propTypes = _interopRequireDefault( require( 'prop-types' ) ),
	_socialLogoData = require( './social-logo-data' ),
	_excluded = [ 'size', 'onClick', 'icon', 'className' ];
/**
 *
 * @param a
 */
function _interopRequireDefault( a ) {
	return a && a.__esModule ? a : { default: a };
}
/**
 *
 * @param a
 */
function _getRequireWildcardCache( a ) {
	if ( 'function' !== typeof WeakMap ) {
		return null;
	}
	const b = new WeakMap(),
		c = new WeakMap();
	return ( _getRequireWildcardCache = function ( a ) {
		return a ? c : b;
	} )( a );
}
/**
 *
 * @param b
 * @param c
 */
function _interopRequireWildcard( b, c ) {
	if ( ! c && b && b.__esModule ) {
		return b;
	}
	if ( null === b || ( 'object' != _typeof( b ) && 'function' !== typeof b ) ) {
		return { default: b };
	}
	const d = _getRequireWildcardCache( c );
	if ( d && d.has( b ) ) {
		return d.get( b );
	}
	const e = { __proto__: null },
		f = Object.defineProperty && Object.getOwnPropertyDescriptor;
	for ( const a in b ) {
		if ( 'default' != a && Object.prototype.hasOwnProperty.call( b, a ) ) {
			const g = f ? Object.getOwnPropertyDescriptor( b, a ) : null;
			g && ( g.get || g.set ) ? Object.defineProperty( e, a, g ) : ( e[ a ] = b[ a ] );
		}
	}
	return ( e.default = b ), d && d.set( b, e ), e;
}
/**
 *
 * @param a
 */
function _typeof( a ) {
	'@babel/helpers - typeof';
	return (
		( _typeof =
			'function' === typeof Symbol && 'symbol' === typeof Symbol.iterator
				? function ( a ) {
						return typeof a;
				  }
				: function ( a ) {
						return a &&
							'function' === typeof Symbol &&
							a.constructor === Symbol &&
							a !== Symbol.prototype
							? 'symbol'
							: typeof a;
				  } ),
		_typeof( a )
	);
}
/**
 *
 * @param a
 * @param b
 */
function ownKeys( a, b ) {
	const c = Object.keys( a );
	if ( Object.getOwnPropertySymbols ) {
		let d = Object.getOwnPropertySymbols( a );
		b &&
			( d = d.filter( function ( b ) {
				return Object.getOwnPropertyDescriptor( a, b ).enumerable;
			} ) ),
			c.push.apply( c, d );
	}
	return c;
}
/**
 *
 * @param a
 */
function _objectSpread( a ) {
	for ( var b, c = 1; c < arguments.length; c++ ) {
		( b = null == arguments[ c ] ? {} : arguments[ c ] ),
			c % 2
				? ownKeys( Object( b ), ! 0 ).forEach( function ( c ) {
						_defineProperty( a, c, b[ c ] );
				  } )
				: Object.getOwnPropertyDescriptors
				? Object.defineProperties( a, Object.getOwnPropertyDescriptors( b ) )
				: ownKeys( Object( b ) ).forEach( function ( c ) {
						Object.defineProperty( a, c, Object.getOwnPropertyDescriptor( b, c ) );
				  } );
	}
	return a;
}
/**
 *
 */
function _extends() {
	return (
		( _extends = Object.assign
			? Object.assign.bind()
			: function ( a ) {
					for ( var b, c = 1; c < arguments.length; c++ ) {
						for ( const d in ( ( b = arguments[ c ] ), b ) ) {
							Object.prototype.hasOwnProperty.call( b, d ) && ( a[ d ] = b[ d ] );
						}
					}
					return a;
			  } ),
		_extends.apply( this, arguments )
	);
}
/**
 *
 * @param a
 * @param b
 */
function _objectWithoutProperties( a, b ) {
	if ( null == a ) {
		return {};
	}
	let c,
		d,
		e = _objectWithoutPropertiesLoose( a, b );
	if ( Object.getOwnPropertySymbols ) {
		const f = Object.getOwnPropertySymbols( a );
		for ( d = 0; d < f.length; d++ ) {
			( c = f[ d ] ),
				0 <= b.indexOf( c ) ||
					( Object.prototype.propertyIsEnumerable.call( a, c ) && ( e[ c ] = a[ c ] ) );
		}
	}
	return e;
}
/**
 *
 * @param a
 * @param b
 */
function _objectWithoutPropertiesLoose( a, b ) {
	if ( null == a ) {
		return {};
	}
	let c,
		d,
		e = {},
		f = Object.keys( a );
	for ( d = 0; d < f.length; d++ ) {
		( c = f[ d ] ), 0 <= b.indexOf( c ) || ( e[ c ] = a[ c ] );
	}
	return e;
}
/**
 *
 * @param a
 * @param b
 */
function _classCallCheck( a, b ) {
	if ( ! ( a instanceof b ) ) {
		throw new TypeError( 'Cannot call a class as a function' );
	}
}
/**
 *
 * @param a
 * @param b
 */
function _defineProperties( a, b ) {
	for ( var c, d = 0; d < b.length; d++ ) {
		( c = b[ d ] ),
			( c.enumerable = c.enumerable || ! 1 ),
			( c.configurable = ! 0 ),
			'value' in c && ( c.writable = ! 0 ),
			Object.defineProperty( a, _toPropertyKey( c.key ), c );
	}
}
/**
 *
 * @param a
 * @param b
 * @param c
 */
function _createClass( a, b, c ) {
	return (
		b && _defineProperties( a.prototype, b ),
		c && _defineProperties( a, c ),
		Object.defineProperty( a, 'prototype', { writable: ! 1 } ),
		a
	);
}
/**
 *
 * @param a
 * @param b
 * @param c
 */
function _callSuper( a, b, c ) {
	return (
		( b = _getPrototypeOf( b ) ),
		_possibleConstructorReturn(
			a,
			_isNativeReflectConstruct()
				? Reflect.construct( b, c || [], _getPrototypeOf( a ).constructor )
				: b.apply( a, c )
		)
	);
}
/**
 *
 * @param a
 * @param b
 */
function _possibleConstructorReturn( a, b ) {
	if ( b && ( 'object' === _typeof( b ) || 'function' === typeof b ) ) {
		return b;
	}
	if ( void 0 !== b ) {
		throw new TypeError( 'Derived constructors may only return object or undefined' );
	}
	return _assertThisInitialized( a );
}
/**
 *
 * @param a
 */
function _assertThisInitialized( a ) {
	if ( void 0 === a ) {
		throw new ReferenceError( "this hasn't been initialised - super() hasn't been called" );
	}
	return a;
}
/**
 *
 */
function _isNativeReflectConstruct() {
	try {
		var a = ! Boolean.prototype.valueOf.call( Reflect.construct( Boolean, [], function () {} ) );
	} catch ( a ) {}
	return ( _isNativeReflectConstruct = function () {
		return !! a;
	} )();
}
/**
 *
 * @param a
 */
function _getPrototypeOf( a ) {
	return (
		( _getPrototypeOf = Object.setPrototypeOf
			? Object.getPrototypeOf.bind()
			: function ( a ) {
					return a.__proto__ || Object.getPrototypeOf( a );
			  } ),
		_getPrototypeOf( a )
	);
}
/**
 *
 * @param a
 * @param b
 */
function _inherits( a, b ) {
	if ( 'function' !== typeof b && null !== b ) {
		throw new TypeError( 'Super expression must either be null or a function' );
	}
	( a.prototype = Object.create( b && b.prototype, {
		constructor: { value: a, writable: ! 0, configurable: ! 0 },
	} ) ),
		Object.defineProperty( a, 'prototype', { writable: ! 1 } ),
		b && _setPrototypeOf( a, b );
}
/**
 *
 * @param a
 * @param b
 */
function _setPrototypeOf( a, b ) {
	return (
		( _setPrototypeOf = Object.setPrototypeOf
			? Object.setPrototypeOf.bind()
			: function ( a, b ) {
					return ( a.__proto__ = b ), a;
			  } ),
		_setPrototypeOf( a, b )
	);
}
/**
 *
 * @param a
 * @param b
 * @param c
 */
function _defineProperty( a, b, c ) {
	return (
		( b = _toPropertyKey( b ) ),
		b in a
			? Object.defineProperty( a, b, {
					value: c,
					enumerable: ! 0,
					configurable: ! 0,
					writable: ! 0,
			  } )
			: ( a[ b ] = c ),
		a
	);
}
/**
 *
 * @param a
 */
function _toPropertyKey( a ) {
	const b = _toPrimitive( a, 'string' );
	return 'symbol' == _typeof( b ) ? b : b + '';
}
/**
 *
 * @param a
 * @param b
 */
function _toPrimitive( a, b ) {
	if ( 'object' != _typeof( a ) || ! a ) {
		return a;
	}
	const c = a[ Symbol.toPrimitive ];
	if ( void 0 !== c ) {
		const d = c.call( a, b || 'default' );
		if ( 'object' != _typeof( d ) ) {
			return d;
		}
		throw new TypeError( '@@toPrimitive must return a primitive value.' );
	}
	return ( 'string' === b ? String : Number )( a );
}
const SocialLogo = ( exports.default = /*#__PURE__*/ ( function ( a ) {
	/**
	 *
	 */
	function b() {
		return _classCallCheck( this, b ), _callSuper( this, b, arguments );
	}
	return (
		_inherits( b, a ),
		_createClass( b, [
			{
				key: 'render',
				value: function render() {
					const a = this.props,
						b = a.size,
						c = a.onClick,
						d = a.icon,
						e = a.className,
						f = _objectWithoutProperties( a, _excluded ),
						g = [ 'social-logo', 'social-logo-' + d, e ].filter( Boolean ).join( ' ' ),
						h = _socialLogoData.SocialLogoData.find( function ( a ) {
							return a.name === d;
						} );
					if ( ! h ) {
						return /*#__PURE__*/ _react.default.createElement(
							'svg',
							_extends( { height: b, width: b }, f )
						);
					}
					const i = /*#__PURE__*/ _react.default.cloneElement(
						h.svg,
						_objectSpread( { className: g, height: b, width: b, onClick: c }, f )
					);
					return i;
				},
			},
		] ),
		b
	);
} )( _react.PureComponent ) );
_defineProperty( SocialLogo, 'defaultProps', { size: 24 } ),
	_defineProperty( SocialLogo, 'propTypes', {
		icon: _propTypes.default.string.isRequired,
		size: _propTypes.default.number,
		onClick: _propTypes.default.func,
		className: _propTypes.default.string,
	} );
