! ( function ( e, t ) {
	'object' === typeof exports && 'object' === typeof module
		? ( module.exports = t( require( 'moment' ), require( 'fullcalendar' ) ) )
		: 'function' === typeof define && define.amd
		? define( [ 'moment', 'fullcalendar' ], t )
		: 'object' === typeof exports
		? t( require( 'moment' ), require( 'fullcalendar' ) )
		: t( e.moment, e.FullCalendar );
} )( 'undefined' !== typeof self ? self : this, function ( e, t ) {
	return ( function ( e ) {
		/**
		 * @param r
		 */
		function t( r ) {
			if ( n[ r ] ) {
				return n[ r ].exports;
			}
			const o = ( n[ r ] = { i: r, l: ! 1, exports: {} } );
			return e[ r ].call( o.exports, o, o.exports, t ), ( o.l = ! 0 ), o.exports;
		}
		var n = {};
		return (
			( t.m = e ),
			( t.c = n ),
			( t.d = function ( e, n, r ) {
				t.o( e, n ) ||
					Object.defineProperty( e, n, { configurable: ! 1, enumerable: ! 0, get: r } );
			} ),
			( t.n = function ( e ) {
				const n =
					e && e.__esModule
						? function () {
								return e.default;
						  }
						: function () {
								return e;
						  };
				return t.d( n, 'a', n ), n;
			} ),
			( t.o = function ( e, t ) {
				return Object.prototype.hasOwnProperty.call( e, t );
			} ),
			( t.p = '' ),
			t( ( t.s = 155 ) )
		);
	} )( {
		0: function ( t, n ) {
			t.exports = e;
		},
		1: function ( e, n ) {
			e.exports = t;
		},
		155: function ( e, t, n ) {
			Object.defineProperty( t, '__esModule', { value: ! 0 } ), n( 156 );
			const r = n( 1 );
			r.datepickerLocale( 'ka', 'ka', {
				closeText: 'დახურვა',
				prevText: 'წინა',
				nextText: 'შემდეგი',
				currentText: 'დღეს',
				monthNames: [
					'იანვარი',
					'თებერვალი',
					'მარტი',
					'აპრილი',
					'მაისი',
					'ივნისი',
					'ივლისი',
					'აგვისტო',
					'სექტემბერი',
					'ოქტომბერი',
					'ნოემბერი',
					'დეკემბერი',
				],
				monthNamesShort: [
					'იან',
					'თებ',
					'მარ',
					'აპრ',
					'მაი',
					'ივნ',
					'ივლ',
					'აგვ',
					'სექ',
					'ოქტ',
					'ნოე',
					'დეკ',
				],
				dayNames: [
					'კვირა',
					'ორშაბათი',
					'სამშაბათი',
					'ოთხშაბათი',
					'ხუთშაბათი',
					'პარასკევი',
					'შაბათი',
				],
				dayNamesShort: [ 'კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ' ],
				dayNamesMin: [ 'კვ', 'ორ', 'სა', 'ოთ', 'ხუ', 'პა', 'შა' ],
				weekHeader: 'კვ',
				dateFormat: 'dd.mm.yy',
				firstDay: 1,
				isRTL: ! 1,
				showMonthAfterYear: ! 1,
				yearSuffix: '',
			} ),
				r.locale( 'ka', {
					buttonText: { month: 'თვე', week: 'კვირა', day: 'დღე', list: 'დღის წესრიგი' },
					allDayText: 'მთელი დღე',
					eventLimitText: function ( e ) {
						return '+ კიდევ ' + e;
					},
					noEventsMessage: 'ღონისძიებები არ არის',
				} );
		},
		156: function ( e, t, n ) {
			! ( function ( e, t ) {
				t( n( 0 ) );
			} )( 0, function ( e ) {
				return e.defineLocale( 'ka', {
					months: {
						standalone: 'იანვარი_თებერვალი_მარტი_აპრილი_მაისი_ივნისი_ივლისი_აგვისტო_სექტემბერი_ოქტომბერი_ნოემბერი_დეკემბერი'.split(
							'_'
						),
						format: 'იანვარს_თებერვალს_მარტს_აპრილის_მაისს_ივნისს_ივლისს_აგვისტს_სექტემბერს_ოქტომბერს_ნოემბერს_დეკემბერს'.split(
							'_'
						),
					},
					monthsShort: 'იან_თებ_მარ_აპრ_მაი_ივნ_ივლ_აგვ_სექ_ოქტ_ნოე_დეკ'.split( '_' ),
					weekdays: {
						standalone: 'კვირა_ორშაბათი_სამშაბათი_ოთხშაბათი_ხუთშაბათი_პარასკევი_შაბათი'.split(
							'_'
						),
						format: 'კვირას_ორშაბათს_სამშაბათს_ოთხშაბათს_ხუთშაბათს_პარასკევს_შაბათს'.split( '_' ),
						isFormat: /(წინა|შემდეგ)/,
					},
					weekdaysShort: 'კვი_ორშ_სამ_ოთხ_ხუთ_პარ_შაბ'.split( '_' ),
					weekdaysMin: 'კვ_ორ_სა_ოთ_ხუ_პა_შა'.split( '_' ),
					longDateFormat: {
						LT: 'h:mm A',
						LTS: 'h:mm:ss A',
						L: 'DD/MM/YYYY',
						LL: 'D MMMM YYYY',
						LLL: 'D MMMM YYYY h:mm A',
						LLLL: 'dddd, D MMMM YYYY h:mm A',
					},
					calendar: {
						sameDay: '[დღეს] LT[-ზე]',
						nextDay: '[ხვალ] LT[-ზე]',
						lastDay: '[გუშინ] LT[-ზე]',
						nextWeek: '[შემდეგ] dddd LT[-ზე]',
						lastWeek: '[წინა] dddd LT-ზე',
						sameElse: 'L',
					},
					relativeTime: {
						future: function ( e ) {
							return /(წამი|წუთი|საათი|წელი)/.test( e ) ? e.replace( /ი$/, 'ში' ) : e + 'ში';
						},
						past: function ( e ) {
							return /(წამი|წუთი|საათი|დღე|თვე)/.test( e )
								? e.replace( /(ი|ე)$/, 'ის წინ' )
								: /წელი/.test( e )
								? e.replace( /წელი$/, 'წლის წინ' )
								: void 0;
						},
						s: 'რამდენიმე წამი',
						ss: '%d წამი',
						m: 'წუთი',
						mm: '%d წუთი',
						h: 'საათი',
						hh: '%d საათი',
						d: 'დღე',
						dd: '%d დღე',
						M: 'თვე',
						MM: '%d თვე',
						y: 'წელი',
						yy: '%d წელი',
					},
					dayOfMonthOrdinalParse: /0|1-ლი|მე-\d{1,2}|\d{1,2}-ე/,
					ordinal: function ( e ) {
						return 0 === e
							? e
							: 1 === e
							? e + '-ლი'
							: e < 20 || ( e <= 100 && e % 20 == 0 ) || e % 100 == 0
							? 'მე-' + e
							: e + '-ე';
					},
					week: { dow: 1, doy: 7 },
				} );
			} );
		},
	} );
} );
