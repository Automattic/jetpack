/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

/* global paypal */
/* exported PaypalExpressCheckout */
/* jshint unused:false */
var PaypalExpressCheckout = {
	getCreatePaymentEndpoint: function( blogId ) {
		return 'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/simple-payments/paypal/payment';
	},
	getExecutePaymentEndpoint: function( blogId, paymentId ) {
		return 'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/simple-payments/paypal/' + paymentId + '/execute';
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
	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = 'sandbox';
		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}
		paypal.Button.render( {
			env: env,
			commit: true,
			style: {
				label: 'pay',
				color: 'blue'
			},
			payment: function() {
				var payload = {
					number: PaypalExpressCheckout.getNumberOfItems( domId + '_number', enableMultiple ),
					buttonId: buttonId,
					env: env
				};
				return paypal.request.post( PaypalExpressCheckout.getCreatePaymentEndpoint( blogId ), payload ).then( function( data ) {
					return data.id;
				} );
			},
			onAuthorize: function( data ) {
				return paypal.request.post( PaypalExpressCheckout.getExecutePaymentEndpoint( blogId, data.paymentID ), {
					buttonId: buttonId,
					payerId: data.payerID
				} ).then( function( payment ) {
					// TODO: handle success, errors, messaging, etc, etc.
					/* jshint ignore:start */
					console.log( 'payment: ', payment );
					alert( 'success!' );
					/* jshint ignore:end */
				} );
			}

		}, domId + '_button' );
	}
};
