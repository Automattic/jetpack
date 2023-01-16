! ( function ( e, r ) {
	'object' === typeof exports && 'object' === typeof module
		? ( module.exports = r( require( 'moment' ), require( 'fullcalendar' ) ) )
		: 'function' === typeof define && define.amd
		? define( [ 'moment', 'fullcalendar' ], r )
		: 'object' === typeof exports
		? r( require( 'moment' ), require( 'fullcalendar' ) )
		: r( e.moment, e.FullCalendar );
} )( 'undefined' !== typeof self ? self : this, function ( e, r ) {
	return ( function ( e ) {
		/**
		 * @param t
		 */
		function r( t ) {
			if ( n[ t ] ) {
				return n[ t ].exports;
			}
			const a = ( n[ t ] = { i: t, l: ! 1, exports: {} } );
			return e[ t ].call( a.exports, a, a.exports, r ), ( a.l = ! 0 ), a.exports;
		}
		var n = {};
		return (
			( r.m = e ),
			( r.c = n ),
			( r.d = function ( e, n, t ) {
				r.o( e, n ) ||
					Object.defineProperty( e, n, { configurable: ! 1, enumerable: ! 0, get: t } );
			} ),
			( r.n = function ( e ) {
				const n =
					e && e.__esModule
						? function () {
								return e.default;
						  }
						: function () {
								return e;
						  };
				return r.d( n, 'a', n ), n;
			} ),
			( r.o = function ( e, r ) {
				return Object.prototype.hasOwnProperty.call( e, r );
			} ),
			( r.p = '' ),
			r( ( r.s = 135 ) )
		);
	} )( {
		0: function ( r, n ) {
			r.exports = e;
		},
		1: function ( e, n ) {
			e.exports = r;
		},
		135: function ( e, r, n ) {
			Object.defineProperty( r, '__esModule', { value: ! 0 } ), n( 136 );
			const t = n( 1 );
			t.datepickerLocale( 'fr', 'fr', {
				closeText: 'Fermer',
				prevText: 'Précédent',
				nextText: 'Suivant',
				currentText: "Aujourd'hui",
				monthNames: [
					'janvier',
					'février',
					'mars',
					'avril',
					'mai',
					'juin',
					'juillet',
					'août',
					'septembre',
					'octobre',
					'novembre',
					'décembre',
				],
				monthNamesShort: [
					'janv.',
					'févr.',
					'mars',
					'avr.',
					'mai',
					'juin',
					'juil.',
					'août',
					'sept.',
					'oct.',
					'nov.',
					'déc.',
				],
				dayNames: [ 'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi' ],
				dayNamesShort: [ 'dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.' ],
				dayNamesMin: [ 'D', 'L', 'M', 'M', 'J', 'V', 'S' ],
				weekHeader: 'Sem.',
				dateFormat: 'dd/mm/yy',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				t.locale( 'fr', {
					buttonText: {
						year: 'Année',
						month: 'Mois',
						week: 'Semaine',
						day: 'Jour',
						list: 'Mon planning',
					},
					allDayHtml: 'Toute la<br/>journée',
					eventLimitText: 'en plus',
					noEventsMessage: 'Aucun événement à afficher',
				} );
		},
		136: function ( e, r, n ) {
			! ( function ( e, r ) {
				r( n( 0 ) );
			} )( 0, function ( e ) {
				return e.defineLocale( 'fr', {
					months: 'janvier_février_mars_avril_mai_juin_juillet_août_septembre_octobre_novembre_décembre'.split(
						'_'
					),
					monthsShort: 'janv._févr._mars_avr._mai_juin_juil._août_sept._oct._nov._déc.'.split(
						'_'
					),
					monthsParseExact: ! 0,
					weekdays: 'dimanche_lundi_mardi_mercredi_jeudi_vendredi_samedi'.split( '_' ),
					weekdaysShort: 'dim._lun._mar._mer._jeu._ven._sam.'.split( '_' ),
					weekdaysMin: 'di_lu_ma_me_je_ve_sa'.split( '_' ),
					weekdaysParseExact: ! 0,
					longDateFormat: {
						LT: 'HH:mm',
						LTS: 'HH:mm:ss',
						L: 'DD/MM/YYYY',
						LL: 'D MMMM YYYY',
						LLL: 'D MMMM YYYY HH:mm',
						LLLL: 'dddd D MMMM YYYY HH:mm',
					},
					calendar: {
						sameDay: '[Aujourd’hui à] LT',
						nextDay: '[Demain à] LT',
						nextWeek: 'dddd [à] LT',
						lastDay: '[Hier à] LT',
						lastWeek: 'dddd [dernier à] LT',
						sameElse: 'L',
					},
					relativeTime: {
						future: 'dans %s',
						past: 'il y a %s',
						s: 'quelques secondes',
						ss: '%d secondes',
						m: 'une minute',
						mm: '%d minutes',
						h: 'une heure',
						hh: '%d heures',
						d: 'un jour',
						dd: '%d jours',
						M: 'un mois',
						MM: '%d mois',
						y: 'un an',
						yy: '%d ans',
					},
					dayOfMonthOrdinalParse: /\d{1,2}(er|)/,
					ordinal: function ( e, r ) {
						switch ( r ) {
							case 'D':
								return e + ( 1 === e ? 'er' : '' );
							default:
							case 'M':
							case 'Q':
							case 'DDD':
							case 'd':
								return e + ( 1 === e ? 'er' : 'e' );
							case 'w':
							case 'W':
								return e + ( 1 === e ? 're' : 'e' );
						}
					},
					week: { dow: 1, doy: 4 },
				} );
			} );
		},
	} );
} );
