/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.4
 *
 * Copyright 2020 Automattic
 * New Task UI JS for the Calendar functionality
 *
 * Date: 15th August 2018
 */

jQuery( function ( $ ) {

	$( '.mark-complete-task button' ).on( 'click', function ( e ) {
		e.preventDefault();

		$( '.mark-complete-task button' ).addClass( 'disabled' );

		var ourButton = $( this );
		var completeBlocker = true;

		if ( completeBlocker ) {
			completeBlocker = false;
			if ( $( this ).hasClass( 'green' ) ) {
				ourButton.removeClass( 'green' ).addClass( 'loading' );

				// postbag!
				var data = {
					action: 'mark_task_complete',
					taskID: $( this ).data( 'taskid' ),
					way: 'incomplete',
					sec: window.zbs_root.zbsnonce,
				};

				// Send it Pat :D
				jQuery.ajax( {
					type: 'POST',
					url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
					data: data,
					dataType: 'json',
					timeout: 20000,
					success: function ( response ) {
						ourButton.removeClass( 'loading' );
						ourButton.html( '<i class="ui icon check"></i> Mark Complete' );
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						$( '#zbs-task-complete' ).val( -1 );
						completeBlocker = true;
					},
					error: function ( response ) {
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						completeBlocker = true;
					},
				} );
			} else {
				ourButton.addClass( 'green' ).addClass( 'loading' );
				// postbag!
				var data = {
					action: 'mark_task_complete',
					taskID: $( this ).data( 'taskid' ),
					way: 'complete',
					sec: window.zbs_root.zbsnonce,
				};

				// Send it Pat :D
				jQuery.ajax( {
					type: 'POST',
					url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
					data: data,
					dataType: 'json',
					timeout: 20000,
					success: function ( response ) {
						ourButton.removeClass( 'loading' );
						ourButton.html( '<i class="ui icon check"></i> Completed' );
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						$( '#zbs-task-complete' ).val( 1 );
						completeBlocker = true;
					},
					error: function ( response ) {
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						completeBlocker = true;
					},
				} );
			}
		}
	} );

	jQuery( function () {
		// temp pre v3.0 fix, forcing english en for this datepicker only.
		// requires php mod: search #forcedlocaletasks
		// (Month names are localised, causing a mismatch here (Italian etc.))
		moment.locale( 'en' );

		jQuery( 'input[name="daterange"]' ).daterangepicker( {
			timePicker: true,
			timePickerIncrement: 15,
			timePicker24Hour: true,
			locale: {
				format: 'DD MMMM YYYY h:mm A',
				firstDay:
					window.zbs_root.localeOptions && window.zbs_root.localeOptions.firstDay
						? window.zbs_root.localeOptions.firstDay
						: 0,
			},
		} );
	} );

	jQuery( '#daterange' ).on( 'apply.daterangepicker', function ( ev, picker ) {
		jQuery( '#zbs_from' ).val( picker.startDate.format( 'YYYY-MM-DD HH:mm:ss' ) );
		jQuery( '#zbs_to' ).val( picker.endDate.format( 'YYYY-MM-DD HH:mm:ss' ) );
	} );
} );
