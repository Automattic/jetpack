/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

/* global paypal */
/* exported PaypalExpressCheckout */
/* jshint unused:false */
var PaypalExpressCheckout = {
	sandbox: true,
	$purchaseMessageContainer: null,
	getCreatePaymentEndpoint: function( blogId ) {
		return 'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/simple-payments/paypal/payment';
	},
	getExecutePaymentEndpoint: function( blogId, paymentId ) {
		return 'https://public-api.wordpress.com/wpcom/v2/sites/' + blogId + '/simple-payments/paypal/' + paymentId + '/execute';
	},
	getNumberOfItems: function( field, enableMultiple ) {
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
	togglePurcahseMessage: function( message, successOrError ) {
		if ( ! this.$purchaseMessageContainer ) {
			this.$purchaseMessageContainer = jQuery( '.jetpack-simple-payments__purchase-message' );
		}

		if ( this.$purchaseMessageContainer.hasClass( 'show' ) ) {
			this.$purchaseMessageContainer
				.removeClass( 'show' )
				.text( '' )
				.removeClass( 'success error' );
		} else {
			this.$purchaseMessageContainer
				.text( message )
				.addClass( 'show ' + successOrError );
		}
	},
	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = PaypalExpressCheckout.sandbox ? 'sandbox' : 'production';
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
			payment: function( paymentData ) {
				PaypalExpressCheckout.togglePurcahseMessage();

				var payload = {
					number: PaypalExpressCheckout.getNumberOfItems( domId + '_number', enableMultiple ),
					buttonId: buttonId,
					env: env
				};

				return paypal.request.post( PaypalExpressCheckout.getCreatePaymentEndpoint( blogId ), payload )
				.then( function( paymentResponse ) {
					return paymentResponse.id;
				} )
				.catch( function( paymentError ) {
					PaypalExpressCheckout.togglePurcahseMessage( paymentError, 'error' );
				} );
			},
			onAuthorize: function( onAuthData ) {
				PaypalExpressCheckout.togglePurcahseMessage();

				return paypal.request.post( PaypalExpressCheckout.getExecutePaymentEndpoint( blogId, onAuthData.paymentID ), {
					buttonId: buttonId,
					payerId: onAuthData.payerID,
					env: env
				} )
				.then( function( authResponse ) {
					var payerInfo = authResponse.payer.payer_info;
					var message =
						'<strong>Thank you for your purchase, ' + payerInfo.first_name + '!</strong>' +
						'<br />' +
						'The purchase has been successful. <br />' +
						'For more details, an email has been sent to your email address <em>' + payerInfo.email + '<em>.';

					PaypalExpressCheckout.togglePurcahseMessage( message, 'success' );

					// TODO: handle success, errors, messaging, etc, etc.
					/* jshint ignore:start */
					/* jshint ignore:end */
				} )
				.catch( function( authError ) {
					PaypalExpressCheckout.togglePurcahseMessage( 'Error!', 'error' );
					// console.log( 'authError: %o', authError );
				} );
			}

		}, domId + '_button' );
	}
};
