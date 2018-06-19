/* exported JetpackMemberships */
/* jshint unused:false, es3:false, esversion:5 */

var JetpackMemberships = {
	listener: null,
	wrapper: null,
	success: function() {},
	iframeResult: function( evt ) {
		if ( evt.origin === 'https://subscribe.wordpress.com' ) {
			window.removeEventListener( 'message', JetpackMemberships.iframeResult );
			console.log( 'JSON', evt );
			var data = JSON.parse( evt.data );
			if ( data.success ) {
				JetpackMemberships.success( data );
			}
			tb_remove();
		}
	},
	initPurchaseButton: function ( blogId, planId, cssClass ) {
		var wrapper = jQuery( '.' + cssClass );
		wrapper.find( '.jetpack-memberships_purchase_button' ).click( function() {
			JetpackMemberships.success = function( data ) {
				wrapper.append( "<div class='jetpack-memberships_success'>" +
					"<h4>Success!</h4>" +
					"<p>You have purchased subscription and now can enjoy all the benefits.</p>" +
					"<p>Your subscription is valid until '" + data.end_date + "'</p>" +
					"</div>" );
			};
			JetpackMemberships.listener = window.addEventListener( 'message', JetpackMemberships.iframeResult, false );
			tb_show(null, 'https://subscribe.wordpress.com/memberships/?blog=' + blogId + '&plan=' + planId + 'TB_iframe=true&height=400&width=500', null);
		} );
	}
};
