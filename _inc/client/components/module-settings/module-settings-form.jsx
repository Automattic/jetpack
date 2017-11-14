/**
 * External dependencies
 */
import React from 'react';
import get from 'lodash/get';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import { connectModuleOptions } from 'components/module-settings/connect-module-options';

/**
 * High order component that provides a <form> with functionality
 * to handle input values on the forms' own React component state.
 *
 * @param  {React.Component} InnerComponent The component with a top level form element
 * @return {[React.Component]}	The component with new functionality
 */
export function ModuleSettingsForm( InnerComponent ) {
	class SettingsForm extends React.Component {
		state = {
			options: {}
		};

		onOptionChange = event => {
			const optionName = event.target.name;
			let optionValue;
			// Get the option value from the `checked` property if present.
			if ( event.target.type === 'checkbox' ) {
				optionValue = typeof event.target.checked !== 'undefined'
					? event.target.checked
					: event.target.value;
			} else {
				optionValue = event.target.value;
			}

			this.updateFormStateOptionValue( optionName, optionValue );
		};

		/**
		 * Updates the list of form values to save, usually options to set or modules to activate.
		 * Receives an object with key => value pairs to set multiple options or a string and a value to set a single option.
		 *
		 * @param   {string|object} optionMaybeOptions
		 * @param   {*}             optionValue
		 * @returns {boolean}
		 */
		updateFormStateOptionValue = (optionMaybeOptions, optionValue = undefined) => {
			if ( 'string' === typeof optionMaybeOptions ) {
				optionMaybeOptions = { [ optionMaybeOptions ]: optionValue };
			}
			const newOptions = {
				...this.state.options,
				...optionMaybeOptions
			};
			this.setState( { options: newOptions } );
			return true;
		};

		/**
		 * Receives an option and the module it depends on.
		 * If the module is active, only the option is added to the list of form values to send.
		 * If it's inactive, an additional option stating that the module must be activated is added to the list.
		 *
		 * @param {String}  module
		 * @param {String}  moduleOption
		 * @param {Boolean} deactivate
		 */
		updateFormStateModuleOption = (module, moduleOption, deactivate = false) => {
			this.trackSettingsToggle( module, moduleOption, ! this.getOptionValue( moduleOption ) );

			// If the module is active, check if we're going to update the option or update and deactivate.
			if ( this.getOptionValue( module ) ) {
				if ( deactivate ) {

					// If after toggling the option the module is no longer needed to be active, deactivate it.
					this.props.updateOptions( {
						[ module ]: false,
						[ moduleOption ]: ! this.getOptionValue( moduleOption )
					} );
				} else {
					// We pass the value to set.
					this.props.updateOptions( {
						[ moduleOption ]: ! this.getOptionValue( moduleOption )
					} );
				}
			} else {

				// If the module is inactive, we pass the module to activate and the value to set.
				this.props.updateOptions( {
					[ module ]: true,
					[ moduleOption ]: true
				} );
			}
		};

		/**
		 * Instantly activate or deactivate a module.
		 *
		 * @param {String} module
		 */
		toggleModuleNow = module => {
			this.props.updateOptions( { [ module ]: ! this.getOptionValue( module ) } );
		};

		componentDidUpdate() {
			if ( this.isDirty() ) {
				this.props.setUnsavedSettingsFlag();
			}
		}

		onSubmit = event => {
			event.preventDefault();
			this.props.updateOptions( this.state.options )
				.then( () => {

					// Track it
					this.trackFormSubmission( this.state.options );

					this.setState( { options: {} } );
				} )
				.then( () => {
					this.props.clearUnsavedSettingsFlag();
				} );
		};

		/**
		 * Retrieves an option from an existing module, or from an array of modules
		 * if the form was initialized with an array
		 */
		getOptionValue = (settingName, module = '') => {
			return get( this.state.options, settingName, this.props.getSettingCurrentValue( settingName, module ) );
		};

		shouldSaveButtonBeDisabled = () => {
			// Check if the form is not currently dirty
			return this.isSavingAnyOption() || ! this.isDirty();
		};

		/**
		 * Check if there are unsaved settings in the card.
		 *
		 * @returns {Boolean}
		 */
		isDirty = () => {
			return !! Object.keys( this.state.options ).length;
		};

		/**
		 * Checks if a setting is currently being saved.
		 *
		 * @param {String|Array} settings
		 *
		 * @returns {Boolean} True if specified settings are being saved, false otherwise.
		 */
		isSavingAnyOption = (settings = '') => {
			return this.props.isUpdating( settings );
		};

		/**
		 * Tracks form submissions
		 * @param options
		 */
		trackFormSubmission = options => {
			analytics.tracks.recordEvent(
				'jetpack_wpa_settings_form_submit',
				options
			);
		};

		/**
		 * Tracks settings toggles
		 * @param options
		 */
		trackSettingsToggle = (module, setting, activated) => {
			analytics.tracks.recordEvent(
				'jetpack_wpa_settings_toggle',
				{
					module: module,
					setting: setting,
					toggled: activated ? 'on' : 'off'
				}
			);
		};

		render() {
			return (
				<InnerComponent
					getOptionValue={ this.getOptionValue }
					onSubmit={ this.onSubmit }
					onOptionChange={ this.onOptionChange }
					updateFormStateOptionValue={ this.updateFormStateOptionValue }
					toggleModuleNow={ this.toggleModuleNow }
					updateFormStateModuleOption={ this.updateFormStateModuleOption }
					shouldSaveButtonBeDisabled={ this.shouldSaveButtonBeDisabled }
					isSavingAnyOption={ this.isSavingAnyOption }
					isDirty={ this.isDirty }
					{ ...this.props } />
			);
		}
	}

	return connectModuleOptions( SettingsForm );
}
