/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const generatePasswordButton = $( '.wp-generate-pw' );
	const weakPasswordConfirmation = $( '.pw-weak' );
	const submitButton = $( '#submit' );

	const passwordInput = $( '#pass1' );
	passwordInput.css( { 'border-color': '#8C8F94' } );

	const corePasswordStrengthMeter = $( '#pass-strength-result' );
	corePasswordStrengthMeter.hide();

	const passwordValidationStatus = $( '<div id="password-validation-status"></div>' );

	const validationMessages = {
		core: {
			status: null,
			message: 'Passes core validation',
		},
		...jetpackData.validationInitialState,
	};

	const validationCheckList = $( '<ul></ul>', {
		css: {
			display: 'flex',
			'flex-direction': 'column',
			gap: '4px',
		},
	} );

	const validationItems = {};

	Object.entries( validationMessages ).forEach( ( [ key, value ] ) => {
		const listItem = $( '<li></li>', {
			css: {
				display: 'contains_backslash' === key ? 'none' : 'flex',
				'align-items': 'center',
				gap: '8px',
			},
			'data-key': key,
		} );

		const validationIcon = $( '<img>', {
			src: jetpackData.loadingIcon,
			alt: 'Validating...',
			css: {
				height: '24px',
			},
		} );

		const validationCheckListItemText = $( '<p>', {
			text: value.message,
			css: {
				'margin-top': '0',
			},
		} );

		listItem.append( validationIcon );
		listItem.append( validationCheckListItemText );
		validationCheckList.append( listItem );

		validationItems[ key ] = {
			icon: validationIcon,
			text: validationCheckListItemText,
			item: listItem,
		};
	} );

	passwordValidationStatus.append( validationCheckList );
	passwordInput.after( passwordValidationStatus );

	const strengthMeter = $( '<div>', {
		css: {
			display: 'flex',
			'justify-content': 'space-between',
			'align-items': 'center',
			height: '30px',
			padding: '0px 16px',
			'margin-left': '1px', // TODO: Certain styling should only apply to profile or reset UIs - profile only
			'margin-right': '1px', // TODO: Certain styling should only apply to profile or reset UIs - profile only
			'margin-bottom': '16px',
			'border-radius': '0px 0px 4px 4px',
			'background-color': '#8C8F94',
		},
	} );

	const strength = $( '<p>', {
		text: 'Validating...',
		css: {
			display: 'flex',
			'align-items': 'center',
			'font-size': '12px',
			'font-weight': 'bold',
			color: '#1D2327',
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
			color: '#1D2327',
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
	passwordInput.after( strengthMeter );

	passwordInput.on( 'input', () => validatePassword() );

	setTimeout( () => {
		if ( passwordInput.val().length > 0 ) {
			validatePassword();
		}
	}, 1500 );

	generatePasswordButton.on( 'click', () => validatePassword( 'on password generation' ) );

	/**
	 *
	 * Validate the current password input
	 *
	 */
	function validatePassword() {
		const currentPasswordInput = passwordInput.val();
		const failedValidationConditions = {};

		if ( ! currentPasswordInput || currentPasswordInput.length === 0 ) {
			applyStyling( failedValidationConditions, true );
			return;
		}

		// strengthMeter loading state
		strength.text( 'Validating...' );
		strengthMeter.css( 'background-color', '#8C8F94' );
		passwordInput.css( { 'border-color': '#8C8F94' } );

		// passwordValidationStatus loading state
		Object.values( validationItems ).forEach( ( { icon, text } ) => {
			icon.attr( 'src', jetpackData.loadingIcon );
			icon.attr( 'alt', 'Validating...' );
			text.css( { color: '#3C434A', transition: 'color 0.2s ease-in-out' } );
		} );

		const corePasswordStrengthMeterClass = corePasswordStrengthMeter.attr( 'class' ) || '';
		const coreValidationFailed =
			corePasswordStrengthMeterClass !== 'strong' && corePasswordStrengthMeterClass !== 'good';

		const uiUpdates = [];

		uiUpdates.push( () => {
			const { icon, text } = validationItems.core;

			icon.attr( 'src', coreValidationFailed ? jetpackData.crossIcon : jetpackData.checkIcon );
			icon.attr( 'alt', coreValidationFailed ? 'Jetpack Cross' : 'Jetpack Check' );
			text.css( 'color', coreValidationFailed ? '#E65054' : '#008710' );

			if ( coreValidationFailed ) {
				failedValidationConditions.core = true;
			}
		} );

		$.ajax( {
			url: jetpackData.ajaxurl,
			type: 'POST',
			data: {
				action: 'validate_password_ajax',
				password: currentPasswordInput,
			},
			success: function ( response ) {
				if ( response.success ) {
					Object.entries( response.data.status ).forEach( ( [ key, item ] ) => {
						const isInvalid = item.status;
						const { icon, text, item: listItem } = validationItems[ key ] || {};

						if ( ! icon || ! text ) return;

						if ( key === 'contains_backslash' ) {
							listItem.css( 'display', isInvalid ? 'flex' : 'none' );
						}

						uiUpdates.push( () => {
							icon.attr( 'src', isInvalid ? jetpackData.crossIcon : jetpackData.checkIcon );
							icon.attr( 'alt', isInvalid ? 'Jetpack Cross' : 'Jetpack Check' );
							text.css( {
								color: isInvalid ? '#E65054' : '#008710',
								transition: 'color 0.2s ease-in-out',
							} );
						} );

						if ( isInvalid ) {
							failedValidationConditions[ key ] = isInvalid;
						}
					} );

					requestAnimationFrame( () => {
						uiUpdates.forEach( update => update() );

						validationCheckList.css( 'opacity', 0.99 );
						setTimeout( () => validationCheckList.css( 'opacity', 1 ), 1 );

						applyStyling( failedValidationConditions );
					} );
				} else {
					passwordValidationStatus.html(
						'<p style="color: #E65054">Error: Unable to validate password.</p>'
					);
				}
			},
			error: function () {
				passwordValidationStatus.html(
					'<p style="color: #E65054">Error connecting to server.</p>'
				);
			},
		} );
	}

	/**
	 *
	 * Apply styling based on validation results
	 *
	 * @param {object}  failedValidationConditions - Object containing failed validation conditions
	 * @param {boolean} passwordIsEmpty            - Whether the password input is empty
	 */
	function applyStyling( failedValidationConditions, passwordIsEmpty = false ) {
		let finalColor = '#8c8f94';
		let finalStrengthText = '';

		if ( passwordIsEmpty ) {
			strengthMeter.hide();
			passwordValidationStatus.hide();
			passwordInput.css( { 'border-color': '#8c8f94', 'border-radius': '4px' } );
			return;
		}

		if ( 0 === Object.keys( failedValidationConditions ).length ) {
			finalColor = '#64CA43';
			finalStrengthText = 'Strong';

			if ( submitButton.prop( 'disabled' ) ) {
				submitButton.prop( 'disabled', false );
			}

			if ( weakPasswordConfirmation.is( ':visible' ) ) {
				weakPasswordConfirmation.css( 'display', 'none' );
			}
		} else {
			finalColor = '#E65054';
			finalStrengthText = 'Weak';

			if ( ! submitButton.prop( 'disabled' ) ) {
				submitButton.prop( 'disabled', true );
			}

			if ( weakPasswordConfirmation.css( 'display' ) !== 'table-row' ) {
				weakPasswordConfirmation.css( 'display', 'table-row' );
			}
		}

		strength.text( finalStrengthText );
		strengthMeter.css( 'background-color', finalColor );
		passwordInput.css( { 'border-color': finalColor, 'border-radius': '4px 4px 0px 0px' } );

		// TODO: Smoother transition?
		if ( ! strengthMeter.find( strength ).length ) {
			strengthMeter.append( strength );
		}
		if ( ! strengthMeter.find( jetpackBranding ).length ) {
			strengthMeter.append( jetpackBranding );
		}
		if ( ! strengthMeter.parent().length ) {
			passwordInput.after( strengthMeter );
		}

		if ( strengthMeter.is( ':hidden' ) ) {
			strengthMeter.show();
		}
		if ( passwordValidationStatus.is( ':hidden' ) ) {
			passwordValidationStatus.show();
		}
	}
} );
