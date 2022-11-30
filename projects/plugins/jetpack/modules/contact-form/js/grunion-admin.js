/* global ajaxurl jetpack_empty_spam_button_parameters */
jQuery( function ( $ ) {
	if ( typeof jetpack_empty_spam_button_parameters !== 'undefined' ) {
		// Create the "Empty Spam" button and add it above and below the list of spam feedbacks.
		var jetpack_empty_spam_feedbacks_button_container = $( '<div/>' ).addClass(
			'jetpack-empty-spam-container'
		);

		var jetpack_empty_spam_feedbacks_button = $( '<a />' )
			.addClass( 'button-secondary' )
			.addClass( 'jetpack-empty-spam' )
			.attr( 'href', '#' )
			.attr( 'data-progress-label', jetpack_empty_spam_button_parameters.progress_label )
			.attr( 'data-success-url', jetpack_empty_spam_button_parameters.success_url )
			.attr( 'data-failure-url', jetpack_empty_spam_button_parameters.failure_url )
			.attr( 'data-spam-feedbacks-count', jetpack_empty_spam_button_parameters.spam_count )
			.attr( 'data-nonce', jetpack_empty_spam_button_parameters.nonce )
			.text( jetpack_empty_spam_button_parameters.label );
		jetpack_empty_spam_feedbacks_button_container.append( jetpack_empty_spam_feedbacks_button );

		var jetpack_empty_spam_feedbacks_spinner = $( '<span />' ).addClass(
			'jetpack-empty-spam-spinner'
		);
		jetpack_empty_spam_feedbacks_button_container.append( jetpack_empty_spam_feedbacks_spinner );

		// Add the button both above and below the list of spam feedbacks.
		$( '.tablenav.top .actions, .tablenav.bottom .actions' )
			.not( '.bulkactions' )
			.append( jetpack_empty_spam_feedbacks_button_container );
	}

	$( document ).on( 'click', '#jetpack-check-feedback-spam:not(.button-disabled)', function ( e ) {
		e.preventDefault();

		$( '#jetpack-check-feedback-spam:not(.button-disabled)' ).addClass( 'button-disabled' );
		$( '.jetpack-check-feedback-spam-spinner' ).addClass( 'spinner' ).show();
		grunion_check_for_spam( 0, 100 );
	} );

	function grunion_check_for_spam( offset, limit ) {
		var nonceName = $( '#jetpack-check-feedback-spam' ).data( 'nonce-name' );
		var nonce = $( '#' + nonceName ).attr( 'value' );
		var failureUrl = $( '#jetpack-check-feedback-spam' ).data( 'failure-url' );

		var requestOptions = {
			action: 'grunion_recheck_queue',
			offset: offset,
			limit: limit,
		};
		requestOptions[ nonceName ] = nonce;

		$.post( ajaxurl, requestOptions )
			.fail( function () {
				// An error is only returned in the case of a missing nonce or invalid permissions, so we don't need the actual error message.
				window.location.href = failureUrl;
				return;
			} )
			.done( function ( result ) {
				if ( result.processed < limit ) {
					window.location.reload();
				} else {
					grunion_check_for_spam( offset + limit, limit );
				}
			} );
	}

	var initial_spam_count = 0;
	var deleted_spam_count = 0;

	$( document ).on( 'click', '.jetpack-empty-spam', function ( e ) {
		e.preventDefault();

		if ( $( this ).hasClass( 'button-disabled' ) ) {
			// An Emptying process is already underway or the button is otherwise disabled.
			return;
		}

		$( '.jetpack-empty-spam' ).addClass( 'button-disabled' ).addClass( 'emptying' );
		$( '.jetpack-empty-spam-spinner' ).addClass( 'spinner' ).addClass( 'is-active' );

		// Update the label on the "Empty Spam" button to use the active "Emptying Spam" language.
		$( '.jetpack-empty-spam' ).text(
			$( '.jetpack-empty-spam' ).data( 'progress-label' ).replace( '%1$s', '0' )
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
			.fail( function ( result ) {
				// An error is only returned in the case of a missing nonce or invalid permissions, so we don't need the actual error message.
				window.location.href = empty_spam_buttons.data( 'failure-url' );
				return;
			} )
			.done( function ( result ) {
				deleted_spam_count += result.data.counts.deleted;

				if ( result.data.counts.deleted < result.data.counts.limit ) {
					window.location.href = empty_spam_buttons.data( 'success-url' );
				} else {
					grunion_delete_spam();
				}
			} );
	}

	// Async handling for response table actions
	$( document ).ready( function () {
		function updateStatus( postId, status, indicatorColor ) {
			$.post(
				ajaxurl,
				{
					action: 'grunion_ajax_spam',
					post_id: postId,
					make_it: status,
					sub_menu: jQuery( '.subsubsub .current' ).attr( 'href' ),
					_ajax_nonce: window.__grunionPostStatusNonce,
				},
				function ( response ) {
					$( '#post-' + postId )
						.css( { backgroundColor: indicatorColor } )
						.fadeOut( 350, function () {
							$( this ).remove();
							$( '.subsubsub' ).html( response );
						} );
				}
			);
		}

		$( 'tr.type-feedback .row-actions a' ).click( function ( e ) {
			e.preventDefault();

			var postRowId = $( e.target ).closest( 'tr.type-feedback' ).attr( 'id' );
			var match = postRowId.match( /^post\-(\d+)/ );

			if ( ! match ) {
				return;
			}

			var postId = parseInt( match[ 1 ], 10 );

			if ( $( e.target ).parent().hasClass( 'spam' ) ) {
				e.preventDefault();
				updateStatus( postId, 'spam', '#FF7979' );
			}

			if ( $( e.target ).parent().hasClass( 'trash' ) ) {
				e.preventDefault();
				updateStatus( postId, 'trash', '#FF7979' );
			}

			if ( $( e.target ).parent().hasClass( 'unspam' ) ) {
				e.preventDefault();
				updateStatus( postId, 'ham', '#59C859' );
			}

			if ( $( e.target ).parent().hasClass( 'untrash' ) ) {
				e.preventDefault();
				updateStatus( postId, 'publish', '#59C859' );
			}
		} );
	} );

	// Handle export
	$( document ).on( 'click', '#jetpack-export-feedback', function ( e ) {
		e.preventDefault();

		var nonceName = $( '#jetpack-export-feedback' ).data( 'nonce-name' );
		var nonce = $( '#' + nonceName ).attr( 'value' );

		var date = window.location.search.match( /(\?|\&)m=(\d+)/ );
		var post = window.location.search.match( /(\?|\&)jetpack_form_parent_id=(\d+)/ );

		var selected = [];
		$( '#posts-filter .check-column input[type=checkbox]:checked' ).each( function () {
			selected.push( parseInt( $( this ).attr( 'value' ), 10 ) );
		} );

		$.post(
			ajaxurl,
			{
				action: 'feedback_export',
				year: date ? date[ 2 ].substr( 0, 4 ) : '',
				month: date ? date[ 2 ].substr( 4, 2 ) : '',
				post: post ? parseInt( post[ 2 ], 10 ) : 'all',
				selected: selected,
				[ nonceName ]: nonce,
			},
			function ( response ) {
				var blob = new Blob( [ response ], { type: 'application/octetstream' } );

				var a = document.createElement( 'a' );
				a.href = window.URL.createObjectURL( blob );
				a.download = 'feedback.csv';

				document.body.appendChild( a );
				a.click();
				document.body.removeChild( a );
				window.URL.revokeObjectURL( a.href );
			}
		);
	} );
} );
