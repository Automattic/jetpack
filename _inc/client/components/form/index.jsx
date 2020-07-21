/**
 * External Dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { isArray } from 'lodash';
import Formsy from 'formsy-react';

/**
 * Internal Dependencies
 */
import ActionBar from './action-bar';
import Section from './section';
import Row from './row';
import Label from './label';
import TextInput from './input-text';
import RadioInput from './input-radio';
import CheckboxInput from './input-checkbox';
import MultiCheckboxInput from './input-checkbox-multiple';
import SelectInput from './input-select';
import CountrySelect from './input-select-country';
import HiddenInput from './input-hidden';
import Submit from './submit';
import './style.scss';

// very thin wrapper for Formsy.Form
class Form extends React.Component {
	static propTypes = {
		style: PropTypes.object,
		onValidSubmit: PropTypes.func,
		onInvalidSubmit: PropTypes.func,
		onValid: PropTypes.func,
		onInvalid: PropTypes.func,
		validationErrors: PropTypes.object,
	};

	state = {};

	isValid = () => {
		return this.refs.form.state.isValid;
	};

	getCurrentValues = () => {
		return this.refs.form.getCurrentValues();
	};

	submit = () => {
		this.refs.form.submit();
	};

	render() {
		const { style, ...other } = this.props;
		return (
			<div className="dops-form" style={ style }>
				<Formsy.Form ref="form" { ...other }>
					{ this.props.children }
				</Formsy.Form>
			</div>
		);
	}
}

// from: https://gist.github.com/ShirtlessKirk/2134376
/**
 * Luhn algorithm in JavaScript: validate credit card number supplied as string of numbers
 * @author ShirtlessKirk. Copyright ( c ) 2012.
 * @license WTFPL ( http://www.wtfpl.net/txt/copying )
 */
const luhnChk = ( function ( arr ) {
	return function ( ccNum ) {
		let len = ccNum.length,
			bit = 1,
			sum = 0,
			val;

		while ( len ) {
			val = parseInt( ccNum.charAt( --len ), 10 );
			bit ^= 1;
			sum += bit ? arr[ val ] : val;
		}

		return sum && sum % 10 === 0;
	};
} )( [ 0, 2, 4, 6, 8, 1, 3, 5, 7, 9 ] );

// To find out more about validators, see:
// https://github.com/christianalfoni/formsy-react/blob/master/API.md#validators

Formsy.addValidationRule( 'isCC', function ( values, value ) {
	if ( value === undefined || value === null ) {
		return false;
	}

	// strip spaces
	value = value.replace( /\s/g, '' );

	return value.length > 12 && luhnChk( value );
} );

Formsy.addValidationRule( 'isArray', function ( values, value ) {
	return isArray( value );
} );

Form.ActionBar = ActionBar;
Form.Section = Section;
Form.Row = Row;
Form.Label = Label;
Form.TextInput = TextInput;
Form.RadioInput = RadioInput;
Form.CheckboxInput = CheckboxInput;
Form.MultiCheckboxInput = MultiCheckboxInput;
Form.SelectInput = SelectInput;
Form.CountrySelect = CountrySelect;
Form.HiddenInput = HiddenInput;
Form.Submit = Submit;

export default Form;
