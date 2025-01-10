/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/* global zeroBSCRMJS_buildTagsInput, zeroBSCRMJS_buildTags, swal, zeroBSCRMJS_retrieveURLS */

jQuery( document ).ready( function () {
	// init if settings there (not on non-listview pages)
	if ( typeof window.zbsEditSettings !== 'undefined' ) {
		zeroBSCRMJS_initEditView();
		if ( typeof window.zbsEditSettings.objdbname !== 'undefined' ) {
			// check type :)
			if ( window.zbsEditSettings.objdbname === 'contact' ) {
				zeroBSCRMJS_editContactInit();
				jpcrm_bind_linkify();
			} else if ( window.zbsEditSettings.objdbname === 'company' ) {
				jpcrm_bind_linkify();
			} else if ( window.zbsEditSettings.objdbname === 'event' ) {
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
 * Init edit view.
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

window.zbscrmjsPageChangesSave = false; // this is a flag, letting it not prompt when
/**
 * Warn if leaving page without saving.
 */
function zeroBSCRMJS_preLeaveEditView() {
	jQuery( window ).on( 'beforeunload', function () {
		if (
			Object.keys( window.zbscrmjsPageChanges ).length > 0 &&
			! window.zbscrmjsPageChangesSave
		) {
			// Chrome doesn't even show this message, it defaults to its own
			// Leave Site? Changes you have made might not be saved?
			// so leave english here, will probs be ignored.
			return 'Are you sure you want to leave? You will lose unsaved changes.';
		}
	} );
}

/**
 * Look up language-aware string by key.
 * @param {string} key      - Key to look up language string.
 * @param {string} fallback - Fallback string.
 * @return {string} - Language-aware string.
 */
function zeroBSCRMJS_editViewLang( key, fallback = '' ) {
	if ( typeof window.zbsEditViewLangLabels[ key ] !== 'undefined' ) {
		return window.zbsEditViewLangLabels[ key ];
	}

	return fallback;
}

/**
 * Draw Edit View.
 */
function zeroBSCRMJS_drawEditView() {
	//console.log('drawing with',window.zbsListViewParams);

	// if no blocker
	if ( ! window.zbsDrawEditViewBlocker ) {
		// put blocker up
		window.zbsDrawEditViewBlocker = true;

		// Draw tags
		zeroBSCRMJS_buildTags();

		// hide any notifications
		zeroBSCRMJS_hideNotificationsAfter();
	}
}

/**
 * Hides non-urgent notifications after 1.5s
 */
function zeroBSCRMJS_hideNotificationsAfter() {
	setTimeout( function () {
		jQuery( '#zbs-edit-notification-wrap .zbs-not-urgent' ).slideUp( 300, function () {
			// if no notifications, after, hide the notification wrap :)
			if ( jQuery( '#zbs-edit-notification-wrap .ui.info:visible' ).length === 0 ) {
				jQuery( '#zbs-edit-notification-row' ).hide();
			}
		} );
	}, 1500 );
}

/* ============================================================================================================

    Edit contact specific JS (Taken from editcust.js old file for DB2 edit view)

============================================================================================================ */

/**
 * Contact Edit init.
 */
function zeroBSCRMJS_editContactInit() {
	const picture_file_input = document.getElementById( 'zbsc_profile-picture-file' );

	if ( picture_file_input ) {
		picture_file_input.addEventListener( 'change', jpcrm_customer_profile_picture_on_change );
	}

	const picture_file_remove_btn = document.getElementById( 'zbsc_remove-profile-picture-button' );

	if ( picture_file_remove_btn ) {
		picture_file_remove_btn.addEventListener( 'click', jpcrm_customer_remove_profile_picture );
	}

	jQuery( '.send-sms-none' ).on( 'click', function () {
		swal(
			'Twilio Extension Needed!',
			'To SMS your contacts you need the <a target="_blank" style="font-weight:900;text-decoration:underline;" href="https://jetpackcrm.com/extension-bundles/">Twilio extension</a> (included in our Entrepreneurs Bundle)',
			'info'
		);
	} );
}

/**
 * Handle profile picture change.
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
 * Handle profile picture removal.
 */
function jpcrm_customer_remove_profile_picture() {
	// clears the previous picture selected if any
	document.getElementById( 'zbsc_remove-profile-picture' ).value = 1;
	document.getElementById( 'empty-profile-picture' ).style.display = 'inline-block';
	document.getElementById( 'profile-picture-img' ).style.display = 'none';
	document.getElementById( 'zbsc_profile-picture-file' ).value = null;
}

/**
 * Handle pseudolink click.
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
 * Add a pseudolink next to an element.
 * @param {HTMLElement} ele - Element.
 */
function zeroBSCRMJS_initLinkify( ele ) {
	// find any links?
	const v = jQuery( ele ).val();
	let bound = false;
	if ( v.length > 5 ) {
		const possMatch = zeroBSCRMJS_retrieveURLS( v );

		if ( typeof possMatch === 'object' && typeof possMatch[ 0 ] !== 'undefined' ) {
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
	}

	// unlinkify if not
	if ( ! bound ) {
		jQuery( '.zbs-linkify', jQuery( ele ).parent() ).remove();
		jQuery( ele ).parent().removeClass( 'ui action input fluid' );
	}
}

/**
 * Make things linkified.
 */
function zeroBSCRMJS_bindLinkify() {
	jQuery( '.zbs-linkify' )
		.off( 'click' )
		.on( 'click', function () {
			const u = jQuery( this ).attr( 'data-url' );
			if ( typeof u !== 'undefined' && u !== '' ) {
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

/**
 * Set contact on task.
 * @param {object} obj - Contact object.
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
 * Set company on task.
 * @param {object} obj - Company object.
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

/**
 * Clear contact as needed.
 * @param {any} o - some var
 */
function jpcrm_tasks_changeContact( o ) {
	if ( typeof o === 'undefined' || ! o ) {
		jQuery( '#zbse_customer' ).val( '' );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showContactLinkIf( '' );
		}, 0 );
	}
}

/**
 * Clear company as needed.
 * @param {any} o - some var
 */
function jpcrm_tasks_changeCompany( o ) {
	if ( typeof o === 'undefined' || ! o ) {
		jQuery( '#zbse_company' ).val( '' );

		setTimeout( function () {
			// when select drop down changed, show/hide quick nav
			jpcrm_tasks_showCompanyLinkIf( '' );
		}, 0 );
	}
}

/**
 * Add contact link to task page.
 * @param {number} contactID - contact ID
 */
function jpcrm_tasks_showContactLinkIf( contactID ) {
	// remove old
	jQuery( '.zbs-task-for .zbs-view-contact' ).remove();
	jQuery( '#jpcrm-task-learn-nav .zbs-quicknav-contact' ).remove();

	if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
		contactID = parseInt( contactID );
		if ( contactID > 0 ) {
			let html = '<div class="ui mini animated button zbs-view-contact">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_editViewLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="user icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '.zbs-task-for' ).prepend( html );

			// ALSO show in header bar, if so
			const navButton =
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

/**
 * Handle contact nav click.
 */
function jpcrm_tasks_bindContactLinkIf() {
	jQuery( '.zbs-task-for .zbs-view-contact' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			let contactID = parseInt( jQuery( '#zbse_customer' ).val() );

			if ( typeof contactID !== 'undefined' && contactID !== null && contactID !== '' ) {
				contactID = parseInt( contactID );
				if ( contactID > 0 ) {
					const url = window.zbsObjectViewLinkPrefixCustomer + contactID;

					window.open( url, '_parent' );
				}
			}
		} );
}

/**
 * Add company link to task page.
 * @param {number} companyID - company ID
 */
function jpcrm_tasks_showCompanyLinkIf( companyID ) {
	// remove old
	jQuery( '.zbs-task-for-company .zbs-view-company' ).remove();
	jQuery( '#jpcrm-task-learn-nav .zbs-quicknav-company' ).remove();

	if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
		companyID = parseInt( companyID );
		if ( companyID > 0 ) {
			let html = '<div class="ui mini animated button zbs-view-company">';
			html +=
				'<div class="visible content">' + zeroBSCRMJS_editViewLang( 'view', 'View' ) + '</div>';
			html += '<div class="hidden content">';
			html += '<i class="building icon"></i>';
			html += '</div>';
			html += '</div>';

			jQuery( '.zbs-task-for-company' ).prepend( html );

			// ALSO show in header bar, if so
			const navButton =
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

/**
 * Handle company nav click.
 */
function jpcrm_tasks_bindCompanyLinkIf() {
	jQuery( '.zbs-task-for-company .zbs-view-company' )
		.off( 'click' )
		.on( 'click', function () {
			// get from hidden input
			let companyID = parseInt( jQuery( '#zbse_company' ).val() );

			if ( typeof companyID !== 'undefined' && companyID !== null && companyID !== '' ) {
				companyID = parseInt( companyID );
				if ( companyID > 0 ) {
					const url = window.zbsObjectViewLinkPrefixCompany + companyID;

					window.open( url, '_parent' );
				}
			}
		} );
}

/* ============================================================================================================

    / Edit task specific JS

============================================================================================================ */

if ( typeof module !== 'undefined' ) {
	module.exports = {
		jpcrm_tasks_setContact,
		jpcrm_tasks_setCompany,
		jpcrm_tasks_changeContact,
		jpcrm_tasks_changeCompany,
		zeroBSCRMJS_initEditView,
		zeroBSCRMJS_preLeaveEditView,
		zeroBSCRMJS_editViewLang,
		zeroBSCRMJS_drawEditView,
		zeroBSCRMJS_hideNotificationsAfter,
		zeroBSCRMJS_editContactInit,
		jpcrm_customer_profile_picture_on_change,
		jpcrm_customer_remove_profile_picture,
		jpcrm_bind_linkify,
		zeroBSCRMJS_initLinkify,
		zeroBSCRMJS_bindLinkify,
		jpcrm_tasks_showContactLinkIf,
		jpcrm_tasks_bindContactLinkIf,
		jpcrm_tasks_showCompanyLinkIf,
		jpcrm_tasks_bindCompanyLinkIf,
	};
}
