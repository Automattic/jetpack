/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

/* global paypal */
/* global jQuery */
/* exported PaypalExpressCheckout */
/* jshint unused:false, es3:false, esversion:5 */
var PaypalExpressCheckout = {
	primaryCssClassName: 'jetpack-simple-payments',
	messageCssClassName: 'jetpack-simple-payments-purchase-message',

	wpRestAPIHost: 'https://public-api.wordpress.com',
	wpRestAPIVersion: '/wpcom/v2',

	getEnvironment: function() {
		if ( localStorage && localStorage.getItem && localStorage.getItem( 'simple-payments-env' ) === 'sandbox' ) {
			return 'sandbox';
		}
		return 'production';
	},

	getCreatePaymentEndpoint: function( blogId ) {
		return PaypalExpressCheckout.wpRestAPIHost + PaypalExpressCheckout.wpRestAPIVersion + '/sites/' + blogId + '/simple-payments/paypal/payment';
	},

	getExecutePaymentEndpoint: function( blogId, paymentId ) {
		return PaypalExpressCheckout.wpRestAPIHost + PaypalExpressCheckout.wpRestAPIVersion + '/sites/' + blogId + '/simple-payments/paypal/' + paymentId + '/execute';
	},

	getNumberOfItems: function( field, enableMultiple ) {
		if ( enableMultiple !== '1' ) {
			return 1;
		}

		var numberField = document.getElementById( field );

		if ( ! numberField ) {
			return 1;
		}

		var number = Number( numberField.value );

		if ( isNaN( number ) ) {
			return 1;
		}
		return number;
	},

	/**
	 * Get the DOM element-placeholder used to show message
	 * about the transaction. If it doesn't exist then the function will create a new one.
	 *
	 * @param  string domId id of the payment button placeholder
	 * @return Element the dom element to print the message
	 */
	getMessageContainer: function( domId ) {
		return document.getElementById( domId + '-message-container' );
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
	showMessage: function( message, domId, isError ) {
		var domEl = PaypalExpressCheckout.getMessageContainer( domId );

		// set css classes
		var cssClasses = PaypalExpressCheckout.messageCssClassName + ' show ';
		cssClasses += isError ? 'error' : 'success';

		// show message 1s after Paypal popup is closed
		setTimeout( function() {
			domEl.innerHTML = message;
			domEl.setAttribute( 'class', cssClasses );
		}, 1000 );
	},

	showError: function( message, domId ) {
		PaypalExpressCheckout.showMessage( message, domId, true );
	},

	processErrorMessage: function( errorResponse ) {
		var error = errorResponse.responseJSON;
		var defaultMessage = 'There was an issue processing your payment.';

		if ( ! error ) {
			return '<p>' + defaultMessage + '</p>';
		}

		if ( error.additional_errors ) {
			var messages = [];
			error.additional_errors.forEach( function( additionalError) {
				if ( additionalError.message ) {
					messages.push( '<p>' + additionalError.message.toString() + '</p>' );
				}
			} );
			return messages.join('');
		}

		return '<p>' + ( error.message || defaultMessage ) + '</p>';
	},

	cleanAndHideMessage: function( domId ) {
		var domEl = PaypalExpressCheckout.getMessageContainer( domId );
		domEl.setAttribute( 'class', PaypalExpressCheckout.messageCssClassName );
		domEl.innerHTML = '';
	},

	getButtonStyle: function( domId ) {
		var buttonEl = document.getElementById( domId );
		var dataset = buttonEl ? ( buttonEl.dataset || {} ) : {};

		return {
			label: dataset.buttonStyleLabel || 'pay',
			shape: dataset.buttonStyleShape || 'rect',
			color: dataset.buttonStyleColor || 'silver'
		};
	},

	renderButton: function( blogId, buttonId, domId, enableMultiple ) {
		var env = PaypalExpressCheckout.getEnvironment();

		if ( ! paypal ) {
			throw new Error( 'PayPal module is required by PaypalExpressCheckout' );
		}

		var buttonDomId = domId + '_button';

		paypal.Button.render( {
			env: env,
			commit: true,

			style: PaypalExpressCheckout.getButtonStyle( buttonDomId ),

			payment: function() {
				PaypalExpressCheckout.cleanAndHideMessage( domId );

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
							var paymentErrorMessage = PaypalExpressCheckout.processErrorMessage( paymentError );
							PaypalExpressCheckout.showError( paymentErrorMessage, domId );
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
							PaypalExpressCheckout.showMessage( authResponse.message, domId );
							resolve();
						} )
						.fail( function( authError ) {
							var authErrorMessage = PaypalExpressCheckout.processErrorMessage( authError );
							PaypalExpressCheckout.showError( authErrorMessage, domId );
							reject( new Error( authError.responseJSON.code ) );
						} );
				} );
			}
		}, buttonDomId );
	}
};
