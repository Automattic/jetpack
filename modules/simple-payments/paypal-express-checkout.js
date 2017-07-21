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

	/**
	 * Get the DOM element-placeholder used to show message
	 * about the transaction. If it doesn't exist then the function will create a new one.
	 * 
	 * @param  string buttonDomId id of the payment button placeholder
	 * @return Element the dom element to print the message
	 */
	getMessageElement: function ( buttonDomId ) {
		var messageDomId = buttonDomId + '_message';

		// DOM Elements
		var buttonDomElement = document.getElementById( buttonDomId );
		var messageDomElement = document.getElementById( messageDomId );

		if ( messageDomElement ) {
			return messageDomElement;
		}

		// create dom message element
		messageDomElement = document.createElement( 'div' );
		messageDomElement.setAttribute( 'id', messageDomId );

		// inject into the DOM Tree
		buttonDomElement.appendChild( messageDomElement );

		return messageDomElement;
	},

	/**
	 * Show a messange close to the Paypal button.
	 * Use this function to give feedback to the user according
	 * to the transaction result.
	 * 
	 * @param  {String} message message to show
	 * @param  {String} domId paypal-button element dom identifier
	 * @param  {Boolean} [error] defines if it's a message error. Not TRUE as default.
	 */
	showMessage: function( message, buttonDomId, isError ) {
		var domEl = PaypalExpressCheckout.getMessageElement( buttonDomId );

		// set css classes
		var cssClasses = 'jetpack-simple-payments__purchase-message show ';
		cssClasses += isError ? 'error' : 'success';

		// show message 1s after Paypal popup is closed
		setTimeout( function() {
			domEl.innerHTML = message;
			domEl.setAttribute( 'class', cssClasses );
		}, 1000 );
	},

	showError: function( message, buttonDomId ) {
		PaypalExpressCheckout.showMessage( message, buttonDomId, true );
	},

	cleanAndHideMessage: function( buttonDomId ) {
		var domEl = PaypalExpressCheckout.getMessageElement( buttonDomId );
		domEl.setAttribute( 'class', 'jetpack-simple-payments__purchase-message' );
		domEl.innerHTML = '';
	},

	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = PaypalExpressCheckout.sandbox ? 'sandbox' : 'production';
		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}

		var buttonDomId = domId+ '_button';

		paypal.Button.render( {
			env: env,
			commit: true,
			style: {
				label: 'pay',
				color: 'blue'
			},
			payment: function( paymentData ) {
				PaypalExpressCheckout.cleanAndHideMessage( buttonDomId );

				var payload = {
					number: PaypalExpressCheckout.getNumberOfItems( domId + '_number', enableMultiple ),
					buttonId: buttonId,
					env: env
				};

				return paypal
					.request
					.post( PaypalExpressCheckout.getCreatePaymentEndpoint( blogId ), payload )
					.then( function( paymentResponse ) {
						return paymentResponse.id;
					} )
					.catch( function( paymentError) {
						PaypalExpressCheckout.showError( 'Item temporarily unavailable', buttonDomId );
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

					var message =
						'<strong>Thank you for your purchase, ' + payerInfo.first_name + '!</strong>' +
						'<br />' +
						'The purchase has been successful. <br />' +
						'For more details, an email has been sent to your email address ' +
						'<a href="mailto:' + payerInfo.email + '"><em>' + payerInfo.email + '</em></a>.';

					PaypalExpressCheckout.showMessage( message, buttonDomId );
				} )
				.catch( function( authError ) {
					PaypalExpressCheckout.showError( 'Item temporarily unavailable', buttonDomId );
				} );
			}

		}, buttonDomId );
	}
};
