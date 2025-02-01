/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const passwordInput = $( '#pass1' );
	const generatePasswordButton = $( '.wp-generate-pw' );
	const passwordStrengthResult = $( '#pass-strength-result' );

	// TODO: Enforce password confirmation on custom validation
	// const weakPasswordConfirmation = $( '.pw-weak' );
	// const submitButton = $( '#submit' );
	const passwordValidationStatus = $( '<div id="password-validation-status"></div>' );

	passwordInput.css( { border: '1px solid #8c8f94', 'border-radius': '4px 4px 0px 0px' } );
	passwordStrengthResult.hide();

	// Store the last known class to prevent duplicate logs
	let lastClass = passwordStrengthResult.attr( 'class' ) || '';

	/**
	 * Function to log the updated class only if it changes
	 */
	function logClassChange() {
		const newClass = passwordStrengthResult.attr( 'class' ) || '';
		if ( newClass !== lastClass ) {
			lastClass = newClass; // Update last known class
		}
	}

	// Monitor class changes using MutationObserver
	const classObserver = new MutationObserver( function ( mutations ) {
		mutations.forEach( function ( mutation ) {
			if ( mutation.attributeName === 'class' ) {
				logClassChange();
			}
		} );
	} );

	// Start observing class attribute changes
	if ( passwordStrengthResult.length ) {
		classObserver.observe( passwordStrengthResult[ 0 ], { attributes: true } );
	}

	const strengthMeter = $( '<div>', {
		id: 'custom-password-message',
		css: {
			display: 'flex',
			'justify-content': 'space-between',
			'align-items': 'center',
			padding: '8px 16px',
			'margin-left': '1px', // TODO: Certain styling should only apply to profile or reset UIs - profile only
			'margin-right': '1px', // TODO: Certain styling should only apply to profile or reset UIs - profile only
			'margin-bottom': '16px',
			'background-color': '#9dd977',
			'border-radius': '0px 0px 4px 4px',
		},
	} );

	const strength = $( '<p>', {
		text: 'Strong',
		css: {
			display: 'flex',
			'align-items': 'center',
			'font-size': '12px',
			'font-weight': 'bold',
			margin: '0',
		},
	} );

	const jetpackBranding = $( '<div>', {
		css: {
			display: 'flex',
			'align-items': 'center',
			gap: '4px',
		},
	} );

	const brandingMessage = $( '<p>', {
		text: 'Powered by ',
		css: {
			'font-size': '12px',
			margin: '0',
		},
	} );

	const jetpackLogo = $( '<img>', {
		src: jetpackData.logo,
		alt: 'Jetpack Logo',
		css: {
			height: '18px',
		},
	} );

	jetpackBranding.append( brandingMessage );
	jetpackBranding.append( jetpackLogo );

	strengthMeter.append( strength );
	strengthMeter.append( jetpackBranding );

	passwordInput.after( passwordValidationStatus );
	passwordInput.after( strengthMeter );

	// Run validation on real-time input updates
	passwordInput.on( 'input', () => validatePassword( 'input update' ) );

	// Run validation if input has a initial value - reset form
	setTimeout( () => {
		if ( passwordInput.val().length > 0 ) {
			validatePassword( 'immediate with initial value' );
		}
	}, 1000 );

	// Run validation on password generation
	generatePasswordButton.on( 'click', () => validatePassword( 'on password generation' ) );

	/**
	 *
	 * Validate the current password input
	 *
	 */
	function validatePassword() {
		const currentPasswordInput = passwordInput.val();
		// Password validation logic here
		console.log( 'Validating password...', currentPasswordInput );

		$.ajax( {
			url: jetpackData.ajaxurl, // WordPress AJAX handler
			type: 'POST',
			data: {
				action: 'validate_password_ajax',
				password: currentPasswordInput, // ✅ Pass the password for validation
			},
			beforeSend: function () {
				passwordValidationStatus.html( '<p>Validating...</p>' );
			},
			success: function ( response ) {
				if ( response.success ) {
					passwordValidationStatus.html(
						`<p style="color: green;">${ response.data.message }</p>`
					);
				} else {
					let errorHtml = '<ul style="color: red;">';
					response.data.errors.forEach( error => {
						errorHtml += `<li>${ error }</li>`;
					} );
					errorHtml += '</ul>';
					passwordValidationStatus.html( errorHtml );
				}
			},
			error: function () {
				passwordValidationStatus.html( '<p style="color: red;">Error connecting to server.</p>' );
			},
		} );
	}
} );
