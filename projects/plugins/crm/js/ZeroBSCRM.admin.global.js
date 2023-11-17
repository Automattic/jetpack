/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 17/06/2016
 */
jQuery( function () {
	// THIS IS FOR POTENTIALLY GLOBAL STUFF ONLY! NO SPECIFICS (E>G> INVOICING)

	// set locale for all date stuff
	zbscrm_JS_momentInit();

	// Infobox:
	zbscrm_JS_infoBoxInit();

	// any typeaheads:
	zbscrm_JS_Bind_Typeaheads();

	// all date ranges:
	zbscrm_JS_bindDateRangePicker();

	// field validation
	zbscrm_JS_bindFieldValidators();

	// close logs
	zbscrm_JS_bindCloseLogs();

	// check dirty/clean
	zbscrm_JS_watchInputsAndDirty();
	zbscrm_JS_dirtyCatch();

	// menu stuff
	zbscrm_JS_adminMenuDropdown();

	// screenopts
	zeroBSCRMJS_bindScreenOptions();

	// contact global funcs
	zeroBSCRMJS_bindGlobalObjFuncs();

	// dissmiss msgs etc.
	zeroBSCRMJS_bindGlobalDismiss();

	// licensing modal
	jpcrm_bind_licensing_modals();

	// admin dismiss notices
	jpcrm_dismiss_woo_notice();
	jpcrm_dismiss_tracking_notice();
	jpcrm_dismiss_feature_alert();

	// custom field csv builders
	jpcrm_bind_customfield_csv_builders();

	// generic window-openers via class
	jpcrm_bind_generic_window_opening();
} );

/* ==========================================================================================
    jQuery plugins
========================================================================================== */
jQuery.fn.insertIntoTextArea = function ( textToInsert ) {
	return this.each( function () {
		selectionStart = this.selectionStart;
		selectionEnd = this.selectionEnd;
		do_select = selectionStart != selectionEnd;
		old_val = this.value;
		new_val = old_val.slice( 0, selectionStart ) + textToInsert + old_val.slice( selectionEnd );
		this.value = new_val;
		if ( do_select ) {
			this.selectionStart = selectionStart;
			this.selectionEnd = selectionStart + textToInsert.length;
		}
		this.focus();
	} );
};
/* ==========================================================================================
    / jQuery plugins
========================================================================================== */

// returns a DAL or presumed DAL int
/**
 *
 */
function zbscrm_JS_DAL() {
	var DAL = 2;
	if ( typeof zbs_root.dal !== 'undefined' ) {
		var DAL = parseInt( zbs_root.dal );
	}

	return DAL;
}

/**
 *
 */
function jpcrm_dismiss_woo_notice() {
	jQuery( document ).on( 'click', '#woo-promo .notice-dismiss', function ( event ) {
		data = {
			action: 'jpcrm_hide_woo_promo',
		};
		jQuery.post( ajaxurl, data, function ( response ) {} );
	} );
}

/**
 *
 */
function jpcrm_dismiss_tracking_notice() {
	jQuery( document ).on( 'click', '#track-notice .notice-dismiss', function ( event ) {
		data = {
			action: 'jpcrm_hide_track_notice',
		};
		jQuery.post( ajaxurl, data, function ( response ) {} );
	} );
}

/**
 *
 */
function jpcrm_dismiss_feature_alert() {
	jQuery( document ).on( 'click', '.jpcrm_feature_alert .notice-dismiss', function ( event ) {
		data = {
			action: 'jpcrm_hide_feature_alert',
			feature_alert: this.parentElement.id,
		};
		jQuery.post( ajaxurl, data, function ( response ) {} );
	} );
}

// this is for any moment init stuff (pre date picker etc.)
/**
 *
 */
function zbscrm_JS_momentInit() {
	// language
	// set locale, if non standard
	// https://stackoverflow.com/questions/17493309/how-do-i-change-the-language-of-moment-js
	if (
		typeof window.zbs_root.locale_short !== 'undefined' &&
		window.zbs_root.locale_short != 'en'
	) {
		moment.locale( window.zbs_root.locale_short );
	}
	// debug console.log('locale:',window.zbs_root.locale_short);

	// timezone offset?
	// Here we get the UTS offset in minutes from zbs_root
	var offsetMins = 0;
	if ( typeof window.zbs_root.timezone_offset_mins !== 'undefined' ) {
		offsetMins = parseInt( window.zbs_root.timezone_offset_mins );
	}

	// any .zbs-datemoment-since
	jQuery( '.zbs-datemoment-since' ).each( function ( ind, ele ) {
		if ( jQuery( this ).attr( 'data-zbs-created-uts' ) ) {
			var thisUTS = parseInt( jQuery( this ).attr( 'data-zbs-created-uts' ) );
			if ( thisUTS > 0 ) {
				// Here we create a moment instance in correct timezone(offset) using original created unix timestamp in UTC
				var createdMoment = moment.unix( thisUTS ).utcOffset( offsetMins );

				// dump moment readable into html
				jQuery( this ).html( createdMoment.fromNow() );
			}
		}
	} );
}

// Mikes fancy new top drop-down-menu :)
var zbscrmjs_adminMenuBlocker = false;
/**
 *
 */
function zbscrm_JS_adminMenuDropdown() {
	// popup menu
	zbscrm_JS_initMenuPopups();

	jQuery( function () {
		// hopscotch?
		// if defined & virgin & has menu
		if (
			window.zbscrmjs_hopscotch_virgin === 1 &&
			typeof hopscotch !== 'undefined' &&
			jQuery( '.jpcrm-learn-menu-container' ).length
		) {
			// UNSET tour (unless somethign went wrong)
			//console.log('state:',hopscotch.getState());
			try {
				if ( hopscotch.getState() != null ) {
					hopscotch.endTour();
				}
			} catch ( err ) {}

			if ( typeof window.zbscrmjs_hopscotch_squash === 'undefined' ) {
				hopscotch.startTour( window.zbsTour, 0 );
			}
		}
	} );

	// if calypso...
	if ( zbscrm_JS_isCalypso() ) {
		// if calypso, we save the #wpwrap top value so we can toggle when we fullscreen
		window.zbscrm_JS_wpwraptop = jQuery( '#wpwrap' ).css( 'top' );

		// if calypso, loading on an embed page, already full screen, need to run this to re-adjust/hide:
		setTimeout( function () {
			if ( ! jQuery( '#jpcrm-top-menu .logo-cube' ).hasClass( 'menu-open' ) ) {
				zbscrm_JS_fullscreenModeOn( jQuery( '#jpcrm-top-menu .logo-cube' ) );
			}
		}, 0 );
	}

	// bind the toggle
	jQuery( '#jpcrm-top-menu .logo-cube' )
		.off( 'click' )
		.on( 'click', function ( e ) {
			if ( ! window.zbscrmjs_adminMenuBlocker ) {
				window.zbscrmjs_adminMenuBlocker = true;
console.log(this);
				if ( jQuery( this ).hasClass( 'menu-open' ) ) {
					// go fullscreen
					zbscrm_JS_fullscreenModeOn( this );
				} else {
					// close fullscreen mode
					zbscrm_JS_fullscreenModeOff( this );
				}
			}
		} );
}

// Enable 'full screen mode'
/**
 * @param wrapperElement
 */
function zbscrm_JS_fullscreenModeOn( wrapperElement ) {
	// adjust classes & hide menu bar etc.
	// any work here, take account of calypsoify results
	jQuery( 'body' ).addClass( 'zbs-fullscreen' );
	jQuery( wrapperElement ).removeClass( 'menu-open' );
	jQuery( '#wpadminbar, #adminmenuback, #adminmenuwrap, #calypso-sidebar-header' ).hide();

	// if we're in calypso, also adjust this:
	if ( zbscrm_JS_isCalypso() && typeof window.zbscrm_JS_wpwraptop !== 'undefined' ) {
		jQuery( '#wpwrap' ).css( 'top', 0 );
	}

	// redraw the overlay
	if ( typeof hopscotch !== 'undefined' ) {
		hopscotch.refreshBubblePosition();
	}

	// & save state
	var data = {
		action: 'zbs_admin_top_menu_save',
		sec: window.zbscrmjs_topMenuSecToken,
		hide: 1,
	};
	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: data,
		dataType: 'json',
		timeout: 20000,
		success: function ( response ) {
			// blocker
			window.zbscrmjs_adminMenuBlocker = false;
		},
		error: function ( response ) {
			// blocker
			window.zbscrmjs_adminMenuBlocker = false;
		},
	} );
}

// Disable 'full screen mode'
/**
 * @param wrapperElement
 */
function zbscrm_JS_fullscreenModeOff( wrapperElement ) {
	// adjust classes & show menu bar etc.
	// any work here, take account of calypsoify results
	jQuery( 'body' ).removeClass( 'zbs-fullscreen' );
	jQuery( wrapperElement ).addClass( 'menu-open' );
	jQuery( '#wpadminbar, #adminmenuback, #adminmenuwrap, #calypso-sidebar-header' ).show();

	// if we're in calypso, also adjust this:
	if ( zbscrm_JS_isCalypso() && typeof window.zbscrm_JS_wpwraptop !== 'undefined' ) {
		jQuery( '#wpwrap' ).css( 'top', window.zbscrm_JS_wpwraptop );
	}

	// redraw the overlay
	if ( typeof hopscotch !== 'undefined' ) {
		hopscotch.refreshBubblePosition();
	}

	// & save state
	var data = {
		action: 'zbs_admin_top_menu_save',
		sec: window.zbscrmjs_topMenuSecToken,
		hide: 0,
	};
	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: data,
		dataType: 'json',
		timeout: 20000,
		success: function ( response ) {
			// blocker
			window.zbscrmjs_adminMenuBlocker = false;
		},
		error: function ( response ) {
			// blocker
			window.zbscrmjs_adminMenuBlocker = false;
		},
	} );
}

// used by hopscotch to intefere, as well as on init
/**
 *
 */
function zbscrm_JS_initMenuPopups() {
	if ( typeof jQuery( '#jpcrm-user-menu-item' ).popup !== 'undefined' ) {
		jQuery( '#jpcrm-user-menu-item' ).popup( {
			popup: jQuery( '#jpcrm-user-menu' ),
			position: 'bottom center',
			hoverable: true,
			on: 'hover',
			delay: {
				show: 50,
				hide: 500,
			},
		} );
	}
}

// watches any input with class zbs-watch-input and if they're changed from post dom, it'll flag an input with thier id_dirtyflag
// lets you see in post if a field has changed :)
// NOTE this is separate from zbscrm_JS_dirtyCatch(); below
var zbscrmjsDirtyLog = {};
/**
 *
 */
