/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

/**
 * Get the DOM element-placeholder used to show message
 * about the transaction. If it doesn't exist then the function will create a new one.
 * 
 * @param  string buttonDomId id of the payment button placeholder
 * @return Element the dom element to print the message
 */
var getButtonMessageElement = function ( buttonDomId ) {
	var messageDomId = buttonDomId + '_message';

	var domButtonElement = document.getElementById( buttonDomId );
	var domMessageElement = document.getElementById( messageDomId );

	if ( domMessageElement ) {
		return domMessageElement;
	}

	// create dom message element
	domMessageElement = document.createElement( 'div' );
	domMessageElement.setAttribute( 'class', 'jetpack-simple-payments-message-placeholder' );
	domMessageElement.setAttribute( 'id', messageDomId );
	domMessageElement.style.display = 'none';

	// inject into the DOM Tree
	domButtonElement.appendChild( domMessageElement );

	return domMessageElement;
}

var showMessage = function( message, el ) {
	// show message 500ms after Paypal popup is closed
	setTimeout( function() {
		el.style.display = 'block';
		el.style.color = '#06F';
		el.innerHTML = message;
	}, 1000 );
}

/* global paypal */
/* exported PaypalExpressCheckout */
/* jshint unused:false */
var PaypalExpressCheckout = {
	sandbox: true,
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
	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = PaypalExpressCheckout.sandbox ? 'sandbox' : 'production';
		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}

		// message DOM element instance
		var paypalMessagePlaceholder;

		paypal.Button.render( {
			env: env,
			commit: true,
			style: {
				label: 'pay',
				color: 'blue'
			},
			payment: function( paymentData ) {
				paypalMessagePlaceholder = getButtonMessageElement( domId + '_button' );

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
					showMessage( paymentError, paypalMessagePlaceholder );
				} );
			},
			onAuthorize: function( onAuthData ) {
				return paypal.request.post( PaypalExpressCheckout.getExecutePaymentEndpoint( blogId, onAuthData.paymentID ), {
					buttonId: buttonId,
					payerId: onAuthData.payerID,
					env: env
				} )
				.then( function( authResponse ) {
					var payerInfo = authResponse.payer.payer_info;
					var message = 'Thanks <strong>' + payerInfo.first_name + '</strong>! ' +
						'The purchase has been successful.<br />' +
						'For more details, an email has been sent to the <em>' + payerInfo.email + '<em>.';

					showMessage( message, paypalMessagePlaceholder );

					// TODO: handle success, errors, messaging, etc, etc.
					/* jshint ignore:start */
					/* jshint ignore:end */
				} )
				.catch( function( authError ) {
					// console.log( 'authError: %o', authError );
				} );
			}

		}, domId + '_button' );
	}
};
