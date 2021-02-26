/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';
import Formsy from 'formsy-react';
import createReactClass from 'create-react-class';

/**
 * Internal Dependencies
 */
import Label from './label';
import getUniqueId from './counter';
import FormInputValidation from '../form-input-validation';
import requiredFieldErrorFormatter from './required-error-label';

class Radios extends React.Component {
	static propTypes = {
		name: PropTypes.string,
		choices: PropTypes.array,
		selected: PropTypes.any,
		uniqueId: PropTypes.string,
		changeValue: PropTypes.func,
	};

	static defaultProps = {
		choices: [],
	};

	onChange = event => {
		this.props.changeValue( event );
	};

	mapChoices() {
		const uniqueId = this.props.uniqueId;
		return this.props.choices.map( ( choice, i ) => {
			const checked = this.props.selected === choice.value;
			return (
				<div className="dops-form-checkbox" key={ i }>
					<Label inline label={ choice.label } htmlFor={ uniqueId + i }>
						<input
							type="radio"
							id={ uniqueId + i }
							value={ choice.value }
							name={ this.props.name }
							checked={ checked }
							onChange={ this.onChange }
						/>
					</Label>
				</div>
			);
		} );
	}

	render() {
		const choices = this.mapChoices();

		return <fieldset>{ choices }</fieldset>;
	}
}

export default createReactClass( {
	displayName: 'RadioInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		choices: PropTypes.any,
		selected: PropTypes.any,
		required: PropTypes.any,
		validations: PropTypes.string,
		validationError: PropTypes.string,
	},

	getInitialState: function () {
		return {
			uniqueId: getUniqueId(),
			selectedItem: this.props.selected,
		};
	},

	UNSAFE_componentWillMount: function () {
		this.setValue( this.props.selected );
	},

	getDefaultProps: function () {
		return { required: false };
	},

	changeValue: function ( event ) {
		this.setState( { selectedItem: event.target.value } );
		this.setValue( event.target.value );
	},

	render: function () {
		let errorMessage;

		if ( ! this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( ! errorMessage ) {
				errorMessage = this.showRequired()
					? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' )
					: null;
			}
		}

		const className = classNames(
			{
				'dops-field': true,
				'dops-form-radio': true,
				'dops-form-error': errorMessage,
			},
			this.props.className
		);

		return (
			<div className={ className }>
				<Radios
					name={ this.props.name }
					uniqueId={ this.state.uniqueId }
					choices={ this.props.choices }
					changeValue={ this.changeValue }
					selected={ this.state.selectedItem }
				/>

				{ errorMessage && <FormInputValidation text={ errorMessage } isError={ true } /> }
			</div>
		);
	},
} );
