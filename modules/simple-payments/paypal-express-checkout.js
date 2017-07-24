/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

var PaypalExpressCheckout = {};

/* global paypal */
/* global jQuery */
/* exported PaypalExpressCheckout */
/* jshint unused:false, es3:false, esversion:5 */
PaypalExpressCheckout = {
	primaryCssClassName: 'jetpack-simple-payments',
	messageCssClassName: PaypalExpressCheckout.primaryCssClassName + '-purchase-message',

	wpRestAPIHost: 'https://public-api.wordpress.com',
	wpRestAPIVersion: '/wpcom/v2',

	sandbox: true,

	getCreatePaymentEndpoint: function( blogId ) {
		return PaypalExpressCheckout.wpRestAPIHost + PaypalExpressCheckout.wpRestAPIVersion + '/sites/' + blogId + '/simple-payments/paypal/payment';
	},

	getExecutePaymentEndpoint: function( blogId, paymentId ) {
		return PaypalExpressCheckout.wpRestAPIHost + PaypalExpressCheckout.wpRestAPIVersion + '/sites/' + blogId + '/simple-payments/paypal/' + paymentId + '/execute';
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
		var cssClasses = PaypalExpressCheckout.messageCssClassName + ' show ';
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

	processErrorMessage: function( errorResponse ) {
		var error = errorResponse.responseJSON;
		var defaultMessage = 'There was an issue processing your payment.';

		if ( ! error ) {
			return defaultMessage;
		}

		if ( error.additional_errors ) {
			var messages = [];
			error.additional_errors.forEach( function( error ) {
				if ( error.message ) {
					messages.push( '<p>' + error.message.toString() + '</p>' );
				}
			} );
			return messages.join();
		}

		return '<p>' + ( error.message || defaultMessage ) + '</p>';
	},

	cleanAndHideMessage: function( buttonDomId ) {
		var domEl = PaypalExpressCheckout.getMessageElement( buttonDomId );
		domEl.setAttribute( 'class', PaypalExpressCheckout.messageCssClassName );
		domEl.innerHTML = '';
	},

	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = PaypalExpressCheckout.sandbox ? 'sandbox' : 'production';
		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}

		var buttonDomId = domId + '_button';

		paypal.Button.render( {
			env: env,
			commit: true,

			style: {
				label: 'pay',
				shape: 'rect',
				color: 'silver'
			},
			
			payment: function() {
				PaypalExpressCheckout.cleanAndHideMessage( buttonDomId );

				var payload = {
					number: PaypalExpressCheckout.getNumberOfItems( domId + '_number', enableMultiple ),
					buttonId: buttonId,
					env: env
				};

				return new paypal.Promise( function( resolve, reject ) {
					jQuery.post( PaypalExpressCheckout.getCreatePaymentEndpoint( blogId ), payload )
						.done( function( paymentResponse ) {
							resolve( paymentResponse.id );
						} )
						.fail( function( paymentError ) {
							var errorMessage = PaypalExpressCheckout.processErrorMessage( paymentError );
							PaypalExpressCheckout.showError( errorMessage, buttonDomId );
							reject( new Error( paymentError.responseJSON.code ) );
						} );
				} );
			},

			onAuthorize: function( onAuthData ) {
				var payload = {
					buttonId: buttonId,
					payerId: onAuthData.payerID,
					env: env
				};
				return new paypal.Promise( function( resolve, reject ) {
					jQuery.post( PaypalExpressCheckout.getExecutePaymentEndpoint( blogId, onAuthData.paymentID ), payload )
						.done( function( authResponse ) {
							PaypalExpressCheckout.showMessage( authResponse.message, buttonDomId );
							resolve();
						} )
						.fail( function( authError ) {
							PaypalExpressCheckout.showError( authError, buttonDomId );
							reject( new Error( authError.responseJSON.code ) );
						} );
				} );
			}
		}, buttonDomId );
	}
};
