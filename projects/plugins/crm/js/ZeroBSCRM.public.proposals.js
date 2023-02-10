/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.2.5
 *
 * Copyright 2020 Automattic
 *
 * Date: 19/01/2017
 */
var zbsCRM_JS_proposalBlocker = false;
jQuery( function () {
	jQuery( '#zbs-proposal-accept' ).on( 'click', function () {
		// do smt?
		if ( window.zbsCRM_JS_proposalBlocker ) {
			return;
		}

		// block double clicks etc.
		window.zbsCRM_JS_proposalBlocker = true;

		// retrieve id
		var quoteID = parseInt( window.jpcrm_proposal_data.quote_id );
		var quoteHash = window.jpcrm_proposal_data.quote_hash;

		// Got a potential quote id?
		if ( quoteID > 0 ) {
			zbsCRM_JS_acceptProp( quoteHash, quoteID )
				.done(
					function ( quoteID ) {
						// good - fade out actions + say 'accepted, thanks'
						jQuery( '#zerobs-proposal-actions-' + quoteID ).slideUp();
						jQuery( '#zbs-quote-accepted-' + quoteID ).slideDown();

						// unblock
						window.zbsCRM_JS_proposalBlocker = false;
					}.bind( null, quoteID )
				)
				.fail(
					function ( quoteID ) {
						// show fail message
						jQuery( '#zbs-quote-failed-' + quoteID ).slideDown();
					}.bind( null, quoteID )
				)
				.always( function () {
					// unblock
					window.zbsCRM_JS_proposalBlocker = false;
				} );
		}
	} );
} );

/**
 * @param quoteHash
 * @param quoteID
 */
function zbsCRM_JS_acceptProp( quoteHash, quoteID ) {
	// postbag!
	var data = {
		action: 'zbs_quotes_accept_quote',
		sec: window.jpcrm_proposal_data.proposal_nonce,
		// data
		'zbs-quote-hash': quoteHash,
		'zbs-quote-id': quoteID,
		'zbs-quote-signedby': '',
	};

	// Send
	return jQuery.ajax( {
		type: 'POST',
		url: window.jpcrm_proposal_data.ajax_url,
		data: data,
		dataType: 'json',
		timeout: 20000,
	} );
}

if ( typeof module !== 'undefined' ) {
    module.exports = { zbsCRM_JS_proposalBlocker, zbsCRM_JS_acceptProp };
}
