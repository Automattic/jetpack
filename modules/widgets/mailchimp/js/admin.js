/* global mailchimpAdmin*/
( function( $ ) {
	/**
	 * Check the connectivity with MailChimp.
	 *
	 * @return void
	 */
	function apiCall() {
		$.ajax( {
			url: '/wp-json/wpcom/v2/mailchimp',
			type: 'GET',
			success: function( data ) {
				console.log( data );
			},
		} );
	}

	//apiCall();

	/**
	 * Generates the widget form.
	 */
	function generateForm() {
		var sections = mailchimpAdmin.formSections;
		console.log( sections );
	}

	generateForm();
} )( jQuery );
