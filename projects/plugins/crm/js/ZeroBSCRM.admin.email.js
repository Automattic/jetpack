/*

Jetpack CRM: Emails jQuery

*/
jQuery( function ( $ ) {
	$( '.inbox-nav .item' ).on( 'click', function ( e ) {
		$( '.inbox-nav .item' ).removeClass( 'active' );
		$( '.zbs-email-list-item ' ).removeClass( 'active' );
		$( '#zbs-email-body' ).hide();
		$( '#zbs-send-single-email, #zbs-send-single-email-ui' ).hide();
		$( '#zbs-email-send-message-thread' ).hide();
		$( '.click-email-to-load' ).show();
		$( '.zbs-ajax-loading' ).show();
		$( this ).addClass( 'active' );
	} );

	$( '.zbs-email-actions .star' ).on( 'click', function ( e ) {
		if ( $( this ).hasClass( 'outline' ) ) {
			var data = {
				action: 'zbs_email_star_thread',
				emid: window.zbs_star_id,
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
					$( '.zbs-list-fav-' + window.zbs_star_id ).show();
				},
				error: function ( response ) {},
			} );

			$( this ).addClass( 'yellow' ).removeClass( 'outline' );

			$( '.starred-email-list .zbs-email-list-' + window.zbs_star_id ).show();
		} else {
			var data = {
				action: 'zbs_email_unstar_thread',
				emid: window.zbs_star_id,
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
					$( '.zbs-list-fav-' + window.zbs_star_id ).hide();
				},
				error: function ( response ) {},
			} );

			$( this ).removeClass( 'yellow' ).addClass( 'outline' );
			$( '.starred-email-list .zbs-email-list-' + window.zbs_star_id ).hide();
		}
	} );

	$( '.zbs-inbox-compose-email' ).on( 'click', function ( e ) {
		//composing the email (form the send UI page within "Emails") rather than the contact actions
		//need to tweak the contact actions so it can handle this
		e.preventDefault();
		$( '.zbs-email-list' ).hide();
		$( '.zbs-email-content' ).hide();
		$( '.zbs-email-contact-info' ).hide();
		$( '#zbs-send-single-email, #zbs-send-single-email-ui' ).show();

		$( '.inbox-nav .item' ).removeClass( 'active blue' );
		$( '.zbs-email-list-item ' ).removeClass( 'active' );
		$( '.zbs-drafts-link' ).addClass( 'active blue' );
	} );

	$( '.zbs-email-actions .trash' ).on( 'click', function ( e ) {
		swal( {
			title: 'Are you sure?',
			text:
				'This will delete the email thread and remove it from your database. You can not undo this',
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#3085d6',
			cancelButtonColor: '#d33',
			confirmButtonText: 'Yes delete the email!',
		} ) //.then((result) => {
			.then( function ( result ) {
				if ( result.value ) {
					// ajax remove
					var emailid = window.zbs_star_id;

					var data = {
						action: 'zbs_delete_email_thread',
						// don't need, is unique id 'objtype': <?php echo $this->typeInt; ?>,
						emid: emailid,
						sec: window.zbs_root.zbsnonce,
					};

					// Send it Pat :D
					jQuery.ajax( {
						type: 'POST',
						url: ajaxurl,
						data: data,
						dataType: 'json',
						timeout: 20000,
						success: function ( response ) {
							swal( 'Email thread deleted!', 'Your email thread has been removed.', 'success' );

							// remove it from the list
							$( '#zbs-email-body' ).hide();
							$( '#zbs-email-send-message-thread' ).hide();
							$( '.zbs-email-contact-info' ).hide();
							$( '.click-email-to-load' ).show();
							$( '.zbs-ajax-loading' ).show();
							$( '.zbs-email-list-' + emailid ).remove();
						},
						error: function ( response ) {
							swal(
								'Email Thread Not Deleted!',
								'Your email thread was not removed, please try again.',
								'warning'
							);
						},
					} );
				}
			} );
	} );

	$( '.zbs-email-list-item' ).on( 'click', function ( e ) {
		$( '.zbs-email-thread' ).html( '' );

		window.zbs_star_id = $( this ).data( 'emid' );
		window.zbs_fav = $( this ).data( 'fav' );
		window.zbs_cid = $( this ).data( 'cid' );

		if ( $( this ).hasClass( 'zbs-unread-0' ) ) {
			$( this ).removeClass( 'zbs-unread-0' ).addClass( 'zbs-unread-1' );
		}

		// this created multi-click bug, moved to global var profile_url = $('.edit-contact-link').attr('href');
		$( '.edit-contact-link' ).attr( 'href', window.zbsContactEditPrefix + window.zbs_cid );

		$( '.zbs-email-list-item' ).removeClass( 'active' );
		$( '.click-email-to-load, .reply-sent' ).hide();
		$( this ).addClass( 'active' );

		if ( window.zbs_fav == 1 ) {
			$( '.zbs-email-actions .star' ).addClass( 'yellow' ).removeClass( 'outline' );
		} else {
			$( '.zbs-email-actions .star' ).removeClass( 'yellow' ).addClass( 'outline' );
		}

		$( '.zbs-email-read-date' ).hide();

		$( '#zbs-email-body' ).hide();

		$( '.zbs-ajax-loading' ).show();
		$( '.spinner-gif' ).show();

		// remove any fail msg
		jQuery( '#zbs-couldnotload' ).remove();

		the_content = $( 'the_content', this ).html();

		$( '.spinner-gif' ).show();
		// postbag!
		var data = {
			action: 'zbs_email_customer_panel',
			cid: $( this ).data( 'cid' ),
			emid: $( this ).data( 'emid' ),
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
				//populate the data in the customer panel
				$( '#panel-customer-avatar' ).html( response.avatar );
				$( '#panel-name' ).html( response.customer.fname + ' ' + response.customer.lname );
				$( '#panel-status' ).html( response.customer.status );

				$( '.panel-customer-email' ).html( response.customer.email );
				$( '.panel-customer-phone' ).html( response.customer.hometel );

				$( '.the-tasks' ).html( '' );

				var completed_tasks = 0;
				var progress_tasks = 0;
				var total_tasks = 0;
				$.each( response.tasks, function ( k, v ) {
					total_tasks++;
					if ( v.complete == 1 ) {
						$( '.the-tasks' ).append(
							'<li class="complete"><i class="ui icon check green circle"></i>' + v.title + '</li>'
						);
						completed_tasks++;
					} else {
						$( '.the-tasks' ).append( '<li class="incomplete">' + v.title + '</li>' );
						progress_tasks++;
					}
				} );

				if ( total_tasks == 0 ) {
					$( '.the-tasks' ).html( "<div class='no-tasks'>No Tasks for this contact</div>" );
				}

				$( '.total-tasks-panel' ).html( total_tasks );
				$( '.completed-tasks-panel' ).html( completed_tasks );
				$( '.inprogress-tasks-panel' ).html( progress_tasks );
				$( '.total-paid .the_value' ).html( response.trans_value );
				$( '.total-due .the_value' ).html( response.quote_value );

				//the email stuff
				$( '.zbs-email-date' ).html( response.email_date );
				$( '.zbs-email-subject' ).html( response.email.zbsmail_subject );

				//   $('.zbs-email-body-content').append(response.email);
				$.each( response.email, function ( k, v ) {
					$( '.zbs-email-thread' ).append( '<div class="zbs-email-date>' + v.date + '</div>' );
					$( '.zbs-email-thread' ).append(
						'<div class="zbs-email-subject em-sub-' +
							k +
							'">' +
							jpcrm.esc_html( v.zbsmail_subject ) +
							'</div>'
					);
					$( '.zbs-email-thread' ).append(
						'<div class="zbs-email-body-content ' +
							v.in_or_out +
							'" id="zbsbody' +
							v.the_id +
							'">' +
							unescape( v.zbsmail_content ) +
							'</div>'
					);
					$( '#zbsbody' + v.the_id ).append( '<div class="pointer' + v.in_or_out + '"></div>' );
					$( '.zbs-email-thread' ).append(
						'<div class="email-avatar avatar-' + v.in_or_out + '">' + v.avatar + '</div>'
					);
					$( '.zbs-email-thread' ).append( '<div class="clear"></div>' );

					if ( v.zbsmail_opened > 0 ) {
						$( '.zbs-email-thread' ).append(
							'<div class="zbsread' +
								v.in_or_out +
								'"><span class="bold">Read:</span> ' +
								v.zbsmail_lastopened +
								'</div>'
						);
					}

					/*
                                    <div class='zbs-email-date'></div>
                <div class='zbs-email-subject'></div>
                <div class='zbs-email-body-content'></div>
                */
				} );

				if ( response.email.zbsmail_opened == 1 ) {
					$( '.zbs-email-read-date' ).show();
				} else {
					$( '.zbs-email-read-date' ).hide();
				}

				$( '.zbs-email-content' ).css( 'background', 'white' );

				$( '.zbs-ajax-loading' ).hide();
				$( '.click-email-to-load' ).hide();
				$( '.spinner-gif' ).hide();

				// remove any fail msg
				jQuery( '#zbs-couldnotload' ).remove();

				$( '#zbs-email-body' ).show();

				$( '.zbs-email-content' ).fadeIn( 1000 );
				$( '.zbs-email-contact-info' ).fadeIn( 1000 );

				$( '#zbs-email-send-message-thread' ).show();
			},
			error: function ( response ) {
				$( '.mark-complete-task button' ).removeClass( 'disabled' );
				completeBlocker = true;

				// WH: there was no error catching here, added (plz do in future)
				$( '.spinner-gif' ).hide();
				jQuery( '#zbs-couldnotload' ).remove();
				jQuery( '.zbs-ajax-loading' ).append(
					'<p id="zbs-couldnotload">' + zbsEmailSingleLang.couldnotload + '</p>'
				);
			},
		} );
	} );

	$( '.zbs-sent-link' ).on( 'click', function ( e ) {
		$( '.app-content' ).hide();
		$( '.click-email-to-load' ).show();
		$( '.spinner-gif' ).hide();

		$( '.sent-email-list, .zbs-email-content' ).fadeIn( 1000 );
	} );

	$( '.zbs-starred-link' ).on( 'click', function ( e ) {
		$( '.app-content' ).hide();
		$( '.click-email-to-load' ).show();
		$( '.spinner-gif' ).hide();

		$( '.starred-email-list, .zbs-email-content' ).fadeIn( 1000 );
	} );

	//sending the threaded email
	$( '.zbs-send-email-thread-button' ).on( 'click', function ( e ) {
		the_thread_id = window.zbs_star_id;
		the_thread_message = tinymce.get( 'zbs_send_email_thread' ).getContent();
		the_customer_id = window.zbs_cid;
		the_thread_subject = $( '.em-sub-0' ).html();

		var data = {
			action: 'zbs_email_send_thread_ui',
			emid: the_thread_id,
			cid: the_customer_id,
			'zbs-send-email-title': the_thread_subject,
			zbs_send_email_content: the_thread_message,
			sec: window.zbs_root.zbsnonce,
		};

		// Send it Pat :D
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				tinymce.get( 'zbs_send_email_thread' ).setContent( '' );
				$( '#zbs-email-body, #zbs-email-send-message-thread' ).hide();
				$( '.zbs-ajax-loading' ).show();
				$( '.zbs-ajax-loading' ).append(
					'<div class="reply-sent"><i class="ui icon check green circle"></i></div>'
				);
				$( '.reply-sent' ).append( '<h3>Email Sent</h3>' );
			},
			error: function ( response ) {},
		} );
	} );
} );

/**
 * @param obj
 */
function zbscrmjs_customer_setCustomerEmail( obj ) {
	if ( typeof obj.id !== 'undefined' ) {
		jQuery( '#zbs-send-email-to' ).val( obj.email );
		// remove "hidden" class from error div if contact with no email is selected
		document
			.getElementById( 'email_contact_selector' )
			.classList.toggle( 'hidden', obj.email != '' );
	}
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zbscrmjs_customer_setCustomerEmail };
}