function zbscrm_JS_watchInputsAndDirty() {
	jQuery( '.zbs-watch-input' ).each( function ( ind, ele ) {
		var dirtyID = jQuery( ele ).attr( 'name' ) + '_dirtyflag';

		if ( jQuery( '#' + dirtyID ).length > 0 ) {
			// log orig
			window.zbscrmjsDirtyLog[ dirtyID ] = jQuery( this ).val();
		}
	} );

	jQuery( '.zbs-watch-input' ).on( 'change', function () {
		var dirtyID = jQuery( this ).attr( 'name' ) + '_dirtyflag';

		if ( jQuery( '#' + dirtyID ).length > 0 ) {
			// compare to orig
			if ( jQuery( this ).val() != window.zbscrmjsDirtyLog[ dirtyID ] ) {
				// dirty
				jQuery( '#' + dirtyID ).val( '1' );
			} else {
				// clean
				jQuery( '#' + dirtyID ).val( '0' );
			}
		}
	} );
}

// manages whether or not things have changed on a page that might need you to prompt before leaving
// e.g. contact deets changed, but not saved
var zbscrmjsPageChanges = {};
var zbscrmjsPageData = {};
/**
 *
 */
function zbscrm_JS_dirtyCatch() {
	jQuery( '.zbs-dc' ).each( function ( ind, ele ) {
		// log orig
		window.zbscrmjsPageData[ jQuery( ele ).attr( 'name' ) ] = jQuery( this ).val();
	} );

	jQuery( '.zbs-dc' ).on( 'change', function () {
		// compare to orig
		if ( jQuery( this ).val() != window.zbscrmjsPageData[ jQuery( this ).attr( 'name' ) ] ) {
			// dirty
			//window.zbscrmjsPageChanges[jQuery(this).attr('name')] = 1;
			zbscrm_JS_addDirty( jQuery( this ).attr( 'name' ) );
		} else {
			// clean
			//delete window.zbscrmjsPageChanges[jQuery(this).attr('name')];
			zbscrm_JS_delDirty( jQuery( this ).attr( 'name' ) );
		}

		// console.log('change',window.zbscrmjsPageChanges);
	} );
}
// these are used by other js (not just above dirtyCatch)
/**
 * @param key
 */
function zbscrm_JS_addDirty( key ) {
	window.zbscrmjsPageChanges[ key ] = 1;
}
/**
 * @param key
 */
function zbscrm_JS_delDirty( key ) {
	delete window.zbscrmjsPageChanges[ key ];
}

/*
 * Bind various types of date and date time range pickers used throughout
 */
/**
 * @param options
 */
function zbscrm_JS_bindDateRangePicker( options ) {
	/*

	.jpcrm-date = date
	.jpcrm-date.jpcrm-empty-start = date + empty to start with
	.jpcrm-date.jpcrm-custom-field = date + empty to start with
	.jpcrm-date-range = date range
	.jpcrm-datetime-range = datetime range
	.jpcrm-date-time = date time
	.jpcrm-date-time-future = date time only in future

	Note: backward compatibility is added for `.jpcrm-*` variants

	Add html attribute to input to override format:
	data-date-picker-format="YYYY-MM-DD HH:mm"

	*/

	// Bind .jpcrm-date.jpcrm-empty-start, .jpcrm-date.jpcrm-custom-field
	jpcrm_js_bind_datepicker( options );

	// Bind .jpcrm-date-range = date rangepicker
	jpcrm_js_bind_daterangepicker( options );

	// bind .jpcrm-datetime-range
	jpcrm_js_bind_datetimerangepicker( options );

	// Bind .jpcrm-date-time = date time range picker
	jpcrm_js_bind_datetimepicker( options );

	// Bind .jpcrm-date-time-future = date time only in future
	jpcrm_js_bind_datetimepicker_future( options );
}

/*
 * Bind .jpcrm-date, .jpcrm-date.jpcrm-empty-start, .jpcrm-date.jpcrm-custom-field
 */
/**
 * @param options
 * @param callback
 */
function jpcrm_js_bind_datepicker( options, callback ) {
	// if daterangepicker
	if ( typeof jQuery( '.jpcrm-date' ).daterangepicker === 'function' ) {
		// default options
		var dateRangePickerOpts = {
			singleDatePicker: true,
			showDropdowns: true,
			timePicker: false,
			locale: {
				format: 'YYYY-MM-DD',
				cancelLabel: 'Clear',
			},
		};

		// where we have root options available, override:
		if ( typeof window.zbs_root.localeOptions !== 'undefined' ) {
			dateRangePickerOpts.locale = zbscrm_JS_clone( window.zbs_root.localeOptions );
		}

		// where we have passed options, merge those
		if ( options ) {
			jQuery.extend( dateRangePickerOpts, options );
		}

		// Initiate Date Picker
		jQuery( '.jpcrm-date, .zbs-date' ).each( function ( ind, ele ) {
			var elementOptions = zbscrm_JS_clone( dateRangePickerOpts );

			// and per-date-picker we can also override the format with data-daterangepicker-format attribute:
			if ( jQuery( ele ).attr( 'data-date-picker-format' ) ) {
				elementOptions.locale.format = jQuery( ele ).attr( 'data-date-picker-format' );
			}

			// .jpcrm-empty-start, and .jpcrm-custom-field need some specific options and to pass a function (legacy)
			if (
				jQuery( ele ).filter(
					'.jpcrm-empty-start, .zbs-empty-start, .jpcrm-custom-field, .zbs-custom-field'
				).length
			) {
				// based on https://github.com/dangrossman/daterangepicker/issues/815 'dangrossman commented on Sep 25, 2015'
				// further added ability to select today (from empty) https://github.com/dangrossman/daterangepicker/issues/1789#issuecomment-624578490
				elementOptions.autoUpdateInput = false;
				elementOptions.minDate = moment( [ 1900 ] );
				elementOptions.maxDate = moment().add( 50, 'years' );

				// init with function
				jQuery( ele ).daterangepicker( elementOptions, function ( chosen_date ) {
					this.element.val( chosen_date.format( elementOptions.locale.format ) );
				} );
			} else {
				// normal init
				jQuery( ele ).daterangepicker( elementOptions, callback );
			}
		} );

		// ... this catches 'empty -> clicks todays date' + make sure above callback still fires
		jQuery(
			'.jpcrm-date.jpcrm-empty-start, .jpcrm-date.jpcrm-custom-field, .zbs-date.zbs-empty-start, .zbs-date.zbs-custom-field'
		).on( 'apply.daterangepicker', function ( event, picker ) {
			if ( picker.element.val() == '' ) {
				picker.callback( picker.startDate );
			}
		} );
	}
}

/*
 * Bind .jpcrm-date-range = date rangepicker
 */
/**
 * @param options
 * @param callback
 */
function jpcrm_js_bind_daterangepicker( options, callback ) {
	// if daterangepicker
	if ( typeof jQuery( '.jpcrm-date' ).daterangepicker === 'function' ) {
		// default options
		var dateRangePickerOpts = {
			alwaysShowCalendars: true,
			opens: 'left',
			showDropdowns: true,
			timePicker: false,
			ranges: {
				Today: [ moment(), moment() ],
				Yesterday: [ moment().subtract( 1, 'days' ), moment().subtract( 1, 'days' ) ],
				'Last 7 Days': [ moment().subtract( 6, 'days' ), moment() ],
				'Last 30 Days': [ moment().subtract( 29, 'days' ), moment() ],
				'This Month': [ moment().startOf( 'month' ), moment().endOf( 'month' ) ],
				'Last Month': [
					moment().subtract( 1, 'month' ).startOf( 'month' ),
					moment().subtract( 1, 'month' ).endOf( 'month' ),
				],
			},
			locale: {
				format: 'YYYY-MM-DD',
				cancelLabel: 'Clear',
			},
		};

		// where we have root options available, override:
		if ( typeof window.zbs_root.localeOptions !== 'undefined' ) {
			dateRangePickerOpts.locale = zbscrm_JS_clone( window.zbs_root.localeOptions );
		}

		// where we have passed options, merge those
		if ( options ) {
			jQuery.extend( dateRangePickerOpts, options );
		}

		// Initiate Date Range Picker
		jQuery( '.jpcrm-date-range, .zbs-date-range' ).each( function ( ind, ele ) {
			var elementOptions = zbscrm_JS_clone( dateRangePickerOpts );

			// and per-date-picker we can also override the format with data-daterangepicker-format attribute:
			if ( jQuery( ele ).attr( 'data-date-picker-format' ) ) {
				elementOptions.locale.format = jQuery( ele ).attr( 'data-date-picker-format' );
			}

			// init
			jQuery( ele ).daterangepicker( elementOptions, callback );
		} );
	}
}

/*
 * Bind .jpcrm-datetime-range = date time range picker
 */
/**
 * @param options
 * @param callback
 */
function jpcrm_js_bind_datetimerangepicker( options, callback ) {
	// if daterangepicker
	if ( typeof jQuery( '.jpcrm-date' ).daterangepicker === 'function' ) {
		// default options
		var dateRangePickerOpts = {
			timePicker: true,
			showDropdowns: true,
			opens: 'left',
			ranges: {
				Today: [ moment(), moment() ],
				Yesterday: [ moment().subtract( 1, 'days' ), moment().subtract( 1, 'days' ) ],
				'Last 7 Days': [ moment().subtract( 6, 'days' ), moment() ],
				'Last 30 Days': [ moment().subtract( 29, 'days' ), moment() ],
				'This Month': [ moment().startOf( 'month' ), moment().endOf( 'month' ) ],
				'Last Month': [
					moment().subtract( 1, 'month' ).startOf( 'month' ),
					moment().subtract( 1, 'month' ).endOf( 'month' ),
				],
			},
			locale: {
				format: 'YYYY-MM-DD',
				cancelLabel: 'Clear',
			},
		};

		// where we have root options available, override:
		if ( typeof window.zbs_root.localeOptions !== 'undefined' ) {
			dateRangePickerOpts.locale = zbscrm_JS_clone( window.zbs_root.localeOptions );
		}

		// where we have passed options, merge those
		if ( options ) {
			jQuery.extend( dateRangePickerOpts, options );
		}

		// force time format
		if (
			dateRangePickerOpts.locale.format &&
			! dateRangePickerOpts.locale.format.includes( 'hh:mm' )
		) {
			dateRangePickerOpts.locale.format += ' hh:mm A';
		}

		// Initiate Datetime Range Picker
		jQuery( '.jpcrm-datetime-range, .zbs-datetime-range' ).each( function ( ind, ele ) {
			var elementOptions = zbscrm_JS_clone( dateRangePickerOpts );

			// and per-date-picker we can also override the format with data-daterangepicker-format attribute:
			if ( jQuery( ele ).attr( 'data-date-picker-format' ) ) {
				elementOptions.locale.format = jQuery( ele ).attr( 'data-date-picker-format' );
			}

			// init
			jQuery( ele ).daterangepicker( elementOptions, callback );
		} );
	}
}

