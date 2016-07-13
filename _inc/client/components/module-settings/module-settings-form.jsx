/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { connectModuleOptions } from 'components/module-settings/connect-module-options';

export function ModuleSettingsForm( InnerComponent ) {
	const SettingsForm = React.createClass( {
		getInitialState() {
			return {
				options: {}
			}
		},
		onOptionChange( event ) {
			const optionName = event.target.name;
			// Get the option value from the `checked` property if present.
			const optionValue = typeof event.target.checked !== 'undefined'
				? event.target.checked
				: event.target.value;
			const newOptions = {
				...this.state.options,
				[ optionName ]: optionValue
			};
			this.setState( { options: newOptions } );
			return true;
		},
		onSubmit( event ) {
			event.preventDefault();
			console.log( this.state.options );
			this.props.updateOptions( this.state.options );
		},
		getOptionValue( optionName ) {
			const currentValue = this.props.getOptionCurrentValue( this.props.module.module, optionName );
			return typeof this.state.options[ optionName ] !== 'undefined'
				? this.state.options[ optionName ]
				: currentValue;
		},
		isDirty() {
			return !! Object.keys( this.state.options ).length;
		},
		render() {
			return(
				<InnerComponent
					getOptionValue={ this.getOptionValue }
					onSubmit={ this.onSubmit }
					onOptionChange={ this.onOptionChange }
					isDirty={ this.isDirty }
					{ ...this.props } />
			);
		}
	} );
	return connectModuleOptions( SettingsForm );
}