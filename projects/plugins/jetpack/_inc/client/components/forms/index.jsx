import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import SelectDropdown from 'components/select-dropdown';
import { isEmpty, forOwn, omit } from 'lodash';
import React from 'react';

export const FormFieldset = props => {
	return (
		<fieldset
			{ ...omit( props, 'className' ) }
			className={ classNames( props.className, 'jp-form-fieldset' ) }
		>
			{ props.children }
		</fieldset>
	);
};

export class FormLabel extends React.Component {
	static displayName = 'FormLabel';

	render() {
		const { className, htmlFor, ...otherProps } = this.props;
		return (
			<label
				{ ...otherProps }
				htmlFor={ htmlFor }
				className={ classNames( className, 'jp-form-label' ) }
			>
				{ this.props.children }
			</label>
		);
	}
}

export class FormLegend extends React.Component {
	static displayName = 'FormLegend';

	render() {
		return (
			<legend
				{ ...omit( this.props, 'className' ) }
				className={ classNames( this.props.className, 'jp-form-legend' ) }
			>
				{ this.props.children }
			</legend>
		);
	}
}

export class FormCheckbox extends React.Component {
	static displayName = 'FormInputCheckbox';

	render() {
		const otherProps = omit( this.props, [ 'className', 'type' ] );

		return (
			<input
				{ ...otherProps }
				type="checkbox"
				className={ classNames( this.props.className, 'jp-form-checkbox' ) }
			/>
		);
	}
}

export class FormTextInput extends React.Component {
	static displayName = 'FormTextInput';

	static defaultProps = {
		isError: false,
		isValid: false,
		selectOnFocus: false,
		type: 'text',
	};

	focus = () => {
		this.refs.textField.focus();
	};

	render() {
		const { className, selectOnFocus } = this.props;
		const classes = classNames( className, {
			'jp-form-text-input': true,
			'is-error': this.props.isError,
			'is-valid': this.props.isValid,
		} );

		const filteredProps = {};
		for ( const key in this.props ) {
			if ( [ 'isError', 'isValid', 'selectOnFocus' ].includes( key ) ) {
				continue;
			}
			filteredProps[ key ] = this.props[ key ];
		}

		return (
			<input
				{ ...filteredProps }
				ref="textField"
				className={ classes }
				onClick={ selectOnFocus ? this.selectOnFocus : null }
			/>
		);
	}

	selectOnFocus = event => {
		event.target.select();
	};
}

export class FormTextarea extends React.Component {
	static displayName = 'FormTextarea';

	render() {
		return (
			<textarea
				{ ...omit( this.props, 'className' ) }
				className={ classNames( this.props.className, 'jp-form-textarea' ) }
			>
				{ this.props.children }
			</textarea>
		);
	}
}

export class FormRadio extends React.Component {
	static displayName = 'FormRadio';

	render() {
		const otherProps = omit( this.props, [ 'className', 'type' ] );

		return (
			<input
				{ ...otherProps }
				type="radio"
				className={ classNames( this.props.className, 'jp-form-radio' ) }
			/>
		);
	}
}

export class FormButton extends React.Component {
	static displayName = 'FormsButton';

	static defaultProps = {
		isSubmitting: false,
		isPrimary: true,
		type: 'submit',
	};

	getDefaultButtonAction = () => {
		return this.props.isSubmitting
			? __( 'Saving…', 'jetpack' )
			: __( 'Save Settings', 'jetpack', /* dummy arg to avoid bad minification */ 0 );
	};

	render() {
		const buttonClasses = classNames( {
			'jp-form-button': true,
		} );

		return (
			<Button
				{ ...omit( this.props, 'className' ) }
				variant={ this.props.isPrimary ? 'primary' : undefined }
				className={ classNames( this.props.className, buttonClasses ) }
			>
				{ isEmpty( this.props.children ) ? this.getDefaultButtonAction() : this.props.children }
			</Button>
		);
	}
}

export class FormSelect extends React.Component {
	handleOnSelect = option => {
		this.props.onOptionChange( {
			target: {
				type: 'select',
				name: this.props.name,
				value: option.value,
			},
		} );
	};

	render() {
		const validValues = [];
		forOwn( this.props.validValues, ( label, value ) => {
			validValues.push( { label: label, value: value } );
		} );
		return (
			<SelectDropdown
				options={ validValues }
				onSelect={ this.handleOnSelect }
				disabled={ this.props.disabled }
				initialSelected={ this.props.value }
			/>
		);
	}
}
