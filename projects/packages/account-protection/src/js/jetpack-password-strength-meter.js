/* global jQuery, jetpackData */

jQuery( document ).ready( function ( $ ) {
	const UIComponents = {
		core: {
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

	/**
	 * Apply initial validation UI structure and styling
	 */
	function initializeValidationUI() {
		initializeForm();
		initializeStrengthMeter();
		initializeValidationChecklist();
	}

	/**
	 * Generate and append the initial strength meter state
	 */
	function initializeForm() {
		const { passwordInput, passwordStrengthResults } = UIComponents.core;

		passwordInput.css( {
			'border-color': '#8C8F94',
			'border-radius': '4px 4px 0 0',
		} );

		passwordStrengthResults.hide();
		passwordInput.after( UIComponents.passwordValidationStatus );
		UIComponents.passwordValidationStatus.append( UIComponents.validationCheckList );
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

		const branding = $( '<div>', { class: 'branding' } )
			.append( $( '<p>', { class: 'powered-by', text: 'Powered by ' } ) )
			.append( jetpackData.logo );

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

			const validationIcon = $( '<span>', {
				class: 'validation-icon',
			} );

			const validationMessage = $( '<p>', {
				text: value.message,
				class: 'validation-message',
			} );

			const infoIconPopover = value.info ? createInfoIconPopover( value.info ) : null;
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
	 * Debounce function to limit the number of requests
	 * @param {Function} func  - The function to debounce
	 * @param {number}   delay - The delay in milliseconds
	 *
	 * @return {Function} - The debounced function
	 */
	function debounce( func, delay ) {
		let timer;
		return function () {
			clearTimeout( timer );
			timer = setTimeout( () => func.apply( this, arguments ), delay );
		};
	}

	/**
	 * Bind events to the UI components
	 */
	function bindEvents() {
		const { passwordInput } = UIComponents.core;

		passwordInput.on( 'input', debounce( validatePassword, 250 ) );
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
			updateValidationUI( 'empty' );
			return;
		}

		// Ensure core strength meter is hidden
		passwordStrengthResults.hide();

		updateValidationUI( 'loading' );

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
			updateValidationUI( 'results', response.data.state );
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
	 * Get the core validation state
	 * @return {boolean} - Whether the core validation failed
	 */
	function getCoreValidationState() {
		const corePasswordStrengthResultsClass =
			UIComponents.core.passwordStrengthResults.attr( 'class' ) || '';

		return ! (
			corePasswordStrengthResultsClass.includes( 'strong' ) ||
			corePasswordStrengthResultsClass.includes( 'good' )
		);
	}

	/**
	 *
	 * Update the validation UI based on the current state
	 * @param {string} state           - The current validation state
	 * @param {object} validationState - Object containing validation state
	 */
	function updateValidationUI( state, validationState ) {
		if ( state === 'empty' ) {
			renderEmptyState();
			return;
		}

		UIComponents.passwordValidationStatus.show();

		if ( state === 'loading' ) {
			renderLoadingState();
			return;
		}

		if ( validationState ) {
			renderResultsState( validationState );
		}
	}

	/**
	 * Render the empty input state
	 */
	function renderEmptyState() {
		const { weakPasswordConfirmation, passwordInput } = UIComponents.core;

		weakPasswordConfirmation.hide();
		passwordInput.css( {
			'border-color': '#8C8F94',
			'border-radius': '4px',
		} );

		UIComponents.passwordValidationStatus.hide();
	}

	/**
	 * Render the loading state
	 */
	function renderLoadingState() {
		renderFormLoadingState();
		renderStrengthMeterLoadingState();
		renderValidationChecklistLoadingState();
	}

	/**
	 * Render the form loading state
	 */
	function renderFormLoadingState() {
		const { submitButtons, passwordInput } = UIComponents.core;

		submitButtons.prop( 'disabled', true );
		passwordInput.css( {
			'border-color': '#C3C4C7',
			'border-radius': '4px 4px 0px 0px',
		} );

		UIComponents.passwordValidationStatus.show();
	}

	/**
	 * Render the strength meter loading state
	 */
	function renderStrengthMeterLoadingState() {
		const { wrapper, text } = UIComponents.strengthMeter;

		text.text( 'Validating...' );
		wrapper.css( 'background-color', '#C3C4C7' );
	}

	/**
	 * Render the validation checklist loading state
	 */
	function renderValidationChecklistLoadingState() {
		Object.entries( UIComponents.validationChecklistItems ).forEach( ( [ key, itemData ] ) => {
			const { icon, text, item } = itemData;

			icon.removeClass( 'check cross' );
			text.css( { color: '#3C434A' } );

			// Re-hide the core and contains_backslash items
			if ( [ 'core', 'contains_backslash' ].includes( key ) ) {
				item.hide();
			}
		} );

		UIComponents.strengthMeter.text.text( 'Validating...' );
		UIComponents.strengthMeter.wrapper.css( 'background-color', '#C3C4C7' );
	}

	/**
	 * Render the validation results state
	 * @param {object} validationState - Object containing validation state
	 */
	function renderResultsState( validationState ) {
		validationState.core.status = getCoreValidationState();
		const isPasswordStrong = Object.values( validationState ).every( item => ! item.status );
		const color = isPasswordStrong ? '#9DD977' : '#FFABAF';
		const failedValidationKeys = ! isPasswordStrong
			? Object.keys( validationState ).filter( key => validationState[ key ].status )
			: [];

		renderFormResultsState( isPasswordStrong, color );
		renderStengthMeterResultsState( isPasswordStrong, color );
		renderValidationChecklistResultsState( failedValidationKeys );
	}

	/**
	 * Update the form elements based on the current password strength
	 * @param {boolean} isPasswordStrong - Whether the password is strong
	 * @param {string}  color            - The color to apply to the form elements
	 */
	function renderFormResultsState( isPasswordStrong, color ) {
		const {
			passwordInput,
			weakPasswordConfirmation,
			weakPasswordConfirmationCheckbox,
			submitButtons,
		} = UIComponents.core;
		passwordInput.css( { 'border-color': color, 'border-radius': '4px 4px 0px 0px' } );

		weakPasswordConfirmation.css( 'display', isPasswordStrong ? 'none' : 'table-row' );
		submitButtons.prop(
			'disabled',
			! isPasswordStrong && ! weakPasswordConfirmationCheckbox.prop( 'checked' )
		);
	}

	/**
	 *
	 * Update the strength meter based on the current password strength
	 * @param {boolean} isPasswordStrong - Whether the password is strong
	 * @param {string}  color            - The color to apply to the strength meter
	 */
	function renderStengthMeterResultsState( isPasswordStrong, color ) {
		const { wrapper, text } = UIComponents.strengthMeter;

		text.text( isPasswordStrong ? 'Strong' : 'Weak' );
		wrapper.css( 'background-color', color );
	}

	/**
	 *
	 * Update the validation checklist based on the failed validation keys
	 * @param {Array} failedValidationKeys - Array containing failed validation keys
	 */
	function renderValidationChecklistResultsState( failedValidationKeys ) {
		Object.entries( UIComponents.validationChecklistItems ).forEach( ( [ key, itemData ] ) => {
			const { icon, text, item } = itemData;
			const validationFailed = failedValidationKeys.includes( key );

			icon.attr( 'class', `validation-icon ${ validationFailed ? 'cross' : 'check' }` );
			text.css( { color: validationFailed ? '#E65054' : '#008710' } );

			// Display the core and backslash validation items they fail
			if ( [ 'core', 'contains_backslash' ].includes( key ) ) {
				item.css( 'display', validationFailed ? 'flex' : 'none' );
			}
		} );
	}

	/**
	 * Resets UI to core strength meter.
	 */
	function restoreCoreStrengthMeter() {
		renderEmptyState();
		UIComponents.core.passwordStrengthResults.show();
	}

	/**
	 * Creates an info popover element.
	 *
	 * @param {string} infoText - The text to display in the popover.
	 * @return {jQuery} - The info popover element.
	 */
	function createInfoIconPopover( infoText ) {
		const popover = $( '<div>', { text: infoText, class: 'popover' } ).append(
			$( '<div>', { class: 'popover-arrow' } )
		);

		const infoIcon = $( '<span>', { class: 'info-icon' } ).hover(
			() => popover.fadeIn( 200 ),
			() => popover.fadeOut( 200 )
		);

		return $( '<div>', { class: 'info-popover' } ).append( infoIcon, popover );
	}

	initializeValidationUI();
	bindEvents();
} );
