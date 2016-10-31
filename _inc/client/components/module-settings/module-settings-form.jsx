/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { connectModuleOptions } from 'components/module-settings/connect-module-options';

/**
 * High order component that provides a <form> with functionality
 * to handle input values on the forms' own React component state.
 *
 * @param  {React.Component} Component The component with a top level form element
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
		updateFormStateOptionValue( optionName, optionValue ) {
			const newOptions = {
				...this.state.options,
				[ optionName ]: optionValue
			};
			this.setState( { options: newOptions } );
			this.props.setUnsavedOptionFlag();
			return true;
		},
		onSubmit( event ) {
			event.preventDefault();
			this.props.updateOptions( this.state.options )
				.then( () => {
					this.setState( { options: {} } )
				} );
			this.props.clearUnsavedOptionFlag();
		},

		/**
		 * Retrieves an option from an existing module, or from an array of modules
		 * if the form was initialized with an array
		 */
		getOptionValue( optionName ) {
			let self = this;

			if ( Array.isArray( this.props.module ) ) {

				// If we have an array of modules, find the one with that option
				return this.props.module.map( function( module ) {
					return self.getOptionFromModule( optionName, module );
				} ).reduce( function( item, value ) {
					if ( 'undefined' !== typeof item ) {
						return item;
					}
					return value;
				}, undefined );

			} else {
				return this.getOptionFromModule( optionName, this.props.module );
			}
		},

		/**
		 * Return an option value from a certain module
		 */
		getOptionFromModule( optionName, module ) {
			const currentValue = this.props.getOptionCurrentValue( module.module, optionName );
			return typeof this.state.options[ optionName ] !== 'undefined'
				 ? this.state.options[ optionName ]
				 : currentValue;
		},
		shouldSaveButtonBeDisabled() {
			let shouldItBeEnabled = false;
			// Check if the form is not currently dirty
			shouldItBeEnabled = ! this.isSavingAnyOption() && this.isDirty();
			return ! shouldItBeEnabled;
		},
		isDirty() {
			return !! Object.keys( this.state.options ).length;
		},
		isSavingAnyOption() {
			// Check if any of the updated options is still saving
			return Object.keys( this.state.options ).some( option_name => this.props.isUpdating( option_name ) );
		},
		render() {
			return (
				<InnerComponent
					getOptionValue={ this.getOptionValue }
					onSubmit={ this.onSubmit }
					onOptionChange={ this.onOptionChange }
					updateFormStateOptionValue={ this.updateFormStateOptionValue }
					shouldSaveButtonBeDisabled={ this.shouldSaveButtonBeDisabled }
					isSavingAnyOption={ this.isSavingAnyOption }
					{ ...this.props } />
			);
		}
	} );
	return connectModuleOptions( SettingsForm );
}
