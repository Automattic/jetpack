/**
 * External dependencies
 */
import React from 'react';
import concat from 'lodash/concat';
import without from 'lodash/without';

/**
 * Internal dependencies
 */
import {
	FormLabel,
	FormRadio
} from 'components/forms';
import Checkbox from 'components/checkbox';


export const ModuleSettingCheckbox = React.createClass( {
	render() {
		const props = this.props;
		return (
			<FormLabel>
				<Checkbox
					name={ props.name }
					checked={ !! props.getOptionValue( props.name ) }
					value={ !! props.getOptionValue( props.name ) }
					disabled={ props.isUpdating( props.name ) }
					onChange= { props.onOptionChange } />
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
					<FormLabel key={ `option-${ props.option_name }-${key}` } >
						<FormRadio
							name={ props.name }
							checked={ key === props.getOptionValue( props.name ) }
							value={ key }
							disabled={ props.isUpdating( props.name ) }
							onChange= { props.onOptionChange } />
						<span>{ ( validValues[ key ] ) }</span>
					</FormLabel>
				) )
				}
			</div>
		);
	}
} );

export const ModuleSettingMultipleSelectCheckboxes = React.createClass( {
	getDefaultProps() {
		return {
			always_checked: []
		}
	},
	onOptionChange( event ) {
		const justUpdated = event.target.value;
		const currentValue = this.props.getOptionValue( this.props.name );
		const newValue = currentValue.indexOf( justUpdated ) === -1 ?
			concat( currentValue, justUpdated ) :
			without( currentValue, justUpdated );
		this.props.updateFormStateOptionValue( this.props.name, newValue );
	},
	isAlwaysChecked( key ) {
		return this.props.always_checked.indexOf( key ) !== -1;
	},
	shouldBeChecked( key ) {
		return this.isAlwaysChecked( key ) ||
			this.props.getOptionValue( this.props.name ).indexOf( key ) !== -1;
	},
	shouldBeDisabled( key ) {
		return this.isAlwaysChecked( key ) ||
			this.props.isUpdating( this.props.name );
	},
	render() {
		let props = this.props;
		let validValues = this.props.validValues;
		return (
			<div>
				{
				Object.keys( validValues ).map( ( key ) => (
					<FormLabel key={ `option-${ props.option_name }-${key}` } >
						<Checkbox
							name={ props.name }
							checked= { this.shouldBeChecked( key ) }
							value={ key }
							disabled={ this.shouldBeDisabled( key ) }
							onChange= { this.onOptionChange } />
						<span>{ ( validValues[ key ].name ) }</span>
					</FormLabel>
				) )
				}
			</div>
		);
	}
} );
