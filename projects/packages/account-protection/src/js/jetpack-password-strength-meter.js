/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const UIComponents = {
		core: {
			passwordInputWrapper: $( '.user-pass1-wrap' ),
			passwordInput: $( '#pass1' ),
			passwordStrengthResults: $( '#pass-strength-result' ),
			weakPasswordConfirmation: $( '.pw-weak' ),
			weakPasswordConfirmationCheckbox: $( '.pw-weak input[type="checkbox"]' ),
			submitButtons: $( '#submit, #createusersub, #wp-submit' ),
		},
		passwordValidationStatus: $( '<div>', { id: 'password-validation-status' } ),
		validationCheckList: $( '<ul>', { class: 'validation-checklist' } ),
		strengthMeter: {},
		validationChecklistItems: {},
	};

	let currentAjaxRequest = null;

	initializeUI();
	bindEvents();

	/**
	 * Apply initial UI structure and styling
	 */
	function initializeUI() {
		const { passwordInputWrapper, passwordInput, passwordStrengthResults } = UIComponents.core;

		passwordInputWrapper.css( {
			'margin-bottom': '16px',
		} );
		passwordInput.css( {
			'border-color': '#8C8F94',
			'border-radius': '4px 4px 0 0',
		} );
		passwordStrengthResults.hide();
		passwordInput.after( UIComponents.passwordValidationStatus );
		UIComponents.passwordValidationStatus.append( UIComponents.validationCheckList );

		initializeStrengthMeter();
		initializeValidationChecklist();
	}

	/**
	 * Generate and append the initial strength meter state
	 */
	function initializeStrengthMeter() {
		const strengthMeterWrapper = $( '<div>', {
			class: 'strength-meter',
			'aria-live': 'polite',
		} );

		const strengthText = $( '<p>', {
			class: 'strength',
			text: 'Validating...',
		} );

		const branding = $( '<div>', { class: 'branding' } ).append(
			$( '<p>', { class: 'powered-by', text: 'Powered by ' } ),
			$( '<img>', { src: jetpackData.logo, alt: 'Jetpack Logo' } )
		);

		strengthMeterWrapper.append( strengthText, branding );
		UIComponents.validationCheckList.before( strengthMeterWrapper );

		UIComponents.strengthMeter = {
			wrapper: strengthMeterWrapper,
			text: strengthText,
			branding,
		};
	}

	/**
	 * Generate and append the initial validation checklist state
	 */
	function initializeValidationChecklist() {
		Object.entries( jetpackData.validationInitialState ).forEach( ( [ key, value ] ) => {
			const listItem = $( '<li>', { class: 'validation-item', 'data-key': key } );

			// Hide the core and backslash validation items by default
			if ( [ 'core', 'contains_backslash' ].includes( key ) ) {
				listItem.hide();
			}

			const validationIcon = $( '<img>', {
				src: jetpackData.loadingIcon,
				alt: 'Validating...',
				class: 'validation-icon',
			} );

			const validationMessage = $( '<p>', {
				text: value.message,
				class: 'validation-message',
			} );

			let infoIconPopover = null;
			if ( value.info ) {
				infoIconPopover = createInfoIconPopover( value.info );
			}

			listItem.append( validationIcon, validationMessage, infoIconPopover );
			UIComponents.validationCheckList.append( listItem );

			UIComponents.validationChecklistItems[ key ] = {
				icon: validationIcon,
				text: validationMessage,
				item: listItem,
			};
		} );
	}

	/**
	 * Bind events to the UI components
	 */
	function bindEvents() {
		const { passwordInput } = UIComponents.core;

		passwordInput.on( 'input', validatePassword );
		passwordInput.on( 'pwupdate', validatePassword );
	}

	/**
	 * Validate the current password input
	 */
	function validatePassword() {
		const { passwordInput, passwordStrengthResults } = UIComponents.core;

		const password = passwordInput.val();

		if ( currentAjaxRequest ) {
			const oldRequest = currentAjaxRequest;
			currentAjaxRequest = null;
			oldRequest.abort();
		}

		if ( ! password?.trim() ) {
			applyStyling( [], true );
			return;
		}

		// Ensure core strength meter is hidden
		passwordStrengthResults.hide();

		renderLoadingState();

		currentAjaxRequest = $.ajax( {
			url: jetpackData.ajaxurl,
			type: 'POST',
			data: {
				action: 'validate_password_ajax',
				nonce: jetpackData.nonce,
				password: password,
				user_specific: jetpackData.userSpecific,
			},
			success: handleValidationResponse,
			error: handleValidationError,
		} );
	}

	/**
	 * Handles the password validation response.
	 * @param {object} response - The response object.
	 */
	function handleValidationResponse( response ) {
		currentAjaxRequest = null;

		if ( response.success ) {
			const failedValidationConditions = updateValidationChecklist( response.data.state );
			applyStyling( failedValidationConditions );
		} else {
			restoreCoreStrengthMeter();
		}
	}

	/**
	 * Handles validation errors.
	 * @param {object} jqXHR      - The jqXHR object.
	 * @param {any}    textStatus - The status of the request.
	 */
	function handleValidationError( jqXHR, textStatus ) {
		if ( textStatus !== 'abort' ) {
			restoreCoreStrengthMeter();
		}
	}

	/**
	 * Updates the validation checklist based on the response data.
	 *
	 * @param {object} state - The validation state.
	 * @return {object} - The failed conditions.
	 */
	function updateValidationChecklist( state ) {
		const failedConditions = [];

		// Manually update core strength meter status
		const corePasswordStrengthResultsClass =
			UIComponents.core.passwordStrengthResults.attr( 'class' ) || '';
		const coreValidationFailed = ! (
			corePasswordStrengthResultsClass.includes( 'strong' ) ||
			corePasswordStrengthResultsClass.includes( 'good' )
		);

		Object.entries( state ).forEach( ( [ key, item ] ) => {
			const validationFailed = key === 'core' ? coreValidationFailed : item.status;
			const checklistItem = UIComponents.validationChecklistItems[ key ];

			if ( [ 'core', 'contains_backslash' ].includes( key ) ) {
				checklistItem.item.css( 'display', validationFailed ? 'flex' : 'none' );
			}

			if ( checklistItem ) {
				checklistItem.icon.attr(
					'src',
					validationFailed ? jetpackData.crossIcon : jetpackData.checkIcon
				);
				checklistItem.icon.attr( 'alt', validationFailed ? 'Invalid' : 'Valid' );
				checklistItem.text.css( { color: validationFailed ? '#E65054' : '#008710' } );
			}

			if ( validationFailed ) failedConditions.push( key );
		} );

		return failedConditions;
	}

	/**
	 *
	 * Apply styling based on validation results
	 *
	 * @param {Array}   failedValidationConditions - Array containing failed validation conditions keys
	 * @param {boolean} passwordIsEmpty            - Whether the password input is empty
	 */
	function applyStyling( failedValidationConditions, passwordIsEmpty = false ) {
		if ( passwordIsEmpty ) {
			renderEmptyInputState();
			return;
		}

		const isPasswordStrong = failedValidationConditions.length === 0;
		const color = isPasswordStrong ? '#9DD977' : '#FFABAF';
		const strengthText = isPasswordStrong ? 'Strong' : 'Weak';

		const {
			weakPasswordConfirmation,
			weakPasswordConfirmationCheckbox,
			submitButtons,
			passwordInput,
		} = UIComponents.core;
		const { wrapper, text } = UIComponents.strengthMeter;

		if ( isPasswordStrong || weakPasswordConfirmationCheckbox.prop( 'checked' ) ) {
			submitButtons.prop( 'disabled', false );
		} else {
			submitButtons.prop( 'disabled', true );
		}

		weakPasswordConfirmation.css( 'display', isPasswordStrong ? 'none' : 'table-row' );

		text.text( strengthText );
		wrapper.css( 'background-color', color );

		passwordInput.css( {
			'border-color': color,
			'border-radius': '4px 4px 0px 0px',
		} );

		UIComponents.passwordValidationStatus.show();
	}

	/**
	 * Render the empty input state
	 */
	function renderEmptyInputState() {
		UIComponents.passwordValidationStatus.hide();
		UIComponents.core.passwordInput.removeAttr( 'style' );
	}

	/**
	 * Render the loading state
	 */
	function renderLoadingState() {
		const { passwordInput, weakPasswordConfirmation, submitButtons } = UIComponents.core;
		submitButtons.prop( 'disabled', true );
		weakPasswordConfirmation.hide();

		Object.values( UIComponents.validationChecklistItems ).forEach( ( { icon, text } ) => {
			icon.attr( 'src', jetpackData.loadingIcon );
			icon.attr( 'alt', 'Validating...' );
			text.css( { color: '#3C434A', transition: 'color 0.2s ease-in-out' } );
		} );

		UIComponents.strengthMeter.text.text( 'Validating...' );
		UIComponents.strengthMeter.wrapper.css( 'background-color', '#C3C4C7' );
		passwordInput.css( {
			'border-color': '#C3C4C7',
			'border-radius': '4px 4px 0px 0px',
		} );

		UIComponents.passwordValidationStatus.show();
	}

	/**
	 * Resets UI to core strength meter.
	 */
	function restoreCoreStrengthMeter() {
		renderEmptyInputState();
		UIComponents.core.passwordStrengthResults.show();
	}

	/**
	 * Creates an info popover element.
	 *
	 * @param {string} infoText - The text to display in the popover.
	 * @return {jQuery} - The info popover element.
	 */
	function createInfoIconPopover( infoText ) {
		const infoIcon = $( '<img>', { src: jetpackData.infoIcon, alt: 'Info', class: 'info-icon' } );
		const popover = $( '<div>', { text: infoText, class: 'popover' } ).append(
			$( '<div>', { class: 'popover-arrow' } )
		);

		infoIcon.hover(
			() => popover.fadeIn( 200 ),
			() => popover.fadeOut( 200 )
		);

		return $( '<div>', { class: 'info-popover' } ).append( infoIcon, popover );
	}
} );