/*
 * Bind .jpcrm-date-time = single date time picker
 */
/**
 * @param options
 * @param callback
 */
function jpcrm_js_bind_datetimepicker( options, callback ) {
	// if daterangepicker
	if ( typeof jQuery( '.jpcrm-date' ).daterangepicker === 'function' ) {
		// default options
		var dateRangePickerOpts = {
			singleDatePicker: true,
			timePicker: true,
			showDropdowns: true,
			locale: {
				format: 'YYYY-MM-DD',
				cancelLabel: 'Clear',
			},
		};

		// where we have root options available, override:
		if ( typeof window.zbs_root.localeOptions !== 'undefined' ) {
			dateRangePickerOpts.locale = zbscrm_JS_clone( window.zbs_root.localeOptions );
		}

		// where we have passed options, merge those
		if ( options ) {
			jQuery.extend( dateRangePickerOpts, options );
		}

		// force time format
		if (
			dateRangePickerOpts.locale.format &&
			! dateRangePickerOpts.locale.format.includes( 'hh:mm' )
		) {
			dateRangePickerOpts.locale.format += ' hh:mm A';
		}

		// Initiate Datetime Picker
		jQuery( '.jpcrm-date-time, .zbs-date-time' )
			.not( '.jpcrm-date-time-future' )
			.not( '.zbs-date-time-future' )
			.each( function ( ind, ele ) {
				var elementOptions = zbscrm_JS_clone( dateRangePickerOpts );

				// and per-date-picker we can also override the format with data-daterangepicker-format attribute:
				if ( jQuery( ele ).attr( 'data-date-picker-format' ) ) {
					elementOptions.locale.format = jQuery( ele ).attr( 'data-date-picker-format' );
				}

				// init
				jQuery( ele ).daterangepicker( elementOptions, callback );
			} );
	}
}

/*
 * Bind .jpcrm-date-time-future = date time only in future
 */
/**
 * @param options
 * @param callback
 */
function jpcrm_js_bind_datetimepicker_future( options, callback ) {
	// if daterangepicker
	if ( typeof jQuery( '.jpcrm-date' ).daterangepicker === 'function' ) {
		// default options
		var dateRangePickerOpts = {
			singleDatePicker: true,
			timePicker: true,
			showDropdowns: true,
			locale: {
				format: 'YYYY-MM-DD',
				cancelLabel: 'Clear',
			},
			minDate: new Date(),
		};

		// where we have root options available, override:
		if ( typeof window.zbs_root.localeOptions !== 'undefined' ) {
			dateRangePickerOpts.locale = zbscrm_JS_clone( window.zbs_root.localeOptions );
		}

		// where we have passed options, merge those
		if ( options ) {
			jQuery.extend( dateRangePickerOpts, options );
		}

		// force time format
		if (
			dateRangePickerOpts.locale.format &&
			! dateRangePickerOpts.locale.format.includes( 'hh:mm' )
		) {
			dateRangePickerOpts.locale.format += ' hh:mm A';
		}

		// Initiate Datetime Picker - future only
		jQuery( '.jpcrm-date-time-future, .zbs-date-time-future' )
			.not( '.zbs-date-time' )
			.not( '.jpcrm-date-time' )
			.each( function ( ind, ele ) {
				var elementOptions = zbscrm_JS_clone( dateRangePickerOpts );

				// and per-date-picker we can also override the format with data-daterangepicker-format attribute:
				if ( jQuery( ele ).attr( 'data-date-picker-format' ) ) {
					elementOptions.locale.format = jQuery( ele ).attr( 'data-date-picker-format' );
				}

				// init
				jQuery( ele ).daterangepicker( elementOptions, callback );
			} );
	}
}

/**
 *
 */
function zbscrm_JS_bindFieldValidators() {
	jQuery( '.numbersOnly, .jpcrm-inputmask-float' )
		.off( 'keyup' )
		.on( 'keyup', function () {
			var rep = this.value.replace( /[^-0-9\.]/g, '' );
			if ( this.value != rep ) {
				this.value = rep;
			}
		} );

	jQuery( '.intOnly, .jpcrm-inputmask-int' )
		.off( 'keyup' )
		.on( 'keyup', function () {
			var rep = this.value.replace( /[^-0-9]/g, '' );
			if ( this.value != rep ) {
				this.value = rep;
			}
		} );
}

/**
 *
 */
function zbscrm_JS_infoBoxInit() {
	jQuery( '.zbs-infobox' ).each( function ( ind, ele ) {
		// build sub html
		var infoHTML = jQuery( ele ).html();

		// inject new
		jQuery( ele ).html(
			'<i class="fa fa-info-circle zbs-help-ico"></i><div class="zbs-infobox-detail"></div>'
		);

		// post render, inject
		setTimeout( function () {
			// localise
			var lEle = ele;

			// inject orig html
			jQuery( '.zbs-infobox-detail', jQuery( lEle ) ).html( infoHTML );

			// add live class (show it)
			jQuery( lEle ).addClass( 'zbs-live' );

			// Bind
			setTimeout( function () {
				// mouse over
				jQuery( '.zbs-infobox' )
					.on( 'mouseenter', function () {
						// up opacity
						jQuery( 'i.zbs-help-ico', jQuery( this ) ).css( 'opacity', '1' );

						// show sub div (detail)
						jQuery( '.zbs-infobox-detail', jQuery( this ) ).show();
					} )
					.on( 'mouseleave', function () {
						// reduce opacity
						jQuery( 'i.zbs-help-ico', jQuery( this ) ).css( 'opacity', '0.6' );

						// hide sub div (detail)
						jQuery( '.zbs-infobox-detail', jQuery( this ) ).hide();
					} );
			}, 0 );
		}, 0 );
	} );
}

// binds typeaheads/bloodhound
/**
 *
 */
function zbscrm_JS_Bind_Typeaheads() {
	zbscrm_JS_Bind_Typeaheads_Customers();
	zbscrm_JS_Bind_Typeaheads_Companies();
	jpcrm_bind_typeaheads_placeholders();
}
/**
 *
 */
function zbscrm_JS_Bind_Typeaheads_Customers() {
	// if any?
	if ( jQuery( '.zbstypeaheadwrap .zbstypeahead' ).length > 0 ) {
		// one prefetch bloodhound for all instances
		var customers = new Bloodhound( {
			//datumTokenizer: Bloodhound.tokenizers.whitespace,
			datumTokenizer: function ( datum ) {
				return Bloodhound.tokenizers.whitespace( datum.name );
			},
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			identify: function ( obj ) {
				return obj.id;
			},
			// https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#prefetch
			//'../data/countries.json'
			prefetch: {
				// prefatch options
				url: window.zbscrmBHURLCustomers,
				ttl: 300000, // 300000 = 5 mins, 86400000 = 1 day (default) - ms
				transform: function ( response ) {
					return jQuery.map( response, function ( obj ) {
						return {
							id: obj.id,
							name: obj.name,
							created: obj.created,
							//DAL2: //email: obj.meta.email
							email: obj.email,
						};
					} );
				},
			},
			remote: {
				// this checks when users type, via ajax search ... useful addition to (cached) prefetch
				url: window.zbscrmBHURLCustomers + '&s=%QUERY',
				wildcard: '%QUERY',
				transform: function ( response ) {
					return jQuery.map( response, function ( obj ) {
						return {
							id: obj.id,
							name: obj.name,
							created: obj.created,
							//DAL2: //email: obj.meta.email
							email: obj.email,
						};
					} );
				},
			},
			//http://stackoverflow.com/questions/24560108/typeahead-v0-10-2-bloodhound-working-with-nested-json-objects
			/*filter: function (response) {
	            return jQuery.map(response, function (obj) {
	                return {
	                    name: obj.name,
	                    created: obj.created,
	                };
	            });
	        }*/
		} );

		// for each typeahead init
		jQuery( '.zbstypeaheadwrap .zbstypeahead' ).each( function () {
			//debug console.log("enabling on ",jQuery(this));

			jQuery( this ).typeahead(
				{
					hint: true,
					highlight: true,
					minLength: 1,
				},
				{
					name: 'customers',
					source: customers,
					display: function ( r ) {
						if ( r.name.trim() ) {
							return r.name;
						} else if ( r.email ) {
							return r.email;
						}
						return 'Contact #' + r.id;
					},
					limit: 10,
					templates: {
						suggestion: function ( r ) {
							var name = r.name.trim()
								? r.name
								: zeroBSCRMJS_globViewLang( 'contact' ) + ' #' + r.id;
							var email = r.email ? r.email : '<i>no email</i>';
							sug =
								'<div class="sug-wrap"><div class="name">' +
								name +
								'</div><div class="email">' +
								email +
								'</div></div><div class="clear"></div>';
							return sug;
						},
					},
				}
			);

			// BRUTALLY setup all for autocomplete to die :)
			setTimeout( function () {
				var utc = new Date().getTime();
				var k = jQuery( this ).attr( 'data-autokey' );
				if ( typeof k === 'undefined' ) {
					var k = '-typeahead';
				}
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery( '.zbstypeahead' ).attr( 'autocomplete', ns ).attr( 'name', ns );
			}, 0 );
			jQuery( this ).on( 'typeahead:open', function ( ev, suggestion ) {
				// force all typeaheads to be NOT AUTOCOMPLETE
				//jQuery('.zbstypeaheadco').attr('autocomplete','zbscontact-1518172413-addr1').attr('name','3f3g3g');
				var utc = new Date().getTime();
				var k = jQuery( this ).attr( 'data-autokey' );
				if ( typeof k === 'undefined' ) {
					var k = '-typeahead';
				}
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery( '.zbstypeahead' ).attr( 'autocomplete', ns ).attr( 'name', ns );
			} );

			// bind any callbacks
			var potentalOpenCallback = jQuery( this ).attr( 'data-zbsopencallback' );

			if ( typeof potentalOpenCallback === 'string' && potentalOpenCallback.length > 0 ) {
				jQuery( this ).on( 'typeahead:select', function ( ev, suggestion ) {
					var localisedCallback = potentalOpenCallback;
					//Debug console.log('Selection: ',suggestion);
					if ( typeof window[ localisedCallback ] === 'function' ) {
						window[ localisedCallback ]( suggestion );
					}
				} );
			}

			// this is a "change" callback which can be used as well as / instead of previous "select" callback
			// e.g. this'll fire if emptied :)
			var potentalChangeCallback = jQuery( this ).attr( 'data-zbschangecallback' );
			if ( typeof potentalChangeCallback === 'string' && potentalChangeCallback.length > 0 ) {
				jQuery( this ).on( 'typeahead:change', function ( ev, val ) {
					var localisedCallback = potentalChangeCallback;
					//Debug console.log('Selection: ',suggestion);
					if ( typeof window[ localisedCallback ] === 'function' ) {
						window[ localisedCallback ]( val );
					}
				} );
			}

			/* other events https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
				jQuery(this).on('typeahead:open', function(ev, suggestion) {
				  console.log('Open: ', ev);
				});
				jQuery('.zbstypeahead').on('typeahead:select', function(ev, suggestion) {
				  console.log('Selection: ' + suggestion);
				});
			*/
		} );
	}
}
/**
 *
 */
