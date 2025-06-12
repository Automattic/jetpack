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

/* global ajaxurl */

jQuery( function ( $ ) {
	$( '.mark-complete-task button' ).on( 'click', function ( e ) {
		e.preventDefault();

		$( '.mark-complete-task button' ).addClass( 'disabled' );

		const ourButton = $( this );
		let completeBlocker = true;

		if ( completeBlocker ) {
			completeBlocker = false;
			if ( $( this ).hasClass( 'black' ) ) {
				ourButton.removeClass( 'black' ).addClass( 'loading' );

				// postbag!
				const data = {
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
					success: function () {
						ourButton.removeClass( 'loading' );
						ourButton.html( '<i class="ui icon check"></i> Mark Complete' );
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						$( '#zbs-task-complete' ).val( -1 );
						completeBlocker = true;
					},
					error: function () {
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						completeBlocker = true;
					},
				} );
			} else {
				ourButton.addClass( 'black' ).addClass( 'loading' );
				// postbag!
				const data = {
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
					success: function () {
						ourButton.removeClass( 'loading' );
						ourButton.html( '<i class="ui icon check"></i> Completed' );
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						$( '#zbs-task-complete' ).val( 1 );
						completeBlocker = true;
					},
					error: function () {
						$( '.mark-complete-task button' ).removeClass( 'disabled' );
						completeBlocker = true;
					},
				} );
			}
		}
	} );
} );
