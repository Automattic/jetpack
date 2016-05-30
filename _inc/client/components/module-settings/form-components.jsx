/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
 import {
	FormLabel,
	FormCheckbox
 } from 'components/forms';

export const ModuleSettingCheckbox = React.createClass( {
	render() {
		const props = this.props;
		return (
			<FormLabel>
				<FormCheckbox
					name={ props.name }
					checked={ props.getOptionValue( props.name ) }
					value={ props.getOptionValue( props.name ) }
					disabled={ props.isUpdating( props.name ) }
					onChange= { props.onOptionChange} />
				<span>{ ( props.label ) }</span>
			</FormLabel>
		);
	}
} );

export const ModuleSettingRadios = React.createClass( {
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
