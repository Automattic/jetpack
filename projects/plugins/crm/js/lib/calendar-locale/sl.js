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
			const a = ( t[ r ] = { i: r, l: ! 1, exports: {} } );
			return e[ r ].call( a.exports, a, a.exports, n ), ( a.l = ! 0 ), a.exports;
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
			n( ( n.s = 193 ) )
		);
	} )( {
		0: function ( n, t ) {
			n.exports = e;
		},
		1: function ( e, t ) {
			e.exports = n;
		},
		193: function ( e, n, t ) {
			Object.defineProperty( n, '__esModule', { value: ! 0 } ), t( 194 );
			const r = t( 1 );
			r.datepickerLocale( 'sl', 'sl', {
				closeText: 'Zapri',
				prevText: '&#x3C;Prejšnji',
				nextText: 'Naslednji&#x3E;',
				currentText: 'Trenutni',
				monthNames: [
					'Januar',
					'Februar',
					'Marec',
					'April',
					'Maj',
					'Junij',
					'Julij',
					'Avgust',
					'September',
					'Oktober',
					'November',
					'December',
				],
				monthNamesShort: [
					'Jan',
					'Feb',
					'Mar',
					'Apr',
					'Maj',
					'Jun',
					'Jul',
					'Avg',
					'Sep',
					'Okt',
					'Nov',
					'Dec',
				],
				dayNames: [ 'Nedelja', 'Ponedeljek', 'Torek', 'Sreda', 'Četrtek', 'Petek', 'Sobota' ],
				dayNamesShort: [ 'Ned', 'Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob' ],
				dayNamesMin: [ 'Ne', 'Po', 'To', 'Sr', 'Če', 'Pe', 'So' ],
				weekHeader: 'Teden',
				dateFormat: 'dd.mm.yy',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				r.locale( 'sl', {
					buttonText: { month: 'Mesec', week: 'Teden', day: 'Dan', list: 'Dnevni red' },
					allDayText: 'Ves dan',
					eventLimitText: 'več',
					noEventsMessage: 'Ni dogodkov za prikaz',
				} );
		},
		194: function ( e, n, t ) {
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
					let a = e + ' ';
					switch ( t ) {
						case 's':
							return n || r ? 'nekaj sekund' : 'nekaj sekundami';
						case 'ss':
							return ( a +=
								1 === e
									? n
										? 'sekundo'
										: 'sekundi'
									: 2 === e
									? n || r
										? 'sekundi'
										: 'sekundah'
									: e < 5
									? n || r
										? 'sekunde'
										: 'sekundah'
									: 'sekund' );
						case 'm':
							return n ? 'ena minuta' : 'eno minuto';
						case 'mm':
							return ( a +=
								1 === e
									? n
										? 'minuta'
										: 'minuto'
									: 2 === e
									? n || r
										? 'minuti'
										: 'minutama'
									: e < 5
									? n || r
										? 'minute'
										: 'minutami'
									: n || r
									? 'minut'
									: 'minutami' );
						case 'h':
							return n ? 'ena ura' : 'eno uro';
						case 'hh':
							return ( a +=
								1 === e
									? n
										? 'ura'
										: 'uro'
									: 2 === e
									? n || r
										? 'uri'
										: 'urama'
									: e < 5
									? n || r
										? 'ure'
										: 'urami'
									: n || r
									? 'ur'
									: 'urami' );
						case 'd':
							return n || r ? 'en dan' : 'enim dnem';
						case 'dd':
							return ( a +=
								1 === e
									? n || r
										? 'dan'
										: 'dnem'
									: 2 === e
									? n || r
										? 'dni'
										: 'dnevoma'
									: n || r
									? 'dni'
									: 'dnevi' );
						case 'M':
							return n || r ? 'en mesec' : 'enim mesecem';
						case 'MM':
							return ( a +=
								1 === e
									? n || r
										? 'mesec'
										: 'mesecem'
									: 2 === e
									? n || r
										? 'meseca'
										: 'mesecema'
									: e < 5
									? n || r
										? 'mesece'
										: 'meseci'
									: n || r
									? 'mesecev'
									: 'meseci' );
						case 'y':
							return n || r ? 'eno leto' : 'enim letom';
						case 'yy':
							return ( a +=
								1 === e
									? n || r
										? 'leto'
										: 'letom'
									: 2 === e
									? n || r
										? 'leti'
										: 'letoma'
									: e < 5
									? n || r
										? 'leta'
										: 'leti'
									: n || r
									? 'let'
									: 'leti' );
					}
				}
				return e.defineLocale( 'sl', {
					months: 'januar_februar_marec_april_maj_junij_julij_avgust_september_oktober_november_december'.split(
						'_'
					),
					monthsShort: 'jan._feb._mar._apr._maj._jun._jul._avg._sep._okt._nov._dec.'.split( '_' ),
					monthsParseExact: ! 0,
					weekdays: 'nedelja_ponedeljek_torek_sreda_četrtek_petek_sobota'.split( '_' ),
					weekdaysShort: 'ned._pon._tor._sre._čet._pet._sob.'.split( '_' ),
					weekdaysMin: 'ne_po_to_sr_če_pe_so'.split( '_' ),
					weekdaysParseExact: ! 0,
					longDateFormat: {
						LT: 'H:mm',
						LTS: 'H:mm:ss',
						L: 'DD.MM.YYYY',
						LL: 'D. MMMM YYYY',
						LLL: 'D. MMMM YYYY H:mm',
						LLLL: 'dddd, D. MMMM YYYY H:mm',
					},
					calendar: {
						sameDay: '[danes ob] LT',
						nextDay: '[jutri ob] LT',
						nextWeek: function () {
							switch ( this.day() ) {
								case 0:
									return '[v] [nedeljo] [ob] LT';
								case 3:
									return '[v] [sredo] [ob] LT';
								case 6:
									return '[v] [soboto] [ob] LT';
								case 1:
								case 2:
								case 4:
								case 5:
									return '[v] dddd [ob] LT';
							}
						},
						lastDay: '[včeraj ob] LT',
						lastWeek: function () {
							switch ( this.day() ) {
								case 0:
									return '[prejšnjo] [nedeljo] [ob] LT';
								case 3:
									return '[prejšnjo] [sredo] [ob] LT';
								case 6:
									return '[prejšnjo] [soboto] [ob] LT';
								case 1:
								case 2:
								case 4:
								case 5:
									return '[prejšnji] dddd [ob] LT';
							}
						},
						sameElse: 'L',
					},
					relativeTime: {
						future: 'čez %s',
						past: 'pred %s',
						s: n,
						ss: n,
						m: n,
						mm: n,
						h: n,
						hh: n,
						d: n,
						dd: n,
						M: n,
						MM: n,
						y: n,
						yy: n,
					},
					dayOfMonthOrdinalParse: /\d{1,2}\./,
					ordinal: '%d.',
					week: { dow: 1, doy: 7 },
				} );
			} );
		},
	} );
} );
