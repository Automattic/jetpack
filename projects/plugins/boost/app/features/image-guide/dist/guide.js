! ( function () {
	function t( t, e, n, i ) {
		return new ( n || ( n = Promise ) )( function ( o, r ) {
			function s( t ) {
				try {
					a( i.next( t ) );
				} catch ( t ) {
					r( t );
				}
			}
			function c( t ) {
				try {
					a( i.throw( t ) );
				} catch ( t ) {
					r( t );
				}
			}
			function a( t ) {
				let e;
				t.done
					? o( t.value )
					: ( ( e = t.value ),
					  e instanceof n
							? e
							: new n( function ( t ) {
									t( e );
							  } ) ).then( s, c );
			}
			a( ( i = i.apply( t, e || [] ) ).next() );
		} );
	}
	let e,
		n = { exports: {} };
	function i() {}
	self,
		( e = () =>
			( () => {
				const t = {
						'./src/MeasurableImage.ts': /*!********************************!*\
      !*** ./src/MeasurableImage.ts ***!
      \********************************/ (
							t,
							e,
							n
						) => {
							n.r( e ), n.d( e, { MeasurableImage: () => r } );
							var i = function ( t, e, n, i ) {
									return new ( n || ( n = Promise ) )( function ( o, r ) {
										function s( t ) {
											try {
												a( i.next( t ) );
											} catch ( t ) {
												r( t );
											}
										}
										function c( t ) {
											try {
												a( i.throw( t ) );
											} catch ( t ) {
												r( t );
											}
										}
										function a( t ) {
											let e;
											t.done
												? o( t.value )
												: ( ( e = t.value ),
												  e instanceof n
														? e
														: new n( function ( t ) {
																t( e );
														  } ) ).then( s, c );
										}
										a( ( i = i.apply( t, e || [] ) ).next() );
									} );
								},
								o = function ( t, e ) {
									let n,
										i,
										o,
										r,
										s = {
											label: 0,
											sent() {
												if ( 1 & o[ 0 ] ) throw o[ 1 ];
												return o[ 1 ];
											},
											trys: [],
											ops: [],
										};
									return (
										( r = { next: c( 0 ), throw: c( 1 ), return: c( 2 ) } ),
										'function' === typeof Symbol &&
											( r[ Symbol.iterator ] = function () {
												return this;
											} ),
										r
									);
									function c( r ) {
										return function ( c ) {
											return ( function ( r ) {
												if ( n ) throw new TypeError( 'Generator is already executing.' );
												for ( ; s;  )
													try {
														if (
															( ( n = 1 ),
															i &&
																( o =
																	2 & r[ 0 ]
																		? i.return
																		: r[ 0 ]
																		? i.throw || ( ( o = i.return ) && o.call( i ), 0 )
																		: i.next ) &&
																! ( o = o.call( i, r[ 1 ] ) ).done )
														)
															return o;
														switch ( ( ( i = 0 ), o && ( r = [ 2 & r[ 0 ], o.value ] ), r[ 0 ] ) ) {
															case 0:
															case 1:
																o = r;
																break;
															case 4:
																return s.label++, { value: r[ 1 ], done: ! 1 };
															case 5:
																s.label++, ( i = r[ 1 ] ), ( r = [ 0 ] );
																continue;
															case 7:
																( r = s.ops.pop() ), s.trys.pop();
																continue;
															default:
																if (
																	! (
																		( o = ( o = s.trys ).length > 0 && o[ o.length - 1 ] ) ||
																		( 6 !== r[ 0 ] && 2 !== r[ 0 ] )
																	)
																) {
																	s = 0;
																	continue;
																}
																if (
																	3 === r[ 0 ] &&
																	( ! o || ( r[ 1 ] > o[ 0 ] && r[ 1 ] < o[ 3 ] ) )
																) {
																	s.label = r[ 1 ];
																	break;
																}
																if ( 6 === r[ 0 ] && s.label < o[ 1 ] ) {
																	( s.label = o[ 1 ] ), ( o = r );
																	break;
																}
																if ( o && s.label < o[ 2 ] ) {
																	( s.label = o[ 2 ] ), s.ops.push( r );
																	break;
																}
																o[ 2 ] && s.ops.pop(), s.trys.pop();
																continue;
														}
														r = e.call( t, s );
													} catch ( t ) {
														( r = [ 6, t ] ), ( i = 0 );
													} finally {
														n = o = 0;
													}
												if ( 5 & r[ 0 ] ) throw r[ 1 ];
												return { value: r[ 0 ] ? r[ 1 ] : void 0, done: ! 0 };
											} )( [ r, c ] );
										};
									}
								},
								r = ( function () {
									function t( t, e ) {
										( this.node = t ), ( this.getURLCallback = e );
									}
									return (
										( t.prototype.getURL = function () {
											return this.getURLCallback( this.node );
										} ),
										( t.prototype.getSizeOnPage = function () {
											const t = this.node.getBoundingClientRect(),
												e = t.width,
												n = t.height;
											return { width: Math.round( e ), height: Math.round( n ) };
										} ),
										( t.prototype.getFileSize = function ( t ) {
											return i( this, void 0, void 0, function () {
												let e, n, i, r, s;
												return o( this, function ( o ) {
													switch ( o.label ) {
														case 0:
															return [
																4,
																Promise.all( [
																	this.fetchFileWeight( t ),
																	this.fetchFileDimensions( t ),
																] ),
															];
														case 1:
															return (
																( e = o.sent() ),
																( n = e[ 0 ] ),
																( i = e[ 1 ] ),
																( r = i.width ),
																( s = i.height ),
																[ 2, { width: r, height: s, weight: n } ]
															);
													}
												} );
											} );
										} ),
										( t.prototype.getPotentialSavings = function ( t, e ) {
											const n = this.getOversizedRatio( t, e );
											return n <= 1 ? null : Math.round( t.weight - t.weight / n );
										} ),
										( t.prototype.getExpectedSize = function ( t ) {
											const e = window.devicePixelRatio || 1;
											return {
												width: Math.round( t.width * e ),
												height: Math.round( t.height * e ),
											};
										} ),
										( t.prototype.getOversizedRatio = function ( t, e ) {
											const n = this.getExpectedSize( e ),
												i = n.width,
												o = n.height;
											return ( t.width * t.height ) / ( i * o );
										} ),
										( t.prototype.fetchFileWeight = function ( t ) {
											return i( this, void 0, void 0, function () {
												let e, n;
												return o( this, function ( i ) {
													switch ( i.label ) {
														case 0:
															return [ 4, fetch( t, { method: 'HEAD', mode: 'no-cors' } ) ];
														case 1:
															return ( e = i.sent() ).url
																? ( n = e.headers.get( 'content-length' ) )
																	? [ 2, parseInt( n, 10 ) / 1024 ]
																	: [ 2, -1 ]
																: ( console.log(
																		"Can't get image size for ".concat(
																			t,
																			' likely due to a CORS error.'
																		)
																  ),
																  [ 2, -1 ] );
													}
												} );
											} );
										} ),
										( t.prototype.fetchFileDimensions = function ( t ) {
											return i( this, void 0, void 0, function () {
												let e;
												return o( this, function ( n ) {
													return (
														( ( e = new Image() ).src = t ),
														[
															2,
															new Promise( function ( t ) {
																( e.onload = function () {
																	t( {
																		width: Math.round( e.width ),
																		height: Math.round( e.height ),
																	} );
																} ),
																	( e.onerror = function () {
																		t( { width: -1, height: -1 } );
																	} );
															} ),
														]
													);
												} );
											} );
										} ),
										t
									);
								} )();
						},
						'./src/find-image-elements.ts': /*!************************************!*\
      !*** ./src/find-image-elements.ts ***!
      \************************************/ (
							t,
							e,
							n
						) => {
							n.r( e ),
								n.d( e, {
									backgroundImageSource: () => s,
									findMeasurableElements: () => o,
									getMeasurableImages: () => c,
									imageTagSource: () => r,
								} );
							const i = n( /*! ./MeasurableImage */ './src/MeasurableImage.ts' );
							function o( t ) {
								return t.filter( function ( t ) {
									return (
										t instanceof HTMLImageElement ||
										( t instanceof HTMLElement && 'none' !== getComputedStyle( t ).backgroundImage )
									);
								} );
							}
							function r( t ) {
								return a( t.currentSrc ) ? t.currentSrc : a( t.src ) ? t.src : null;
							}
							function s( t ) {
								const e = getComputedStyle( t ).backgroundImage.match( /url\(.?(.*?).?\)/i );
								return e && e[ 1 ] && a( e[ 1 ] ) ? e[ 1 ] : null;
							}
							function c( t ) {
								return o( t )
									.map( function ( t ) {
										return t instanceof HTMLImageElement
											? new i.MeasurableImage( t, r )
											: t instanceof HTMLElement && s( t )
											? new i.MeasurableImage( t, s )
											: null;
									} )
									.filter( function ( t ) {
										return null !== t;
									} );
							}
							function a( t ) {
								if ( t.startsWith( '/' ) ) return ! t.split( '?' )[ 0 ].endsWith( '.svg' );
								try {
									const e = new URL( t );
									return 'http:' === e.protocol || 'https:' === e.protocol;
								} catch ( t ) {
									return ! 1;
								}
							}
						},
					},
					e = {};
				function n( i ) {
					const o = e[ i ];
					if ( void 0 !== o ) return o.exports;
					const r = ( e[ i ] = { exports: {} } );
					return t[ i ]( r, r.exports, n ), r.exports;
				}
				( n.d = ( t, e ) => {
					for ( const i in e )
						n.o( e, i ) &&
							! n.o( t, i ) &&
							Object.defineProperty( t, i, { enumerable: ! 0, get: e[ i ] } );
				} ),
					( n.o = ( t, e ) => Object.prototype.hasOwnProperty.call( t, e ) ),
					( n.r = t => {
						'undefined' !== typeof Symbol &&
							Symbol.toStringTag &&
							Object.defineProperty( t, Symbol.toStringTag, { value: 'Module' } ),
							Object.defineProperty( t, '__esModule', { value: ! 0 } );
					} );
				const i = {};
				return (
					( () => {
						/*!**********************!*\
      !*** ./src/index.ts ***!
      \**********************/
						n.r( i ),
							n.d( i, {
								MeasurableImage: () => t.MeasurableImage,
								getMeasurableImages: () => e.getMeasurableImages,
							} );
						var t = n( /*! ./MeasurableImage */ './src/MeasurableImage.ts' ),
							e = n( /*! ./find-image-elements */ './src/find-image-elements.ts' );
					} )(),
					i
				);
			} )() ),
		( n.exports = e() );
	const o = t => t;
	function r( t ) {
		return t();
	}
	function s() {
		return Object.create( null );
	}
	function c( t ) {
		t.forEach( r );
	}
	function a( t ) {
		return 'function' === typeof t;
	}
	function l( t, e ) {
		return t != t ? e == e : t !== e || ( t && 'object' === typeof t ) || 'function' === typeof t;
	}
	let u;
	function d( t, e ) {
		return u || ( u = document.createElement( 'a' ) ), ( u.href = e ), t === u.href;
	}
	function f( t, ...e ) {
		if ( null == t ) return i;
		const n = t.subscribe( ...e );
		return n.unsubscribe ? () => n.unsubscribe() : n;
	}
	function p( t ) {
		let e;
		return f( t, t => ( e = t ) )(), e;
	}
	function h( t, e, n ) {
		t.$$.on_destroy.push( f( e, n ) );
	}
	function g( t, e, n, i ) {
		return t[ 1 ] && i
			? ( function ( t, e ) {
					for ( const n in e ) t[ n ] = e[ n ];
					return t;
			  } )( n.ctx.slice(), t[ 1 ]( i( e ) ) )
			: n.ctx;
	}
	const m = 'undefined' !== typeof window;
	const v = m ? () => window.performance.now() : () => Date.now(),
		$ = m ? t => requestAnimationFrame( t ) : i;
	const w = new Set();
	function b( t ) {
		w.forEach( e => {
			e.c( t ) || ( w.delete( e ), e.f() );
		} ),
			0 !== w.size && $( b );
	}
	function y( t ) {
		let e;
		return (
			0 === w.size && $( b ),
			{
				promise: new Promise( n => {
					w.add( ( e = { c: t, f: n } ) );
				} ),
				abort() {
					w.delete( e );
				},
			}
		);
	}
	function x( t, e ) {
		t.appendChild( e );
	}
	function _( t ) {
		if ( ! t ) return document;
		const e = t.getRootNode ? t.getRootNode() : t.ownerDocument;
		return e && e.host ? e : t.ownerDocument;
	}
	function k( t ) {
		const e = j( 'style' );
		return (
			( function ( t, e ) {
				x( t.head || t, e ), e.sheet;
			} )( _( t ), e ),
			e.sheet
		);
	}
	function z( t, e, n ) {
		t.insertBefore( e, n || null );
	}
	function S( t ) {
		t.parentNode && t.parentNode.removeChild( t );
	}
	function j( t ) {
		return document.createElement( t );
	}
	function E( t ) {
		return document.createElementNS( 'http://www.w3.org/2000/svg', t );
	}
	function C( t ) {
		return document.createTextNode( t );
	}
	function M() {
		return C( ' ' );
	}
	function O() {
		return C( '' );
	}
	function I( t, e, n, i ) {
		return t.addEventListener( e, n, i ), () => t.removeEventListener( e, n, i );
	}
	function P( t, e, n ) {
		null == n ? t.removeAttribute( e ) : t.getAttribute( e ) !== n && t.setAttribute( e, n );
	}
	function L( t, e ) {
		( e = '' + e ), t.wholeText !== e && ( t.data = e );
	}
	function R( t, e, n, i ) {
		null === n ? t.style.removeProperty( e ) : t.style.setProperty( e, n, i ? 'important' : '' );
	}
	function T( t, e, n ) {
		t.classList[ n ? 'add' : 'remove' ]( e );
	}
	function A( t, e, { bubbles: n = ! 1, cancelable: i = ! 1 } = {} ) {
		const o = document.createEvent( 'CustomEvent' );
		return o.initCustomEvent( t, n, i, e ), o;
	}
	const U = new Map();
	let B,
		H = 0;
	function N( t, e, n, i, o, r, s, c = 0 ) {
		const a = 16.666 / i;
		let l = '{\n';
		for ( let t = 0; t <= 1; t += a ) {
			const i = e + ( n - e ) * r( t );
			l += 100 * t + `%{${ s( i, 1 - i ) }}\n`;
		}
		const u = l + `100% {${ s( n, 1 - n ) }}\n}`,
			d = `__svelte_${ ( function ( t ) {
				let e = 5381,
					n = t.length;
				for ( ; n--;  ) e = ( ( e << 5 ) - e ) ^ t.charCodeAt( n );
				return e >>> 0;
			} )( u ) }_${ c }`,
			f = _( t ),
			{ stylesheet: p, rules: h } =
				U.get( f ) ||
				( function ( t, e ) {
					const n = { stylesheet: k( e ), rules: {} };
					return U.set( t, n ), n;
				} )( f, t );
		h[ d ] || ( ( h[ d ] = ! 0 ), p.insertRule( `@keyframes ${ d } ${ u }`, p.cssRules.length ) );
		const g = t.style.animation || '';
		return (
			( t.style.animation = `${ g ? `${ g }, ` : '' }${ d } ${ i }ms linear ${ o }ms 1 both` ),
			( H += 1 ),
			d
		);
	}
	function D( t, e ) {
		const n = ( t.style.animation || '' ).split( ', ' ),
			i = n.filter( e ? t => t.indexOf( e ) < 0 : t => -1 === t.indexOf( '__svelte' ) ),
			o = n.length - i.length;
		o &&
			( ( t.style.animation = i.join( ', ' ) ),
			( H -= o ),
			H ||
				$( () => {
					H ||
						( U.forEach( t => {
							const { ownerNode: e } = t.stylesheet;
							e && S( e );
						} ),
						U.clear() );
				} ) );
	}
	function F( t ) {
		B = t;
	}
	function J() {
		if ( ! B ) throw new Error( 'Function called outside component initialization' );
		return B;
	}
	function W( t ) {
		J().$$.on_mount.push( t );
	}
	function V( t, e ) {
		const n = t.$$.callbacks[ e.type ];
		n && n.slice().forEach( t => t.call( this, e ) );
	}
	const X = [],
		q = [],
		G = [],
		Z = [],
		K = Promise.resolve();
	let Y = ! 1;
	function Q( t ) {
		G.push( t );
	}
	const tt = new Set();
	let et,
		nt = 0;
	function it() {
		const t = B;
		do {
			for ( ; nt < X.length;  ) {
				const t = X[ nt ];
				nt++, F( t ), ot( t.$$ );
			}
			for ( F( null ), X.length = 0, nt = 0; q.length;  ) q.pop()();
			for ( let t = 0; t < G.length; t += 1 ) {
				const e = G[ t ];
				tt.has( e ) || ( tt.add( e ), e() );
			}
			G.length = 0;
		} while ( X.length );
		for ( ; Z.length;  ) Z.pop()();
		( Y = ! 1 ), tt.clear(), F( t );
	}
	function ot( t ) {
		if ( null !== t.fragment ) {
			t.update(), c( t.before_update );
			const e = t.dirty;
			( t.dirty = [ -1 ] ), t.fragment && t.fragment.p( t.ctx, e ), t.after_update.forEach( Q );
		}
	}
	function rt() {
		return (
			et ||
				( ( et = Promise.resolve() ),
				et.then( () => {
					et = null;
				} ) ),
			et
		);
	}
	function st( t, e, n ) {
		t.dispatchEvent( A( `${ e ? 'intro' : 'outro' }${ n }` ) );
	}
	const ct = new Set();
	let at;
	function lt() {
		at = { r: 0, c: [], p: at };
	}
	function ut() {
		at.r || c( at.c ), ( at = at.p );
	}
	function dt( t, e ) {
		t && t.i && ( ct.delete( t ), t.i( e ) );
	}
	function ft( t, e, n, i ) {
		if ( t && t.o ) {
			if ( ct.has( t ) ) return;
			ct.add( t ),
				at.c.push( () => {
					ct.delete( t ), i && ( n && t.d( 1 ), i() );
				} ),
				t.o( e );
		} else i && i();
	}
	const pt = { duration: 0 };
	function ht( t, e, n ) {
		let r,
			s,
			c = e( t, n ),
			l = ! 1,
			u = 0;
		function d() {
			r && D( t, r );
		}
		function f() {
			const { delay: e = 0, duration: n = 300, easing: a = o, tick: f = i, css: p } = c || pt;
			p && ( r = N( t, 0, 1, n, e, a, p, u++ ) ), f( 0, 1 );
			const h = v() + e,
				g = h + n;
			s && s.abort(),
				( l = ! 0 ),
				Q( () => st( t, ! 0, 'start' ) ),
				( s = y( e => {
					if ( l ) {
						if ( e >= g ) return f( 1, 0 ), st( t, ! 0, 'end' ), d(), ( l = ! 1 );
						if ( e >= h ) {
							const t = a( ( e - h ) / n );
							f( t, 1 - t );
						}
					}
					return l;
				} ) );
		}
		let p = ! 1;
		return {
			start() {
				p || ( ( p = ! 0 ), D( t ), a( c ) ? ( ( c = c() ), rt().then( f ) ) : f() );
			},
			invalidate() {
				p = ! 1;
			},
			end() {
				l && ( d(), ( l = ! 1 ) );
			},
		};
	}
	function gt( t, e, n, r ) {
		let s = e( t, n ),
			l = r ? 0 : 1,
			u = null,
			d = null,
			f = null;
		function p() {
			f && D( t, f );
		}
		function h( t, e ) {
			const n = t.b - l;
			return (
				( e *= Math.abs( n ) ),
				{ a: l, b: t.b, d: n, duration: e, start: t.start, end: t.start + e, group: t.group }
			);
		}
		function g( e ) {
			const { delay: n = 0, duration: r = 300, easing: a = o, tick: g = i, css: m } = s || pt,
				$ = { start: v() + n, b: e };
			e || ( ( $.group = at ), ( at.r += 1 ) ),
				u || d
					? ( d = $ )
					: ( m && ( p(), ( f = N( t, l, e, r, n, a, m ) ) ),
					  e && g( 0, 1 ),
					  ( u = h( $, r ) ),
					  Q( () => st( t, e, 'start' ) ),
					  y( e => {
							if (
								( d &&
									e > d.start &&
									( ( u = h( d, r ) ),
									( d = null ),
									st( t, u.b, 'start' ),
									m && ( p(), ( f = N( t, l, u.b, u.duration, 0, a, s.css ) ) ) ),
								u )
							)
								if ( e >= u.end )
									g( ( l = u.b ), 1 - l ),
										st( t, u.b, 'end' ),
										d || ( u.b ? p() : --u.group.r || c( u.group.c ) ),
										( u = null );
								else if ( e >= u.start ) {
									const t = e - u.start;
									( l = u.a + u.d * a( t / u.duration ) ), g( l, 1 - l );
								}
							return ! ( ! u && ! d );
					  } ) );
		}
		return {
			run( t ) {
				a( s )
					? rt().then( () => {
							( s = s() ), g( t );
					  } )
					: g( t );
			},
			end() {
				p(), ( u = d = null );
			},
		};
	}
	const mt =
		'undefined' !== typeof window
			? window
			: 'undefined' !== typeof globalThis
			? globalThis
			: global;
	function vt( t ) {
		t && t.c();
	}
	function $t( t, e, n, i ) {
		const { fragment: o, after_update: s } = t.$$;
		o && o.m( e, n ),
			i ||
				Q( () => {
					const e = t.$$.on_mount.map( r ).filter( a );
					t.$$.on_destroy ? t.$$.on_destroy.push( ...e ) : c( e ), ( t.$$.on_mount = [] );
				} ),
			s.forEach( Q );
	}
	function wt( t, e ) {
		const n = t.$$;
		null !== n.fragment &&
			( c( n.on_destroy ),
			n.fragment && n.fragment.d( e ),
			( n.on_destroy = n.fragment = null ),
			( n.ctx = [] ) );
	}
	function bt( t, e ) {
		-1 === t.$$.dirty[ 0 ] &&
			( X.push( t ), Y || ( ( Y = ! 0 ), K.then( it ) ), t.$$.dirty.fill( 0 ) ),
			( t.$$.dirty[ ( e / 31 ) | 0 ] |= 1 << e % 31 );
	}
	function yt( t, e, n, o, r, a, l, u = [ -1 ] ) {
		const d = B;
		F( t );
		const f = ( t.$$ = {
			fragment: null,
			ctx: [],
			props: a,
			update: i,
			not_equal: r,
			bound: s(),
			on_mount: [],
			on_destroy: [],
			on_disconnect: [],
			before_update: [],
			after_update: [],
			context: new Map( e.context || ( d ? d.$$.context : [] ) ),
			callbacks: s(),
			dirty: u,
			skip_bound: ! 1,
			root: e.target || d.$$.root,
		} );
		l && l( f.root );
		let p = ! 1;
		if (
			( ( f.ctx = n
				? n( t, e.props || {}, ( e, n, ...i ) => {
						const o = i.length ? i[ 0 ] : n;
						return (
							f.ctx &&
								r( f.ctx[ e ], ( f.ctx[ e ] = o ) ) &&
								( ! f.skip_bound && f.bound[ e ] && f.bound[ e ]( o ), p && bt( t, e ) ),
							n
						);
				  } )
				: [] ),
			f.update(),
			( p = ! 0 ),
			c( f.before_update ),
			( f.fragment = !! o && o( f.ctx ) ),
			e.target )
		) {
			if ( e.hydrate ) {
				const t = ( function ( t ) {
					return Array.from( t.childNodes );
				} )( e.target );
				f.fragment && f.fragment.l( t ), t.forEach( S );
			} else f.fragment && f.fragment.c();
			e.intro && dt( t.$$.fragment ), $t( t, e.target, e.anchor, e.customElement ), it();
		}
		F( d );
	}
	class xt {
		$destroy() {
			wt( this, 1 ), ( this.$destroy = i );
		}
		$on( t, e ) {
			if ( ! a( e ) ) return i;
			const n = this.$$.callbacks[ t ] || ( this.$$.callbacks[ t ] = [] );
			return (
				n.push( e ),
				() => {
					const t = n.indexOf( e );
					-1 !== t && n.splice( t, 1 );
				}
			);
		}
		$set( t ) {
			let e;
			this.$$set &&
				( ( e = t ), 0 !== Object.keys( e ).length ) &&
				( ( this.$$.skip_bound = ! 0 ), this.$$set( t ), ( this.$$.skip_bound = ! 1 ) );
		}
	}
	const _t = [];
	function kt( t, e = i ) {
		let n;
		const o = new Set();
		function r( e ) {
			if ( l( t, e ) && ( ( t = e ), n ) ) {
				const e = ! _t.length;
				for ( const e of o ) e[ 1 ](), _t.push( e, t );
				if ( e ) {
					for ( let t = 0; t < _t.length; t += 2 ) _t[ t ][ 0 ]( _t[ t + 1 ] );
					_t.length = 0;
				}
			}
		}
		return {
			set: r,
			update( e ) {
				r( e( t ) );
			},
			subscribe( s, c = i ) {
				const a = [ s, c ];
				return (
					o.add( a ),
					1 === o.size && ( n = e( r ) || i ),
					s( t ),
					() => {
						o.delete( a ), 0 === o.size && ( n(), ( n = null ) );
					}
				);
			},
		};
	}
	function zt( t, e, n ) {
		const o = ! Array.isArray( t ),
			r = o ? [ t ] : t,
			s = e.length < 2;
		return (
			( l = t => {
				let n = ! 1;
				const l = [];
				let u = 0,
					d = i;
				const p = () => {
						if ( u ) return;
						d();
						const n = e( o ? l[ 0 ] : l, t );
						s ? t( n ) : ( d = a( n ) ? n : i );
					},
					h = r.map( ( t, e ) =>
						f(
							t,
							t => {
								( l[ e ] = t ), ( u &= ~( 1 << e ) ), n && p();
							},
							() => {
								u |= 1 << e;
							}
						)
					);
				return (
					( n = ! 0 ),
					p(),
					function () {
						c( h ), d();
					}
				);
			} ),
			{ subscribe: kt( n, l ).subscribe }
		);
		let l;
	}
	function St( e, n ) {
		return t( this, void 0, void 0, function* () {
			const t = {};
			return (
				'undefined' !== typeof Jetpack_Boost &&
					( 'version' in Jetpack_Boost && ( t.boost_version = Jetpack_Boost.version ),
					'connection' in Jetpack_Boost &&
						( t.jetpack_connection = Jetpack_Boost.connection.connected
							? 'connected'
							: 'disconnected' ),
					'optimizations' in Jetpack_Boost &&
						( t.optimizations = JSON.stringify( Jetpack_Boost.optimizations ) ) ),
				( n = Object.assign( Object.assign( {}, t ), n ) ),
				new Promise( t => {
					'undefined' !== typeof jpTracksAJAX &&
					'function' === typeof jpTracksAJAX.record_ajax_event
						? jpTracksAJAX
								.record_ajax_event( `boost_${ e }`, 'click', n )
								.done( t )
								.fail( n => {
									console.log(
										`Recording event 'boost_${ e }' failed with error: ${ n.responseText }`
									),
										t();
								} )
						: ( console.log( 'Invalid jpTracksAJAX object.' ), t() );
				} )
			);
		} );
	}
	const jt = 'jetpack-boost-guide',
		Et = { active: 'Active', paused: 'Paused' };
	let Ct = localStorage.getItem( jt );
	( Ct && Et[ Ct ] ) || ( localStorage.setItem( jt, 'Active' ), ( Ct = 'active' ) );
	const { set: Mt, update: Ot, subscribe: It } = kt( Ct );
	It( t => {
		localStorage.setItem( jt, t );
	} );
	const Pt = {
			subscribe: It,
			set: Mt,
			update: Ot,
			cycle: () => {
				Ot( t => {
					const e = Object.keys( Et ),
						n = e.indexOf( t );
					return e[ ( n + 1 ) % e.length ];
				} );
			},
		},
		Lt = zt( Pt, t => Et[ t ] );
	class Rt {
		static trackImageOutcome( e ) {
			return t( this, void 0, void 0, function* () {
				return new Promise( t => {
					e.loading.subscribe( n => {
						if ( ! n ) {
							const n = p( e.oversizedRatio ),
								i = n > 4 ? 'red' : n > 2.5 ? 'yellow' : 'green',
								o = p( e.fileSize ),
								r = p( e.sizeOnPage ),
								s = p( e.expectedSize ),
								c = p( e.potentialSavings ),
								a = p( e.url ),
								l = {
									severity: i,
									oversized_ratio: n,
									file_weight: o.weight,
									file_width: o.width,
									file_height: o.height,
									size_on_page_width: r.width,
									size_on_page_height: r.height,
									expected_width: s.width,
									expected_height: s.height,
									potential_savings: c,
									image_url: a,
								};
							St(
								'image_guide_image_outcome',
								Object.assign( Object.assign( {}, l ), {
									window_width: window.innerWidth,
									window_height: window.innerHeight,
									device_pixel_ratio: window.devicePixelRatio,
								} )
							),
								t( l );
						}
					} );
				} );
			} );
		}
		static trackPage( e ) {
			return t( this, void 0, void 0, function* () {
				if ( ! e.length || Rt.trackingComplete ) return;
				Rt.trackingComplete = ! 0;
				const t = e.map( Rt.trackImageOutcome ),
					n = yield Promise.all( t );
				St( 'image_guide_page_outcome', {
					total_potential_savings: n.reduce( ( t, e ) => t + ( e.potential_savings || 0 ), 0 ),
					red_severity_count: n.filter( t => 'red' === t.severity ).length,
					yellow_severity_count: n.filter( t => 'yellow' === t.severity ).length,
					green_severity_count: n.filter( t => 'green' === t.severity ).length,
					window_width: window.innerWidth,
					window_height: window.innerHeight,
					device_pixel_ratio: window.devicePixelRatio,
				} );
			} );
		}
		static trackInitialState() {
			St( 'image_guide_initial_ui_state', { image_guide_state: p( Pt ) } );
		}
		static trackUIStateChange() {
			St( 'image_guide_ui_state_change', { image_guide_state: p( Pt ) } );
		}
	}
	Rt.trackingComplete = ! 1;
	class Tt {
		constructor( t ) {
			( this.loading = kt( ! 0 ) ),
				( this.currentSrc = '' ),
				( this.image = t ),
				( this.node = t.node );
			( this.url = kt( t.getURL() ) ),
				( this.fileSize = kt( { width: 0, height: 0, weight: 0 } ) ),
				( this.sizeOnPage = kt( { width: 0, height: 0 } ) ),
				( this.potentialSavings = this.derivePotentialSavings() ),
				( this.oversizedRatio = this.deriveOversizedRatio() ),
				( this.expectedSize = this.deriveExpectedSize() );
		}
		deriveOversizedRatio() {
			return zt( [ this.fileSize, this.sizeOnPage ], ( [ t, e ] ) =>
				this.image.getOversizedRatio( t, e )
			);
		}
		deriveExpectedSize() {
			return zt( this.sizeOnPage, t => this.image.getExpectedSize( t ) );
		}
		derivePotentialSavings() {
			return zt( [ this.fileSize, this.sizeOnPage ], ( [ t, e ] ) =>
				this.image.getPotentialSavings( t, e )
			);
		}
		updateDimensions() {
			return t( this, void 0, void 0, function* () {
				const t = this.image.getSizeOnPage();
				this.sizeOnPage.set( t ), yield this.maybeUpdateWeight();
			} );
		}
		maybeUpdateWeight() {
			return t( this, void 0, void 0, function* () {
				if ( this.image.getURL() === this.currentSrc ) return;
				this.loading.set( ! 0 ), ( this.currentSrc = this.image.getURL() );
				const t = yield this.image.getFileSize( this.currentSrc );
				this.url.set( this.currentSrc ), this.fileSize.set( t ), this.loading.set( ! 1 );
			} );
		}
	}
	function At( t ) {
		const e = 1.70158;
		return --t * t * ( ( e + 1 ) * t + e ) + 1;
	}
	function Ut( t ) {
		const e = t - 1;
		return e * e * e + 1;
	}
	function Bt( t, { delay: e = 0, duration: n = 400, easing: i = o } = {} ) {
		const r = +getComputedStyle( t ).opacity;
		return { delay: e, duration: n, easing: i, css: t => 'opacity: ' + t * r };
	}
	function Ht(
		t,
		{ delay: e = 0, duration: n = 400, easing: i = Ut, x: o = 0, y: r = 0, opacity: s = 0 } = {}
	) {
		const c = getComputedStyle( t ),
			a = +c.opacity,
			l = 'none' === c.transform ? '' : c.transform,
			u = a * ( 1 - s );
		return {
			delay: e,
			duration: n,
			easing: i,
			css: ( t, e ) =>
				`\n\t\t\ttransform: ${ l } translate(${ ( 1 - t ) * o }px, ${
					( 1 - t ) * r
				}px);\n\t\t\topacity: ${ a - u * e }`,
		};
	}
	function Nt( t ) {
		let e, n, o, r, s;
		return {
			c() {
				( e = j( 'div' ) ),
					( n = E( 'svg' ) ),
					( o = E( 'path' ) ),
					( r = E( 'path' ) ),
					( s = E( 'path' ) ),
					P(
						o,
						'd',
						'M55.4 107.8C84.3397 107.8 107.8 84.3397 107.8 55.4C107.8 26.4603 84.3397 3 55.4 3C26.4603 3 3 26.4603 3 55.4C3 84.3397 26.4603 107.8 55.4 107.8Z'
					),
					P( o, 'fill', t[ 1 ] ),
					P( r, 'd', 'M58 46.6V97.4L84.2 46.6H58Z' ),
					P( r, 'fill', 'white' ),
					P( s, 'd', 'M52.7 64.1V13.4L26.6 64.1H52.7Z' ),
					P( s, 'fill', 'white' ),
					P( n, 'viewBox', '0 0 110 110' ),
					P( n, 'fill', 'none' ),
					P( n, 'xmlns', 'http://www.w3.org/2000/svg' ),
					R( e, 'width', t[ 0 ] + 'px' ),
					R( e, 'height', t[ 0 ] + 'px' ),
					P( e, 'class', 'svelte-f6jc8' );
			},
			m( t, i ) {
				z( t, e, i ), x( e, n ), x( n, o ), x( n, r ), x( n, s );
			},
			p( t, [ n ] ) {
				2 & n && P( o, 'fill', t[ 1 ] ),
					1 & n && R( e, 'width', t[ 0 ] + 'px' ),
					1 & n && R( e, 'height', t[ 0 ] + 'px' );
			},
			i,
			o: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function Dt( t, e, n ) {
		let { size: i = 16 } = e,
			{ bg: o = '#069E08' } = e;
		return (
			( t.$$set = t => {
				'size' in t && n( 0, ( i = t.size ) ), 'bg' in t && n( 1, ( o = t.bg ) );
			} ),
			[ i, o ]
		);
	}
	class Ft extends xt {
		constructor( t ) {
			super(), yt( this, t, Dt, Nt, l, { size: 0, bg: 1 } );
		}
	}
	function Jt( t ) {
		let e, n, r, s;
		return (
			( n = new Ft( { props: { size: 12, bg: 'transparent' } } ) ),
			{
				c() {
					( e = j( 'div' ) ), vt( n.$$.fragment ), P( e, 'class', 'spinner svelte-2eb8gc' );
				},
				m( t, i ) {
					z( t, e, i ), $t( n, e, null ), ( s = ! 0 );
				},
				p: i,
				i( t ) {
					s || ( dt( n.$$.fragment, t ), r && r.end( 1 ), ( s = ! 0 ) );
				},
				o( t ) {
					ft( n.$$.fragment, t ),
						( r = ( function ( t, e, n ) {
							let r,
								s = e( t, n ),
								l = ! 0;
							const u = at;
							function d() {
								const { delay: e = 0, duration: n = 300, easing: a = o, tick: d = i, css: f } =
									s || pt;
								f && ( r = N( t, 1, 0, n, e, a, f ) );
								const p = v() + e,
									h = p + n;
								Q( () => st( t, ! 1, 'start' ) ),
									y( e => {
										if ( l ) {
											if ( e >= h ) return d( 0, 1 ), st( t, ! 1, 'end' ), --u.r || c( u.c ), ! 1;
											if ( e >= p ) {
												const t = a( ( e - p ) / n );
												d( 1 - t, t );
											}
										}
										return l;
									} );
							}
							return (
								( u.r += 1 ),
								a( s )
									? rt().then( () => {
											( s = s() ), d();
									  } )
									: d(),
								{
									end( e ) {
										e && s.tick && s.tick( 1, 0 ), l && ( r && D( t, r ), ( l = ! 1 ) );
									},
								}
							);
						} )( e, Bt, { duration: 300 } ) ),
						( s = ! 1 );
				},
				d( t ) {
					t && S( e ), wt( n ), t && r && r.end();
				},
			}
		);
	}
	class Wt extends xt {
		constructor( t ) {
			super(), yt( this, t, null, Jt, l, {} );
		}
	}
	function Vt( t ) {
		let e, n;
		return {
			c() {
				( e = E( 'svg' ) ),
					( n = E( 'path' ) ),
					P( n, 'stroke-linecap', 'round' ),
					P( n, 'stroke-linejoin', 'round' ),
					P( n, 'stroke-width', '2' ),
					P( n, 'd', 'M5 13l4 4L19 7' ),
					P( e, 'class', 'w-6 h-6 svelte-jkeb2' ),
					P( e, 'fill', 'none' ),
					P( e, 'stroke', 'white' ),
					P( e, 'width', '18' ),
					P( e, 'height', '18' ),
					P( e, 'viewBox', '0 0 24 24' ),
					P( e, 'xmlns', 'http://www.w3.org/2000/svg' );
			},
			m( t, i ) {
				z( t, e, i ), x( e, n );
			},
			p: i,
			i,
			o: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	class Xt extends xt {
		constructor( t ) {
			super(), yt( this, t, null, Vt, l, {} );
		}
	}
	function qt( t ) {
		let e, n, o;
		return (
			( n = new Wt( {} ) ),
			{
				c() {
					( e = j( 'div' ) ), vt( n.$$.fragment ), P( e, 'class', 'bubble-inner svelte-sip1vm' );
				},
				m( t, i ) {
					z( t, e, i ), $t( n, e, null ), ( o = ! 0 );
				},
				p: i,
				i( t ) {
					o || ( dt( n.$$.fragment, t ), ( o = ! 0 ) );
				},
				o( t ) {
					ft( n.$$.fragment, t ), ( o = ! 1 );
				},
				d( t ) {
					t && S( e ), wt( n );
				},
			}
		);
	}
	function Gt( t ) {
		let e, n, i, o, r, s;
		const c = [ Yt, Kt, Zt ],
			a = [];
		function l( t, e ) {
			return t[ 0 ] > 9 ? 0 : t[ 0 ] > 0.99 ? 1 : 2;
		}
		return (
			( i = l( t ) ),
			( o = a[ i ] = c[ i ]( t ) ),
			{
				c() {
					( e = j( 'div' ) ),
						( n = j( 'div' ) ),
						o.c(),
						P( n, 'class', 'label' ),
						P( e, 'class', 'bubble-inner svelte-sip1vm' );
				},
				m( t, o ) {
					z( t, e, o ), x( e, n ), a[ i ].m( n, null ), ( s = ! 0 );
				},
				p( t, e ) {
					const r = i;
					( i = l( t ) ),
						i === r
							? a[ i ].p( t, e )
							: ( lt(),
							  ft( a[ r ], 1, 1, () => {
									a[ r ] = null;
							  } ),
							  ut(),
							  ( o = a[ i ] ),
							  o ? o.p( t, e ) : ( ( o = a[ i ] = c[ i ]( t ) ), o.c() ),
							  dt( o, 1 ),
							  o.m( n, null ) );
				},
				i( t ) {
					s ||
						( dt( o ),
						r ||
							Q( () => {
								( r = ht( n, Bt, { delay: 200, duration: 300 } ) ), r.start();
							} ),
						( s = ! 0 ) );
				},
				o( t ) {
					ft( o ), ( s = ! 1 );
				},
				d( t ) {
					t && S( e ), a[ i ].d();
				},
			}
		);
	}
	function Zt( t ) {
		let e, n;
		return {
			c() {
				( e = j( 'span' ) ),
					( e.textContent = '<' ),
					( n = C( ' 1x' ) ),
					R( e, 'font-size', '0.75em' );
			},
			m( t, i ) {
				z( t, e, i ), z( t, n, i );
			},
			p: i,
			i,
			o: i,
			d( t ) {
				t && S( e ), t && S( n );
			},
		};
	}
	function Kt( t ) {
		let e, n, i, o;
		const r = [ te, Qt ],
			s = [];
		function c( t, e ) {
			return 'normal' === t[ 1 ] ? 0 : 1;
		}
		return (
			( e = c( t ) ),
			( n = s[ e ] = r[ e ]( t ) ),
			{
				c() {
					n.c(), ( i = O() );
				},
				m( t, n ) {
					s[ e ].m( t, n ), z( t, i, n ), ( o = ! 0 );
				},
				p( t, o ) {
					const a = e;
					( e = c( t ) ),
						e === a
							? s[ e ].p( t, o )
							: ( lt(),
							  ft( s[ a ], 1, 1, () => {
									s[ a ] = null;
							  } ),
							  ut(),
							  ( n = s[ e ] ),
							  n ? n.p( t, o ) : ( ( n = s[ e ] = r[ e ]( t ) ), n.c() ),
							  dt( n, 1 ),
							  n.m( i.parentNode, i ) );
				},
				i( t ) {
					o || ( dt( n ), ( o = ! 0 ) );
				},
				o( t ) {
					ft( n ), ( o = ! 1 );
				},
				d( t ) {
					s[ e ].d( t ), t && S( i );
				},
			}
		);
	}
	function Yt( t ) {
		let e,
			n,
			o = Math.floor( t[ 0 ] ) + '';
		return {
			c() {
				( e = C( o ) ), ( n = C( 'x' ) );
			},
			m( t, i ) {
				z( t, e, i ), z( t, n, i );
			},
			p( t, n ) {
				1 & n && o !== ( o = Math.floor( t[ 0 ] ) + '' ) && L( e, o );
			},
			i,
			o: i,
			d( t ) {
				t && S( e ), t && S( n );
			},
		};
	}
	function Qt( t ) {
		let e,
			n,
			o = t[ 0 ].toFixed( 1 ) + '';
		return {
			c() {
				( e = C( o ) ), ( n = C( 'x' ) );
			},
			m( t, i ) {
				z( t, e, i ), z( t, n, i );
			},
			p( t, n ) {
				1 & n && o !== ( o = t[ 0 ].toFixed( 1 ) + '' ) && L( e, o );
			},
			i,
			o: i,
			d( t ) {
				t && S( e ), t && S( n );
			},
		};
	}
	function te( t ) {
		let e, n;
		return (
			( e = new Xt( {} ) ),
			{
				c() {
					vt( e.$$.fragment );
				},
				m( t, i ) {
					$t( e, t, i ), ( n = ! 0 );
				},
				p: i,
				i( t ) {
					n || ( dt( e.$$.fragment, t ), ( n = ! 0 ) );
				},
				o( t ) {
					ft( e.$$.fragment, t ), ( n = ! 1 );
				},
				d( t ) {
					wt( e, t );
				},
			}
		);
	}
	function ee( t ) {
		let e, n, i, o, r, s, c, a, l;
		const u = [ Gt, qt ],
			d = [];
		function f( t, e ) {
			return ! 1 === t[ 3 ] ? 0 : 1;
		}
		return (
			( i = f( t ) ),
			( o = d[ i ] = u[ i ]( t ) ),
			{
				c() {
					( e = j( 'div' ) ),
						( n = j( 'div' ) ),
						o.c(),
						P( n, 'class', 'bubble svelte-sip1vm' ),
						P( e, 'class', ( r = 'interaction-area ' + t[ 1 ] + ' svelte-sip1vm' ) );
				},
				m( o, r ) {
					z( o, e, r ),
						x( e, n ),
						d[ i ].m( n, null ),
						t[ 10 ]( e ),
						( c = ! 0 ),
						a || ( ( l = I( e, 'mouseenter', t[ 7 ] ) ), ( a = ! 0 ) );
				},
				p( s, [ a ] ) {
					const l = i;
					( i = f( ( t = s ) ) ),
						i === l
							? d[ i ].p( t, a )
							: ( lt(),
							  ft( d[ l ], 1, 1, () => {
									d[ l ] = null;
							  } ),
							  ut(),
							  ( o = d[ i ] ),
							  o ? o.p( t, a ) : ( ( o = d[ i ] = u[ i ]( t ) ), o.c() ),
							  dt( o, 1 ),
							  o.m( n, null ) ),
						( ! c || ( 2 & a && r !== ( r = 'interaction-area ' + t[ 1 ] + ' svelte-sip1vm' ) ) ) &&
							P( e, 'class', r );
				},
				i( n ) {
					c ||
						( dt( o ),
						Q( () => {
							s || ( s = gt( e, Ht, t[ 6 ], ! 0 ) ), s.run( 1 );
						} ),
						( c = ! 0 ) );
				},
				o( n ) {
					ft( o ), s || ( s = gt( e, Ht, t[ 6 ], ! 1 ) ), s.run( 0 ), ( c = ! 1 );
				},
				d( n ) {
					n && S( e ), d[ i ].d(), t[ 10 ]( null ), n && s && s.end(), ( a = ! 1 ), l();
				},
			}
		);
	}
	function ne( t, e, n ) {
		let i,
			o,
			r,
			{ index: s } = e,
			{ store: c } = e;
		const a = c.oversizedRatio;
		h( t, a, t => n( 0, ( i = t ) ) );
		const l = c.loading;
		h( t, l, t => n( 3, ( o = t ) ) );
		const u = { delay: 150 + 50 * s, duration: 250, y: 2, easing: At };
		let d;
		const f = ( function () {
			const t = J();
			return ( e, n, { cancelable: i = ! 1 } = {} ) => {
				const o = t.$$.callbacks[ e ];
				if ( o ) {
					const r = A( e, n, { cancelable: i } );
					return (
						o.slice().forEach( e => {
							e.call( t, r );
						} ),
						! r.defaultPrevented
					);
				}
				return ! 0;
			};
		} )();
		return (
			( t.$$set = t => {
				'index' in t && n( 8, ( s = t.index ) ), 'store' in t && n( 9, ( c = t.store ) );
			} ),
			( t.$$.update = () => {
				1 & t.$$.dirty && n( 1, ( r = i > 4 ? 'high' : i > 2.5 ? 'medium' : 'normal' ) );
			} ),
			[
				i,
				r,
				d,
				o,
				a,
				l,
				u,
				function () {
					const t = d.getBoundingClientRect();
					f( 'hover', { index: s, position: { top: t.top + t.height + 10, left: t.left } } );
				},
				s,
				c,
				function ( t ) {
					q[ t ? 'unshift' : 'push' ]( () => {
						( d = t ), n( 2, d );
					} );
				},
			]
		);
	}
	class ie extends xt {
		constructor( t ) {
			super(), yt( this, t, ne, ee, l, { index: 8, store: 9 } );
		}
	}
	function oe( t ) {
		let e, n;
		const i = t[ 2 ].default,
			o = ( function ( t, e, n, i ) {
				if ( t ) {
					const o = g( t, e, n, i );
					return t[ 0 ]( o );
				}
			} )( i, t, t[ 1 ], null );
		return {
			c() {
				( e = j( 'div' ) ), o && o.c(), P( e, 'class', 'jetpack-boost-guide-portal' );
			},
			m( i, r ) {
				z( i, e, r ), o && o.m( e, null ), t[ 3 ]( e ), ( n = ! 0 );
			},
			p( t, [ e ] ) {
				o &&
					o.p &&
					( ! n || 2 & e ) &&
					( function ( t, e, n, i, o, r ) {
						if ( o ) {
							const s = g( e, n, i, r );
							t.p( s, o );
						}
					} )(
						o,
						i,
						t,
						t[ 1 ],
						n
							? ( function ( t, e, n, i ) {
									if ( t[ 2 ] && i ) {
										const o = t[ 2 ]( i( n ) );
										if ( void 0 === e.dirty ) return o;
										if ( 'object' === typeof o ) {
											const t = [],
												n = Math.max( e.dirty.length, o.length );
											for ( let i = 0; i < n; i += 1 ) t[ i ] = e.dirty[ i ] | o[ i ];
											return t;
										}
										return e.dirty | o;
									}
									return e.dirty;
							  } )( i, t[ 1 ], e, null )
							: ( function ( t ) {
									if ( t.ctx.length > 32 ) {
										const e = [],
											n = t.ctx.length / 32;
										for ( let t = 0; t < n; t++ ) e[ t ] = -1;
										return e;
									}
									return -1;
							  } )( t[ 1 ] ),
						null
					);
			},
			i( t ) {
				n || ( dt( o, t ), ( n = ! 0 ) );
			},
			o( t ) {
				ft( o, t ), ( n = ! 1 );
			},
			d( n ) {
				n && S( e ), o && o.d( n ), t[ 3 ]( null );
			},
		};
	}
	function re( t, e, n ) {
		let i,
			{ $$slots: o = {}, $$scope: r } = e;
		let s;
		return (
			W( () => {
				document.body.appendChild( i );
			} ),
			( s = () => {
				document.body.removeChild( i );
			} ),
			J().$$.on_destroy.push( s ),
			( t.$$set = t => {
				'$$scope' in t && n( 1, ( r = t.$$scope ) );
			} ),
			[
				i,
				r,
				o,
				function ( t ) {
					q[ t ? 'unshift' : 'push' ]( () => {
						( i = t ), n( 0, i );
					} );
				},
			]
		);
	}
	class se extends xt {
		constructor( t ) {
			super(), yt( this, t, re, oe, l, {} );
		}
	}
	function ce( t ) {
		let e, n;
		return {
			c() {
				( e = E( 'svg' ) ),
					( n = E( 'path' ) ),
					P(
						n,
						'd',
						'M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z'
					),
					P( e, 'xmlns', 'http://www.w3.org/2000/svg' ),
					P( e, 'viewBox', '0 0 24 24' ),
					P( e, 'class', 'svelte-1g2gjwn' );
			},
			m( t, i ) {
				z( t, e, i ), x( e, n );
			},
			p: i,
			i,
			o: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	class ae extends xt {
		constructor( t ) {
			super(), yt( this, t, null, ce, l, {} );
		}
	}
	const { window: le } = mt;
	function ue( t ) {
		let e,
			n,
			i,
			o,
			r = t[ 30 ] + '';
		return {
			c() {
				( e = j( 'div' ) ),
					( n = C( 'The image file is ' ) ),
					( i = C( r ) ),
					( o = C(
						'x smaller than expected on this screen. This might be\n\t\t\t\t\t\tfine, but you may want to check if the image appears blurry.'
					) ),
					P( e, 'class', 'explanation svelte-1c7o3v8' );
			},
			m( t, r ) {
				z( t, e, r ), x( e, n ), x( e, i ), x( e, o );
			},
			p( t, e ) {
				8 & e[ 0 ] && r !== ( r = t[ 30 ] + '' ) && L( i, r );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function de( t ) {
		let e,
			n,
			i = t[ 6 ] > 1 && he( t );
		return {
			c() {
				( e = j( 'div' ) ),
					( n = C(
						'The image size is very close to the size it appears in the browser.\n\t\t\t\t\t\t'
					) ),
					i && i.c(),
					P( e, 'class', 'explanation svelte-1c7o3v8' );
			},
			m( t, o ) {
				z( t, e, o ), x( e, n ), i && i.m( e, null );
			},
			p( t, n ) {
				t[ 6 ] > 1
					? i
						? i.p( t, n )
						: ( ( i = he( t ) ), i.c(), i.m( e, null ) )
					: i && ( i.d( 1 ), ( i = null ) );
			},
			d( t ) {
				t && S( e ), i && i.d();
			},
		};
	}
	function fe( t ) {
		let e;
		return {
			c() {
				( e = j( 'div' ) ),
					( e.textContent = 'The image is exactly the correct size for this screen.' ),
					P( e, 'class', 'explanation svelte-1c7o3v8' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function pe( t ) {
		let e,
			n,
			i,
			o,
			r,
			s,
			c = t[ 4 ].weight > 450 && ge();
		return {
			c() {
				( e = j( 'div' ) ),
					( n = C( 'The image loaded is ' ) ),
					( i = j( 'strong' ) ),
					( o = C( t[ 6 ] ) ),
					( r = C( 'x' ) ),
					( s = C( ' larger than it appears in the browser.\n\t\t\t\t\t\t' ) ),
					c && c.c(),
					P( e, 'class', 'explanation svelte-1c7o3v8' );
			},
			m( t, a ) {
				z( t, e, a ), x( e, n ), x( e, i ), x( i, o ), x( i, r ), x( e, s ), c && c.m( e, null );
			},
			p( t, n ) {
				64 & n[ 0 ] && L( o, t[ 6 ] ),
					t[ 4 ].weight > 450
						? c || ( ( c = ge() ), c.c(), c.m( e, null ) )
						: c && ( c.d( 1 ), ( c = null ) );
			},
			d( t ) {
				t && S( e ), c && c.d();
			},
		};
	}
	function he( t ) {
		let e, n, i, o, r;
		return {
			c() {
				( e = C(
					"Because there are various screen sizes, it's okay for the image to be\n\t\t\t\t\t\t\t"
				) ),
					( n = j( 'strong' ) ),
					( i = C( t[ 6 ] ) ),
					( o = C( 'x' ) ),
					( r = C( ' than it appears on the page.' ) );
			},
			m( t, s ) {
				z( t, e, s ), z( t, n, s ), x( n, i ), x( n, o ), z( t, r, s );
			},
			p( t, e ) {
				64 & e[ 0 ] && L( i, t[ 6 ] );
			},
			d( t ) {
				t && S( e ), t && S( n ), t && S( r );
			},
		};
	}
	function ge( t ) {
		let e;
		return {
			c() {
				e = C( 'Try using a smaller image or reduce the file size by compressing it.' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function me( t ) {
		let e, n;
		return {
			c() {
				( e = j( 'img' ) ),
					d( e.src, ( n = t[ 5 ] ) ) || P( e, 'src', n ),
					P( e, 'alt', t[ 10 ] ),
					R( e, 'width', t[ 2 ] + 'px' ),
					R( e, 'height', t[ 7 ] + 'px' ),
					P( e, 'width', t[ 2 ] ),
					P( e, 'height', t[ 7 ] ),
					P( e, 'class', 'svelte-1c7o3v8' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p( t, i ) {
				32 & i[ 0 ] && ! d( e.src, ( n = t[ 5 ] ) ) && P( e, 'src', n ),
					1024 & i[ 0 ] && P( e, 'alt', t[ 10 ] ),
					4 & i[ 0 ] && R( e, 'width', t[ 2 ] + 'px' ),
					128 & i[ 0 ] && R( e, 'height', t[ 7 ] + 'px' ),
					4 & i[ 0 ] && P( e, 'width', t[ 2 ] ),
					128 & i[ 0 ] && P( e, 'height', t[ 7 ] );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function ve( t ) {
		let e;
		function n( t, e ) {
			return t[ 18 ] ? be : we;
		}
		let i = n( t ),
			o = i( t );
		return {
			c() {
				( e = j( 'div' ) ), o.c(), P( e, 'class', 'value' );
			},
			m( t, n ) {
				z( t, e, n ), o.m( e, null );
			},
			p( t, r ) {
				i !== ( i = n( t ) ) && ( o.d( 1 ), ( o = i( t ) ), o && ( o.c(), o.m( e, null ) ) );
			},
			d( t ) {
				t && S( e ), o.d();
			},
		};
	}
	function $e( t ) {
		let e,
			n,
			i,
			o,
			r = t[ 4 ].width + '',
			s = t[ 4 ].height + '';
		return {
			c() {
				( e = j( 'div' ) ),
					( n = C( r ) ),
					( i = C( ' x ' ) ),
					( o = C( s ) ),
					P( e, 'class', 'value' );
			},
			m( t, r ) {
				z( t, e, r ), x( e, n ), x( e, i ), x( e, o );
			},
			p( t, e ) {
				16 & e[ 0 ] && r !== ( r = t[ 4 ].width + '' ) && L( n, r ),
					16 & e[ 0 ] && s !== ( s = t[ 4 ].height + '' ) && L( o, s );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function we( t ) {
		let e;
		return {
			c() {
				( e = j( 'em' ) ), ( e.textContent = 'Unknown' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function be( t ) {
		let e;
		return {
			c() {
				e = C( 'Loading...' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function ye( t ) {
		let e;
		return {
			c() {
				( e = j( 'em' ) ), ( e.textContent = 'Unknown' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function xe( t ) {
		let e;
		return {
			c() {
				e = C( 'Loading...' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function _e( t ) {
		let e,
			n,
			i = Math.round( t[ 4 ].weight ) + '';
		return {
			c() {
				( e = C( i ) ), ( n = C( ' KB' ) );
			},
			m( t, i ) {
				z( t, e, i ), z( t, n, i );
			},
			p( t, n ) {
				16 & n[ 0 ] && i !== ( i = Math.round( t[ 4 ].weight ) + '' ) && L( e, i );
			},
			d( t ) {
				t && S( e ), t && S( n );
			},
		};
	}
	function ke( t ) {
		let e;
		return {
			c() {
				( e = j( 'em' ) ), ( e.textContent = 'N/A' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function ze( t ) {
		let e;
		return {
			c() {
				e = C( 'Loading...' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			p: i,
			d( t ) {
				t && S( e );
			},
		};
	}
	function Se( t ) {
		let e, n, i;
		return {
			c() {
				( e = j( 'strong' ) ), ( n = C( t[ 21 ] ) ), ( i = C( ' KB' ) );
			},
			m( t, o ) {
				z( t, e, o ), x( e, n ), x( e, i );
			},
			p( t, e ) {
				2097152 & e[ 0 ] && L( n, t[ 21 ] );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function je( t ) {
		let e;
		return {
			c() {
				( e = j( 'div' ) ),
					( e.textContent =
						'Unable to estimate file size savings because the image is hosted on a different domain.' ),
					P( e, 'class', 'info svelte-1c7o3v8' );
			},
			m( t, n ) {
				z( t, e, n );
			},
			d( t ) {
				t && S( e );
			},
		};
	}
	function Ee( t ) {
		let e,
			n,
			i,
			o,
			r,
			s,
			c,
			a,
			l,
			u,
			d,
			f,
			p,
			h,
			g,
			m,
			v,
			$,
			w,
			b,
			y,
			_,
			k,
			E,
			O,
			T,
			A,
			U,
			B,
			H,
			N,
			D,
			F,
			J,
			W,
			V,
			X,
			q,
			G,
			Z,
			K,
			Y,
			tt,
			et,
			nt,
			it,
			ot,
			rt,
			st,
			ct,
			at,
			lt,
			ut = t[ 19 ].width + '',
			pt = t[ 19 ].height + '',
			gt = t[ 20 ].width + '',
			mt = t[ 20 ].height + '',
			bt = `${ t[ 0 ].top }px`,
			yt = `${ t[ 0 ].left }px`;
		function xt( t, e ) {
			return t[ 6 ] >= 1.3 ? pe : 1 === t[ 6 ] ? fe : t[ 6 ] >= 0.99 && t[ 6 ] < 1.3 ? de : ue;
		}
		function _t( t, e ) {
			return e === ue
				? ( function ( t ) {
						const e = t.slice(),
							n = Me( 1 / e[ 3 ] );
						return ( e[ 30 ] = n ), e;
				  } )( t )
				: t;
		}
		i = new Ft( { props: { size: 250 } } );
		let kt = xt( t ),
			zt = kt( _t( t, kt ) ),
			St = t[ 5 ] && me( t );
		function jt( t, e ) {
			return t[ 4 ].width > 0 && t[ 4 ].height > 0 ? $e : ve;
		}
		let Et = jt( t ),
			Ct = Et( t );
		function Mt( t, e ) {
			return t[ 4 ].weight > 0 ? _e : t[ 18 ] ? xe : ye;
		}
		let Ot = Mt( t ),
			It = Ot( t );
		function Pt( t, e ) {
			return t[ 21 ] > 0 ? Se : t[ 18 ] ? ze : ke;
		}
		let Lt = Pt( t ),
			Rt = Lt( t ),
			Tt = t[ 8 ] !== t[ 9 ] && je();
		return (
			( rt = new ae( {} ) ),
			{
				c() {
					( e = j( 'div' ) ),
						( n = j( 'div' ) ),
						vt( i.$$.fragment ),
						( o = M() ),
						( r = j( 'div' ) ),
						( s = j( 'div' ) ),
						( c = j( 'div' ) ),
						( a = j( 'a' ) ),
						( l = C( t[ 10 ] ) ),
						( u = M() ),
						zt.c(),
						( d = M() ),
						St && St.c(),
						( f = M() ),
						( p = j( 'div' ) ),
						( h = j( 'div' ) ),
						( g = j( 'div' ) ),
						( g.textContent = 'Image File Dimensions' ),
						( m = M() ),
						Ct.c(),
						( v = M() ),
						( $ = j( 'div' ) ),
						( w = j( 'div' ) ),
						( w.textContent = 'Expected Dimensions' ),
						( b = M() ),
						( y = j( 'div' ) ),
						( _ = C( ut ) ),
						( k = C( ' x ' ) ),
						( E = C( pt ) ),
						( O = M() ),
						( T = j( 'div' ) ),
						( A = j( 'div' ) ),
						( A.textContent = 'Size on screen' ),
						( U = M() ),
						( B = j( 'div' ) ),
						( H = C( gt ) ),
						( N = C( ' x ' ) ),
						( D = C( mt ) ),
						( F = M() ),
						( J = j( 'div' ) ),
						( W = j( 'div' ) ),
						( W.textContent = 'Image Size' ),
						( V = M() ),
						( X = j( 'div' ) ),
						It.c(),
						( q = M() ),
						( G = j( 'div' ) ),
						( Z = j( 'div' ) ),
						( Z.textContent = 'Potential savings' ),
						( K = M() ),
						( Y = j( 'div' ) ),
						Rt.c(),
						( tt = M() ),
						Tt && Tt.c(),
						( et = M() ),
						( nt = j( 'div' ) ),
						( it = j( 'a' ) ),
						( ot = C( 'Learn how to improve site speed by optimizing images ' ) ),
						vt( rt.$$.fragment ),
						P( n, 'class', 'logo svelte-1c7o3v8' ),
						P( a, 'href', t[ 5 ] ),
						P( a, 'target', '_blank noreferrer' ),
						P( a, 'class', 'svelte-1c7o3v8' ),
						P( c, 'class', 'title svelte-1c7o3v8' ),
						P( s, 'class', 'description svelte-1c7o3v8' ),
						P( r, 'class', 'preview svelte-1c7o3v8' ),
						P( g, 'class', 'label' ),
						P( h, 'class', 'row svelte-1c7o3v8' ),
						P( w, 'class', 'label' ),
						P( y, 'class', 'value' ),
						P( $, 'class', 'row svelte-1c7o3v8' ),
						P( A, 'class', 'label' ),
						P( B, 'class', 'value' ),
						P( T, 'class', 'row svelte-1c7o3v8' ),
						P( W, 'class', 'label' ),
						P( X, 'class', 'value' ),
						P( J, 'class', 'row svelte-1c7o3v8' ),
						P( Z, 'class', 'label' ),
						P( Y, 'class', 'value' ),
						P( G, 'class', 'row svelte-1c7o3v8' ),
						P( it, 'class', 'documentation svelte-1c7o3v8' ),
						P( it, 'href', t[ 22 ] ),
						P( it, 'target', '_blank noreferrer' ),
						P( nt, 'class', 'info svelte-1c7o3v8' ),
						P( p, 'class', 'meta' ),
						P( e, 'class', 'jetpack-boost-guide-popup keep-guide-open svelte-1c7o3v8' ),
						R( e, 'top', bt ),
						R( e, 'left', yt );
				},
				m( S, j ) {
					z( S, e, j ),
						x( e, n ),
						$t( i, n, null ),
						x( e, o ),
						x( e, r ),
						x( r, s ),
						x( s, c ),
						x( c, a ),
						x( a, l ),
						x( s, u ),
						zt.m( s, null ),
						x( r, d ),
						St && St.m( r, null ),
						x( e, f ),
						x( e, p ),
						x( p, h ),
						x( h, g ),
						x( h, m ),
						Ct.m( h, null ),
						x( p, v ),
						x( p, $ ),
						x( $, w ),
						x( $, b ),
						x( $, y ),
						x( y, _ ),
						x( y, k ),
						x( y, E ),
						x( p, O ),
						x( p, T ),
						x( T, A ),
						x( T, U ),
						x( T, B ),
						x( B, H ),
						x( B, N ),
						x( B, D ),
						x( p, F ),
						x( p, J ),
						x( J, W ),
						x( J, V ),
						x( J, X ),
						It.m( X, null ),
						x( p, q ),
						x( p, G ),
						x( G, Z ),
						x( G, K ),
						x( G, Y ),
						Rt.m( Y, null ),
						x( p, tt ),
						Tt && Tt.m( p, null ),
						x( p, et ),
						x( p, nt ),
						x( nt, it ),
						x( it, ot ),
						$t( rt, it, null ),
						( ct = ! 0 ),
						at || ( ( lt = I( e, 'mouseleave', t[ 25 ] ) ), ( at = ! 0 ) );
				},
				p( n, i ) {
					( t = n ),
						( ! ct || 1024 & i[ 0 ] ) && L( l, t[ 10 ] ),
						( ! ct || 32 & i[ 0 ] ) && P( a, 'href', t[ 5 ] ),
						kt === ( kt = xt( t ) ) && zt
							? zt.p( _t( t, kt ), i )
							: ( zt.d( 1 ), ( zt = kt( _t( t, kt ) ) ), zt && ( zt.c(), zt.m( s, null ) ) ),
						t[ 5 ]
							? St
								? St.p( t, i )
								: ( ( St = me( t ) ), St.c(), St.m( r, null ) )
							: St && ( St.d( 1 ), ( St = null ) ),
						Et === ( Et = jt( t ) ) && Ct
							? Ct.p( t, i )
							: ( Ct.d( 1 ), ( Ct = Et( t ) ), Ct && ( Ct.c(), Ct.m( h, null ) ) ),
						( ! ct || 524288 & i[ 0 ] ) && ut !== ( ut = t[ 19 ].width + '' ) && L( _, ut ),
						( ! ct || 524288 & i[ 0 ] ) && pt !== ( pt = t[ 19 ].height + '' ) && L( E, pt ),
						( ! ct || 1048576 & i[ 0 ] ) && gt !== ( gt = t[ 20 ].width + '' ) && L( H, gt ),
						( ! ct || 1048576 & i[ 0 ] ) && mt !== ( mt = t[ 20 ].height + '' ) && L( D, mt ),
						Ot === ( Ot = Mt( t ) ) && It
							? It.p( t, i )
							: ( It.d( 1 ), ( It = Ot( t ) ), It && ( It.c(), It.m( X, null ) ) ),
						Lt === ( Lt = Pt( t ) ) && Rt
							? Rt.p( t, i )
							: ( Rt.d( 1 ), ( Rt = Lt( t ) ), Rt && ( Rt.c(), Rt.m( Y, null ) ) ),
						t[ 8 ] !== t[ 9 ]
							? Tt || ( ( Tt = je() ), Tt.c(), Tt.m( p, et ) )
							: Tt && ( Tt.d( 1 ), ( Tt = null ) ),
						1 & i[ 0 ] && bt !== ( bt = `${ t[ 0 ].top }px` ) && R( e, 'top', bt ),
						1 & i[ 0 ] && yt !== ( yt = `${ t[ 0 ].left }px` ) && R( e, 'left', yt );
				},
				i( t ) {
					ct ||
						( dt( i.$$.fragment, t ),
						dt( rt.$$.fragment, t ),
						st ||
							Q( () => {
								( st = ht( e, Ht, { duration: 150, y: 4, easing: At } ) ), st.start();
							} ),
						( ct = ! 0 ) );
				},
				o( t ) {
					ft( i.$$.fragment, t ), ft( rt.$$.fragment, t ), ( ct = ! 1 );
				},
				d( t ) {
					t && S( e ),
						wt( i ),
						zt.d(),
						St && St.d(),
						Ct.d(),
						It.d(),
						Rt.d(),
						Tt && Tt.d(),
						wt( rt ),
						( at = ! 1 ),
						lt();
				},
			}
		);
	}
	function Ce( t ) {
		let e,
			n,
			i,
			o,
			r,
			s = ! 1,
			c = () => {
				s = ! 1;
			};
		return (
			Q( t[ 26 ] ),
			( n = new se( { props: { $$slots: { default: [ Ee ] }, $$scope: { ctx: t } } } ) ),
			{
				c() {
					vt( n.$$.fragment );
				},
				m( a, l ) {
					$t( n, a, l ),
						( i = ! 0 ),
						o ||
							( ( r = I( le, 'scroll', () => {
								( s = ! 0 ), clearTimeout( e ), ( e = setTimeout( c, 100 ) ), t[ 26 ]();
							} ) ),
							( o = ! 0 ) );
				},
				p( t, i ) {
					2 & i[ 0 ] &&
						! s &&
						( ( s = ! 0 ),
						clearTimeout( e ),
						scrollTo( le.pageXOffset, t[ 1 ] ),
						( e = setTimeout( c, 100 ) ) );
					const o = {};
					( 3934205 & i[ 0 ] ) | ( 1 & i[ 1 ] ) && ( o.$$scope = { dirty: i, ctx: t } ),
						n.$set( o );
				},
				i( t ) {
					i || ( dt( n.$$.fragment, t ), ( i = ! 0 ) );
				},
				o( t ) {
					ft( n.$$.fragment, t ), ( i = ! 1 );
				},
				d( t ) {
					wt( n, t ), ( o = ! 1 ), r();
				},
			}
		);
	}
	function Me( t ) {
		return t % 1 == 0 ? t : parseFloat( t.toFixed( 2 ) );
	}
	function Oe( t, e, n ) {
		let o,
			r,
			s,
			c,
			a,
			l,
			u,
			d,
			p,
			h,
			g,
			m,
			v,
			$,
			w,
			b,
			y,
			x,
			_,
			k,
			z = i,
			S = i,
			j = i,
			E = i,
			C = i,
			M = i,
			O = i;
		t.$$.on_destroy.push( () => z() ),
			t.$$.on_destroy.push( () => S() ),
			t.$$.on_destroy.push( () => j() ),
			t.$$.on_destroy.push( () => E() ),
			t.$$.on_destroy.push( () => C() ),
			t.$$.on_destroy.push( () => M() ),
			t.$$.on_destroy.push( () => O() );
		let { store: I } = e,
			{ size: P } = e,
			{ position: L } = e,
			R = 0,
			T = 0,
			A = 0;
		W( () => {
			( T = R ), ( A = L.top );
		} );
		const U = ( function ( t, e = {} ) {
			let n;
			const i = {};
			let o;
			if (
				( 'undefined' !== typeof window &&
					( o = null === ( n = window.Initial_State ) || void 0 === n ? void 0 : n.calypsoEnv ),
				0 === t.search( 'https://' ) )
			) {
				const e = new URL( t );
				( t = `https://${ e.host }${ e.pathname }` ), ( i.url = encodeURIComponent( t ) );
			} else i.source = encodeURIComponent( t );
			return (
				Object.keys( e ).map( t => {
					i[ t ] = encodeURIComponent( e[ t ] );
				} ),
				! Object.keys( i ).includes( 'site' ) &&
					'undefined' !== typeof jetpack_redirects &&
					jetpack_redirects.hasOwnProperty( 'currentSiteRawUrl' ) &&
					( i.site = jetpack_redirects.currentSiteRawUrl ),
				o && ( i.calypso_env = o ),
				'https://jetpack.com/redirect/?' +
					Object.keys( i )
						.map( t => t + '=' + i[ t ] )
						.join( '&' )
			);
		} )( 'jetpack-support-boost-image-performance-guide' );
		return (
			( t.$$set = t => {
				'store' in t && n( 23, ( I = t.store ) ),
					'size' in t && n( 24, ( P = t.size ) ),
					'position' in t && n( 0, ( L = t.position ) );
			} ),
			( t.$$.update = () => {
				let e;
				8388608 & t.$$.dirty[ 0 ] &&
					( n( 17, ( o = I.loading ) ), E(), ( E = f( o, t => n( 18, ( y = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 16, ( r = I.oversizedRatio ) ), z(), ( z = f( r, t => n( 3, ( $ = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 15, ( s = I.fileSize ) ), S(), ( S = f( s, t => n( 4, ( w = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 14, ( c = I.sizeOnPage ) ), M(), ( M = f( c, t => n( 20, ( _ = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 13, ( a = I.potentialSavings ) ), O(), ( O = f( a, t => n( 21, ( k = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 12, ( l = I.expectedSize ) ), C(), ( C = f( l, t => n( 19, ( x = t ) ) ) ) ),
					8388608 & t.$$.dirty[ 0 ] &&
						( n( 11, ( u = I.url ) ), j(), ( j = f( u, t => n( 5, ( b = t ) ) ) ) ),
					32 & t.$$.dirty[ 0 ] && n( 10, ( d = b.split( '/' ).pop() ) ),
					32 & t.$$.dirty[ 0 ] && n( 8, ( h = new URL( b ).origin ) ),
					16777216 & t.$$.dirty[ 0 ] && n( 2, ( g = 'normal' === P ? 100 : 50 ) ),
					20 & t.$$.dirty[ 0 ] && n( 7, ( m = Math.floor( g / ( w.width / w.height ) ) ) ),
					8 & t.$$.dirty[ 0 ] && n( 6, ( v = Me( $ ) ) ),
					2 & t.$$.dirty[ 0 ] && 0 !== ( e = R ) && T !== e && n( 0, ( L.top = A + ( T - e ) ), L );
			} ),
			n( 9, ( p = new URL( window.location.href ).origin ) ),
			[
				L,
				R,
				g,
				$,
				w,
				b,
				v,
				m,
				h,
				p,
				d,
				u,
				l,
				a,
				c,
				s,
				r,
				o,
				y,
				x,
				_,
				k,
				U,
				I,
				P,
				function ( e ) {
					V.call( this, t, e );
				},
				function () {
					n( 1, ( R = le.pageYOffset ) );
				},
			]
		);
	}
	class Ie extends xt {
		constructor( t ) {
			super(), yt( this, t, Oe, Ce, l, { store: 23, size: 24, position: 0 }, null, [ -1, -1 ] );
		}
	}
	function Pe( t, e, n ) {
		const i = t.slice();
		return ( i[ 10 ] = e[ n ] ), ( i[ 12 ] = n ), i;
	}
	function Le( t ) {
		let e,
			n,
			i,
			o,
			r,
			s,
			c,
			a = t[ 0 ],
			l = [];
		for ( let e = 0; e < a.length; e += 1 ) l[ e ] = Re( Pe( t, a, e ) );
		const u = t =>
			ft( l[ t ], 1, 1, () => {
				l[ t ] = null;
			} );
		let d = ! 1 !== t[ 1 ] && Te( t );
		return {
			c() {
				( e = j( 'div' ) ), ( n = j( 'div' ) );
				for ( let t = 0; t < l.length; t += 1 ) l[ t ].c();
				( i = M() ),
					d && d.c(),
					P( n, 'class', 'previews svelte-11j2opz' ),
					P( e, 'class', ( o = 'guide ' + t[ 3 ] + ' svelte-11j2opz' ) ),
					T( e, 'show', ! 1 !== t[ 1 ] ),
					T( e, 'keep-guide-open', ! 1 !== t[ 1 ] );
			},
			m( o, a ) {
				z( o, e, a ), x( e, n );
				for ( let t = 0; t < l.length; t += 1 ) l[ t ].m( n, null );
				x( e, i ),
					d && d.m( e, null ),
					( r = ! 0 ),
					s || ( ( c = I( e, 'mouseleave', t[ 5 ] ) ), ( s = ! 0 ) );
			},
			p( t, i ) {
				if ( 129 & i ) {
					let e;
					for ( a = t[ 0 ], e = 0; e < a.length; e += 1 ) {
						const o = Pe( t, a, e );
						l[ e ]
							? ( l[ e ].p( o, i ), dt( l[ e ], 1 ) )
							: ( ( l[ e ] = Re( o ) ), l[ e ].c(), dt( l[ e ], 1 ), l[ e ].m( n, null ) );
					}
					for ( lt(), e = a.length; e < l.length; e += 1 ) u( e );
					ut();
				}
				! 1 !== t[ 1 ]
					? d
						? ( d.p( t, i ), 2 & i && dt( d, 1 ) )
						: ( ( d = Te( t ) ), d.c(), dt( d, 1 ), d.m( e, null ) )
					: d &&
					  ( lt(),
					  ft( d, 1, 1, () => {
							d = null;
					  } ),
					  ut() ),
					( ! r || ( 8 & i && o !== ( o = 'guide ' + t[ 3 ] + ' svelte-11j2opz' ) ) ) &&
						P( e, 'class', o ),
					( ! r || 10 & i ) && T( e, 'show', ! 1 !== t[ 1 ] ),
					( ! r || 10 & i ) && T( e, 'keep-guide-open', ! 1 !== t[ 1 ] );
			},
			i( t ) {
				if ( ! r ) {
					for ( let t = 0; t < a.length; t += 1 ) dt( l[ t ] );
					dt( d ), ( r = ! 0 );
				}
			},
			o( t ) {
				l = l.filter( Boolean );
				for ( let t = 0; t < l.length; t += 1 ) ft( l[ t ] );
				ft( d ), ( r = ! 1 );
			},
			d( t ) {
				t && S( e ),
					( function ( t, e ) {
						for ( let n = 0; n < t.length; n += 1 ) t[ n ] && t[ n ].d( e );
					} )( l, t ),
					d && d.d(),
					( s = ! 1 ),
					c();
			},
		};
	}
	function Re( t ) {
		let e, n;
		return (
			( e = new ie( { props: { index: t[ 12 ], store: t[ 10 ] } } ) ),
			e.$on( 'hover', t[ 7 ] ),
			{
				c() {
					vt( e.$$.fragment );
				},
				m( t, i ) {
					$t( e, t, i ), ( n = ! 0 );
				},
				p( t, n ) {
					const i = {};
					1 & n && ( i.store = t[ 10 ] ), e.$set( i );
				},
				i( t ) {
					n || ( dt( e.$$.fragment, t ), ( n = ! 0 ) );
				},
				o( t ) {
					ft( e.$$.fragment, t ), ( n = ! 1 );
				},
				d( t ) {
					wt( e, t );
				},
			}
		);
	}
	function Te( t ) {
		let e, n;
		return (
			( e = new Ie( { props: { store: t[ 0 ][ t[ 1 ] ], size: t[ 3 ], position: t[ 2 ] } } ) ),
			e.$on( 'mouseleave', t[ 5 ] ),
			{
				c() {
					vt( e.$$.fragment );
				},
				m( t, i ) {
					$t( e, t, i ), ( n = ! 0 );
				},
				p( t, n ) {
					const i = {};
					3 & n && ( i.store = t[ 0 ][ t[ 1 ] ] ),
						8 & n && ( i.size = t[ 3 ] ),
						4 & n && ( i.position = t[ 2 ] ),
						e.$set( i );
				},
				i( t ) {
					n || ( dt( e.$$.fragment, t ), ( n = ! 0 ) );
				},
				o( t ) {
					ft( e.$$.fragment, t ), ( n = ! 1 );
				},
				d( t ) {
					wt( e, t );
				},
			}
		);
	}
	function Ae( t ) {
		let e,
			n,
			i = 'active' === t[ 4 ] && Le( t );
		return {
			c() {
				i && i.c(), ( e = O() );
			},
			m( t, o ) {
				i && i.m( t, o ), z( t, e, o ), ( n = ! 0 );
			},
			p( t, [ n ] ) {
				'active' === t[ 4 ]
					? i
						? ( i.p( t, n ), 16 & n && dt( i, 1 ) )
						: ( ( i = Le( t ) ), i.c(), dt( i, 1 ), i.m( e.parentNode, e ) )
					: i &&
					  ( lt(),
					  ft( i, 1, 1, () => {
							i = null;
					  } ),
					  ut() );
			},
			i( t ) {
				n || ( dt( i ), ( n = ! 0 ) );
			},
			o( t ) {
				ft( i ), ( n = ! 1 );
			},
			d( t ) {
				i && i.d( t ), t && S( e );
			},
		};
	}
	function Ue( t, e, n ) {
		let i, o, r;
		h( t, Pt, t => n( 4, ( r = t ) ) );
		let { stores: s } = e,
			c = ! 1;
		W( () => {
			s.forEach( t => t.updateDimensions() );
		} );
		const a = s[ 0 ].sizeOnPage;
		h( t, a, t => n( 8, ( o = t ) ) );
		let l = { top: 0, left: 0 };
		return (
			( t.$$set = t => {
				'stores' in t && n( 0, ( s = t.stores ) );
			} ),
			( t.$$.update = () => {
				256 & t.$$.dirty &&
					n(
						3,
						( i = ( function ( t = -1, e = -1 ) {
							return t < 200 || e < 200 ? 'micro' : t < 400 || e < 400 ? 'small' : 'normal';
						} )( o.width, o.height ) )
					),
					2 & t.$$.dirty &&
						( function ( t = ! 1 ) {
							t
								? s.forEach( t => t.node.classList.add( 'jetpack-boost-guide__backdrop' ) )
								: s.forEach( t => t.node.classList.remove( 'jetpack-boost-guide__backdrop' ) );
						} )( ! 1 !== c );
			} ),
			[
				s,
				c,
				l,
				i,
				r,
				function ( t ) {
					( t.relatedTarget && t.relatedTarget.classList.contains( 'keep-guide-open' ) ) ||
						n( 1, ( c = ! 1 ) );
				},
				a,
				function ( t ) {
					const e = t.detail,
						i = e.index;
					n( 2, ( l = e.position ) ), n( 1, ( c = i ) );
				},
				o,
			]
		);
	}
	class Be extends xt {
		constructor( t ) {
			super(), yt( this, t, Ue, Ae, l, { stores: 0 } );
		}
	}
	let He = 0;
	function Ne( t ) {
		const e = t.node;
		if (
			! ( t.node instanceof HTMLImageElement ) &&
			[ 'static', 'relative' ].includes( getComputedStyle( e ).position )
		)
			return e;
		if ( ! e.parentNode || ! e.parentElement ) return;
		const n = ( function ( t ) {
			let e,
				n = t.parentElement;
			for ( ; n && n instanceof HTMLElement && n !== document.body;  ) {
				const t = getComputedStyle( n ),
					i = 'inline' !== t.display,
					o = 'static' === t.position,
					r = 'relative' === t.position,
					s = 'auto' !== t.zIndex;
				i && ( ( ! e && ( o || r ) ) || ( r && s ) ) && ( e = n ), ( n = n.parentElement );
			}
			return e;
		} )( e );
		if ( null == n ? void 0 : n.classList.contains( 'jetpack-boost-guide' ) ) return n;
		if ( n ) {
			const t = getComputedStyle( n );
			if ( 'relative' === t.position ) {
				const t = Array.from( n.children ).find( t =>
					t.classList.contains( 'jetpack-boost-guide' )
				);
				if ( t && t instanceof HTMLElement ) return t;
			}
			const e = document.createElement( 'div' );
			return (
				e.classList.add( 'jetpack-boost-guide' ),
				( e.dataset.jetpackBoostGuideId = ( ++He ).toString() ),
				'static' === t.position && ( n.style.position = 'relative' ),
				n.prepend( e ),
				e
			);
		}
		return e.parentElement;
	}
	function De( t ) {
		let e, n, i, o, r, s, c, a, l, u;
		return (
			( n = new Ft( {} ) ),
			{
				c() {
					( e = j( 'a' ) ),
						vt( n.$$.fragment ),
						( i = M() ),
						( o = j( 'span' ) ),
						( r = C( 'Image Guide: ' ) ),
						( s = C( t[ 2 ] ) ),
						P( e, 'id', 'jetpack-boost-guide-bar' ),
						P( e, 'href', t[ 0 ] ),
						P( e, 'class', ( c = 'ab-item ' + t[ 1 ] + ' svelte-itog5b' ) );
				},
				m( c, d ) {
					let f;
					z( c, e, d ),
						$t( n, e, null ),
						x( e, i ),
						x( e, o ),
						x( o, r ),
						x( o, s ),
						( a = ! 0 ),
						l ||
							( ( u = I(
								e,
								'click',
								( ( f = t[ 3 ] ),
								function ( t ) {
									return t.preventDefault(), f.call( this, t );
								} )
							) ),
							( l = ! 0 ) );
				},
				p( t, [ n ] ) {
					( ! a || 4 & n ) && L( s, t[ 2 ] ),
						( ! a || 1 & n ) && P( e, 'href', t[ 0 ] ),
						( ! a || ( 2 & n && c !== ( c = 'ab-item ' + t[ 1 ] + ' svelte-itog5b' ) ) ) &&
							P( e, 'class', c );
				},
				i( t ) {
					a || ( dt( n.$$.fragment, t ), ( a = ! 0 ) );
				},
				o( t ) {
					ft( n.$$.fragment, t ), ( a = ! 1 );
				},
				d( t ) {
					t && S( e ), wt( n ), ( l = ! 1 ), u();
				},
			}
		);
	}
	function Fe( t, e, n ) {
		let i, o;
		h( t, Pt, t => n( 1, ( i = t ) ) ), h( t, Lt, t => n( 2, ( o = t ) ) );
		let { href: r } = e;
		return (
			( t.$$set = t => {
				'href' in t && n( 0, ( r = t.href ) );
			} ),
			[
				r,
				i,
				o,
				function () {
					Pt.cycle(), Rt.trackUIStateChange();
				},
			]
		);
	}
	class Je extends xt {
		constructor( t ) {
			super(), yt( this, t, Fe, De, l, { href: 0 } );
		}
	}
	document.addEventListener( 'DOMContentLoaded', () => {
		const t = document.getElementById( 'wp-admin-bar-jetpack-boost-guide' ),
			e = null == t ? void 0 : t.querySelector( 'a' );
		if ( t && e ) {
			const n = e.getAttribute( 'href' );
			e.remove(), new Je( { target: t, props: { href: n } } );
		}
	} );
	const We = [];
	function Ve() {
		Rt.trackInitialState(),
			Pt.subscribe( e =>
				t( this, void 0, void 0, function* () {
					if ( 'paused' === e ) return;
					const t = n.exports.getMeasurableImages(
							Array.from(
								document.querySelectorAll(
									'body *:not(.jetpack-boost-guide > *):not(.jetpack-boost-guide)'
								)
							)
						),
						i = t.filter( t => {
							const { width: e, height: n } = t.getSizeOnPage();
							return ! ( ! e || ! n ) && e >= 65 && n >= 65;
						} );
					We.push(
						...( function ( t ) {
							const e = t.reduce( ( t, e ) => {
								let n;
								if ( ! e.node.parentNode ) return console.error( 'Image has no parent', e.node ), t;
								const i = Ne( e );
								if ( ! i ) return console.error( 'Could not find a parent for image', e ), t;
								const o = parseInt( i.dataset.jetpackBoostGuideId || '' ),
									r = ( null === ( n = t[ o ] ) || void 0 === n ? void 0 : n.props.stores ) || [],
									s = new Tt( e );
								return (
									r.push( s ),
									1 === r.length && ( t[ o ] = { target: i, intro: ! 0, props: { stores: r } } ),
									t
								);
							}, {} );
							return Object.values( e )
								.map( t => ( new Be( t ), t.props.stores ) )
								.flat();
						} )( i )
					),
						Rt.trackPage( We );
				} )
			);
	}
	window.frameElement ||
		window.addEventListener( 'load', () => {
			Ve(),
				window.addEventListener(
					'resize',
					( function () {
						let t;
						return () => {
							t && clearTimeout( t ),
								( t = setTimeout( () => {
									We.forEach( t => {
										t.updateDimensions();
									} );
								}, 500 ) );
						};
					} )()
				);
		} );
} )();
