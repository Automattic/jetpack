/* global paypal */
/* exported PaypalExpressCheckout */
var PaypalExpressCheckout = {
	constants: {
		createPaymentEndpoint: '',
		executePaymentEndpoint: '',
	},
	renderButton: function( id ) {
		paypal.Button.render( {
			commit: true,
			payment: function() {
				return paypal.request.post( PaypalExpressCheckout.constants.createPaymentEndpoint ).then( function( data ) {
					return data.id;
				} );
			},
			onAuthorize: function( data ) {
				return paypal.request.post( PaypalExpressCheckout.constants.executePaymentEndpoint, {
					paymentID: data.paymentID,
					payerID: data.payerID
				} ).then( function( payment ) {
					console.log( 'payment: ', payment );
					alert( 'success!' );
				} );
			}

		}, id );
	}
};
