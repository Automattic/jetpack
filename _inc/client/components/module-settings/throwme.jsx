import React from 'react';

import {
 FormLabel,
 FormCheckbox,
 FormRadio,
 FormTextInput
} from 'components/forms';
import { connectModuleOptions } from 'components/module-settings/connect-module-options';

export const EnumOption = React.createClass( {
	updateOption( event ) {
		this.props.updateOption( this.props.option_name, event.target.value );
		return true;
	},
	isUpdating() {
		return this.props.isUpdating;
	},
	render() {
		let props = this.props;
		let validValues = this.props.validValues;
		return (
			<div>
				{
				Object.keys( validValues ).map( ( key ) => (
					<FormLabel key={ `option-${props.option_name}-${key}` } >
						<FormRadio
							name={ props.option_name }
							checked= { key === props.currentValue }
							value={ key }
							disabled={ this.isUpdating() }
							onChange= { this.updateOption} />
						<span>{ ( validValues[ key ] ) }</span>
					</FormLabel>
				) )
				}
			</div>
		);
	}
} );

export const ModuleOptionEnum = connectModuleOptions( EnumOption );

const TextInputOption = React.createClass( {
	updateOption( event ) {
		this.props.updateOption( this.props.option_name, event.target.value );
		return true;
	},
	isUpdating() {
		return this.props.isUpdating;
	},
	render() {
		let props = this.props;
		return (
			<FormLabel>
				<span>{ ( this.props.label ) }</span>
				<FormTextInput
					name={ props.option_name }
					checked={ props.enabled }
					disabled={ this.isUpdating() }
					onChange= { this.updateOption } />
			</FormLabel>
		);
	}
} );

export const ModuleOptionTextInput = connectModuleOptions( TextInputOption );