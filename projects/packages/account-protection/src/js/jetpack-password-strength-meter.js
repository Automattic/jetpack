/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const generatePasswordButton = $( '.wp-generate-pw' );
	const weakPasswordConfirmation = $( '.pw-weak' );
	const weakPasswordConfirmationCheckbox =
		weakPasswordConfirmation.find( 'input[type="checkbox"]' );
	const updateProfileFormSubmitButton = $( '#submit' );
	const resetPasswordFormSaveButton = $( '#wp-submit' );

	// Non JS form flashes momentarily, we should hide it initially to avoid UI awkwardness

	const passwordInput = $( '#pass1' );
	passwordInput.css( { 'border-color': '#8C8F94' } );

	const coreStrengthMeter = $( '#pass-strength-result' );
	coreStrengthMeter.hide();

	const passwordValidationStatus = $( '<div id="password-validation-status"></div>' );

	const userSpecific = Boolean( jetpackData.userSpecific );

	const validationCheckList = $( '<ul></ul>', {
		css: {
			display: 'flex',
			'flex-direction': 'column',
			gap: '4px',
			'margin-bottom': '16px',
		},
	} );

	const validationItems = {};

	Object.entries( jetpackData.validationInitialState ).forEach( ( [ key, value ] ) => {
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

		let infoIconPopover = null;
		if ( userSpecific && value.info ) {
			infoIconPopover = $( '<div></div>', {
				css: {
					position: 'relative',
					display: 'inline-block',
				},
			} );
			const infoIcon = $( '<img>', {
				src: jetpackData.infoIcon,
				alt: 'Info',
				css: {
					height: '20px',
					cursor: 'pointer',
				},
			} );

			const popover = $( '<div></div>', {
				text: value.info,
				css: {
					display: 'none',
					position: 'absolute',
					bottom: '30px',
					left: '50%',
					transform: 'translateX(-50%)',
					background: '#333',
					color: '#fff',
					padding: '6px 10px',
					'border-radius': '4px',
					'white-space': 'normal',
					width: '200px',
					'font-size': '12px',
					'box-shadow': '0px 4px 6px rgba(0, 0, 0, 0.1)',
					'z-index': 10,
					'text-align': 'center',
				},
			} );

			const popoverArrow = $( '<div></div>', {
				css: {
					position: 'absolute',
					bottom: '-6px',
					left: '50%',
					transform: 'translateX(-50%)',
					'border-left': '6px solid transparent',
					'border-right': '6px solid transparent',
					'border-top': '6px solid #333',
				},
			} );

			popover.append( popoverArrow );

			infoIcon.hover(
				function () {
					popover.fadeIn( 200 );
				},
				function () {
					popover.fadeOut( 200 );
				}
			);

			infoIconPopover.append( infoIcon );
			infoIconPopover.append( popover );
		}

		listItem.append( validationIcon );
		listItem.append( validationCheckListItemText );
		if ( infoIconPopover ) {
			listItem.append( infoIconPopover );
		}
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
			'margin-bottom': '16px',
			'border-radius': '0px 0px 4px 4px',
			'background-color': '#8C8F94',
		},
	} );

	if ( userSpecific ) {
		strengthMeter.css( { 'margin-left': '1px', 'margin-right': '1px' } );
	}

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
		if ( passwordInput && passwordInput.val() && passwordInput.val().length > 0 ) {
			validatePassword();
		}
	}, 1500 );

	generatePasswordButton.on( 'click', () => validatePassword( 'on password generation' ) );

	let currentAjaxRequest = null;

	/**
	 *
	 * Validate the current password input
	 *
	 */
	function validatePassword() {
		const currentPasswordInput = passwordInput.val();
		const failedValidationConditions = {};

		if ( currentAjaxRequest ) {
			currentAjaxRequest.abort();
			currentAjaxRequest = null;
		}

		if ( ! currentPasswordInput || currentPasswordInput.trim().length === 0 ) {
			applyStyling( failedValidationConditions, true );
			return;
		}

		if ( coreStrengthMeter.is( ':visible' ) ) {
			coreStrengthMeter.hide();
		}

		// passwordValidationStatus loading state
		Object.values( validationItems ).forEach( ( { icon, text } ) => {
			icon.attr( 'src', jetpackData.loadingIcon );
			icon.attr( 'alt', 'Validating...' );
			text.css( { color: '#3C434A', transition: 'color 0.2s ease-in-out' } );
		} );

		// strengthMeter loading state
		strength.text( 'Validating...' );
		jetpackBranding.show();
		strengthMeter.css( 'background-color', '#8C8F94' );
		passwordInput.css( { 'border-color': '#8C8F94', 'border-radius': '4px 4px 0px 0px' } );
		strengthMeter.show();
		passwordValidationStatus.show();

		// Disable submit buttons while validating
		if ( ! updateProfileFormSubmitButton.prop( 'disabled' ) ) {
			updateProfileFormSubmitButton.prop( 'disabled', true );
		}

		if ( ! resetPasswordFormSaveButton.prop( 'disabled' ) ) {
			resetPasswordFormSaveButton.prop( 'disabled', true );
		}

		const uiUpdates = [];

		currentAjaxRequest = $.ajax( {
			url: jetpackData.ajaxurl,
			type: 'POST',
			data: {
				action: 'validate_password_ajax',
				nonce: jetpackData.nonce,
				password: currentPasswordInput,
				user_specific: jetpackData.userSpecific,
			},
			success: function ( response ) {
				currentAjaxRequest = null;

				if ( response.success ) {
					// Manually update core strength meter status
					const coreStrengthMeterClass = coreStrengthMeter.attr( 'class' ) || '';
					response.data.state.core.status = ! (
						coreStrengthMeterClass.includes( 'strong' ) || coreStrengthMeterClass.includes( 'good' )
					);

					Object.entries( response.data.state ).forEach( ( [ key, item ] ) => {
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
					// TODO: Restore core strength meter state, show error?
					strengthMeter.hide();
					passwordValidationStatus.hide();
					passwordInput.removeAttr( 'style' );
					coreStrengthMeter.show();
				}
			},
			error: function ( jqXHR, textStatus ) {
				if ( textStatus !== 'abort' ) {
					// TODO: Restore core strength meter state, show error?
					strengthMeter.hide();
					passwordValidationStatus.hide();
					passwordInput.removeAttr( 'style' );
					coreStrengthMeter.show();
				}
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
			strength.text( '' );
			jetpackBranding.hide();
			strengthMeter.css( 'background-color', 'transparent' );
			passwordValidationStatus.hide();
			passwordInput.css( { 'border-color': '#8c8f94', 'border-radius': '4px' } );

			return;
		}

		if ( 0 === Object.keys( failedValidationConditions ).length ) {
			finalColor = '#64CA43';
			finalStrengthText = 'Strong';

			if ( weakPasswordConfirmation.is( ':visible' ) ) {
				weakPasswordConfirmation.css( 'display', 'none' );
			}

			if ( updateProfileFormSubmitButton.prop( 'disabled' ) ) {
				updateProfileFormSubmitButton.prop( 'disabled', false );
			}

			if ( resetPasswordFormSaveButton.prop( 'disabled' ) ) {
				resetPasswordFormSaveButton.prop( 'disabled', false );
			}
		} else {
			finalColor = '#E65054';
			finalStrengthText = 'Weak';

			if ( weakPasswordConfirmation.css( 'display' ) === 'none' ) {
				weakPasswordConfirmation.css( 'display', userSpecific ? 'table-row' : 'block' );
			}

			if ( weakPasswordConfirmationCheckbox.prop( 'checked' ) ) {
				if ( updateProfileFormSubmitButton.prop( 'disabled' ) ) {
					updateProfileFormSubmitButton.prop( 'disabled', false );
				}

				if ( resetPasswordFormSaveButton.prop( 'disabled' ) ) {
					resetPasswordFormSaveButton.prop( 'disabled', false );
				}
			} else {
				if ( ! updateProfileFormSubmitButton.prop( 'disabled' ) ) {
					updateProfileFormSubmitButton.prop( 'disabled', true );
				}

				if ( ! resetPasswordFormSaveButton.prop( 'disabled' ) ) {
					resetPasswordFormSaveButton.prop( 'disabled', true );
				}
			}
		}

		strength.text( finalStrengthText );
		strengthMeter.css( 'background-color', finalColor );
		passwordInput.css( { 'border-color': finalColor, 'border-radius': '4px 4px 0px 0px' } );

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
