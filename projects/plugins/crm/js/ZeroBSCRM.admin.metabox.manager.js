/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.76+
 *
 * Copyright 2020 Automattic
 *
 * Date: 29/04/18
 */
/* global zbsJS_updateScreenOptions */
jQuery( function () {
	zerobscrmJS_bindMetaboxManager();

	// init tab groups of metaboxes
	zeroBSCRMJS_initialiseTabbedMetaboxes();
} );

/**
 * Bind Metabox Manager.
 */
function zerobscrmJS_bindMetaboxManager() {
	// minimise/show
	jQuery( '.zbs-metabox-minimise' )
		.off( 'click' )
		.on( 'click', function () {
			if ( jQuery( this ).closest( '.zbs-metabox' ).hasClass( 'zbs-minimised' ) ) {
				// open
				jQuery( this ).closest( '.zbs-metabox' ).removeClass( 'zbs-minimised' );
			} else {
				// close
				jQuery( this ).closest( '.zbs-metabox' ).addClass( 'zbs-minimised' );
			}

			// save screen options
			setTimeout( function () {
				zeroBSCRMJS_saveScreenOptionsMetaboxes();
			}, 0 );
		} );

	// show hide based on screen options panel onChange
	jQuery( '.zbs-metabox-checkbox' ).checkbox( 'setting', 'onChange', function () {
		// get id
		const id = jQuery( this ).attr( 'id' );
		const mbID = id.substr( 7 );

		if ( jQuery( '#' + id + ':checked' ).length > 0 ) {
			// checked, show
			jQuery( '#' + mbID ).removeClass( 'hide-if-js zbs-hidden' );
		} else {
			// unchecked, hide
			jQuery( '#' + mbID ).addClass( 'hide-if-js zbs-hidden' );
		}

		// save screen options
		setTimeout( function () {
			zeroBSCRMJS_saveScreenOptionsMetaboxes();
		}, 0 );
	} );

	if ( ! jQuery( '.zbs-metabox-sortables' ).hasClass( 'ui-sortable' ) ) {
		jQuery( '.zbs-metabox-sortables' ).sortable( {
			placeholder: 'zbs-metabox-landing-pad',
			handle: '.zbs-metabox-head',
			cancel: '.zbs-metabox-minimise',
			//items: ':not(.zbs-static)',
			start: function () {
				// identify
				jQuery( '#zbs-metabox-manager' ).removeClass( 'blue' ).addClass( 'teal' );

				// act
				jQuery( '.zbs-metabox-sortables' ).addClass( 'zbs-dragready' );
				// - DOWN with the shake jQuery('.zbs-metabox-sortables .zbs-metabox').addClass('zbs-shake');

				//jQuery('.zbs-metabox-sortables').sortable( "enable" );
				//jQuery( ".zbs-metabox-sortables" ).disableSelection();
			},
			stop: function () {
				// identify
				jQuery( '#zbs-metabox-manager' ).addClass( 'blue' ).removeClass( 'teal' );

				// act
				jQuery( '.zbs-metabox-sortables' ).removeClass( 'zbs-dragready' );
				// - DOWN with the shake jQuery('.zbs-metabox-sortables .zbs-metabox').removeClass('zbs-shake');
				// this resets jQuery('.zbs-metabox-sortables').sortable( 'cancel' );
				//jQuery('.zbs-metabox-sortables').sortable( "disable" );
				//jQuery( ".zbs-metabox-sortables" ).enableSelection();

				// save screen options
				setTimeout( function () {
					zeroBSCRMJS_saveScreenOptionsMetaboxes();
				}, 0 );
			},
		} );
	}
}

/**
 * Initialize tabbed Metaboxes.
 */
function zeroBSCRMJS_initialiseTabbedMetaboxes() {
	jQuery( '.zbs-metabox-tabgroup .item' ).tab();
}

// this probs needs thinking how to centralise into Global.js + more common sense for out-of-metabox places use
// NOTE: 16/8/18 wh centralised + used for tablecolumn saver in company view
window.zbsjsScreenOptsBlock = false;
/**
 * Save screen options.
 */
function zeroBSCRMJS_saveScreenOptionsMetaboxes() {
	if ( ! window.zbsjsScreenOptsBlock ) {
		// blocker
		window.zbsjsScreenOptsBlock = true;

		// update global screen options
		window.zbsScreenOptions = zeroBSCRMJS_buildScreenOptionsMetaboxes();

		// save
		zbsJS_updateScreenOptions(
			function () {
				// No debug for now console.log('Saved!',r);

				// blocker
				window.zbsjsScreenOptsBlock = false;
			},
			function () {
				// No debug for now console.error('Failed to save!',r);

				// blocker
				window.zbsjsScreenOptsBlock = false;
			}
		);
	}
}

// this builds metabox screenoptions from actual screen state :)
/**
 * Build Metabox screen options.
 *
 * @return {object} Screen options.
 */
