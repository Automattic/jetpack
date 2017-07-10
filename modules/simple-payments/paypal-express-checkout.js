/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

/* global paypal */
/* exported PaypalExpressCheckout */
/* jshint unused:false */
var PaypalExpressCheckout = {
	constants: {
		createPaymentEndpoint: '', //TODO: point to the actual endpoint
		executePaymentEndpoint: '' //TODO: point to the actual endpoint
	},
	getNumberOfItems( field, enableMultiple ) {
		var numberField, number;
		if ( enableMultiple !== '1' ) {
			return 1;
		}
		numberField = document.getElementById( field );

		if ( ! numberField ) {
			return 1;
		}
		number = Number( numberField.value );

		if ( isNaN( number ) ) {
			return 1;
		}
		return number;
	},
	renderButton: function( id, enableMultiple ) {
		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}
		paypal.Button.render( {
			commit: true,
			style: {
				label: 'pay',
				color: 'blue'
			},
			payment: function() {
				var payload = {
					number: PaypalExpressCheckout.getNumberOfItems( id + '_number', enableMultiple )
				};
				return paypal.request.post( PaypalExpressCheckout.constants.createPaymentEndpoint, payload ).then( function( data ) {
					return data.id;
				} );
			},
			onAuthorize: function( data ) {
				return paypal.request.post( PaypalExpressCheckout.constants.executePaymentEndpoint, {
					paymentID: data.paymentID,
					payerID: data.payerID
				} ).then( function( payment ) {
					// TODO: handle success, errors, messaging, etc, etc.
					/* jshint ignore:start */
					console.log( 'payment: ', payment );
					alert( 'success!' );
					/* jshint ignore:end */
				} );
			}

		}, id + '_button' );
	}
};
