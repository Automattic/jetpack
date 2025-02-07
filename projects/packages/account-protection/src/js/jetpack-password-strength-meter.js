/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const coreElements = {
		generatePasswordButton: $( '.wp-generate-pw' ),
		passwordInputWrapper: $( '.user-pass1-wrap' ),
		passwordInput: $( '#pass1' ),
		strengthMeter: $( '#pass-strength-result' ),
		weakPasswordConfirmation: $( '.pw-weak' ),
		weakPasswordConfirmationCheckbox: $( '.pw-weak input[type="checkbox"]' ),
		updateFormSubmitButton: $( '#submit' ),
		createUserFormSubmitButton: $( '#createusersub' ),
		resetFormSaveButton: $( '#wp-submit' ),
	};

	// TODO: Non JS form flashes momentarily, we should hide it initially to avoid UI awkwardness

	coreElements.passwordInputWrapper.css( {
		'margin-bottom': '16px',
	} );
	coreElements.passwordInput.css( {
		'border-color': '#8C8F94',
		'border-radius': '4px 4px 0 0',
		margin: '0',
	} );
	coreElements.strengthMeter.hide();

	const passwordValidationStatus = $( '<div>', { id: 'password-validation-status' } );
	coreElements.passwordInput.after( passwordValidationStatus );
	const validationCheckList = $( '<ul>', { class: 'validation-checklist' } );
	passwordValidationStatus.append( validationCheckList );

	let currentAjaxRequest = null;
	const strengthMeterItems = {};
	const validationChecklistItems = {};

	generateAndAppendStrengthMeterInitialState();
	generateAndAppendValidationChecklistInitialState();

	// Initial password auto-population check
	setTimeout( () => {
		if ( coreElements.passwordInput?.val()?.length ) {
			validatePassword();
		}
	}, 1000 ); // TODO: This might not always catching the initial password value

	// Event listeners
	coreElements.passwordInput.on( 'input', () => validatePassword() );
	coreElements.generatePasswordButton.on( 'click', () => validatePassword() );

	/**
	 *
	 * Validate the current password input
	 *
	 */
	function validatePassword() {
		const currentPasswordInput = coreElements.passwordInput.val();
		const failedValidationConditions = {};

		if ( currentAjaxRequest ) {
			currentAjaxRequest.abort();
			currentAjaxRequest = null;
		}

		if ( ! currentPasswordInput?.trim() ) {
			applyStyling( failedValidationConditions, true );
			return;
		}

		coreElements.strengthMeter.hide();

		// passwordValidationStatus loading state
		Object.values( validationChecklistItems ).forEach( ( { icon, text } ) => {
			icon.attr( 'src', jetpackData.loadingIcon );
			icon.attr( 'alt', 'Validating...' );
			text.css( { color: '#3C434A', transition: 'color 0.2s ease-in-out' } );
		} );

		// strengthMeter loading state
		strengthMeterItems.strength.text( 'Validating...' );
		strengthMeterItems.jetpackBranding.show();
		strengthMeterItems.strengthMeterWrapper.css( 'background-color', '#8C8F94' );
		coreElements.passwordInput.css( {
			'border-color': '#8C8F94',
			'border-radius': '4px 4px 0px 0px',
		} );
		strengthMeterItems.strengthMeterWrapper.show();
		passwordValidationStatus.show();

		// Disable submit buttons while validating
		coreElements.updateFormSubmitButton.prop( 'disabled', true );
		coreElements.createUserFormSubmitButton.prop( 'disabled', true );
		coreElements.resetFormSaveButton.prop( 'disabled', true );

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
					const coreStrengthMeterClass = coreElements.strengthMeter.attr( 'class' ) || '';
					response.data.state.core.status = ! (
						coreStrengthMeterClass.includes( 'strong' ) || coreStrengthMeterClass.includes( 'good' )
					);

					Object.entries( response.data.state ).forEach( ( [ key, item ] ) => {
						const isInvalid = item.status;
						const { icon, text, item: listItem } = validationChecklistItems[ key ] || {};

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
					strengthMeterItems.strengthMeterWrapper.hide();
					passwordValidationStatus.hide();
					coreElements.passwordInput.removeAttr( 'style' );
					coreElements.strengthMeter.show();
				}
			},
			error: function ( jqXHR, textStatus ) {
				if ( textStatus !== 'abort' ) {
					// TODO: Restore core strength meter state, show error?
					strengthMeterItems.strengthMeterWrapper.hide();
					passwordValidationStatus.hide();
					coreElements.passwordInput.removeAttr( 'style' );
					coreElements.strengthMeter.show();
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
			strengthMeterItems.strength.text( '' );
			strengthMeterItems.jetpackBranding.hide();
			strengthMeterItems.strengthMeterWrapper.css( 'background-color', 'transparent' );
			passwordValidationStatus.hide();
			coreElements.passwordInput.css( { 'border-color': '#8c8f94', 'border-radius': '4px' } );

			return;
		}

		if ( 0 === Object.keys( failedValidationConditions ).length ) {
			finalColor = '#64CA43';
			finalStrengthText = 'Strong';

			coreElements.weakPasswordConfirmation.css( 'display', 'none' );
			coreElements.updateFormSubmitButton.prop( 'disabled', false );
			coreElements.createUserFormSubmitButton.prop( 'disabled', false );
			coreElements.resetFormSaveButton.prop( 'disabled', false );
		} else {
			finalColor = '#E65054';
			finalStrengthText = 'Weak';

			if ( coreElements.weakPasswordConfirmation.css( 'display' ) === 'none' ) {
				coreElements.weakPasswordConfirmation.css( {
					display: 'table-row',
				} );
			}

			if ( coreElements.weakPasswordConfirmationCheckbox.prop( 'checked' ) ) {
				coreElements.updateFormSubmitButton.prop( 'disabled', false );
				coreElements.createUserFormSubmitButton.prop( 'disabled', false );
				coreElements.resetFormSaveButton.prop( 'disabled', false );
			} else {
				coreElements.updateFormSubmitButton.prop( 'disabled', true );
				coreElements.createUserFormSubmitButton.prop( 'disabled', true );
				coreElements.resetFormSaveButton.prop( 'disabled', true );
			}
		}

		strengthMeterItems.strength.text( finalStrengthText );
		strengthMeterItems.strengthMeterWrapper.css( 'background-color', finalColor );
		coreElements.passwordInput.css( {
			'border-color': finalColor,
			'border-radius': '4px 4px 0px 0px',
		} );

		if ( ! strengthMeterItems.strengthMeterWrapper.find( strengthMeterItems.strength ).length ) {
			strengthMeterItems.strengthMeterWrapper.append( strengthMeterItems.strength );
		}
		if (
			! strengthMeterItems.strengthMeterWrapper.find( strengthMeterItems.jetpackBranding ).length
		) {
			strengthMeterItems.strengthMeterWrapper.append( strengthMeterItems.jetpackBranding );
		}
		if ( ! strengthMeterItems.strengthMeterWrapper.parent().length ) {
			coreElements.passwordInput.after( strengthMeterItems.strengthMeterWrapper );
		}

		strengthMeterItems.strengthMeterWrapper.show();
		passwordValidationStatus.show();
	}

	/**
	 * Generate and append the initial validation checklist state
	 */
	function generateAndAppendValidationChecklistInitialState() {
		Object.entries( jetpackData.validationInitialState ).forEach( ( [ key, value ] ) => {
			const listItem = $( '<li>', { class: 'validation-item', 'data-key': key } );

			if ( key === 'contains_backslash' ) {
				listItem.hide();
			}

			const validationIcon = $( '<img>', {
				src: jetpackData.loadingIcon,
				alt: 'Validating...',
				class: 'validation-icon',
			} );

			const validationCheckListItemText = $( '<p>', {
				text: value.message,
				class: 'validation-text',
			} );

			let infoIconPopover = null;
			if ( Boolean( jetpackData.userSpecific ) && value.info ) {
				infoIconPopover = $( '<div>', { class: 'info-popover' } );
				const infoIcon = $( '<img>', {
					src: jetpackData.infoIcon,
					alt: 'Info',
					class: 'info-icon',
				} );

				const popover = $( '<div>', {
					text: value.info,
					class: 'popover',
				} ).append( $( '<div>', { class: 'popover-arrow' } ) );

				infoIcon.hover(
					() => popover.fadeIn( 200 ),
					() => popover.fadeOut( 200 )
				);

				infoIconPopover.append( infoIcon, popover );
			}

			listItem.append( validationIcon, validationCheckListItemText, infoIconPopover );
			validationCheckList.append( listItem );

			validationChecklistItems[ key ] = {
				icon: validationIcon,
				text: validationCheckListItemText,
				item: listItem,
			};
		} );
	}

	/**
	 * Generate and append the initial strength meter state
	 */
	function generateAndAppendStrengthMeterInitialState() {
		const strengthMeterWrapper = $( '<div>', {
			class: 'strength-meter',
		} );

		const strength = $( '<p>', {
			class: 'strength',
			text: 'Validating...',
		} );

		const jetpackBranding = $( '<div>', { class: 'branding' } ).append(
			$( '<p>', { class: 'powered-by', text: 'Powered by ' } ),
			$( '<img>', { src: jetpackData.logo, alt: 'Jetpack Logo' } )
		);

		strengthMeterWrapper.append( strength, jetpackBranding );
		validationCheckList.before( strengthMeterWrapper );

		strengthMeterItems.strengthMeterWrapper = strengthMeterWrapper;
		strengthMeterItems.strength = strength;
		strengthMeterItems.jetpackBranding = jetpackBranding;
	}
} );