function zbscrm_JS_Bind_Typeaheads_Companies() {
	// Typeaheads:

	// if any?
	if ( jQuery( '.zbstypeaheadwrap .zbstypeaheadco' ).length > 0 ) {
		// one prefetch bloodhound for all instances
		var companies = new Bloodhound( {
			//datumTokenizer: Bloodhound.tokenizers.whitespace,
			datumTokenizer: function ( datum ) {
				return Bloodhound.tokenizers.whitespace( datum.name );
			},
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			identify: function ( obj ) {
				return obj.id;
			},
			// https://github.com/twitter/typeahead.js/blob/master/doc/bloodhound.md#prefetch
			//'../data/countries.json'
			prefetch: {
				// prefatch options
				url: window.zbscrmBHURLCompanies,
				ttl: 300000, // 300000 = 5 mins, 86400000 = 1 day (default) - ms
				//cache: false,
				transform: function ( response ) {
					return jQuery.map( response, function ( obj ) {
						var x = {
							id: obj.id,
							name: obj.name,
							created: obj.created,
							//won't be present from 2.95 email: obj.meta.email
							email: '',
						};
						if ( typeof obj.meta !== 'undefined' && typeof obj.meta.email !== 'undefined' ) {
							x.email = obj.meta.email;
						}

						return x;
					} );
				},
			},
			remote: {
				// this checks when users type, via ajax search ... useful addition to (cached) prefetch
				url: window.zbscrmBHURLCompanies + '&s=%QUERY',
				wildcard: '%QUERY',
				transform: function ( response ) {
					return jQuery.map( response, function ( obj ) {
						var x = {
							id: obj.id,
							name: obj.name,
							created: obj.created,
							//won't be present from 2.95 email: obj.meta.email
							email: '',
						};
						if ( typeof obj.meta !== 'undefined' && typeof obj.meta.email !== 'undefined' ) {
							x.email = obj.meta.email;
						}

						return x;
					} );
				},
			},
			//http://stackoverflow.com/questions/24560108/typeahead-v0-10-2-bloodhound-working-with-nested-json-objects
			/*filter: function (response) {
		            return jQuery.map(response, function (obj) {
		                return {
		                    name: obj.name,
		                    created: obj.created,
		                };
		            });
		        }*/
		} );

		// for each typeahead init
		jQuery( '.zbstypeaheadwrap .zbstypeaheadco' ).each( function () {
			//debug console.log("enabling on ",jQuery(this));

			jQuery( this ).typeahead(
				{
					hint: true,
					highlight: true,
					minLength: 1,
				},
				{
					name: 'companies',
					source: companies,
					display: 'name',
					limit: 10,
				}
			);

			/*

					#AUTOCOMPLETE + THIS works: https://stackoverflow.com/questions/34585783/disable-browsers-autofill-when-using-typeahead-js

				*/

			// BRUTALLY setup all for autocomplete to die :)
			setTimeout( function () {
				var utc = new Date().getTime();
				var k = jQuery( this ).attr( 'data-autokey' );
				if ( typeof k === 'undefined' ) {
					var k = '-typeahead';
				}
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery( '.zbstypeaheadco' ).attr( 'autocomplete', ns ).attr( 'name', ns );
			}, 0 );
			jQuery( this ).on( 'typeahead:open', function ( ev, suggestion ) {
				// force all typeaheads to be NOT AUTOCOMPLETE
				//jQuery('.zbstypeaheadco').attr('autocomplete','zbscontact-1518172413-addr1').attr('name','3f3g3g');
				var utc = new Date().getTime();
				var k = jQuery( this ).attr( 'data-autokey' );
				if ( typeof k === 'undefined' ) {
					var k = '-typeahead';
				}
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery( '.zbstypeaheadco' ).attr( 'autocomplete', ns ).attr( 'name', ns );
			} );

			// bind any callbacks

			// typeahead selected callback :)
			var potentalOpenCallback = jQuery( this ).attr( 'data-zbsopencallback' );

			if ( typeof potentalOpenCallback === 'string' && potentalOpenCallback.length > 0 ) {
				jQuery( this ).on( 'typeahead:select', function ( ev, suggestion ) {
					var localisedCallback = potentalOpenCallback;
					//Debug console.log('Selection: ',suggestion);
					if ( typeof window[ localisedCallback ] === 'function' ) {
						window[ localisedCallback ]( suggestion );
					}
				} );
			}

			// this is a "change" callback which can be used as well as / instead of previous "select" callback
			// e.g. this'll fire if emptied :)
			var potentalChangeCallback = jQuery( this ).attr( 'data-zbschangecallback' );
			if ( typeof potentalChangeCallback === 'string' && potentalChangeCallback.length > 0 ) {
				jQuery( this ).on( 'typeahead:change', function ( ev, val ) {
					var localisedCallback = potentalChangeCallback;
					//Debug console.log('Selection: ',suggestion);
					if ( typeof window[ localisedCallback ] === 'function' ) {
						window[ localisedCallback ]( val );
					}
				} );
			}

			/* other events https://github.com/twitter/typeahead.js/blob/master/doc/jquery_typeahead.md
					jQuery(this).on('typeahead:open', function(ev, suggestion) {
					  console.log('Open: ', ev);
					});
					jQuery('.zbstypeahead').on('typeahead:select', function(ev, suggestion) {
					  console.log('Selection: ' + suggestion);
					});
				*/
		} );
	}

	// selects (for < 50)

	// for each typeahead init
	// NOT COMPLETED. - could not get binds to reliably fire.
	// #TODOCOLIST
	/*
	jQuery('.zbs-company-select .zbs-company-select-input').each(function(){

		// typeahead selected callback :)
		var potentalOpenCallback = jQuery(this).attr('data-zbsopencallback');

		if (typeof potentalOpenCallback == "string" && potentalOpenCallback.length > 0){
			console.log('bindin select ' + potentalOpenCallback);
			jQuery(this).on('select', function(ev) {

			  var localisedCallback = potentalOpenCallback;
			  //Debug
			  console.log('Selection: ',[ev]);
			  if (typeof window[localisedCallback] == "function") window[localisedCallback](suggestion);

			});
		}

		// this is a "change" callback which can be used as well as / instead of previous "select" callback
		// e.g. this'll fire if emptied :)
		var potentalChangeCallback = jQuery(this).attr('data-zbschangecallback');
		if (typeof potentalChangeCallback == "string" && potentalChangeCallback.length > 0){
			console.log('bindin change ' + potentalOpenCallback);
			jQuery(this).on('change', function(ev) {

			  var localisedCallback = potentalChangeCallback;
			  //Debug console.log('Selection: ',suggestion);
			  console.log('Selection: ',[ev]);
			  if (typeof window[localisedCallback] == "function") window[localisedCallback](val);

			});
		}

	}); */
}

/*
 *	Binds any placeholder typeaheads (bloodhound js) on the page
 */
/**
 *
 */
function jpcrm_bind_typeaheads_placeholders() {
	// Select Bind
	jQuery( '.jpcrm-placeholder-select' )
		.off( 'change' )
		.on( 'change', function () {
			var target_id = jQuery( this ).attr( 'data-target' );
			var val = jQuery( this ).val();
			if ( val && val != -1 && jQuery( '#' + target_id ).length == 1 ) {
				// insert at cursor
				jQuery( '#' + target_id ).insertIntoTextArea( val );

				// empty select choice
				jQuery( '#jpcrm-mail-template-editor-placeholders' )[ 0 ].selectedIndex = 0;
			}
		} );

	/* This is the pre-work to provide typeahead placeholders. Not functional as at #1373.\

	var filter = function(suggestions) {
	    return $.grep(suggestions, function(suggestion) {
	        return $.inArray(suggestion.return_str, selected) === -1;
	    });
	}

	// check presence
	if (jQuery('.zbstypeaheadwrap .jpcrm-placeholder-typeahead').length > 0){

		// one prefetch bloodhound for all instances
		var placeholders_bh = new Bloodhound({
			datumTokenizer: function (datum) {
						        return Bloodhound.tokenizers.whitespace(datum.replace_str);
						    },
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			sufficient: 3,
    		identify: function(obj) {  return obj.replace_str; },
  			local: window.jpcrm_placeholder_list,
		});

		// initialize the bloodhound suggestion engine
		placeholders_bh.initialize();

		// for each typeahead init
		jQuery('.zbstypeaheadwrap .jpcrm-placeholder-typeahead').each(function(){

			jQuery(this).typeahead({
				hint: true,
				highlight: true,
				minLength: 1
			}, {
				name: 'placeholders_select',
				source: placeholders_bh,
				displayKey: 'replace_str',
    			display: function (r) {
					if (r.replace_str.trim()) return r.replace_str;
					else if (r.description) return r.description;
					return 'Placeholder';
				},
				limit: 10,
				templates: {
					suggestion: function (r) {
						console.log('sug',r);
						var placeholder_str = r.replace_str;
						var placeholder_origin = r.origin + ' - ' ? r.origin : '';
						var placeholder_description = r.description ? r.description : '';
						sug = '<div class="sug-wrap"><div class="name">' + placeholder_str + '</div><div class="placeholder-description">' + placeholder_origin + placeholder_description + '</div></div><div class="clear"></div>';

						return sug;

					},
				}
			});

			// this attempts to block browser suggestions from interfering:
			setTimeout(function(){
				var utc = new Date().getTime();
				var k = jQuery(this).attr('data-autokey'); if (typeof k == "undefined") var k = '-typeahead';
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery('.jpcrm-placeholder-typeahead').attr('autocomplete',ns).attr('name',ns);
			},0);
			jQuery(this).on('typeahead:open', function(ev, suggestion) {
				var utc = new Date().getTime();
				var k = jQuery(this).attr('data-autokey'); if (typeof k == "undefined") var k = '-typeahead';
				var ns = 'zbsco-' + utc + '-' + k;
				jQuery('.jpcrm-placeholder-typeahead').attr('autocomplete',ns).attr('name',ns);
			});

			// bind callback
			// this is a "change" callback which can be used as well as / instead of previous "select" callback
			// e.g. this'll fire if emptied :)
			if ( jQuery( this ).attr('data-target') ){
				jQuery(this).on('typeahead:select', function(ev, val) {

				  	console.log('got selected', [val,jQuery( this ).attr('data-target')]);

					// insert into textarea:
					jQuery( '#' + jQuery( this ).attr('data-target') ).append( val );

				});
			}

		});

	}

*/
}

