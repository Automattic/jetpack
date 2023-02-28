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
			a( ( a.s = 205 ) )
		);
	} )( {
		0: function ( a, t ) {
			a.exports = e;
		},
		1: function ( e, t ) {
			e.exports = a;
		},
		205: function ( e, a, t ) {
			Object.defineProperty( a, '__esModule', { value: ! 0 } ), t( 206 );
			const n = t( 1 );
			n.datepickerLocale( 'tr', 'tr', {
				closeText: 'kapat',
				prevText: '&#x3C;geri',
				nextText: 'ileri&#x3e',
				currentText: 'bugün',
				monthNames: [
					'Ocak',
					'Şubat',
					'Mart',
					'Nisan',
					'Mayıs',
					'Haziran',
					'Temmuz',
					'Ağustos',
					'Eylül',
					'Ekim',
					'Kasım',
					'Aralık',
				],
				monthNamesShort: [
					'Oca',
					'Şub',
					'Mar',
					'Nis',
					'May',
					'Haz',
					'Tem',
					'Ağu',
					'Eyl',
					'Eki',
					'Kas',
					'Ara',
				],
				dayNames: [ 'Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi' ],
				dayNamesShort: [ 'Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct' ],
				dayNamesMin: [ 'Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct' ],
				weekHeader: 'Hf',
				dateFormat: 'dd.mm.yy',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				n.locale( 'tr', {
					buttonText: { next: 'ileri', month: 'Ay', week: 'Hafta', day: 'Gün', list: 'Ajanda' },
					allDayText: 'Tüm gün',
					eventLimitText: 'daha fazla',
					noEventsMessage: 'Gösterilecek etkinlik yok',
				} );
		},
		206: function ( e, a, t ) {
			! ( function ( e, a ) {
				a( t( 0 ) );
			} )( 0, function ( e ) {
				const a = {
					1: "'inci",
					5: "'inci",
					8: "'inci",
					70: "'inci",
					80: "'inci",
					2: "'nci",
					7: "'nci",
					20: "'nci",
					50: "'nci",
					3: "'üncü",
					4: "'üncü",
					100: "'üncü",
					6: "'ncı",
					9: "'uncu",
					10: "'uncu",
					30: "'uncu",
					60: "'ıncı",
					90: "'ıncı",
				};
				return e.defineLocale( 'tr', {
					months: 'Ocak_Şubat_Mart_Nisan_Mayıs_Haziran_Temmuz_Ağustos_Eylül_Ekim_Kasım_Aralık'.split(
						'_'
					),
					monthsShort: 'Oca_Şub_Mar_Nis_May_Haz_Tem_Ağu_Eyl_Eki_Kas_Ara'.split( '_' ),
					weekdays: 'Pazar_Pazartesi_Salı_Çarşamba_Perşembe_Cuma_Cumartesi'.split( '_' ),
					weekdaysShort: 'Paz_Pts_Sal_Çar_Per_Cum_Cts'.split( '_' ),
					weekdaysMin: 'Pz_Pt_Sa_Ça_Pe_Cu_Ct'.split( '_' ),
					longDateFormat: {
						LT: 'HH:mm',
						LTS: 'HH:mm:ss',
						L: 'DD.MM.YYYY',
						LL: 'D MMMM YYYY',
						LLL: 'D MMMM YYYY HH:mm',
						LLLL: 'dddd, D MMMM YYYY HH:mm',
					},
					calendar: {
						sameDay: '[bugün saat] LT',
						nextDay: '[yarın saat] LT',
						nextWeek: '[gelecek] dddd [saat] LT',
						lastDay: '[dün] LT',
						lastWeek: '[geçen] dddd [saat] LT',
						sameElse: 'L',
					},
					relativeTime: {
						future: '%s sonra',
						past: '%s önce',
						s: 'birkaç saniye',
						ss: '%d saniye',
						m: 'bir dakika',
						mm: '%d dakika',
						h: 'bir saat',
						hh: '%d saat',
						d: 'bir gün',
						dd: '%d gün',
						M: 'bir ay',
						MM: '%d ay',
						y: 'bir yıl',
						yy: '%d yıl',
					},
					ordinal: function ( e, t ) {
						switch ( t ) {
							case 'd':
							case 'D':
							case 'Do':
							case 'DD':
								return e;
							default:
								if ( 0 === e ) {
									return e + "'ıncı";
								}
								var n = e % 10,
									r = ( e % 100 ) - n,
									i = e >= 100 ? 100 : null;
								return e + ( a[ n ] || a[ r ] || a[ i ] );
						}
					},
					week: { dow: 1, doy: 7 },
				} );
			} );
		},
	} );
} );
