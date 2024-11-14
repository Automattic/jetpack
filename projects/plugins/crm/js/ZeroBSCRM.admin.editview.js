/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */
jQuery( document ).ready( function () {
	// init if settings there (not on non-listview pages)
	if ( typeof window.zbsEditSettings !== 'undefined' ) {
		zeroBSCRMJS_initEditView();
		if ( typeof window.zbsEditSettings.objdbname !== 'undefined' ) {
			// check type :)
			if ( window.zbsEditSettings.objdbname == 'contact' ) {
				zeroBSCRMJS_editContactInit();
				jpcrm_bind_linkify();
			} else if ( window.zbsEditSettings.objdbname == 'company' ) {
				jpcrm_bind_linkify();
			} else if ( window.zbsEditSettings.objdbname == 'event' ) {
				setTimeout( function () {
					jpcrm_tasks_showContactLinkIf( jQuery( '#zbse_customer' ).val() );
					jpcrm_tasks_showCompanyLinkIf( jQuery( '#zbse_company' ).val() );
				}, 0 );
			}
		}
	}
} );

// Generic / all edit views
/**
 *
 */
function zeroBSCRMJS_initEditView() {
	//console.log('settings init');
	// actions button
	jQuery( '.ui.dropdown' ).dropdown();

	// metabox dropdowns:
	//jQuery('.zbs-metabox .ui.dropdown').dropdown();

	// Submit button (learn bar)
	jQuery( '#zbs-edit-save' )
		.off( 'click' )
		.on( 'click', function () {
			// copy tags into input (if any)
			zeroBSCRMJS_buildTagsInput();

			// set flag to say 'okay to save changes (skip warning)'
			window.zbscrmjsPageChangesSave = true;

			// save
			jQuery( '#zbs-edit-form' ).submit();

			// catch all (save didn't work?)
			setTimeout( function () {
				window.zbscrmjsPageChangesSave = false;
			}, 2000 );
		} );

	// draw
	zeroBSCRMJS_drawEditView();

	// init pre-leave if dirty
	zeroBSCRMJS_preLeaveEditView();
}

var zbscrmjsPageChangesSave = false; // this is a flag, letting it not prompt when
/**
 *
 */
function zeroBSCRMJS_preLeaveEditView() {
	/* moved inline to the save func assigned to button to have absolute control of order.
    jQuery('#zbs-edit-save').on( 'click', function(){
        window.zbscrmjsPageChangesSave = true;

        setTimeout(function(){
            window.zbscrmjsPageChangesSave = false;
        },2000);
    }); */

	jQuery( window ).on( 'beforeunload', function () {
		if (
			Object.keys( window.zbscrmjsPageChanges ).length > 0 &&
			! window.zbscrmjsPageChangesSave
		) {
			// Chrome doesn't even show this message, it defaults to its own
			// Leave Site? Changes you have made might not be saved?
			// so leave english here, will probs be ignored.
			return 'Are you sure you want to leave, you will loose unsaved changes?';
		}
	} );
}

// passes language from window.zbsEditViewLangLabels (js set in listview php)
/**
 * @param key
 * @param fallback
 */
function zeroBSCRMJS_editViewLang( key, fallback ) {
	if ( typeof fallback === 'undefined' ) {
		var fallback = '';
	}

	if ( typeof window.zbsEditViewLangLabels[ key ] !== 'undefined' ) {
		return window.zbsEditViewLangLabels[ key ];
	}

	return fallback;
}

/**
 *
 */
function zeroBSCRMJS_drawEditView() {
	//console.log('drawing with',window.zbsListViewParams);

	// if no blocker
	if ( ! window.zbsDrawEditViewBlocker ) {
		// put blocker up
		window.zbsDrawEditViewBlocker = true;

		// Draw tags
		zeroBSCRMJS_buildTags();

		zeroBSCRMJS_editViewBinds();

		// hide any notifications
		zeroBSCRMJS_hideNotificationsAfter();
	}
}

/**
 *
 */
function zeroBSCRMJS_editViewBinds() {}

// hides non-urgent notifications after 1.5s
/**
 *
 */
function zeroBSCRMJS_hideNotificationsAfter() {
	setTimeout( function () {
		jQuery( '#zbs-edit-notification-wrap .zbs-not-urgent' ).slideUp( 300, function () {
			// if no notifications, after, hide the notification wrap :)
			if ( jQuery( '#zbs-edit-notification-wrap .ui.info:visible' ).length == 0 ) {
				jQuery( '#zbs-edit-notification-row' ).hide();
			}
		} );
	}, 1500 );
}

/* ============================================================================================================

    Edit contact specific JS (Taken from editcust.js old file for DB2 edit view)

============================================================================================================ */

// Contact Edit specifics
/**
 *
 */
