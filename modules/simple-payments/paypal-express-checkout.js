/**
 * This PaypalExpressCheckout global is included by wp_enqueue_script( 'paypal-express-checkout' );
 * It handles communication with Paypal Express checkout and public-api.wordpress.com for the purposes
 * of simple-payments module.
 */

var transactions = {
	amount: {
		total: '0.21',
		currency: 'USD',
		details: {
			subtotal: '0.10',
			tax: '0.07',
			shipping: '0.03',
			handling_fee: '1.00',
			shipping_discount: '-1.00',
			insurance: '0.01',
		},
	},
	description: 'The payment transaction description.',
	custom: 'EBAY_EMS_90048630024435',
	// invoice_number: '48787589673',
	payment_options: {
		allowed_payment_method: 'INSTANT_FUNDING_SOURCE'
	},
	payee: { email: 'admin-facilitator@woothemes.com' },
	soft_descriptor: 'ECHI5786786',
	item_list: {
		items: [
			{
				name: 'hat',
				description: 'Brown hat.',
				quantity: '5',
				price: '0.01',
				tax: '0.01',
				sku: '1',
				currency: 'USD'
			},
			{
				name: 'handbag',
				description: 'Black handbag.',
				quantity: '1',
				price: '0.05',
				tax: '0.02',
				sku: 'product34',
				currency: 'USD'
			}
		],

		shipping_address: {
			recipient_name: 'Brian Robinson',
			line1: '4th Floor',
			line2: 'Unit #34',
			city: 'San Jose',
			country_code: 'US',
			postal_code: '95131',
			phone: '011862212345678',
			state: 'CA'
		}
	}
};

/* global paypal */
/* exported PaypalExpressCheckout */
/* jshint unused:false */
var PaypalExpressCheckout = {
	constants: {
		createPaymentEndpoint: 'https://public-api.wordpress.com/wpcom/v2/sites/retrofocs.wpsandbox.me/simple-payments/paypal/payment',
		executePaymentEndpoint: 'https://public-api.wordpress.com/wpcom/v2/sites/retrofocs.wpsandbox.me/simple-payments/paypal/payment/execute',
	},

	renderButton: function( domElement ) {
		const buttonID = domElement.getAttribute( 'id' );

		paypal.Button.render( {
			commit: true,
			style: {
				label: 'pay',
				color: 'blue'
			},

			env: 'sandbox',

			payment: function() {
				return paypal
				.request
					.post( PaypalExpressCheckout.constants.createPaymentEndpoint, {
						buttonID,
						metadata: JSON.stringify( transactions )
					} )
					.then( function( data ) {
						console.log( 'data: %o', data );
						return data.id;
					} )
					.catch( error => console.error( error ) );
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
				} ).catch( error => console.error( error ) );
			}

		}, domElement );
	}
};