/*
	#==================================================
	# Global UI funcs
	#==================================================
*/
/**
 * @param spinnerHTML
 */
function zbscrm_js_uiSpinnerBlocker( spinnerHTML ) {
	// def
	var anyContent = '<i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i>';
	if ( typeof spinnerHTML !== 'undefined' ) {
		anyContent = spinnerHTML;
	}

	return (
		'<div class="zbsSpinnerBlocker"><div class="zbsSpinnerBG"></div><div class="zbsSpinnerIco">' +
		anyContent +
		'</div></div>'
	);
}

/*
	#==================================================
	# / Global UI funcs
	#==================================================
*/

/*
	#==================================================
	# Global AJAX FUNCS
	#==================================================
*/

var zbscrm_custcache_invoices = {};
/**
 * @param cID
 * @param cb
 * @param errcb
 */
function zbscrm_js_getCustInvs( cID, cb, errcb ) {
	if ( typeof cID !== 'undefined' && cID > 0 ) {
		// see if in cache (rough cache)

		if ( typeof window.zbscrm_custcache_invoices[ cID ] !== 'undefined' ) {
			// call back with that!
			if ( typeof cb === 'function' ) {
				cb( window.zbscrm_custcache_invoices[ cID ] );
			}

			return window.zbscrm_custcache_invoices[ cID ];
		}

		// ... otherwise retrieve!

		// postbag!
		var data = {
			action: 'getinvs',
			sec: window.zbs_root.zbsnonce,
			cid: cID,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// set cache
				window.zbscrm_custcache_invoices[ cID ] = response;

				// callback
				if ( typeof cb === 'function' ) {
					cb( response );
				}

				return response;
			},
			error: function ( response ) {
				//console.error("RESPONSE",response);

				// callback
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}
			},
		} );
	} else if ( typeof errcb === 'function' ) {
		errcb( { fail: 1 } );
	}

	return false;
}

/*
	#==================================================
	# / Global AJAX FUNCS
	#==================================================
*/

/*
	#==================================================
	# GENERIC USEFUL FUNCS
	# Note: These may be duped in ZeroBSCRM.public.global.js or ZeroBSCRM.admin.global.js
	#==================================================
*/

// hitting js clone issues, using this from https://stackoverflow.com/questions/29050004/modifying-a-copy-of-a-javascript-object-is-causing-the-original-object-to-change
/**
 * @param obj
 */
function zbscrm_JS_clone( obj ) {
	if ( null == obj || 'object' !== typeof obj ) {
		return obj;
	}
	var copy = obj.constructor();
	for ( var attr in obj ) {
		if ( obj.hasOwnProperty( attr ) ) {
			copy[ attr ] = obj[ attr ];
		}
	}
	return copy;
}

/* mikes, taken from leadform.js 1.1.19, not accurate?
function zbscrm_JS_isEmail(email) {
  var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
  return regex.test(email);
}
*/
//http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
/**
 * @param email
 */
function zbscrm_JS_validateEmail( email ) {
	var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	return re.test( email );
}

//http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
/**
 * @param x
 */
function zbscrmjs_prettifyLongInts( x ) {
	// catch accidental null passes
	if ( x == null ) {
		return 0;
	}

	return x.toString().replace( /\B(?=(\d{3})+(?!\d))/g, ',' );
}

// w script to change "Note: Whatever X" into "note__whatever_x"
/**
 * @param str
 */
function zbscrmjs_permify( str ) {
	var str2 = zbscrmjs_replaceAll( str, ' ', '_' );
	str2 = zbscrmjs_replaceAll( str2, ':', '_' );
	return str2.toLowerCase();

	//return str.replace(' ','_').replace(':','_').toLowerCase();
}

/**
 * @param str
 * @param find
 * @param replace
 */
function zbscrmjs_replaceAll( str, find, replace ) {
	return str.replace( new RegExp( find, 'g' ), replace );
}

//http://stackoverflow.com/questions/7467840/nl2br-equivalent-in-javascript
/**
 * @param str
 * @param is_xhtml
 */
