/**
 * Custom Jetpack Page JavaScript
 */

jQuery( document ).ready( function ( $ ) {
	// Initialize the custom page functionality
	var JetpackCustomPage = {
		/**
		 * Initialize the page
		 */
		init: function () {
			this.bindEvents();
			this.setupValidation();
		},

		/**
		 * Bind event handlers
		 */
		bindEvents: function () {
			// Example: Handle form submission
			$( '#submit' ).on( 'click', this.handleFormSubmission.bind( this ) );

			// Example: Handle input changes
			$( '#custom_setting' ).on( 'change', this.handleInputChange.bind( this ) );
		},

		/**
		 * Setup form validation
		 */
		setupValidation: function () {
			// Add any validation rules here
			$( '#custom_setting' ).on( 'blur', function () {
				var value = $( this ).val();
				if ( value.length > 0 && value.length < 3 ) {
					$( this ).addClass( 'error' );
					$( this ).next( '.description' ).text( 'Value must be at least 3 characters long.' );
				} else {
					$( this ).removeClass( 'error' );
					$( this ).next( '.description' ).text( 'Enter your custom setting value.' );
				}
			} );
		},

		/**
		 * Handle form submission
		 */
		handleFormSubmission: function ( e ) {
			// Example validation before submission
			var customSetting = $( '#custom_setting' ).val();

			if ( customSetting.length > 0 && customSetting.length < 3 ) {
				e.preventDefault();
				alert( 'Please enter a valid value for the custom setting.' );
				return false;
			}

			return true;
		},

		/**
		 * Handle input changes
		 */
		handleInputChange: function ( e ) {
			var $input = $( e.target );
			var value = $input.val();

			// Example: Show a preview or update other elements
			console.log( 'Custom setting changed to:', value );

			// You could make an AJAX call here to save the setting immediately
			// this.saveSettingAjax(value);
		},

		/**
		 * Example AJAX function
		 */
		saveSettingAjax: function ( value ) {
			$.ajax( {
				url: jetpackCustomPage.ajaxUrl,
				type: 'POST',
				data: {
					action: 'save_jetpack_custom_setting',
					nonce: jetpackCustomPage.nonce,
					setting_value: value,
				},
				success: function ( response ) {
					if ( response.success ) {
						console.log( 'Setting saved successfully' );
					}
				},
				error: function () {
					console.log( 'Error saving setting' );
				},
			} );
		},
	};

	// Initialize when document is ready
	JetpackCustomPage.init();
} );

// Add some CSS for error states
jQuery( document ).ready( function ( $ ) {
	$( '<style>' )
		.prop( 'type', 'text/css' )
		.html(
			`
			.form-table input.error {
				border-color: #dc3232;
				box-shadow: 0 0 2px rgba(220, 50, 50, 0.8);
			}
		`
		)
		.appendTo( 'head' );
} );
