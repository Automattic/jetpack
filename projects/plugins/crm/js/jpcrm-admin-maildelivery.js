var zeroBSCRMJS_SMTPWiz = {
	sendFromName: '',
	sendFromEmail: '',
	serverType: 'wp_mail',
	smtpHost: '',
	smtpPort: '',
	smtpUser: '',
	smtpPass: '',
};

// generic func - can we standardise this (wh)?
/**
 *
 */
function zeroBSCRMJS_refreshPage() {
	window.location = window.zbs_root.current_url;
}

jQuery( function () {
	// bind
	zeroBSCRMJS_mail_delivery_bindWizard();
	zeroBSCRMJS_mail_delivery_bindList();
} );

// defaults for test delivery pass through for SWAL
var zbsTestDelivery = false,
	zbsTestDeliveryMsg = '';

// bind list view stuff
/**
 *
 */
function zeroBSCRMJS_mail_delivery_bindList() {
	jQuery( '.zbs-test-mail-delivery' )
		.off( 'click' )
		.on( 'click', function () {
			// get deets
			var emailFrom = '',
				emailIndx = -1;

			emailIndx = jQuery( this ).attr( 'data-indx' );
			emailFrom = jQuery( this ).attr( 'data-from' );

			swal( {
				title: window.zeroBSCRMJS_globViewLang( 'sendTestMail' ) + ' "' + emailFrom + '"',
				//text: window.zeroBSCRMJS_globViewLang('sendTestWhere'),
				input: 'email',
				inputValue: emailFrom, // prefill with itself
				showCancelButton: true,
				confirmButtonText: window.zeroBSCRMJS_globViewLang( 'sendTestButton' ),
				showLoaderOnConfirm: true,
				preConfirm: function ( email ) {
					return new Promise( function ( resolve, reject ) {
						// localise indx
						var lIndx = emailIndx;

						// timeout for loading
						setTimeout( function () {
							if ( ! zbscrm_JS_validateEmail( email ) ) {
								reject( window.zeroBSCRMJS_globViewLang( 'pleaseEnterEmail' ) );
							} else {
								var data = {
									action: 'zbs_maildelivery_test',
									indx: lIndx,
									em: email,
									sec: window.zbs_root.jpcrm_nonce,
								};

								// Send it Pat :D
								jQuery.ajax( {
									type: 'POST',
									url: ajaxurl,
									data: data,
									dataType: 'json',
									timeout: 20000,
									success: function ( response ) {
										// localise
										var lEmail = email;

										window.zbsTestDelivery = 'success';
										window.zbsTestDeliveryMsg =
											window.zeroBSCRMJS_globViewLang( 'sendTestSentSuccess' ) + ' ' + lEmail;

										resolve();
									},
									error: function ( response ) {
										window.zbsTestDelivery = 'fail';
										window.zbsTestDeliveryMsg = window.zeroBSCRMJS_globViewLang(
											'sendTestSentFailed'
										);

										resolve();
									},
								} );
							}
						}, 2000 );
					} );
				},
				allowOutsideClick: false,
			} )
				.then( function ( email ) {
					if ( window.zbsTestDelivery == 'success' ) {
						swal( {
							type: 'success',
							title: window.zeroBSCRMJS_globViewLang( 'sendTestSent' ),
							html: window.zbsTestDeliveryMsg,
						} );
					} else {
						swal( {
							type: 'warning',
							title: window.zeroBSCRMJS_globViewLang( 'sendTestFail' ),
							html: window.zbsTestDeliveryMsg,
						} );
					}
				} )
				.catch( swal.noop );
		} );

	// REMOVE one :)
	jQuery( '.zbs-remove-mail-delivery' )
		.off( 'click' )
		.on( 'click', function () {
			// get deets
			var emailIndx = -1;

			emailIndx = jQuery( this ).attr( 'data-indx' );

			swal( {
				title: window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureTitle' ),
				text: window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureText' ),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureConfirm' ),
			} ).then( function ( result ) {
				if ( result.value ) {
					// localise indx
					var lIndx = emailIndx;

					var data = {
						action: 'zbs_maildelivery_remove',
						indx: lIndx,
						sec: window.zbs_root.jpcrm_nonce,
					};

					// Send it Pat :D
					jQuery.ajax( {
						type: 'POST',
						url: ajaxurl,
						data: data,
						dataType: 'json',
						timeout: 20000,
						success: function ( response ) {
							console.log( 'del', response );

							swal( {
								title: window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureDeletedTitle' ),
								text: window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureDeletedText' ),
								type: 'success',
								// refresh onClose: zeroBSCRMJS_refreshPage
								onClose: function () {
									// remove line
									llIndx = lIndx;
									jQuery( '#zbs-mail-delivery-' + llIndx ).hide();
								},
							} );
						},
						error: function ( response ) {
							console.error( 'del', response );

							swal(
								window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureDeleteErrTitle' ),
								window.zeroBSCRMJS_globViewLang( 'deleteMailDeliverySureDeleteErrText' ),
								'warning'
							);
						},
					} );
				}
			} );
		} );

	// Set as default
	jQuery( '.zbs-default-mail-delivery' )
		.off( 'click' )
		.on( 'click', function () {
			// get deets
			var emailIndx = -1;

			emailIndx = jQuery( this ).attr( 'data-indx' );

			swal( {
				title: window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureTitle' ),
				text: window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureText' ),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#3085d6',
				cancelButtonColor: '#d33',
				confirmButtonText: window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureConfirm' ),
			} ).then( function () {
				// localise indx
				var lIndx = emailIndx;

				var data = {
					action: 'zbs_maildelivery_setdefault',
					indx: lIndx,
					sec: window.zbs_root.jpcrm_nonce,
				};

				// Send it Pat :D
				jQuery.ajax( {
					type: 'POST',
					url: ajaxurl,
					data: data,
					dataType: 'json',
					timeout: 20000,
					success: function ( response ) {
						console.log( 'def', response );

						swal( {
							title: window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureDeletedTitle' ),
							text: window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureDeletedText' ),
							type: 'success',
							// refresh onClose: zeroBSCRMJS_refreshPage
							onClose: function () {
								// remove other default labels + inject
								jQuery(
									'#zbs-mail-delivery-account-list-wrap td.zbs-mail-delivery-item-details .zbs-default'
								).remove();
								// undisable as well
								jQuery(
									'#zbs-mail-delivery-account-list-wrap .zbs-default-mail-delivery.disabled'
								).removeClass( 'disabled' );

								llIndx = lIndx;
								jQuery(
									'#zbs-mail-delivery-' + llIndx + ' td.zbs-mail-delivery-item-details'
								).prepend(
									'<div class="ui ribbon label zbs-default">' +
										window.zeroBSCRMJS_globViewLang( 'defaultText' ) +
										'</div>'
								);
								jQuery(
									'#zbs-mail-delivery-' + llIndx + ' .ui.button.zbs-default-mail-delivery'
								).addClass( 'disabled' );
							},
						} );
					},
					error: function ( response ) {
						console.error( 'def', response );

						swal(
							window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureDeleteErrTitle' ),
							window.zeroBSCRMJS_globViewLang( 'defaultMailDeliverySureDeleteErrText' ),
							'warning'
						);
					},
				} );
			} );
		} );
}

