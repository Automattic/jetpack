! ( function ( e, n ) {
	'object' === typeof exports && 'object' === typeof module
		? ( module.exports = n( require( 'moment' ), require( 'fullcalendar' ) ) )
		: 'function' === typeof define && define.amd
		? define( [ 'moment', 'fullcalendar' ], n )
		: 'object' === typeof exports
		? n( require( 'moment' ), require( 'fullcalendar' ) )
		: n( e.moment, e.FullCalendar );
} )( 'undefined' !== typeof self ? self : this, function ( e, n ) {
	return ( function ( e ) {
		/**
		 * @param r
		 */
		function n( r ) {
			if ( t[ r ] ) {
				return t[ r ].exports;
			}
			const o = ( t[ r ] = { i: r, l: ! 1, exports: {} } );
			return e[ r ].call( o.exports, o, o.exports, n ), ( o.l = ! 0 ), o.exports;
		}
		var t = {};
		return (
			( n.m = e ),
			( n.c = t ),
			( n.d = function ( e, t, r ) {
				n.o( e, t ) ||
					Object.defineProperty( e, t, { configurable: ! 1, enumerable: ! 0, get: r } );
			} ),
			( n.n = function ( e ) {
				const t =
					e && e.__esModule
						? function () {
								return e.default;
						  }
						: function () {
								return e;
						  };
				return n.d( t, 'a', t ), t;
			} ),
			( n.o = function ( e, n ) {
				return Object.prototype.hasOwnProperty.call( e, n );
			} ),
			( n.p = '' ),
			n( ( n.s = 161 ) )
		);
	} )( {
		0: function ( n, t ) {
			n.exports = e;
		},
		1: function ( e, t ) {
			e.exports = n;
		},
		161: function ( e, n, t ) {
			Object.defineProperty( n, '__esModule', { value: ! 0 } ), t( 162 );
			const r = t( 1 );
			r.datepickerLocale( 'lb', 'lb', {
				closeText: 'Fäerdeg',
				prevText: 'Zréck',
				nextText: 'Weider',
				currentText: 'Haut',
				monthNames: [
					'Januar',
					'Februar',
					'Mäerz',
					'Abrëll',
					'Mee',
					'Juni',
					'Juli',
					'August',
					'September',
					'Oktober',
					'November',
					'Dezember',
				],
				monthNamesShort: [
					'Jan',
					'Feb',
					'Mäe',
					'Abr',
					'Mee',
					'Jun',
					'Jul',
					'Aug',
					'Sep',
					'Okt',
					'Nov',
					'Dez',
				],
				dayNames: [
					'Sonndeg',
					'Méindeg',
					'Dënschdeg',
					'Mëttwoch',
					'Donneschdeg',
					'Freideg',
					'Samschdeg',
				],
				dayNamesShort: [ 'Son', 'Méi', 'Dën', 'Mët', 'Don', 'Fre', 'Sam' ],
				dayNamesMin: [ 'So', 'Mé', 'Dë', 'Më', 'Do', 'Fr', 'Sa' ],
				weekHeader: 'W',
				dateFormat: 'dd.mm.yy',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				r.locale( 'lb', {
					buttonText: { month: 'Mount', week: 'Woch', day: 'Dag', list: 'Terminiwwersiicht' },
					allDayText: 'Ganzen Dag',
					eventLimitText: 'méi',
					noEventsMessage: 'Nee Evenementer ze affichéieren',
				} );
		},
		162: function ( e, n, t ) {
			! ( function ( e, n ) {
				n( t( 0 ) );
			} )( 0, function ( e ) {
				/**
				 * @param e
				 * @param n
				 * @param t
				 * @param r
				 */
				function n( e, n, t, r ) {
					const o = {
						m: [ 'eng Minutt', 'enger Minutt' ],
						h: [ 'eng Stonn', 'enger Stonn' ],
						d: [ 'een Dag', 'engem Dag' ],
						M: [ 'ee Mount', 'engem Mount' ],
						y: [ 'ee Joer', 'engem Joer' ],
					};
					return n ? o[ t ][ 0 ] : o[ t ][ 1 ];
				}
				/**
				 * @param e
				 */
				function t( e ) {
					return o( e.substr( 0, e.indexOf( ' ' ) ) ) ? 'a ' + e : 'an ' + e;
				}
				/**
				 * @param e
				 */
				function r( e ) {
					return o( e.substr( 0, e.indexOf( ' ' ) ) ) ? 'viru ' + e : 'virun ' + e;
				}
				/**
				 * @param e
				 */
				function o( e ) {
					if ( ( ( e = parseInt( e, 10 ) ), isNaN( e ) ) ) {
						return ! 1;
					}
					if ( e < 0 ) {
						return ! 0;
					}
					if ( e < 10 ) {
						return 4 <= e && e <= 7;
					}
					if ( e < 100 ) {
						const n = e % 10,
							t = e / 10;
						return o( 0 === n ? t : n );
					}
					if ( e < 1e4 ) {
						for ( ; e >= 10;  ) {
							e /= 10;
						}
						return o( e );
					}
					return ( e /= 1e3 ), o( e );
				}
				return e.defineLocale( 'lb', {
					months: 'Januar_Februar_Mäerz_Abrëll_Mee_Juni_Juli_August_September_Oktober_November_Dezember'.split(
						'_'
					),
					monthsShort: 'Jan._Febr._Mrz._Abr._Mee_Jun._Jul._Aug._Sept._Okt._Nov._Dez.'.split( '_' ),
					monthsParseExact: ! 0,
					weekdays: 'Sonndeg_Méindeg_Dënschdeg_Mëttwoch_Donneschdeg_Freideg_Samschdeg'.split( '_' ),
					weekdaysShort: 'So._Mé._Dë._Më._Do._Fr._Sa.'.split( '_' ),
					weekdaysMin: 'So_Mé_Dë_Më_Do_Fr_Sa'.split( '_' ),
					weekdaysParseExact: ! 0,
					longDateFormat: {
						LT: 'H:mm [Auer]',
						LTS: 'H:mm:ss [Auer]',
						L: 'DD.MM.YYYY',
						LL: 'D. MMMM YYYY',
						LLL: 'D. MMMM YYYY H:mm [Auer]',
						LLLL: 'dddd, D. MMMM YYYY H:mm [Auer]',
					},
					calendar: {
						sameDay: '[Haut um] LT',
						sameElse: 'L',
						nextDay: '[Muer um] LT',
						nextWeek: 'dddd [um] LT',
						lastDay: '[Gëschter um] LT',
						lastWeek: function () {
							switch ( this.day() ) {
								case 2:
								case 4:
									return '[Leschten] dddd [um] LT';
								default:
									return '[Leschte] dddd [um] LT';
							}
						},
					},
					relativeTime: {
						future: t,
						past: r,
						s: 'e puer Sekonnen',
						ss: '%d Sekonnen',
						m: n,
						mm: '%d Minutten',
						h: n,
						hh: '%d Stonnen',
						d: n,
						dd: '%d Deeg',
						M: n,
						MM: '%d Méint',
						y: n,
						yy: '%d Joer',
					},
					dayOfMonthOrdinalParse: /\d{1,2}\./,
					ordinal: '%d.',
					week: { dow: 1, doy: 4 },
				} );
			} );
		},
	} );
} );
