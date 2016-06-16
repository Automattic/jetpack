/**
 * External dependencies
 */
var React = require( 'react' ),
	classnames = require( 'classnames' );
import classNames from 'classnames';
import assign from 'lodash/assign';
import noop from 'lodash/noop';
import omit from 'lodash/omit';
import isEmpty from 'lodash/isEmpty';

export const FormFieldset = React.createClass( {

	displayName: 'FormFieldset',

	render: function() {
		return (
			<fieldset { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'form-fieldset' ) } >
				{ this.props.children }
			</fieldset>
		);
	}
} );

export const FormLabel = React.createClass( {

	displayName: 'FormLabel',

	render: function() {
		return (
			<label { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'form-label' ) } >
				{ this.props.children }
			</label>
		);
	}
} );

export const FormLegend = React.createClass( {

	displayName: 'FormLegend',

	render: function() {
		return (
			<legend { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'form-legend' ) } >
				{ this.props.children }
			</legend>
		);
	}
} );

export const FormCheckbox = React.createClass( {

	displayName: 'FormInputCheckbox',

	render: function() {
		var otherProps = omit( this.props, [ 'className', 'type' ] );

		return (
			<input { ...otherProps } type="checkbox" className={ classnames( this.props.className, 'form-checkbox' ) } />
		);
	}
} );

export const FormTextInput = React.createClass( {

	displayName: 'FormTextInput',

	getDefaultProps() {
		return {
			isError: false,
			isValid: false,
			selectOnFocus: false,
			type: 'text'
		};
	},

	focus() {
		this.refs.textField.focus();
	},

	render() {
		const { className, selectOnFocus } = this.props;
		const classes = classNames( className, {
			'form-text-input': true,
			'is-error': this.props.isError,
			'is-valid': this.props.isValid
		} );

		return (
			<input
				{ ...this.props }
				ref="textField"
				className={ classes }
				onClick={ selectOnFocus ? this.selectOnFocus : null } />
		);
	},

	selectOnFocus( event ) {
		event.target.select();
	}

} );

export const FormTextarea = React.createClass( {

	displayName: 'FormTextarea',

	render: function() {
		return (
			<textarea { ...omit( this.props, 'className' ) } className={ classnames( this.props.className, 'form-textarea' ) } >
				{ this.props.children }
			</textarea>
		);
	}
} );

export const FormRadio = React.createClass( {

	displayName: 'FormRadio',

	render: function() {
		var otherProps = omit( this.props, [ 'className', 'type' ] );

		return (
			<input
				{ ...otherProps }
				type="radio"
				className={ classnames( this.props.className, 'form-radio' ) } />
		);
	}
} );

export const FormButton = React.createClass( {

	displayName: 'FormsButton',

	getDefaultProps: function() {
		return {
			isSubmitting: false,
			isPrimary: true,
			type: 'submit'
		};
	},

	getDefaultButtonAction: function() {
		return this.props.isSubmitting ? this.translate( 'Saving…' ) : this.translate( 'Save Settings' );
	},

	render: function() {
		var buttonClasses = classNames( {
			'form-button': true
		} );

		return (
			<Button
				{ ...omit( this.props, 'className' ) }
				primary={ this.props.isPrimary }
				className={ classnames( this.props.className, buttonClasses ) }>
				{ isEmpty( this.props.children ) ? this.getDefaultButtonAction() : this.props.children }
			</Button>
		);
	}
} );

export const Button = React.createClass( {

	displayName: 'Button',

	propTypes: {
		disabled: React.PropTypes.bool,
		compact: React.PropTypes.bool,
		primary: React.PropTypes.bool,
		scary: React.PropTypes.bool,
		type: React.PropTypes.string,
		href: React.PropTypes.string,
		onClick: React.PropTypes.func,
		borderless: React.PropTypes.bool
	},

	getDefaultProps() {
		return {
			disabled: false,
			type: 'button',
			onClick: noop,
			borderless: false
		};
	},

	render() {
		const element = this.props.href ? 'a' : 'button';
		const buttonClasses = classNames( {
			button: true,
			'is-compact': this.props.compact,
			'is-primary': this.props.primary,
			'is-scary': this.props.scary,
			'is-borderless': this.props.borderless
		} );

		const props = assign( {}, this.props, {
			className: classNames( this.props.className, buttonClasses )
		} );

		return React.createElement( element, props, this.props.children );
	}
} );
