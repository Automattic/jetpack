/* global jQuery */
/* jshint esversion: 5, es3:false */
var JetpackEmailSubscribe = {
	validateEmail: function( email ) {
		var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		return re.test( String( email ).toLowerCase() );
	},
	activate: function( blogId, domId, cssPrefix ) {
		var form = jQuery( '#' + domId );
		form.submit( function( e ) {
			e.preventDefault();
			var emailField = form.find( '.' + cssPrefix + '-email' );
			emailField.removeClass( cssPrefix + '-form-error' );
			var email = emailField.val();

			if ( ! JetpackEmailSubscribe.validateEmail( email ) ) {
				emailField.addClass( cssPrefix + '-form-error' );
				return false;
			}

			jQuery( '#' + domId + ' form' ).hide();
			jQuery( '.' + cssPrefix + '-processing' ).show();
			jQuery.get( 'https://public-api.wordpress.com/rest/v1.1/sites/' + blogId + '/email_follow/subscribe?email=' + email )
			.done( function( response ) {
				jQuery( '.' + cssPrefix + '-processing' ).hide();
				if ( response.error ) {
					jQuery( '.' + cssPrefix + '-error' ).show();
				} else {
					jQuery( '.' + cssPrefix + '-success' ).show();
				}
			} )
			.fail( function() {
				jQuery( '.' + cssPrefix + '-processing' ).hide();
				jQuery( '.' + cssPrefix + '-error' ).show();
			} );

			return false;
		} );
	}
};