function zbscrmjs_nl2br( str, is_xhtml ) {
	var breakTag = is_xhtml || typeof is_xhtml === 'undefined' ? '<br />' : '<br>';
	return ( str + '' ).replace( /([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2' );
}

// brutal replace of <br />
/**
 * @param str
 * @param incLinebreaks
 */
function zbscrmjs_reversenl2br( str, incLinebreaks ) {
	var repWith = '';
	if ( typeof incLinebreaks !== 'undefined' ) {
		repWith = '\r\n';
	}

	//return str.replace(/<br />/g,repWith);
	return str.split( '<br />' ).join( repWith );
}

/**
 * @param str
 */
function ucwords( str ) {
	//  discuss at: http://phpjs.org/functions/ucwords/
	// original by: Jonas Raoni Soares Silva (http://www.jsfromhell.com)
	// improved by: Waldo Malqui Silva
	// improved by: Robin
	// improved by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
	// bugfixed by: Onno Marsman
	//    input by: James (http://www.james-bell.co.uk/)
	//   example 1: ucwords('kevin van  zonneveld');
	//   returns 1: 'Kevin Van  Zonneveld'
	//   example 2: ucwords('HELLO WORLD');
	//   returns 2: 'HELLO WORLD'

	return ( str + '' ).replace( /^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function ( $1 ) {
		return $1.toUpperCase();
	} );
}

// abbreviates str at the nearest space character, adding suffix if broken
/**
 * @param str
 * @param max_length
 * @param suffix
 * @param html_action
 */
function jpcrm_abbreviate_str( str, max_length, suffix, html_action ) {
	// if html_action = 'return' it'll return if HTML found
	// if html_action = 'strip' it'll strip html tags + abbrievate that str

	// if a number is passed (e.g. 0, we need to convert that to string so we can use .replace)
	if ( typeof str === 'number' ) {
		str = str.toString();
	}

	// if contains HTML
	if ( str != str.replace( /(<([^>]+)>)/gi, '' ) ) {
		switch ( html_action ) {
			case 'return':
				return str;
				break;
			case 'strip':
				str = str.replace( /(<([^>]+)>)/gi, '' );
				break;
		}
	}

	// if already shorter than maxLen return
	if ( str.length <= max_length ) {
		return str;
	}

	return str.substr( 0, str.lastIndexOf( ' ', max_length ) ) + suffix;
}

//http://stackoverflow.com/questions/154059/how-do-you-check-for-an-empty-string-in-javascript
/**
 * @param str
 */
function empty( str ) {
	return ! str || 0 === str.length;
}

// returns a fully formed click 2 call link
/**
 * @param telno
 * @param internalHTML
 * @param extraClasses
 */
function zeroBSCRMJS_telLinkFromNo( telno, internalHTML, extraClasses ) {
	return '<a href="tel:' + telno + '" class="' + extraClasses + '">' + internalHTML + '</a>';
}

// returns a click 2 call url
/**
 * @param telno
 */
function zeroBSCRMJS_telURLFromNo( telno ) {
	if ( typeof window.zbsClick2CallType !== 'undefined' ) {
		if ( window.zbsClick2CallType == 2 ) {
			return 'callto:' + telno;
		}
	}

	return 'tel:' + telno;
}

// for annoying workaround in listview 2.0
/**
 * @param obj
 */
function zeroBSCRMJS_isArray( obj ) {
	return !! obj && obj.constructor === Array;
}

// http://phpjs.org/functions/ucwords:569
/**
 * @param str
 */
function zeroBSCRMJS_ucwords( str ) {
	return ( str + '' ).replace( /^([a-z])|\s+([a-z])/g, function ( $1 ) {
		return $1.toUpperCase();
	} );
}

// remove trailing slashes
/**
 * @param str
 */
function jpcrm_strip_trailing_slashes( str ) {
	return str.replace( /\/+$/, '' );
}

// built to dupe the php ver zeroBSCRM_formatCurrency
/**
 * @param c
 */
function zeroBSCRMJS_formatCurrency( c ) {
	//why are we managing two functions. The below needs modifying for settings
	//when we can just format the number in PHP in the AJAX response and spit it out..

	//return c;

	// WH: Sometimes you need to manage things on the fly? E.g. a user types in a number and you want to show it somewhere?
	// adapted yours...
	// For now just made this hodge-podge use the locale set in wp + the zbs settings
	// ... we need to move locale to a zbs setting to be thorough here, and also add datetime settings
	var localeStr = 'en-US';
	if ( typeof window.zbs_root !== 'undefined' && typeof window.zbs_root.locale !== 'undefined' ) {
		localeStr = window.zbs_root.locale;
	}

	// got locale?
	if ( localeStr != '' ) {
		// answer low down here: https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-dollars-currency-string-in-javascript
		// https://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-dollars-currency-string-in-javascript/16233919#16233919

		// this is to get over WP en_US not en-US
		localeStr = localeStr.replace( /_/, '-' );

		// Create our number formatter.
		var formatter = new Intl.NumberFormat( localeStr, {
			style: 'currency',
			currency: window.zbs_root.currencyOptions.currencyStr,
			minimumFractionDigits: window.zbs_root.currencyOptions.noOfDecimals,
		} );

		// Debug console.log('(1) C:' + c + ' becomes ' + formatter.format(c));

		return formatter.format( c ); /* $2,500.00 */
	}
	// SHOULD NEVER RUN

	// fallback to curr + zeroBSCRMJS_number_format_i18n
	return window.zbs_root.currencyOptions.symbol + zeroBSCRMJS_number_format_i18n( c );
}

// duped from wp php
// https://core.trac.wordpress.org/browser/tags/4.8/src/wp-includes/functions.php#L215
/**
 * @param number
 * @param decimals
 */
function zeroBSCRMJS_number_format_i18n( number, decimals ) {
	if ( typeof decimals === 'undefined' ) {
		var decimals = 0;
	}

	if ( typeof window.zbswplocale !== 'undefined' ) {
		return zeroBSCRMJS_number_format(
			number,
			decimals,
			window.zbswplocale.decimal_point,
			window.zbswplocale.thousands_sep
		);
	}
	return zeroBSCRMJS_number_format( number, decimals );
}

// https://stackoverflow.com/questions/12820312/equivalent-to-php-function-number-format-in-jquery-javascript
/**
 * @param number
 * @param decimals
 * @param dec_point
 * @param thousands_sep
 */
function zeroBSCRMJS_number_format( number, decimals, dec_point, thousands_sep ) {
	// Strip all characters but numerical ones.
	number = ( number + '' ).replace( /[^0-9+\-Ee.]/g, '' );
	var n = ! isFinite( +number ) ? 0 : +number,
		prec = ! isFinite( +decimals ) ? 0 : Math.abs( decimals ),
		sep = typeof thousands_sep === 'undefined' ? ',' : thousands_sep,
		dec = typeof dec_point === 'undefined' ? '.' : dec_point,
		s = '',
		toFixedFix = function ( n, prec ) {
			var k = Math.pow( 10, prec );
			return '' + Math.round( n * k ) / k;
		};
	// Fix for IE parseFloat(0.55).toFixed(0) = 0;
	s = ( prec ? toFixedFix( n, prec ) : '' + Math.round( n ) ).split( '.' );
	if ( s[ 0 ].length > 3 ) {
		s[ 0 ] = s[ 0 ].replace( /\B(?=(?:\d{3})+(?!\d))/g, sep );
	}
	if ( ( s[ 1 ] || '' ).length < prec ) {
		s[ 1 ] = s[ 1 ] || '';
		s[ 1 ] += new Array( prec - s[ 1 ].length + 1 ).join( '0' );
	}
	return s.join( dec );
}

// https://stackoverflow.com/questions/14346414/how-do-you-do-html-encode-using-javascript
/**
 * @param value
 */
function zeroBSCRMJS_htmlEncode( value ) {
	//create a in-memory div, set it's inner text(which jQuery automatically encodes)
	//then grab the encoded contents back out.  The div never exists on the page.
	return jQuery( '<div/>' ).text( value ).html();
}

/**
 * @param value
 */
function zeroBSCRMJS_htmlDecode( value ) {
	return jQuery( '<div/>' ).html( value ).text();
}
/**
 * @param url
 * @param windowName
 * @param height
 * @param width
 */
function zeroBSCRMJS_newWindow( url, windowName, height, width ) {
	if ( typeof height === 'undefined' ) {
		var height = 600;
	}
	if ( typeof width === 'undefined' ) {
		var width = 600;
	}
	newwindow = window.open( url, windowName, 'height=' + height + ',width=' + width );
	if ( window.focus ) {
		newwindow.focus();
	}
	return false;
}
//https://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
/**
 * @param url
 * @param title
 * @param w
 * @param h
 */
function zeroBSCRMJS_newWindowCenter( url, title, w, h ) {
	// Fixes dual-screen position                         Most browsers      Firefox
	var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
	var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

	var width = window.innerWidth
		? window.innerWidth
		: document.documentElement.clientWidth
		? document.documentElement.clientWidth
		: screen.width;
	var height = window.innerHeight
		? window.innerHeight
		: document.documentElement.clientHeight
		? document.documentElement.clientHeight
		: screen.height;

	var left = width / 2 - w / 2 + dualScreenLeft;
	var top = height / 2 - h / 2 + dualScreenTop;
	var newWindow = window.open(
		url,
		title,
		'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left
	);

	// Puts focus on the newWindow
	if ( window && window.focus ) {
		newWindow.focus();
	}
}
//https://plainjs.com/javascript/utilities/merge-two-javascript-objects-19/
/**
 * @param obj
 * @param src
 */
function zeroBSCRMJS_extend( obj, src ) {
	for ( var key in src ) {
		if ( src.hasOwnProperty( key ) ) {
			obj[ key ] = src[ key ];
		}
	}
	return obj;
}

// adapted from https://stackoverflow.com/questions/1500260/detect-urls-in-text-with-javascript
/**
 * @param str
 */
function zeroBSCRMJS_retrieveURLS( str ) {
	var urlRegex = /^(https?:\/\/|www\.)\w+(\.\w+)*?(\/[^\s]*)?$/g;
	var match = urlRegex.exec( str );

	return match;
}

// raw url checker. Probably imperfect
/**
 * @param str
 */
function jpcrm_looks_like_URL( str ) {
	var res = str.match(
		/(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
	);
	return res !== null;
}

// https://stackoverflow.com/questions/14440444/extract-all-email-addresses-from-bulk-text-using-jquery
/**
 * @param str
 */
function zeroBSCRMJS_retrieveEmails( str ) {
	return str.match( /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi );
}

// https://stackoverflow.com/questions/542938/how-do-i-get-the-number-of-days-between-two-dates-in-javascript
/**
 * @param str
 */
function parseDate( str ) {
	var mdy = str.split( '/' );
	return new Date( mdy[ 2 ], mdy[ 0 ] - 1, mdy[ 1 ] );
}

/**
 * @param first
 * @param second
 */
function daydiff( first, second ) {
	return Math.round( ( second - first ) / ( 1000 * 60 * 60 * 24 ) );
}

// Select func https://stackoverflow.com/questions/4990175/array-select-in-javascript
Array.prototype.zbsselect = function ( closure ) {
	for ( var n = 0; n < this.length; n++ ) {
		if ( closure( this[ n ] ) ) {
			return this[ n ];
		}
	}

	return null;
};

// semantic html helper, returns percentage bar:
/**
 * @param perc
 * @param extraClasses
 * @param label
 */
function zbsJS_semanticPercBar( perc, extraClasses, label ) {
	if ( typeof extraClasses !== '' ) {
		extraClasses = ' ' + extraClasses;
	} else {
		var extraClasses = '';
	}

	var ret = '<div class="ui progress' + extraClasses + '"><div class="bar"';
	if ( typeof perc !== 'undefined' ) {
		ret += ' style="width:' + perc + '%"';
	}
	ret += '><div class="progress">';
	if ( typeof perc !== 'undefined' ) {
		ret += perc + '%';
	}
	ret += '</div></div>';
	if ( typeof label !== 'undefined' ) {
		ret += '<div class="label">' + label + '</div>';
	}
	ret += '</div>';

	return ret;
}

// used for uts func (not sure where this went!? (WH 28/5/18))
if ( ! Date.now ) {
	Date.now = function () {
		return new Date().getTime();
	};
}
/**
 *
 */
function zbsJS_uts() {
	return Math.floor( Date.now() / 1000 );
}

/*
 * Strips <script> tags from html
 */
/**
 * @param s
 */
function jpcrm_strip_scripts( s ) {
	var div = document.createElement( 'div' );
	div.innerHTML = s;
	var scripts = div.getElementsByTagName( 'script' );
	var i = scripts.length;
	while ( i-- ) {
		scripts[ i ].parentNode.removeChild( scripts[ i ] );
	}
	return div.innerHTML;
}

/**
 *
 */
function zeroBSCRMJS_genericLoaded() {
	jQuery( '.empty-container-with-spinner' ).hide();
	jQuery( '.zbs-generic-loaded' ).show();
}

// lazypost https://stackoverflow.com/questions/1708540/jquery-post-possible-to-do-a-full-page-post-request
/**
 * @param actionUrl
 * @param method
 * @param data
 */
function zeroBSCRMJS_genericPostData( actionUrl, method, data ) {
	var mapForm = jQuery(
		'<form id="mapform" action="' + actionUrl + '" method="' + method.toLowerCase() + '"></form>'
	);
	for ( var key in data ) {
		if ( data.hasOwnProperty( key ) ) {
			mapForm.append(
				'<input type="hidden" name="' + key + '" id="' + key + '" value="' + data[ key ] + '" />'
			);
		}
	}
	jQuery( 'body' ).append( mapForm );
	mapForm.submit();
}

// Javascript version of sleep()
/**
 * @param ms
 */
function jpcrm_sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

/* // ----------------------

	Screen Options

 // ---------------------- */

/**
 *
 */
function zeroBSCRMJS_bindScreenOptions() {
	jQuery( '.zbs-screenoptions-tablecolumns .ui.checkbox' ).on( 'click', function () {
		// save
		zeroBSCRMJS_saveScreenOptions();
	} );

	// show hide screen opts
	jQuery( '#jpcrm_page_options' )
		.off( 'click' )
		.on( 'click', function () {
			if ( jQuery( '#zbs-screen-options' ).hasClass( 'hidden' ) ) {
				// open
				jQuery( '#zbs-screen-options' ).removeClass( 'hidden' );
			} else {
				// close
				jQuery( '#zbs-screen-options' ).addClass( 'hidden' );

				// save
				zeroBSCRMJS_saveScreenOptions();
			}
		} );
}

// takes global js vars + saves against user + page via ajax
var zbscrmjs_screenoptblock = false;
/**
 * @param successcb
 * @param errcb
 */
function zbsJS_updateScreenOptions( successcb, errcb ) {
	// blocker
	window.zbscrmjs_screenoptblock = true;

	var data = {
		action: 'save_zbs_screen_options',
		sec: window.zbscrmjs_secToken,
		screenopts: window.zbsScreenOptions,
		pagekey: window.zbsPageKey,
	};

	jQuery.ajax( {
		type: 'POST',
		url: ajaxurl,
		data: data,
		dataType: 'json',
		timeout: 20000,
		success: function ( response ) {
			// blocker
			window.zbscrmjs_screenoptblock = false;

			if ( typeof successcb === 'function' ) {
				successcb( response );
			}
		},
		error: function ( response ) {
			// blocker
			window.zbscrmjs_screenoptblock = false;

			if ( typeof errcb === 'function' ) {
				errcb( response );
			}
		},
	} );
}

// This was adapted from zeroBSCRMJS_saveScreenOptionsMetaboxes in metabox manager
// generically saves any table column settings (from checkboxes -> user screen options)
// this is fired on checking a box in the screenopts div (see bindScreenOpts)
var zbsjsScreenOptsBlock = false;
/**
 * @param cb
 */
function zeroBSCRMJS_saveScreenOptions( cb ) {
	if ( ! window.zbsjsScreenOptsBlock ) {
		// blocker
		window.zbsjsScreenOptsBlock = true;

		// just check - empty defaults
		if ( typeof window.zbsScreenOptions !== 'undefined' || window.zbsScreenOptions == false ) {
			window.zbsScreenOptions = {
				mb_normal: {},
				mb_side: {},
				mb_hidden: [],
				mb_mini: [],
				pageoptions: [],
				tablecolumns: {},
			};
		}

		// update global screen options (safe to run even on non tablecolumns pages)
		zeroBSCRMJS_buildScreenOptionsTableColumns();

		// update any generics (where they have controls present on page)
		zeroBSCRMJS_buildScreenOptionsGenerics();

		// save
		zbsJS_updateScreenOptions(
			function ( r ) {
				// No debug for now console.log('Saved!',r);

				// blocker
				window.zbsjsScreenOptsBlock = false;

				// callback
				if ( typeof cb === 'function' ) {
					cb();
				}
			},
			function ( r ) {
				// No debug for now console.error('Failed to save!',r);

				// blocker
				window.zbsjsScreenOptsBlock = false;

				// callback
				if ( typeof cb === 'function' ) {
					cb();
				}
			}
		);
	}
}

// this builds tablecol screenoptions from actual screen state :)
/**
 *
 */
function zeroBSCRMJS_buildScreenOptionsTableColumns() {
	// ====== Table columns:

	var tabIdx = 1;

	var tcAreas = [ 'transactions' ];

	// for each area
	jQuery.each( tcAreas, function ( tcAreasIndx, tcArea ) {
		var obj = [];

		// 'normal' metaboxes
		jQuery( '#zbs-tablecolumns-' + tcArea + ' .zbs-tablecolumn-checkbox' ).each( function (
			ind,
			ele
		) {
			// is tabbed? (ignore, tabbed dealt with below for simplicity)
			if ( jQuery( this ).checkbox( 'is checked' ) ) {
				// add to list
				obj.push( jQuery( ele ).attr( 'data-colkey' ) );
			}
		} );

		// override whatevers here
		if ( typeof window.zbsScreenOptions.tablecolumns === 'undefined' ) {
			window.zbsScreenOptions.tablecolumns = {};
		}
		window.zbsScreenOptions.tablecolumns[ tcArea ] = obj;
	} );

	return window.zbsScreenOptions;
}
// this grabs generic screenOptions into the obj if they're set
/**
 *
 */
function zeroBSCRMJS_buildScreenOptionsGenerics() {
	// ====== perpage
	if ( jQuery( '#zbs-screenoptions-records-per-page' ).length > 0 ) {
		var perPage = parseInt( jQuery( '#zbs-screenoptions-records-per-page' ).val() );
		if ( perPage < 1 ) {
			perPage = 20;
		}

		// set it
		if ( perPage > 0 ) {
			window.zbsScreenOptions.perpage = perPage;
		}
	}

	return window.zbsScreenOptions;
}

/* // ----------------------

	/ Screen Options

 // ---------------------- */

/* // ----------------------

		AJAX REST DAL

 // ---------------------- */
var zbsAJAXRestRetrieve = false;
/**
 * @param companyID
 * @param callback
 * @param cbfail
 */
function zeroBSCRMJS_rest_retrieveCompany( companyID, callback, cbfail ) {
	// only works if window.zbscrmBHURLCompanies. + ‘&id=’ + companyID; defined

	if ( typeof companyID !== 'undefined' && typeof window.zbscrmBHURLCompanies !== 'undefined' ) {
		// block
		window.zbsAJAXRestRetrieve = true;

		// url
		var restURL = window.zbscrmBHURLCompanies + '&id=' + companyID;
		jQuery.ajax( {
			type: 'GET',
			url: restURL,
			timeout: 10000,
			success: function ( response ) {
				//console.log("response",response);

				// unblock
				window.zbsAJAXRestRetrieve = false;

				// any callback
				if ( typeof callback === 'function' ) {
					callback( response );
				}

				return true;
			},
			error: function ( response ) {
				//console.log('err',response);

				// unblock
				window.zbsAJAXRestRetrieve = false;

				// any callback
				if ( typeof cbfail === 'function' ) {
					cbfail( response );
				}

				return false;
			},
		} );
	}
}

/* // ----------------------

	/ AJAX REST DAL

 // ---------------------- */

/* ==========================================================================================
    Global Object funcs (e.g. contact cards)
========================================================================================== */
// lang helper:
// passes language from window.x (js set in listview php)
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_globViewLang( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if (
		typeof window.zbs_root.lang !== 'undefined' &&
		typeof window.zbs_root.lang[ key ] !== 'undefined'
	) {
		return window.zbs_root.lang[ key ];
	}

	return fallback;
}

/**
 *
 */
function zeroBSCRMJS_bindGlobalObjFuncs() {
	// needs to fire post page init
	setTimeout( function () {
		// debug console.log('binding global obj funcs');

		// contacts
		zeroBSCRMJS_bindGlobalContactFuncs();
	}, 500 );
}

/**
 *
 */
function zeroBSCRMJS_bindGlobalContactFuncs() {
	// debug console.log('binding global contact obj funcs');

	// send statement modal (currently only used on view + edit contact pages)
	jQuery( '#zbs-contact-action-sendstatement' )
		.off( 'click' )
		.on( 'click', function () {
			/*
		1. Opens a modal window with space for email address “to send statement to”
		(defaults to contact email address), as well as cancel + send buttons
		2. Cancel = closes modal
		3. Send = sends pdf statement along with templated email to given email address

		*/

			var emailToSendTo = '';
			var cID = '';
			if ( typeof jQuery( this ).attr( 'data-sendto' ) !== 'undefined' ) {
				emailToSendTo = jQuery( this ).attr( 'data-sendto' );
			}
			if ( typeof jQuery( this ).attr( 'data-cid' ) !== 'undefined' ) {
				cID = parseInt( jQuery( this ).attr( 'data-cid' ) );
			}

			// see ans 3 here https://stackoverflow.com/questions/31463649/sweetalert-prompt-with-two-input-fields
			swal( {
				title:
					'<i class="envelope outline icon"></i> ' + zeroBSCRMJS_globViewLang( 'sendstatement' ),
				html:
					'<div style="font-size: 1.2em;padding: 0.3em;">' +
					zeroBSCRMJS_globViewLang( 'sendstatementaddr' ) +
					'<br /><div class="ui input"><input type="text" name="zbs-send-pdf-statement-to-email" id="zbs-send-pdf-statement-to-email" value="' +
					emailToSendTo +
					'" placeholder="' +
					zeroBSCRMJS_globViewLang( 'enteremail' ) +
					'" /></div></div>',
				//text: "Are you sure you want to delete these?",
				type: '',
				showCancelButton: true,
				confirmButtonColor: '#000',
				cancelButtonColor: '#fff',
				cancelButtonText: '<span style="color: #000">' + zeroBSCRMJS_globViewLang( 'cancel' ) + '</span>',
				confirmButtonText: zeroBSCRMJS_globViewLang( 'send' ),
			} ).then( function ( result ) {
				// this check required from swal2 6.0+ https://github.com/sweetalert2/sweetalert2/issues/724
				if ( result.value ) {
					// localise
					var lCID = cID;
					var lEmailToSendTo = emailToSendTo;

					// & save state
					var data = {
						action: 'zbs_invoice_send_statement',
						sec: window.zbs_root.zbsnonce,
						cid: lCID,
						em: lEmailToSendTo,
					};
					jQuery.ajax( {
						type: 'POST',
						url: ajaxurl,
						data: data,
						dataType: 'json',
						timeout: 20000,
						success: function ( response ) {
							// blocker
							window.zbscrmjs_adminMenuBlocker = false;
							// success ? SWAL?
							swal(
								zeroBSCRMJS_globViewLang( 'sent' ),
								zeroBSCRMJS_globViewLang( 'statementsent' ),
								'success'
							);
						},
						error: function ( response ) {
							// blocker
							window.zbscrmjs_adminMenuBlocker = false;
							// fail ? SWAL?
							swal(
								zeroBSCRMJS_globViewLang( 'notsent' ),
								zeroBSCRMJS_globViewLang( 'statementnotsent' ),
								'warning'
							);
						},
					} );
				}
			} );
		} );
}

// uses zbs_root to build a view link for obj type (use globally)
/**
 * @param objTypeStr
 * @param objID
 */
function zeroBSCRMJS_obj_viewLink( objTypeStr, objID ) {
	if (
		typeof objTypeStr !== 'undefined' &&
		objTypeStr != '' &&
		typeof objID !== 'undefined' &&
		objID != ''
	) {
		if (
			typeof window.zbs_root.links !== 'undefined' &&
			typeof window.zbs_root.links.generic_view !== 'undefined'
		) {
			// replace with obj type
			return window.zbs_root.links.generic_view.replace( '_TYPE_', objTypeStr ) + objID;
		}
	} // / if not obj type + id

	return '#pagenotfound';
}

// uses zbs_root to build a edit link for obj type (use globally)
/**
 * @param objTypeStr
 * @param objID
 */
function zeroBSCRMJS_obj_editLink( objTypeStr, objID ) {
	if (
		typeof objTypeStr !== 'undefined' &&
		objTypeStr != '' &&
		typeof objID !== 'undefined' &&
		objID != ''
	) {
		if (
			typeof window.zbs_root.links !== 'undefined' &&
			typeof window.zbs_root.links.generic_edit !== 'undefined'
		) {
			// replace with obj type
			return window.zbs_root.links.generic_edit.replace( '_TYPE_', objTypeStr ) + objID;
		}
	} // / if not obj type + id

	return '#pagenotfound';
}

/* ==========================================================================================
    / Global Object funcs (e.g. contact cards)
========================================================================================== */

/* ==========================================================================================
    Global Dismiss funcs (e.g. notifications)
========================================================================================== */
/**
 *
 */
function zeroBSCRMJS_bindGlobalDismiss() {
	jQuery( '.zbs-dismiss' )
		.off( 'click' )
		.on( 'click', function ( ind, ele ) {
			// retrieve attr
			var dismissKey = jQuery( this ).attr( 'data-dismiss-key' );
			var dismissElementID = jQuery( this ).attr( 'data-dismiss-element-id' );

			if ( dismissKey !== '' ) {
				// ajax set transient - see also zbscrm_JS_bindCloseLogs()
				if ( ! window.zbscrmjs_closeLogBlocker ) {
					// blocker
					window.zbscrmjs_closeLogBlocker = true;

					// postbag!
					var data = {
						action: 'logclose',
						sec: window.zbs_root.zbsnonce,
						closing: dismissKey,
					};

					// Send
					jQuery.ajax( {
						type: 'POST',
						url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
						data: data,
						dataType: 'json',
						timeout: 20000,
						success: function ( response ) {
							// localise
							var thisEle = dismissElementID;

							// remove it!
							jQuery( '#' + thisEle ).slideUp();

							// blocker
							window.zbscrmjs_closeLogBlocker = false;
						},
						error: function ( response ) {
							// localise
							var thisEle = dismissElementID;

							// remove it!
							jQuery( '#' + thisEle ).slideUp();

							// blocker
							window.zbscrmjs_closeLogBlocker = false;
						},
					} );
				}
			}
		} );
}

/*
 * jpcrm_set_jpcrm_transient
 * Sends an AJAX POST to set a JPCRM transient within the core crm jurisdiction
 */
/**
 * @param nonce
 * @param transient_key
 * @param transient_value
 * @param transient_expiration
 * @param success_callback
 * @param error_callback
 */
function jpcrm_set_jpcrm_transient(
	nonce,
	transient_key,
	transient_value,
	transient_expiration,
	success_callback,
	error_callback
) {
	// basic check
	if ( nonce !== '' && transient_key !== '' ) {
		// one at a time
		if ( ! window.jpcrm_set_jpcrm_transient_blocker ) {
			// blocker
			window.jpcrm_set_jpcrm_transient_blocker = true;

			// Send
			jQuery.ajax( {
				type: 'POST',
				url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
				data: {
					action: 'jpcrmsettransient',
					sec: nonce,
					'transient-key': transient_key,
					'transient-value': transient_value,
					'transient-expiration': transient_expiration,
				},
				dataType: 'json',
				timeout: 20000,
				success: function ( response ) {
					// callback
					if ( typeof success_callback === 'function' ) {
						success_callback( response );
					}

					// blocker
					window.jpcrm_set_jpcrm_transient_blocker = false;

					return true;
				},
				error: function ( response ) {
					// callback
					if ( typeof error_callback === 'function' ) {
						error_callback( response );
					}

					// blocker
					window.jpcrm_set_jpcrm_transient_blocker = false;

					return false;
				},
			} );
		}
	}

	return false;
}

// this was the original func, though moved to zbs-dismiss for better nomencleture
var zbscrmjs_closeLogBlocker = false;
/**
 *
 */
function zbscrm_JS_bindCloseLogs() {
	jQuery( '.zbsCloseThisAndLog' ).on( 'click', function () {
		// retrieve key
		var thisCloseLog = jQuery( this ).attr( 'data-closelog' );

		if ( thisCloseLog !== '' && ! window.zbscrmjs_closeLogBlocker ) {
			// localise
			var closeDialog = this;

			// blocker
			window.zbscrmjs_closeLogBlocker = true;

			// postbag!
			var data = {
				action: 'logclose',
				sec: window.zbs_root.zbsnonce,
				closing: thisCloseLog,
			};

			// Send
			jQuery.ajax( {
				type: 'POST',
				url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
				data: data,
				dataType: 'json',
				timeout: 20000,
				success: function ( response ) {
					// localise
					var thisEle = closeDialog;

					// remove it!
					jQuery( thisEle ).parent().slideUp();

					// blocker
					window.zbscrmjs_closeLogBlocker = false;
				},
				error: function ( response ) {
					// localise
					var thisEle = closeDialog;

					// remove it!
					jQuery( thisEle ).parent().slideUp();

					// blocker
					window.zbscrmjs_closeLogBlocker = false;
				},
			} );
		}
	} );
}
/* ==========================================================================================
    / Global Dismiss funcs (e.g. notifications)
========================================================================================== */

/* ==========================================================================================
    Calypso related functions
========================================================================================== */
/**
 *
 */
function zbscrm_JS_isCalypso() {
	return jQuery( '#calypso-sidebar-header' ).length;
}
/* ==========================================================================================
    / Calypso related functions
========================================================================================== */

/* ==========================================================================================
    Licensing related functions
========================================================================================== */
/**
 *
 */
function jpcrm_bind_licensing_modals() {
	// close licensing modal
	jQuery( '#jpcrm-close-licensing-modal' ).on( 'click', function () {
		// set transient & close
		jpcrm_set_jpcrm_transient(
			window.jpcrm_modal_message_licensing_nonce,
			'jpcrm-license-modal',
			'nag',
			86400,
			function ( r ) {
				// successfully set
				jQuery( '#jpcrm-modal-message-licensing' ).hide();
			},
			function ( r ) {
				// failed to set (hide anyway)
				jQuery( '#jpcrm-modal-message-licensing' ).hide();
			}
		);
	} );

	// licensing modal "you have updates" -> set transient for 1h and load updates page
	jQuery( '.jpcrm-licensing-modal-set-transient-and-go' ).on( 'click', function () {
		var target_url = jQuery( this ).attr( 'data-href' );

		// set transient & close
		jpcrm_set_jpcrm_transient(
			window.jpcrm_modal_message_licensing_nonce,
			'jpcrm-license-modal',
			'nag',
			3600,
			function ( r ) {
				// successfully set
				window.location = target_url;
			},
			function ( r ) {
				// failed to set (hide anyway)
				window.location = target_url;
			}
		);
	} );
}
/* ==========================================================================================
    / Licensing related functions
========================================================================================== */

/* ==========================================================================================
    Custom field CSV builder
========================================================================================== */
/*
 * This allows the addition of custom field csv options by clicking the options
 * ...currently in the invoice builder settings page
 */
/**
 *
 */
function jpcrm_bind_customfield_csv_builders() {
	jQuery( '.jpcrm-custom-field-builder span' ).on( 'click', function ( e ) {
		// target
		var target = jQuery( e.target ).parent().attr( 'data-target' );
		var value = jQuery( e.target ).text();

		// add to csv
		var existing_value = jQuery( '#' + target ).val();
		var existing_keys = [],
			new_keys = [];

		// process existing
		existing_keys = existing_value.split( ',' );

		// append
		existing_keys.push( value );

		// remove any dupes
		jQuery.each( existing_keys, function ( i, el ) {
			var new_val = el.trim();
			if ( jQuery.inArray( el, new_keys ) === -1 && new_val != '' ) {
				new_keys.push( new_val );
			}
		} );

		// set
		jQuery( '#' + target ).val( new_keys.join( ',' ) );
	} );
}

/* ==========================================================================================
    / Custom field CSV builder
========================================================================================== */

/*
 * Bind generic new window
 */
/**
 *
 */
function jpcrm_bind_generic_window_opening() {
	jQuery( '.jpcrm-open-popup-href' ).on( 'click', function () {
		var url = jQuery( this ).attr( 'data-href' );
		var title = jQuery( this ).attr( 'data-title' );
		var width = parseInt( jQuery( this ).attr( 'data-width' ) );
		var height = parseInt( jQuery( this ).attr( 'data-height' ) );

		if ( typeof title === 'undefined' ) {
			title = '';
		}
		if ( typeof width === 'undefined' || width <= 0 ) {
			width = 600;
		}
		if ( typeof height === 'undefined' || height <= 0 ) {
			height = 600;
		}

		if ( typeof url !== 'undefined' && url !== '' ) {
			zeroBSCRMJS_newWindowCenter( url, title, width, height );
		}
	} );
}

var jpcrm = {
	// essentially the same as PHP's htmlspecialchars(), which is what WP's esc_attr() primarily uses
	// https://stackoverflow.com/a/41699140
	esc_attr( str ) {
		const map = {
			'&': '&amp;',
			'<': '&lt;',
			'>': '&gt;',
			'"': '&quot;',
			"'": '&#039;',
		};
		// ensure it's a string
		str = '' + str;
		return str.replace( /[&<>"']/g, function ( m ) {
			return map[ m ];
		} );
	},
	// identical to WP's esc_attr other than a different hook
	esc_html: function ( str ) {
		return this.esc_attr( str );
	},
};

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm, zbscrmjs_prettifyLongInts, zbscrm_JS_bindFieldValidators,  zbscrm_js_uiSpinnerBlocker, zbscrm_js_getCustInvs, zbscrm_JS_validateEmail, zbscrmjs_permify, 
		zbscrmjs_nl2br, zbscrmjs_reversenl2br, ucwords, jpcrm_abbreviate_str, empty, zeroBSCRMJS_telURLFromNo, zeroBSCRMJS_isArray, zeroBSCRMJS_ucwords,
		jpcrm_strip_trailing_slashes, zeroBSCRMJS_formatCurrency, zeroBSCRMJS_extend, zeroBSCRMJS_retrieveURLS, jpcrm_looks_like_URL,
		zeroBSCRMJS_retrieveEmails, zeroBSCRMJS_genericLoaded, zeroBSCRMJS_genericPostData, jpcrm_sleep, zbsJS_updateScreenOptions,
		zeroBSCRMJS_obj_viewLink, zeroBSCRMJS_obj_editLink, jpcrm_set_jpcrm_transient, jpcrm_js_bind_daterangepicker, zeroBSCRMJS_globViewLang, 
		jpcrm_strip_scripts, zbscrm_JS_DAL, zbscrmjs_adminMenuBlocker, zbscrmjsDirtyLog, zbscrmjsPageData, zbscrmjsPageChanges, zbscrm_custcache_invoices,
		zbsAJAXRestRetrieve, zbscrmjs_closeLogBlocker, zbsjsScreenOptsBlock, zbscrmjs_screenoptblock, zbscrm_JS_addDirty, jpcrm_dismiss_woo_notice,
		jpcrm_dismiss_tracking_notice, jpcrm_dismiss_feature_alert, zbscrm_JS_momentInit, zbscrm_JS_adminMenuDropdown, zbscrm_JS_fullscreenModeOn,
		zbscrm_JS_fullscreenModeOff, zbscrm_JS_initMenuPopups, zbscrm_JS_watchInputsAndDirty, zbscrm_JS_dirtyCatch, zbscrm_JS_delDirty, zbscrm_JS_bindDateRangePicker, jpcrm_js_bind_datepicker,
		jpcrm_js_bind_datetimerangepicker,  jpcrm_js_bind_datetimepicker, jpcrm_js_bind_datetimepicker_future, zbscrm_JS_infoBoxInit, zbscrm_JS_infoBoxInit,
		zbscrm_JS_Bind_Typeaheads, zbscrm_JS_Bind_Typeaheads_Customers, zbscrm_JS_Bind_Typeaheads_Companies, jpcrm_bind_typeaheads_placeholders, zbscrm_JS_clone,
		zbscrmjs_replaceAll, zeroBSCRMJS_telLinkFromNo, zeroBSCRMJS_number_format_i18n, zeroBSCRMJS_number_format, zeroBSCRMJS_htmlEncode,
		zeroBSCRMJS_htmlDecode, zeroBSCRMJS_newWindow, zeroBSCRMJS_newWindowCenter, parseDate, daydiff, zbsJS_semanticPercBar, zbsJS_uts, zeroBSCRMJS_bindScreenOptions,
		zeroBSCRMJS_saveScreenOptions,  zeroBSCRMJS_buildScreenOptionsTableColumns, zeroBSCRMJS_buildScreenOptionsGenerics, zeroBSCRMJS_rest_retrieveCompany, 
		zeroBSCRMJS_bindGlobalObjFuncs, zeroBSCRMJS_bindGlobalContactFuncs, zeroBSCRMJS_bindGlobalDismiss, zbscrm_JS_bindCloseLogs, zbscrm_JS_isCalypso, 
		jpcrm_bind_licensing_modals, jpcrm_bind_customfield_csv_builders, jpcrm_bind_generic_window_opening };
}