function zeroBSCRMJS_editContactInit() {
	var picture_file_input = document.getElementById( 'zbsc_profile-picture-file' );

	if ( picture_file_input ) {
		picture_file_input.addEventListener( 'change', jpcrm_customer_profile_picture_on_change );
	}

	var picture_file_remove_btn = document.getElementById( 'zbsc_remove-profile-picture-button' );

	if ( picture_file_remove_btn ) {
		picture_file_remove_btn.addEventListener( 'click', jpcrm_customer_remove_profile_picture );
	}

	jQuery( '.send-sms-none' ).on( 'click', function ( e ) {
		swal(
			'Twilio Extension Needed!',
			'To SMS your contacts you need the <a target="_blank" style="font-weight:900;text-decoration:underline;" href="https://jetpackcrm.com/extension-bundles/">Twilio extension</a> (included in our Entrepreneurs Bundle)',
			'info'
		);
	} );
}

/**
 *
 */
function jpcrm_customer_profile_picture_on_change() {
	// shows the preview
	document.getElementById( 'zbsc_remove-profile-picture' ).value = 0;
	document.getElementById( 'empty-profile-picture' ).style.display = 'none';
	document.getElementById( 'profile-picture-img' ).style.display = 'inline-block';
	document.getElementById( 'profile-picture-img' ).src = window.URL.createObjectURL(
		document.getElementById( 'zbsc_profile-picture-file' ).files[ 0 ]
	);
}

/**
 *
 */
function jpcrm_customer_remove_profile_picture() {
	// clears the previous picture selected if any
	document.getElementById( 'zbsc_remove-profile-picture' ).value = 1;
	document.getElementById( 'empty-profile-picture' ).style.display = 'inline-block';
	document.getElementById( 'profile-picture-img' ).style.display = 'none';
	document.getElementById( 'zbsc_profile-picture-file' ).value = null;
}

/**
 *
 */
function jpcrm_bind_linkify() {
	// automatic "linkify" check + add
	// note - not certain if this may interfere with some, if so, exclude via class (as they'll be added e.g. email)
	jQuery( '.zbs-text-input input' ).keyup( function () {
		zeroBSCRMJS_initLinkify( this );
	} );
	// fire linkify for all inputs on load
	jQuery( '.zbs-text-input input' ).each( function ( ind, ele ) {
		zeroBSCRMJS_initLinkify( ele );
	} );
}

/**
 * @param ele
 */
function zeroBSCRMJS_initLinkify( ele ) {
	// find any links?
	var v = jQuery( ele ).val();
	var bound = false;
	if ( v.length > 5 ) {
		var possMatch = zeroBSCRMJS_retrieveURLS( v );

		if ( typeof possMatch === 'object' && typeof possMatch !== 'null' ) {
			if ( possMatch != null && possMatch[ 0 ] != 'undefined' ) {
				// remove any prev
				jQuery( '.zbs-linkify', jQuery( ele ).parent() ).remove();

				// linkify
				jQuery( ele )
					.parent()
					.addClass( 'ui action input fluid' )
					.append(
						'<button class="ui icon button zbs-linkify" type="button" data-url="' +
							encodeURI( possMatch[ 0 ] ) +
							'" title="Go To ' +
							encodeURI( possMatch[ 0 ] ) +
							'"><i class="linkify icon"></i></button>'
					);

				// rebind
				zeroBSCRMJS_bindLinkify();

				bound = true;
			}
		} else {
			/* not inc in rollout - wait for MS email func + tie in

                // emails
                var possMatch = zeroBSCRMJS_retrieveEmails(v);

                if (possMatch != null && possMatch[0] != "undefined"){

                    // remove any prev
                    jQuery('.zbs-linkify',jQuery(ele).parent()).remove();

                    // linkify
                    jQuery(ele).parent().addClass('ui action input').append('<button class="ui icon button zbs-linkify" type="button" data-url="mailto:' + possMatch[0] + '" title="Email "' + possMatch[0] + '""><i class="mail outline icon"></i></button>');

                    // rebind
                    zeroBSCRMJS_bindLinkify();

                    bound = true;

                }

                */
		}
	}

	// unlinkify if not
	if ( ! bound ) {
		jQuery( '.zbs-linkify', jQuery( ele ).parent() ).remove();
		jQuery( ele ).parent().removeClass( 'ui action input fluid' );
	}
}

/**
 *
 */
function zeroBSCRMJS_bindLinkify() {
	jQuery( '.zbs-linkify' )
		.off( 'click' )
		.on( 'click', function () {
			var u = jQuery( this ).attr( 'data-url' );
			if ( typeof u !== 'undefined' && u != '' ) {
				window.open( u, '_blank' );
			}
		} );
}
/* ============================================================================================================

   /  Edit contact specific JS (Taken from editcust.js old file for DB2 edit view)

============================================================================================================ */

/* ============================================================================================================

    Edit task specific JS

============================================================================================================ */

// set:
/**
 * @param obj
 */
function jpcrm_tasks_setContact( obj ) {
	if ( typeof obj.id !== 'undefined' ) {
		jQuery( '#zbse_customer' ).val( obj.id );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showContactLinkIf( obj.id );
		}, 0 );
	}
}
/**
 * @param obj
 */
