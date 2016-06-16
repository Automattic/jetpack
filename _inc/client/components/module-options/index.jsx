/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import debounce from 'lodash/debounce';

/**
 * Internal dependencies
 */
 import {
	FormLabel,
	FormCheckbox,
	FormRadio,
	FormTextInput
 } from 'components/forms';
import {
	updateModuleOption,
	getModuleOption,
	getModuleOptionValidValues,
	isUpdatingModuleOption
} from 'state/modules';

export const FormBooleanOption = React.createClass( {
	toggle() {
		this.props.toggleOption( this.props.option_name );
	},
	render() {
		let props = this.props;
		return (
			<FormLabel>
				<FormCheckbox
					name={ props.option_name }
					checked={ props.enabled }
					disabled={ this.props.fetchingOptions }
					onChange= { this.toggle} />
				{ props.children }
			</FormLabel>
		);
	}
} );

const BooleanOption = React.createClass( {
	toggle() {
		this.props.toggleOption( this.props.option_name, this.props.enabled );
		return true;
	},
	isToggling() {
		return this.props.isToggling;
	},
	render() {
		let props = this.props;
		return (
			<FormLabel>
				<FormCheckbox
					name={ props.option_name }
					checked={ props.enabled }
					disabled={ this.isToggling() }
					onChange= { this.toggle} />
				<span>{ ( this.props.label ) }</span>
			</FormLabel>
		);
	}
} );

export const ModuleOptionBoolean = connectModuleOptions( BooleanOption );

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

export function connectModuleOptions( Component ) {
	return connect(
		( state, ownProps ) => {
			return {
				validValues: getModuleOptionValidValues( state, ownProps.module.module, ownProps.option_name ),
				currentValue: getModuleOption( state, ownProps.module.module, ownProps.option_name ),
				enabled: getModuleOption( state, ownProps.module.module, ownProps.option_name ),
				getModuleOption: ( module_slug ) => getModuleOption( state, module_slug, module_name ),
				isToggling: false,
				isUpdating: isUpdatingModuleOption( state, ownProps.module.module, ownProps.option_name )
			}
		},
		( dispatch, ownProps ) => ( {
			toggleOption: ( option_name, currentValue ) => {
				return dispatch( updateModuleOption( ownProps.module.module, option_name, ! currentValue ) );
			},
			updateOption: ( option_name, newValue ) => {
				return dispatch( updateModuleOption( ownProps.module.module, option_name, newValue ) );
			}
		} )
	)( Component );
}