var oauth_profile_key = '';

// bind wizard funcs
/**
 *
 */
function zeroBSCRMJS_mail_delivery_bindWizard() {
	// any of these?
	jQuery( '.ui.radio.checkbox' ).checkbox();

	// start wiz
	jQuery( '#zbs-mail-delivery-start-wizard' )
		.off( 'click' )
		.on( 'click', function () {
			// hide bits classed .zbs-non-wizard
			jQuery( '.zbs-non-wizard', jQuery( '#zbs-mail-delivery-wrap' ) ).hide();

			// show wiz
			jQuery( '#zbs-mail-delivery-wizard-wrap' ).show();
		} );

	// step 1

	// submit
	jQuery( '#zbs-mail-delivery-wizard-step-1-submit' )
		.off( 'click' )
		.on( 'click', function () {
			// test inputs & move on to step 2
			var okayToProceed = true;
			var sendFromName = jQuery( '#zbs-mail-delivery-wizard-sendfromname' ).val();
			var sendFromEmail = jQuery( '#zbs-mail-delivery-wizard-sendfromemail' ).val();

			// send from name
			if ( sendFromName.length > 0 ) {
				// set it
				window.zeroBSCRMJS_SMTPWiz.sendFromName = sendFromName;

				// hide any msg
				jQuery( '#zbs-mail-delivery-wizard-sendfromname-error' )
					.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
					.addClass( 'hidden' );
			} else {
				// not okay
				okayToProceed = false;

				// msg
				jQuery( '#zbs-mail-delivery-wizard-sendfromname-error' )
					.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnter' ) )
					.removeClass( 'hidden' );
			}

			// send from email
			if ( sendFromEmail.length > 0 && zbscrm_JS_validateEmail( sendFromEmail ) ) {
				// set it
				window.zeroBSCRMJS_SMTPWiz.sendFromEmail = sendFromEmail;

				// hide any msg
				jQuery( '#zbs-mail-delivery-wizard-sendfromemail-error' )
					.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
					.addClass( 'hidden' );
			} else {
				// not okay
				okayToProceed = false;

				// msg
				jQuery( '#zbs-mail-delivery-wizard-sendfromemail-error' )
					.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnterEmail' ) )
					.removeClass( 'hidden' );
			}

			// okay?
			if ( okayToProceed ) {
				jQuery( '#zbs-mail-delivery-wizard-step-1-wrap' ).hide();
				jQuery( '#zbs-mail-delivery-wizard-step-2-wrap' ).show();

				jQuery( '.zbs-top-step-1' ).removeClass( 'active' );
				jQuery( '.zbs-top-step-2' ).removeClass( 'disabled' ).addClass( 'active' );

				// Pre-fill user on next step SMTP ...
				if ( jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-user' ).val() == '' ) {
					jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-user' ).val( sendFromEmail );
				}
			}
		} );

	// Step 2
	jQuery( '#zbs-mail-delivery-wizard-step-2-wrap .ui.radio.checkbox' ).on( 'click', function () {
		// check mode
		var serverType = 'wp_mail';
		if ( jQuery( '#zbs-mail-delivery-wizard-step-2-servertype-smtp' ).checkbox( 'is checked' ) ) {
			serverType = 'smtp';
		}
		if (
			jQuery( '#jpcrm-mail-delivery-wizard-step-2-servertype-oauth' ).checkbox( 'is checked' )
		) {
			serverType = 'api';
		}

		// show hide
		if ( serverType == 'smtp' ) {
			jQuery( '#jpcrm-mail-delivery-wizard-step-2-api' ).hide();
			jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-wrap' ).show();
			jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp' ).show();
			jQuery( '.jpcrm-mail-delivery-wizard-step-2-spacer' ).show();
		} else if ( serverType == 'api' ) {
			jQuery( '#jpcrm-mail-delivery-wizard-step-2-api' ).show();
			jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-wrap' ).hide();
			jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp' ).hide();
			jQuery( '.jpcrm-mail-delivery-wizard-step-2-spacer' ).show();
		} else {
			jQuery( '#jpcrm-mail-delivery-wizard-step-2-api' ).hide();
			jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-wrap' ).hide();
			jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp' ).hide();
			jQuery( '.jpcrm-mail-delivery-wizard-step-2-spacer' ).hide();
		}
	} );

	// back button
	jQuery( '#zbs-mail-delivery-wizard-step-2-back' )
		.off( 'click' )
		.on( 'click', function () {
			jQuery( '#zbs-mail-delivery-wizard-step-1-wrap' ).show();
			jQuery( '#zbs-mail-delivery-wizard-step-2-wrap' ).hide();

			jQuery( '.zbs-top-step-1' ).removeClass( 'disabled' ).addClass( 'active' );
			jQuery( '.zbs-top-step-2' ).removeClass( 'active' ).addClass( 'disabled' );
		} );

	// quickfill smtp
	jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp select' )
		.off( 'change' )
		.on( 'change', function () {
			// debug console.log(jQuery('#zbs-mail-delivery-wizard-step-2-prefill-smtp select').val());
			var v = jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp select' ).val();

			// find deets
			jQuery( '#zbs-mail-delivery-wizard-step-2-prefill-smtp select option' ).each( function (
				ind,
				ele
			) {
				if ( jQuery( ele ).val() == v && window.zbs_root.smtp_providers[ v ] ) {
					var smtp_settings = window.zbs_root.smtp_providers[ v ];

					// fill out + break
					jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-host' ).val( smtp_settings.host );
					jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-port' ).val( smtp_settings.port );
					jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-user' ).attr(
						'placeholder',
						smtp_settings.example
					);
					if ( ! smtp_settings.description ) {
						smtp_settings.description = '';
					}
					jQuery( '#jpcrm-maildelivery-description' ).html( smtp_settings.description );

					return true;
				}
			} );
		} );

	// check over deets
	jQuery( '#zbs-mail-delivery-wizard-step-2-submit' )
		.off( 'click' )
		.on( 'click', function () {
			// test inputs & move on to step 2
			var okayToProceed = true;

			// wpmail or smtp?
			var serverType = 'wp_mail';
			if ( jQuery( '#zbs-mail-delivery-wizard-step-2-servertype-smtp' ).checkbox( 'is checked' ) ) {
				serverType = 'smtp';
			}
			if (
				jQuery( '#jpcrm-mail-delivery-wizard-step-2-servertype-oauth' ).checkbox( 'is checked' )
			) {
				serverType = 'api';
			}

			// smtp?
			if ( serverType == 'smtp' ) {
				var smtpHost = jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-host' ).val();
				var smtpPort = jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-port' ).val();
				var smtpUser = jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-user' ).val();
				var smtpPass = jQuery( '#zbs-mail-delivery-wizard-step-2-smtp-pass' ).val();

				// first check lengths of them all

				if ( smtpHost.length > 0 ) {
					// set it
					window.zeroBSCRMJS_SMTPWiz.smtpHost = smtpHost;
					// hide any msg
					jQuery( '#zbs-mail-delivery-wizard-smtphost-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
						.addClass( 'hidden' );
				} else {
					// not okay
					okayToProceed = false;
					// msg
					jQuery( '#zbs-mail-delivery-wizard-smtphost-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnter' ) )
						.removeClass( 'hidden' );
				}

				if ( smtpPort.length > 0 ) {
					// set it
					window.zeroBSCRMJS_SMTPWiz.smtpPort = smtpPort;
					// hide any msg
					jQuery( '#zbs-mail-delivery-wizard-smtpport-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
						.addClass( 'hidden' );
				} else {
					// not okay
					okayToProceed = false;
					// msg
					jQuery( '#zbs-mail-delivery-wizard-smtpport-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnter' ) )
						.removeClass( 'hidden' );
				}

				if ( smtpUser.length > 0 ) {
					// set it
					window.zeroBSCRMJS_SMTPWiz.smtpUser = smtpUser;
					// hide any msg
					jQuery( '#zbs-mail-delivery-wizard-smtpuser-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
						.addClass( 'hidden' );
				} else {
					// not okay
					okayToProceed = false;
					// msg
					jQuery( '#zbs-mail-delivery-wizard-smtpuser-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnter' ) )
						.removeClass( 'hidden' );
				}

				if ( smtpPass.length > 0 ) {
					// set it
					window.zeroBSCRMJS_SMTPWiz.smtpPass = smtpPass;
					// hide any msg
					jQuery( '#zbs-mail-delivery-wizard-smtppass-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'thanks' ) )
						.addClass( 'hidden' );
				} else {
					// not okay
					okayToProceed = false;
					// msg
					jQuery( '#zbs-mail-delivery-wizard-smtppass-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'pleaseEnter' ) )
						.removeClass( 'hidden' );
				}
			} // end if smtp

			// wpmail
			if ( serverType == 'wp_mail' ) {
				// no validation req.
			} // end if wpmail

			// API Oauth
			if ( serverType == 'api' ) {
				// got a valid connection?
				var oauth_profile_key = jQuery( '#jpcrm-mail-delivery-wizard-step-2-api select' ).val();
				if ( oauth_profile_key ) {
					jQuery( '#zbs-mail-delivery-wizard-oauth-error' ).addClass( 'hidden' );
					window.zeroBSCRMJS_SMTPWiz.oauth_profile_key = oauth_profile_key;
				} else {
					okayToProceed = false;
					jQuery( '#zbs-mail-delivery-wizard-oauth-error' )
						.html( window.zeroBSCRMJS_globViewLang( 'oauthConnection' ) )
						.removeClass( 'hidden' );
					window.zeroBSCRMJS_SMTPWiz.oauth_profile_key = false;
				}
			} // end if API OAuth

			// okay?
			if ( okayToProceed ) {
				jQuery( '#zbs-mail-delivery-wizard-step-2-wrap' ).hide();
				jQuery( '#zbs-mail-delivery-wizard-step-3-wrap' ).show();

				jQuery( '.zbs-top-step-2' ).removeClass( 'active' );
				jQuery( '.zbs-top-step-3' ).removeClass( 'disabled' ).addClass( 'active' );

				// start validator
				zeroBSCRMJS_validateSettings();
			}
		} );

	// back button
	jQuery( '#zbs-mail-delivery-wizard-step-3-back' )
		.off( 'click' )
		.on( 'click', function () {
			jQuery( '#zbs-mail-delivery-wizard-step-2-wrap' ).show();
			jQuery( '#zbs-mail-delivery-wizard-step-3-wrap' ).hide();

			jQuery( '.zbs-top-step-2' ).removeClass( 'disabled' ).addClass( 'active' );
			jQuery( '.zbs-top-step-3' ).removeClass( 'active' ).addClass( 'disabled' );
		} );

	// fini button
	jQuery( '#zbs-mail-delivery-wizard-step-3-submit' )
		.off( 'click' )
		.on( 'click', function () {
			window.location = window.zbs_root.current_url;
		} );
}

// takes settings in window.zeroBSCRMJS_SMTPWiz and attempts to validate
// (assumes present values)
/**
 *
 */
function zeroBSCRMJS_validateSettings() {
	/* window.zeroBSCRMJS_SMTPWiz
			sendFromName: '',
			sendFromEmail: '',
			serverType: 'wp_mail',
			smtpHost: '',
			smtpPort: '',
			smtpUser: '',
			smtpPass: ''
			*/

	var serverType = 'wp_mail';
	if ( jQuery( '#zbs-mail-delivery-wizard-step-2-servertype-smtp' ).checkbox( 'is checked' ) ) {
		serverType = 'smtp';
	}
	if ( jQuery( '#jpcrm-mail-delivery-wizard-step-2-servertype-oauth' ).checkbox( 'is checked' ) ) {
		serverType = 'api';
	}

	// step through:
	//<i class="terminal icon"></i>
	//<i class="handshake icon"></i>
	//<i class="mail outline icon"></i>
	//<i class="open envelope outline icon"></i>

	// clear prev debug
	jQuery( '#zbs-mail-delivery-wizard-admdebug' ).html( '' ).hide();

	switch ( serverType ) {
		case 'wp_mail':
			// easy - fire of a test via ajax, but will "work" in as far as validation

			// loading
			jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).addClass( 'loading' );

			// postbag! - NOTE: This also adds a new Mail Delivery line to the options (or updates an old one with same email)
			var data = {
				action: 'zbs_maildelivery_validation_wp_mail',
				sendFromName: window.zeroBSCRMJS_SMTPWiz.sendFromName,
				sendFromEmail: window.zeroBSCRMJS_SMTPWiz.sendFromEmail,
				sec: window.zbs_root.jpcrm_nonce,
			};

			jQuery.ajax( {
				type: 'POST',
				url: ajaxurl,
				data: data,
				dataType: 'json',
				timeout: 20000,
				success: function ( response ) {
					// remove loading
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' )
						.removeClass( 'loading' )
						.html( '<i class="open envelope outline icon"></i>' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( '' );

					// success?
					if ( typeof response.success !== 'undefined' ) {
						// show result
						var resHTML =
							window.zeroBSCRMJS_globViewLang( 'settingsValidatedWPMail' ) +
							'<div class="zbs-validated">' +
							window.zeroBSCRMJS_SMTPWiz.sendFromEmail +
							'</div>';
						jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

						// enable finish button, remove back button
						jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).hide();
						jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).show().removeClass( 'disabled' );
					} else {
						// some kind of error, suggest retry
						var resHTML = window.zeroBSCRMJS_globViewLang( 'settingsValidatedWPMailError' );
						jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );
						jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
							'<i class="warning sign icon"></i>'
						);

						// enable back button, disable finish button
						jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
						jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );
					}
				},
				error: function ( response ) {
					// remove loading
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).removeClass( 'loading' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
						'<i class="warning sign icon"></i>'
					);

					// some kind of error, suggest retry
					var resHTML = window.zeroBSCRMJS_globViewLang( 'settingsValidatedWPMailError' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

					// enable back button, disable finish button
					jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
					jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );
				},
			} );

			break;

		case 'smtp':
			// less easy - fire of a test via ajax, return varied responses :)

			// loading
			jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).addClass( 'loading' );
			jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html(
				window.zeroBSCRMJS_globViewLang( 'settingsValidateSMTPPortCheck' )
			);

			// FIRST check ports open (step 1)
			var data = {
				action: 'zbs_maildelivery_validation_smtp_ports',
				smtpHost: window.zeroBSCRMJS_SMTPWiz.smtpHost,
				smtpPort: window.zeroBSCRMJS_SMTPWiz.smtpPort,
				sec: window.zbs_root.jpcrm_nonce,
			};

			jQuery.ajax( {
				type: 'POST',
				url: ajaxurl,
				data: data,
				dataType: 'json',
				timeout: 60000,
				success: function ( response ) {
					if ( typeof response.open !== 'undefined' && response.open ) {
						// NORMAL - validate smtp via send:
						jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html(
							window.zeroBSCRMJS_globViewLang( 'settingsValidateSMTPProbing' )
						);

						// postbag! - NOTE: This also adds a new Mail Delivery line to the options (or updates an old one with same email)
						var data = {
							action: 'zbs_maildelivery_validation_smtp',
							sendFromName: window.zeroBSCRMJS_SMTPWiz.sendFromName,
							sendFromEmail: window.zeroBSCRMJS_SMTPWiz.sendFromEmail,
							smtpHost: window.zeroBSCRMJS_SMTPWiz.smtpHost,
							smtpPort: window.zeroBSCRMJS_SMTPWiz.smtpPort,
							smtpUser: window.zeroBSCRMJS_SMTPWiz.smtpUser,
							smtpPass: window.zeroBSCRMJS_SMTPWiz.smtpPass,
							sec: window.zbs_root.jpcrm_nonce,
						};

						// Send it Pat :D
						jQuery.ajax( {
							type: 'POST',
							url: ajaxurl,
							data: data,
							dataType: 'json',
							timeout: 60000,
							success: function ( response ) {
								// console.log('SMTP',response);

								// 2.94.2 we also added hidden output of all debugs (click to show)
								if ( typeof response.debugs !== 'undefined' ) {
									var debugStr = '';
									if ( response.debugs.length > 0 ) {
										jQuery.each( response.debugs, function ( ind, ele ) {
											debugStr += '<hr />' + ele;
										} );
									}
									jQuery( '#zbs-mail-delivery-wizard-admdebug' ).html(
										'<strong>Debug Log</strong>:<br />' + debugStr
									);
								}

								// remove loading + play routine for now (no seperate ajax tests here)
								jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html(
									window.zeroBSCRMJS_globViewLang( 'settingsValidateSMTPProbing' )
								);
								jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' )
									.removeClass( 'loading' )
									.html( '<i class="terminal icon"></i>' );

								setTimeout( function () {
									// attempting to send msg
									jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html(
										window.zeroBSCRMJS_globViewLang( 'settingsValidateSMTPAttempt' )
									);
									jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
										'<i class="terminal icon"></i>'
									);

									// fly or die:

									// success?
									if ( typeof response.success !== 'undefined' && response.success ) {
										// sent
										var resHTML = window.zeroBSCRMJS_globViewLang( 'settingsValidateSMTPSuccess' );
										jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );
										jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
											'<i class="mail outline icon"></i>'
										);

										setTimeout( function () {
											//console.log('x',window.zeroBSCRMJS_SMTPWiz.smtpHost);
											// show result
											var resHTML =
												window.zeroBSCRMJS_globViewLang( 'settingsValidatedSMTP' ) +
												'<div class="zbs-validated">' +
												window.zeroBSCRMJS_SMTPWiz.sendFromEmail +
												'</div>';
											jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );
											jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
												'<i class="open envelope outline icon"></i>'
											);

											// enable finish button, remove back button
											jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).hide();
											jQuery( '#zbs-mail-delivery-wizard-step-3-submit' )
												.show()
												.removeClass( 'disabled' );

											setTimeout( function () {
												// bind show debug
												jQuery( '#zbs-mail-delivery-showdebug' )
													.off( 'click' )
													.on( 'click', function ( e ) {
														jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
														e.preventDefault();
													} );
											}, 0 );
										}, 1000 );
									} else {
										// some kind of error, suggest retry
										var resHTML = window.zeroBSCRMJS_globViewLang(
											'settingsValidatedSMTPProbeError'
										);
										jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );
										jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
											'<i class="warning sign icon"></i>'
										);

										// enable back button, disable finish button
										jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
										jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );

										// bind show debug
										jQuery( '#zbs-mail-delivery-showdebug' )
											.off( 'click' )
											.on( 'click', function () {
												jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
											} );

										setTimeout( function () {
											// bind show debug
											jQuery( '#zbs-mail-delivery-showdebug' )
												.off( 'click' )
												.on( 'click', function ( e ) {
													jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
													e.preventDefault();
												} );
										}, 0 );
									}
								}, 1000 );

								setTimeout( function () {
									// bind show debug
									jQuery( '#zbs-mail-delivery-showdebug' )
										.off( 'click' )
										.on( 'click', function ( e ) {
											jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
											e.preventDefault();
										} );
								}, 0 );
							},
							error: function ( response ) {
								// debug (likely timed out)
								jQuery( '#zbs-mail-delivery-wizard-admdebug' ).html(
									'<strong>Debug Log</strong>:<br />' +
										window.zeroBSCRMJS_globViewLang( 'likelytimeout' )
								);

								// remove loading
								jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).removeClass( 'loading' );
								jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
									'<i class="warning sign icon"></i>'
								);

								// some kind of error, suggest retry
								var resHTML = window.zeroBSCRMJS_globViewLang(
									'settingsValidatedSMTPGeneralError'
								);
								jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

								// enable back button, disable finish button
								jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
								jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );

								setTimeout( function () {
									// bind show debug
									jQuery( '#zbs-mail-delivery-showdebug' )
										.off( 'click' )
										.on( 'click', function ( e ) {
											jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
											e.preventDefault();
										} );
								}, 0 );
							},
						} );
					} // had open ports
					else {
						// ports blocked

						// 2.94.2 we also added hidden output of all debugs (click to show)
						if ( typeof response.debugs !== 'undefined' ) {
							var debugStr = '';
							if ( response.debugs.length > 0 ) {
								jQuery.each( response.debugs, function ( ind, ele ) {
									debugStr += '<hr />' + ele;
								} );
							}
							jQuery( '#zbs-mail-delivery-wizard-admdebug' ).html(
								'<strong>Debug Log (Ports Blocked)</strong>:<br />' + debugStr
							);

							// remove loading
							jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).removeClass( 'loading' );
							jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
								'<i class="warning sign icon"></i>'
							);

							// some kind of error, suggest retry
							var resHTML = window.zeroBSCRMJS_globViewLang( 'likelytimeout' );
							jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

							// enable back button, disable finish button
							jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
							jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );

							setTimeout( function () {
								// bind show debug
								jQuery( '#zbs-mail-delivery-showdebug' )
									.off( 'click' )
									.on( 'click', function ( e ) {
										jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
										e.preventDefault();
									} );
							}, 0 );
						}
					}
				},
				error: function ( response ) {
					// debug (likely timed out)
					jQuery( '#zbs-mail-delivery-wizard-admdebug' ).html(
						'<strong>Debug Log (Ports Blocked)</strong>:<br />' +
							window.zeroBSCRMJS_globViewLang( 'likelytimeout' )
					);

					// remove loading
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).removeClass( 'loading' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
						'<i class="warning sign icon"></i>'
					);

					// some kind of error, suggest retry
					var resHTML = window.zeroBSCRMJS_globViewLang( 'likelytimeout' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

					// enable back button, disable finish button
					jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
					jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );

					setTimeout( function () {
						// bind show debug
						jQuery( '#zbs-mail-delivery-showdebug' )
							.off( 'click' )
							.on( 'click', function ( e ) {
								jQuery( '#zbs-mail-delivery-wizard-admdebug' ).toggle();
								e.preventDefault();
							} );
					}, 0 );
				},
			} );

			break;

		// API OAuth methods
		case 'api':
			// loading
			jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).addClass( 'loading' );

			// Build data args
			// Note this also adds a new Mail Delivery line to the options (or updates an old one with same email)
			var data = {
				action: 'jpcrm_maildelivery_validation_api',
				send_from_name: window.zeroBSCRMJS_SMTPWiz.sendFromName,
				send_from_email: window.zeroBSCRMJS_SMTPWiz.sendFromEmail,
				oauth_provider: window.zeroBSCRMJS_SMTPWiz.oauth_profile_key,
				sec: window.zbs_root.jpcrm_nonce,
			};

			// Send it Pat :D
			jQuery.ajax( {
				type: 'POST',
				url: ajaxurl,
				data: data,
				dataType: 'json',
				timeout: 20000,
				success: function ( response ) {
					// remove loading
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' )
						.removeClass( 'loading' )
						.html( '<i class="open envelope outline icon"></i>' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( '' );

					// success?
					if ( typeof response.success !== 'undefined' ) {
						// show result
						var resHTML =
							window.zeroBSCRMJS_globViewLang( 'settingsValidatedOAuth' ) +
							'<div class="zbs-validated">' +
							window.zeroBSCRMJS_SMTPWiz.sendFromEmail +
							'</div>';
						jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

						// enable finish button, remove back button
						jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).hide();
						jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).show().removeClass( 'disabled' );
					} else {
						// some kind of error, suggest retry
						var resHTML = window.zeroBSCRMJS_globViewLang( 'settingsValidatedOAuthError' );
						jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );
						jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
							'<i class="warning sign icon"></i>'
						);

						// enable back button, disable finish button
						jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
						jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );
					}
				},
				error: function ( response ) {
					// remove loading
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).removeClass( 'loading' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console-ico' ).html(
						'<i class="warning sign icon"></i>'
					);

					// some kind of error, suggest retry
					var resHTML = window.zeroBSCRMJS_globViewLang( 'settingsValidatedOAuthError' );
					jQuery( '#zbs-mail-delivery-wizard-validate-console' ).html( resHTML );

					// enable back button, disable finish button
					jQuery( '#zbs-mail-delivery-wizard-step-3-back' ).show();
					jQuery( '#zbs-mail-delivery-wizard-step-3-submit' ).addClass( 'disabled' );
				},
			} );

			break;
	} // / switch
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zeroBSCRMJS_SMTPWiz, zbsTestDelivery, oauth_profile_key,
		zeroBSCRMJS_refreshPage, zeroBSCRMJS_mail_delivery_bindList,
		zeroBSCRMJS_mail_delivery_bindWizard, zeroBSCRMJS_validateSettings };
}
