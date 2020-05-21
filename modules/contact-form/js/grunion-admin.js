/* global ajaxurl */
jQuery( function( $ ) {
	$( document ).on( 'click', '#jetpack-check-feedback-spam:not(.button-disabled)', function( e ) {
		e.preventDefault();

		$( '#jetpack-check-feedback-spam:not(.button-disabled)' ).addClass( 'button-disabled' );
		$( '.jetpack-check-feedback-spam-spinner' )
			.addClass( 'spinner' )
			.show();
		grunion_check_for_spam( 0, 100 );
	} );

	function grunion_check_for_spam( offset, limit ) {
		$.post(
			ajaxurl,
			{
				action: 'grunion_recheck_queue',
				offset: offset,
				limit: limit,
			},
			function( result ) {
				if ( result.processed < limit ) {
					window.location.reload();
				} else {
					grunion_check_for_spam( offset + limit, limit );
				}
			}
		);
	}

	var initial_spam_count = 0;
	var deleted_spam_count = 0;

	$( document ).on( 'click', '.jetpack-empty-spam', function( e ) {
		e.preventDefault();

		if ( $( this ).hasClass( 'button-disabled' ) ) {
			// An Emptying process is already underway or the button is otherwise disabled.
			return;
		}

		$( '.jetpack-empty-spam' )
			.addClass( 'button-disabled' )
			.addClass( 'emptying' );
		$( '.jetpack-empty-spam-spinner' )
			.addClass( 'spinner' )
			.addClass( 'is-active' );

		// Update the label on the "Empty Spam" button to use the active "Emptying Spam" language.
		$( '.jetpack-empty-spam' ).text(
			$( '.jetpack-empty-spam' )
				.data( 'progress-label' )
				.replace( '%1$s', '0' )
		);

		initial_spam_count = parseInt( $( this ).data( 'spam-feedbacks-count' ), 10 );

		grunion_delete_spam();
	} );

	function grunion_delete_spam() {
		var empty_spam_buttons = $( '.jetpack-empty-spam' );

		var nonce = empty_spam_buttons.data( 'nonce' );

		// We show the percentage complete down to one decimal point so even with 100k
		// spam feedbacks, it will show some progress pretty quickly.
		var percentage_complete = Math.round( ( deleted_spam_count / initial_spam_count ) * 1000 ) / 10;

		// Update the progress counter on the "Check for Spam" button.
		empty_spam_buttons.text(
			empty_spam_buttons.data( 'progress-label' ).replace( '%1$s', percentage_complete )
		);

		$.post( ajaxurl, {
			action: 'jetpack_delete_spam_feedbacks',
			nonce: nonce,
		} )
			.fail( function( result ) {
				// An error is only returned in the case of a missing nonce or invalid permissions, so we don't need the actual error message.
				window.location.href = empty_spam_buttons.data( 'failure-url' );
				return;
			} )
			.done( function( result ) {
				deleted_spam_count += result.data.counts.deleted;

				if ( result.data.counts.deleted < result.data.counts.limit ) {
					window.location.href = empty_spam_buttons.data( 'success-url' );
				} else {
					grunion_delete_spam();
				}
			} );
	}
} );
