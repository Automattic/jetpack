/**
 * External dependencies
 */
import React from 'react';
import assign from 'lodash/assign';

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
	const SettingsForm = React.createClass( {
		getInitialState() {
			return {
				options: {}
			}
		},
		onOptionChange( event ) {
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
		},
		/**
		 * Updates the list of form values to save, usually options to set or modules to activate.
		 * Receives an object with key => value pairs to set multiple options or a string and a value to set a single option.
		 *
		 * @param   {string|object} optionMaybeOptions
		 * @param   {*}             optionValue
		 * @returns {boolean}
		 */
		updateFormStateOptionValue( optionMaybeOptions, optionValue = undefined ) {
			if ( 'string' === typeof optionMaybeOptions ) {
				optionMaybeOptions = { [ optionMaybeOptions ]: optionValue };
			}
			const newOptions = {
				...this.state.options,
				...optionMaybeOptions
			};
			this.setState( { options: newOptions } );
			return true;
		},
		/**
		 * Receives an option and the module it depends on.
		 * If the module is active, only the option is added to the list of form values to send.
		 * If it's inactive, an additional option stating that the module must be activated is added to the list.
		 *
		 * @param {string}  module
		 * @param {string}  moduleOption
		 * @param {boolean} deactivate
		 */
		updateFormStateModuleOption( module, moduleOption, deactivate = false ) {

			// If the module is active, check if we're going to update the option or update and deactivate.
			if ( this.getOptionValue( module ) ) {
				if ( deactivate ) {

					// If after toggling the option the module is no longer needed to be active, deactivate it.
					this.updateFormStateOptionValue( {
						[ module ]: false,
						[ moduleOption ]: ! this.getOptionValue( moduleOption )
					} );
				} else {

					// We pass the value to set.
					this.updateFormStateOptionValue( moduleOption, ! this.getOptionValue( moduleOption ) );
				}
			} else {

				// If the module is inactive, we pass the module to activate and the value to set.
				this.updateFormStateOptionValue( {
					[ module ]: true,
					[ moduleOption ]: true
				} );
			}
		},
		componentDidUpdate() {
			if ( this.isDirty() ) {
				this.props.setUnsavedSettingsFlag();
			}
		},
		onSubmit( event ) {
			event.preventDefault();
			this.props.updateOptions( assign( {}, this.state.options ) );
			this.props.clearUnsavedSettingsFlag();
			this.setState( { options: {} } )
		},

		/**
		 * Retrieves an option from an existing module, or from an array of modules
		 * if the form was initialized with an array
		 */
		getOptionValue( settingName, module = '' ) {
			const currentValue = this.props.getSettingCurrentValue( settingName, module );
			return typeof this.state.options[ settingName ] !== 'undefined'
				 ? this.state.options[ settingName ]
				 : currentValue;
		},

		shouldSaveButtonBeDisabled() {
			// Check if the form is not currently dirty
			return this.isSavingAnyOption() || ! this.isDirty();
		},
		isDirty() {
			return !! Object.keys( this.state.options ).length;
		},
		isSavingAnyOption() {
			// Check if any of the updated options is still saving
			return this.props.isUpdating();
		},
		render() {
			return (
				<InnerComponent
					getOptionValue={ this.getOptionValue }
					onSubmit={ this.onSubmit }
					onOptionChange={ this.onOptionChange }
					updateFormStateOptionValue={ this.updateFormStateOptionValue }
					updateFormStateModuleOption={ this.updateFormStateModuleOption }
					shouldSaveButtonBeDisabled={ this.shouldSaveButtonBeDisabled }
					isSavingAnyOption={ this.isSavingAnyOption }
					{ ...this.props } />
			);
		}
	} );
	return connectModuleOptions( SettingsForm );
}