function jpcrm_tasks_setCompany( obj ) {
	if ( typeof obj.id !== 'undefined' ) {
		// set vals
		jQuery( '#zbse_company' ).val( obj.id );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showCompanyLinkIf( obj.id );
		}, 0 );
	}
}
// change: (catch emptying):
/**
 * @param o
 */
function jpcrm_tasks_changeContact( o ) {
	if ( typeof o === 'undefined' || o == '' ) {
		jQuery( '#zbse_customer' ).val( '' );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showContactLinkIf( '' );
		}, 0 );
	}
}
/**
 * @param o
 */
function jpcrm_tasks_changeCompany( o ) {
	if ( typeof o === 'undefined' || o == '' ) {
		jQuery( '#zbse_company' ).val( '' );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showCompanyLinkIf( '' );
		}, 0 );
	}
}

// if a contact is selected (against a task) can 'quick nav' to contact
/**
 * @param contactID
 */
function jpcrm_tasks_showContactLinkIf( contactID ) {
	// remove old
	jQuery( '.zbs-task-for .zbs-view-contact' ).remove();
	jQuery( '#jpcrm-task-learn-nav .zbs-quicknav-contact' ).remove();

	if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
		contactID = parseInt( contactID );
		if ( contactID > 0 ) {
			var html = '<div class="ui mini animated button zbs-view-contact">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_editViewLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="user icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '.zbs-task-for' ).prepend( html );

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-quicknav-contact ui icon button black mini labeled" href="' +
				window.zbsObjectViewLinkPrefixCustomer +
				contactID +
				'"><i class="user icon"></i> ' +
				zeroBSCRMJS_editViewLang( 'contact', 'Contact' ) +
				'</a>';
			jQuery( '#jpcrm-task-learn-nav' ).append( navButton );

			// bind
			jpcrm_tasks_bindContactLinkIf();
		}
	}
}

// click for quicknav :)
/**
 *
 */
function jpcrm_tasks_bindContactLinkIf() {
	jQuery( '.zbs-task-for .zbs-view-contact' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			var contactID = parseInt( jQuery( '#zbse_customer' ).val() );

			if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
				contactID = parseInt( contactID );
				if ( contactID > 0 ) {
					var url = window.zbsObjectViewLinkPrefixCustomer + contactID;

					window.open( url, '_parent' );
				}
			}
		} );
}

// if a company is selected (against a task) can 'quick nav' to company
/**
 * @param companyID
 */
function jpcrm_tasks_showCompanyLinkIf( companyID ) {
	// remove old
	jQuery( '.zbs-task-for-company .zbs-view-company' ).remove();
	jQuery( '#jpcrm-task-learn-nav .zbs-quicknav-company' ).remove();

	if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
		companyID = parseInt( companyID );
		if ( companyID > 0 ) {
			var html = '<div class="ui mini animated button zbs-view-company">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_editViewLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="building icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '.zbs-task-for-company' ).prepend( html );

			// ALSO show in header bar, if so
			var navButton =
				'<a target="_blank" style="margin-left:6px;" class="zbs-quicknav-contact ui icon button black mini labeled" href="' +
				window.zbsObjectViewLinkPrefixCompany +
				companyID +
				'"><i class="user icon"></i> ' +
				zeroBSCRMJS_editViewLang( 'company', 'Company' ) +
				'</a>';
			jQuery( '#jpcrm-task-learn-nav' ).append( navButton );

			// bind
			jpcrm_tasks_bindCompanyLinkIf();
		}
	}
}

// click for quicknav :)
/**
 *
 */
function jpcrm_tasks_bindCompanyLinkIf() {
	jQuery( '.zbs-task-for-company .zbs-view-company' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			var companyID = parseInt( jQuery( '#zbse_company' ).val() );

			if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
				companyID = parseInt( companyID );
				if ( companyID > 0 ) {
					var url = window.zbsObjectViewLinkPrefixCompany + companyID;

					window.open( url, '_parent' );
				}
			}
		} );
}

/* ============================================================================================================

    / Edit task specific JS

============================================================================================================ */


if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_tasks_setContact, jpcrm_tasks_setCompany, jpcrm_tasks_changeContact,
		jpcrm_tasks_changeCompany, zeroBSCRMJS_initEditView, zeroBSCRMJS_preLeaveEditView, zeroBSCRMJS_editViewLang,
		zeroBSCRMJS_drawEditView, zeroBSCRMJS_editViewBinds, zeroBSCRMJS_hideNotificationsAfter,
		zeroBSCRMJS_editContactInit, jpcrm_customer_profile_picture_on_change, jpcrm_customer_remove_profile_picture,
		jpcrm_bind_linkify, zeroBSCRMJS_initLinkify, zeroBSCRMJS_bindLinkify, jpcrm_tasks_showContactLinkIf,
		jpcrm_tasks_bindContactLinkIf, jpcrm_tasks_showCompanyLinkIf, jpcrm_tasks_bindCompanyLinkIf,
		zbscrmjsPageChangesSave };
}