function zeroBSCRMJS_buildScreenOptionsMetaboxes() {
	// empty defaults
	const newScreenOptions = {
		mb_normal: {},
		mb_side: {},
		mb_hidden: [],
		mb_mini: [],
		pageoptions: [],
	};

	// ====== METABOXES:

	let tabIdx = 1;

	const mbAreas = [ 'normal', 'side' ];

	// for each area
	jQuery.each( mbAreas, function ( mbAreaIndx, mbArea ) {
		//console.log('adding ' + mbArea + ' mb');
		const obj = {};

		// 'normal' metaboxes
		jQuery( '#zbs-' + mbArea + '-sortables .zbs-metabox' ).each( function ( ind, ele ) {
			// is tabbed? (ignore, tabbed dealt with below for simplicity)
			if ( ! jQuery( this ).hasClass( 'tab' ) ) {
				// add to list
				//var obj = {}; obj[jQuery(ele).attr('id')] = 'self';
				//newScreenOptions['mb_' + mbArea].push(obj);
				// nor this,... newScreenOptions['mb_' + mbArea][jQuery(ele).attr('id')] = 'self';
				// have to do this:
				obj[ jQuery( ele ).attr( 'id' ) ] = 'self';
			}
		} );

		// 'normal' - tabbed metaboxes
		jQuery( '#zbs-' + mbArea + '-sortables .zbs-metabox-tabgroup' ).each( function ( ind, ele ) {
			// get tabgroup id
			let tabgroupID = jQuery( ele ).attr( 'data-tabid' );
			if ( typeof tabgroupID === 'undefined' || tabgroupID === '' ) {
				tabgroupID = 'tabs_' + tabIdx;
			}

			// build
			const tabList = [];
			jQuery( '.item', jQuery( ele ) ).each( function ( subInd, subEle ) {
				// add to list (their data-tab which will be the metabox id :))
				tabList.push( jQuery( subEle ).attr( 'data-tab' ) );
			} );

			// add to pile
			//var obj = {}; obj[tabgroupID] = tabList.join(',');
			//newScreenOptions['mb_' + mbArea].push(obj);
			// nor this... newScreenOptions['mb_' + mbArea][tabgroupID] = tabList.join(',');
			// have to do this:
			obj[ tabgroupID ] = tabList.join( ',' );

			tabIdx++;
		} );

		newScreenOptions[ 'mb_' + mbArea ] = obj;
		//console.log(obj);
	} );

	// hidden metaboxes
	jQuery( '.zbs-metabox.zbs-hidden' ).each( function ( ind, ele ) {
		// if has class 'zbs-hidden' add to list
		newScreenOptions.mb_hidden.push( jQuery( ele ).attr( 'id' ) );
	} );

	// minimised metaboxes
	jQuery( '.zbs-metabox.zbs-minimised' ).each( function ( ind, ele ) {
		// if has class 'zbs-minimised' add to list
		newScreenOptions.mb_mini.push( jQuery( ele ).attr( 'id' ) );
	} );

	// no ther page options for now
	newScreenOptions.pageoptions = [];

	//console.log('built:',newScreenOptions);

	return newScreenOptions;
}

// temp example func
/**
 * Save Metaboxes.
 */
function saveMetaBoxes() {
	const newScreenOptions = {}; //window.zbsScreenOptions;

	// get metabox order

	// TABS!

	// normal section

	/* This adds them independently (test)

      if (typeof newScreenOptions.mb_normal == "undefined") newScreenOptions.mb_normal = [];
      jQuery('#zbs-normal-sortables .zbs-metabox').each(function(ind,ele){

        // add to list
        var obj = {}; obj[jQuery(ele).attr('id')] = 'self';
        newScreenOptions.mb_normal.push(obj)

      });

      */
	/* This tabs them up */
	if ( typeof newScreenOptions.mb_normal === 'undefined' ) {
		newScreenOptions.mb_normal = [];
	}
	const tabbedList = [];
	jQuery( '#zbs-normal-sortables .zbs-metabox' ).each( function ( ind, ele ) {
		// add to list
		tabbedList.push( jQuery( ele ).attr( 'id' ) );
	} );
	const obj = {};
	obj.tabs_1 = tabbedList.join( ',' );
	newScreenOptions.mb_normal.push( obj );

	// side section
	if ( typeof newScreenOptions.mb_side === 'undefined' ) {
		newScreenOptions.mb_side = [];
	}
	jQuery( '#zbs-side-sortables .zbs-metabox' ).each( function ( ind, ele ) {
		// add to list
		const newobj = {};
		newobj[ jQuery( ele ).attr( 'id' ) ] = 'self';
		newScreenOptions.mb_side.push( newobj );
	} );

	// hidden metaboxes
	if ( typeof newScreenOptions.mb_hidden === 'undefined' ) {
		newScreenOptions.mb_hidden = [];
	}
	jQuery( '.zbs-metabox' ).each( function ( ind, ele ) {
		// if has class 'zbs-hidden' add to list
		if ( jQuery( ele ).hasClass( 'zbs-hidden' ) ) {
			newScreenOptions.mb_hidden.push( jQuery( ele ).attr( 'id' ) );
		}
	} );

	// minimised metaboxes
	if ( typeof newScreenOptions.mb_mini === 'undefined' ) {
		newScreenOptions.mb_mini = [];
	}
	jQuery( '.zbs-metabox' ).each( function ( ind, ele ) {
		// if has class 'zbs-minimised' add to list
		if ( jQuery( ele ).hasClass( 'zbs-minimised' ) ) {
			newScreenOptions.mb_mini.push( jQuery( ele ).attr( 'id' ) );
		}
	} );

	// no ther page options for now
	newScreenOptions.pageoptions = [];

	// update global screen options
	window.zbsScreenOptions = newScreenOptions;

	// save
	zbsJS_updateScreenOptions(
		function () {},
		function () {}
	);
}

if ( typeof module !== 'undefined' ) {
	module.exports = {
		zerobscrmJS_bindMetaboxManager,
		zeroBSCRMJS_initialiseTabbedMetaboxes,
		zeroBSCRMJS_saveScreenOptionsMetaboxes,
		zeroBSCRMJS_buildScreenOptionsMetaboxes,
		saveMetaBoxes,
	};
}
