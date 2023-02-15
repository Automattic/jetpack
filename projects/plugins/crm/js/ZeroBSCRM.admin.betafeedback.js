/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V2.95+
 *
 * Copyright 2020 Automattic
 *
 * Date: 02/10/18
 */
jQuery( function () {
	if ( typeof window.zbsBetaFeedback !== 'undefined' ) {
		zerobscrmJS_bindBetaFeedback();
	}
} );

/* Exposes a beta feedback ico to click + give feedback to US, bottom right, if the global var is set */
/**
 *
 */
function zerobscrmJS_bindBetaFeedback() {
	if ( typeof window.zbsBetaFeedback !== 'undefined' ) {
		if ( typeof window.zbsBetaFeedback.title !== 'undefined' ) {
			// modal
			var html = '<div class="ui large modal" id="zbs-beta-feedback">';
			html += '  <div class="header">' + window.zbsBetaFeedback.title + '</div>';
			html += '  <div class="content">';
			html +=
				'    <p id="zbs-beta-feedback-commentwrap">' +
				window.zbsBetaFeedback.desc +
				'<br /><textarea id="zbs-beta-feedback-comment" placeholder="' +
				window.zbsBetaFeedback.commentplaceholder +
				'"></textarea><br />' +
				window.zbsBetaFeedback.incdata +
				'</p>';
			html +=
				'	<p style="display:none" id="zbs-beta-feedback-sent">' +
				window.zbsBetaFeedback.sent +
				'</p>';
			html +=
				'	<p style="display:none" id="zbs-beta-feedback-fail">' +
				window.zbsBetaFeedback.fail +
				'</p>';
			html +=
				'	<div class="ui dimmer" id="zbs-beta-feedback-loader"><div class="ui loader"></div></div>';
			html += '  </div>';
			html += '  <div class="actions">';
			html += '  	<div class="ui labeled input left floated">';
			html += '	  <div class="ui label">' + window.zbsBetaFeedback.emaillabel + '</div>';
			html +=
				'	  <input type="text" id="zbs-beta-feedback-email" value="' +
				window.zbsBetaFeedback.email +
				'" placeholder="' +
				window.zbsBetaFeedback.emailplaceholder +
				'">';
			html += '	</div>';
			html +=
				'    <div class="ui black button" id="zbs-cancel-beta-feedback">' +
				window.zbsBetaFeedback.cancelbutton +
				'</div>';
			html +=
				'    <div class="ui green right labeled icon button" id="zbs-send-beta-feedback">' +
				window.zbsBetaFeedback.sendbutton +
				'<i class="checkmark icon"></i></div>';
			html += '  </div>';
			html += '</div>';

			// attention grabbing ico!
			html +=
				'<button class="ui black button" id="zbs-beta-feedback-request">' +
				window.zbsBetaFeedback.logo +
				window.zbsBetaFeedback.givefeedback +
				'</button>';

			// kill any prev
			jQuery( '#zbs-beta-feedback, #zbs-beta-feedback-request' ).remove();

			// inject into page
			jQuery( 'body' ).append( html );

			// bind actions
			setTimeout( function () {
				// bind give feedback
				jQuery( '#zbs-beta-feedback-request' ).on( 'click', function () {
					// make sure in right way
					jQuery( '#zbs-beta-feedback .actions' ).show();
					jQuery( '#zbs-beta-feedback-sent' ).hide();
					jQuery( '#zbs-beta-feedback-fail' ).hide();
					jQuery( '#zbs-beta-feedback-commentwrap' ).show();

					// open modal
					jQuery( '#zbs-beta-feedback' ).modal( 'show' ).modal( 'refresh' );
				} );

				// send feedback
				jQuery( '#zbs-send-beta-feedback' ).on( 'click', function () {
					// go.
					zerobscrmJS_sendBetaFeedback(
						function ( r ) {
							// sent
							// hide comment wrap, show sent, hide in 1.5s
							jQuery( '#zbs-beta-feedback .actions' ).hide();
							jQuery( '#zbs-beta-feedback-commentwrap' ).hide();
							jQuery( '#zbs-beta-feedback-sent' ).show();

							setTimeout( function () {
								// close modal
								jQuery( '#zbs-beta-feedback' ).modal( 'hide' );

								// return form
								jQuery( '#zbs-beta-feedback-sent' ).hide();
								jQuery( '#zbs-beta-feedback-comment' ).val( '' );
								jQuery( '#zbs-beta-feedback-commentwrap' ).show();
								jQuery( '#zbs-beta-feedback .actions' ).show();
							}, 1500 );
						},
						function ( r ) {
							// fail
							// show fail msg
							jQuery( '#zbs-beta-feedback-fail' ).show();

							// hide fail msg after 2.5s
							setTimeout( function () {
								jQuery( '#zbs-beta-feedback-fail' ).hide();
							}, 2500 );
						}
					);
				} );

				// cancel feedback
				jQuery( '#zbs-cancel-beta-feedback' ).on( 'click', function () {
					// close modal
					jQuery( '#zbs-beta-feedback' ).modal( 'hide' );
				} );
			}, 0 );
		}
	}
}

var zbsBetaFeedbackInTube = false;
/**
 * @param successcb
 * @param errcb
 */
function zerobscrmJS_sendBetaFeedback( successcb, errcb ) {
	if ( ! window.zbsBetaFeedbackInTube ) {
		// loader
		jQuery( '#zbs-beta-feedback-loader' ).addClass( 'active' );

		// set blocker
		window.zbsBetaFeedbackInTube = true;

		// page if present
		var page = '';
		if ( typeof window.zbsPageKey !== 'undefined' ) {
			page = window.zbsPageKey;
		}
		var area = '';
		if ( typeof window.zbsBetaFeedback.area !== 'undefined' ) {
			area = window.zbsBetaFeedback.area;
		}

		// postbag!
		var data = {
			action: 'zbsbfeedback',
			sec: window.zbs_root.zbsnonce,
			comm: jQuery( '#zbs-beta-feedback-comment' ).val(),
			email: jQuery( '#zbs-beta-feedback-email' ).val(),
			page: page,
			area: area,
		};

		// Send
		jQuery.ajax( {
			type: 'POST',
			url: ajaxurl, // admin side is just ajaxurl not wptbpAJAX.ajaxurl,
			data: data,
			dataType: 'json',
			timeout: 20000,
			success: function ( response ) {
				// temp debug
				// debug console.log("data: ",response);
				// any success callback?
				if ( typeof successcb === 'function' ) {
					successcb( response );
				}

				// unset blocker
				window.zbsBetaFeedbackInTube = false;

				// loader
				jQuery( '#zbs-beta-feedback-loader' ).removeClass( 'active' );
			},
			error: function ( response ) {
				// temp debug console.error("Error: ",response);

				// any error callback?
				if ( typeof errcb === 'function' ) {
					errcb( response );
				}

				// unset blocker
				window.zbsBetaFeedbackInTube = false;

				// loader
				jQuery( '#zbs-beta-feedback-loader' ).removeClass( 'active' );
			},
		} );
	} // / not blocked
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zerobscrmJS_bindBetaFeedback, zerobscrmJS_sendBetaFeedback, zbsBetaFeedbackInTube, zbsBetaFeedbackInTube };
}
