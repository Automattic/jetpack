! ( function ( e, a ) {
	'object' === typeof exports && 'object' === typeof module
		? ( module.exports = a( require( 'moment' ), require( 'fullcalendar' ) ) )
		: 'function' === typeof define && define.amd
		? define( [ 'moment', 'fullcalendar' ], a )
		: 'object' === typeof exports
		? a( require( 'moment' ), require( 'fullcalendar' ) )
		: a( e.moment, e.FullCalendar );
} )( 'undefined' !== typeof self ? self : this, function ( e, a ) {
	return ( function ( e ) {
		/**
		 * @param n
		 */
		function a( n ) {
			if ( t[ n ] ) {
				return t[ n ].exports;
			}
			const r = ( t[ n ] = { i: n, l: ! 1, exports: {} } );
			return e[ n ].call( r.exports, r, r.exports, a ), ( r.l = ! 0 ), r.exports;
		}
		var t = {};
		return (
			( a.m = e ),
			( a.c = t ),
			( a.d = function ( e, t, n ) {
				a.o( e, t ) ||
					Object.defineProperty( e, t, { configurable: ! 1, enumerable: ! 0, get: n } );
			} ),
			( a.n = function ( e ) {
				const t =
					e && e.__esModule
						? function () {
								return e.default;
						  }
						: function () {
								return e;
						  };
				return a.d( t, 'a', t ), t;
			} ),
			( a.o = function ( e, a ) {
				return Object.prototype.hasOwnProperty.call( e, a );
			} ),
			( a.p = '' ),
			a( ( a.s = 143 ) )
		);
	} )( {
		0: function ( a, t ) {
			a.exports = e;
		},
		1: function ( e, t ) {
			e.exports = a;
		},
		143: function ( e, a, t ) {
			Object.defineProperty( a, '__esModule', { value: ! 0 } ), t( 144 );
			const n = t( 1 );
			n.datepickerLocale( 'hr', 'hr', {
				closeText: 'Zatvori',
				prevText: '&#x3C;',
				nextText: '&#x3E;',
				currentText: 'Danas',
				monthNames: [
					'Siječanj',
					'Veljača',
					'Ožujak',
					'Travanj',
					'Svibanj',
					'Lipanj',
					'Srpanj',
					'Kolovoz',
					'Rujan',
					'Listopad',
					'Studeni',
					'Prosinac',
				],
				monthNamesShort: [
					'Sij',
					'Velj',
					'Ožu',
					'Tra',
					'Svi',
					'Lip',
					'Srp',
					'Kol',
					'Ruj',
					'Lis',
					'Stu',
					'Pro',
				],
				dayNames: [ 'Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota' ],
				dayNamesShort: [ 'Ned', 'Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub' ],
				dayNamesMin: [ 'Ne', 'Po', 'Ut', 'Sr', 'Če', 'Pe', 'Su' ],
				weekHeader: 'Tje',
				dateFormat: 'dd.mm.yy.',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				n.locale( 'hr', {
					buttonText: {
						prev: 'Prijašnji',
						next: 'Sljedeći',
						month: 'Mjesec',
						week: 'Tjedan',
						day: 'Dan',
						list: 'Raspored',
					},
					allDayText: 'Cijeli dan',
					eventLimitText: function ( e ) {
						return '+ još ' + e;
					},
					noEventsMessage: 'Nema događaja za prikaz',
				} );
		},
		144: function ( e, a, t ) {
			! ( function ( e, a ) {
				a( t( 0 ) );
			} )( 0, function ( e ) {
				/**
				 * @param e
				 * @param a
				 * @param t
				 */
				function a( e, a, t ) {
					let n = e + ' ';
					switch ( t ) {
						case 'ss':
							return ( n +=
								1 === e ? 'sekunda' : 2 === e || 3 === e || 4 === e ? 'sekunde' : 'sekundi' );
						case 'm':
							return a ? 'jedna minuta' : 'jedne minute';
						case 'mm':
							return ( n +=
								1 === e ? 'minuta' : 2 === e || 3 === e || 4 === e ? 'minute' : 'minuta' );
						case 'h':
							return a ? 'jedan sat' : 'jednog sata';
						case 'hh':
							return ( n += 1 === e ? 'sat' : 2 === e || 3 === e || 4 === e ? 'sata' : 'sati' );
						case 'dd':
							return ( n += 1 === e ? 'dan' : 'dana' );
						case 'MM':
							return ( n +=
								1 === e ? 'mjesec' : 2 === e || 3 === e || 4 === e ? 'mjeseca' : 'mjeseci' );
						case 'yy':
							return ( n +=
								1 === e ? 'godina' : 2 === e || 3 === e || 4 === e ? 'godine' : 'godina' );
					}
				}
				return e.defineLocale( 'hr', {
					months: {
						format: 'siječnja_veljače_ožujka_travnja_svibnja_lipnja_srpnja_kolovoza_rujna_listopada_studenoga_prosinca'.split(
							'_'
						),
						standalone: 'siječanj_veljača_ožujak_travanj_svibanj_lipanj_srpanj_kolovoz_rujan_listopad_studeni_prosinac'.split(
							'_'
						),
					},
					monthsShort: 'sij._velj._ožu._tra._svi._lip._srp._kol._ruj._lis._stu._pro.'.split( '_' ),
					monthsParseExact: ! 0,
					weekdays: 'nedjelja_ponedjeljak_utorak_srijeda_četvrtak_petak_subota'.split( '_' ),
					weekdaysShort: 'ned._pon._uto._sri._čet._pet._sub.'.split( '_' ),
					weekdaysMin: 'ne_po_ut_sr_če_pe_su'.split( '_' ),
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
						sameDay: '[danas u] LT',
						nextDay: '[sutra u] LT',
						nextWeek: function () {
							switch ( this.day() ) {
								case 0:
									return '[u] [nedjelju] [u] LT';
								case 3:
									return '[u] [srijedu] [u] LT';
								case 6:
									return '[u] [subotu] [u] LT';
								case 1:
								case 2:
								case 4:
								case 5:
									return '[u] dddd [u] LT';
							}
						},
						lastDay: '[jučer u] LT',
						lastWeek: function () {
							switch ( this.day() ) {
								case 0:
								case 3:
									return '[prošlu] dddd [u] LT';
								case 6:
									return '[prošle] [subote] [u] LT';
								case 1:
								case 2:
								case 4:
								case 5:
									return '[prošli] dddd [u] LT';
							}
						},
						sameElse: 'L',
					},
					relativeTime: {
						future: 'za %s',
						past: 'prije %s',
						s: 'par sekundi',
						ss: a,
						m: a,
						mm: a,
						h: a,
						hh: a,
						d: 'dan',
						dd: a,
						M: 'mjesec',
						MM: a,
						y: 'godinu',
						yy: a,
					},
					dayOfMonthOrdinalParse: /\d{1,2}\./,
					ordinal: '%d.',
					week: { dow: 1, doy: 7 },
				} );
			} );
		},
	} );
} );
