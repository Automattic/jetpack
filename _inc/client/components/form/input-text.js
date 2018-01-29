/** External Dependencies **/
var React = require( 'react' ),
	Formsy = require( 'formsy-react' ),
	classNames = require( 'classnames' ),
	Payment = require( 'payment' );

/** Internal Dependencies **/
var Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

module.exports = React.createClass( {
	displayName: 'TextInput',

	mixins: [Formsy.Mixin],

	propTypes: {
		name: React.PropTypes.string.isRequired,
		description: React.PropTypes.string,
		className: React.PropTypes.any,
		style: React.PropTypes.any,
		floatingLabel: React.PropTypes.any,
		label: React.PropTypes.any,
		type: React.PropTypes.string,
		formatter: React.PropTypes.oneOf( ['cardNumber', 'cardExpiry', 'cardCVV', 'cardCVC'] ),
		labelSuffix: React.PropTypes.any,
		required: React.PropTypes.any,
		validations: React.PropTypes.oneOfType( [
			React.PropTypes.string,
			React.PropTypes.object
		] ),
		validationError: React.PropTypes.string,
		onChange: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId(),
			// for floating label support
			floated: this.props.value ? this.props.value.length > 0 : false,
			animating: this.props.value ? this.props.value.length > 0 : false,
		};
	},

	componentDidMount: function() {
		var el = this.refs.input.getDOMNode();
		switch ( this.props.formatter ) {
			case 'cardNumber':
				Payment.formatCardNumber( el );
				break;
			case 'cardExpiry':
				Payment.formatCardExpiry( el );
				break;
			case 'cardCVV':
			case 'cardCVC':
				Payment.formatCardCVC( el );
				break;
		}
	},

	focus: function() {
		React.findDOMNode( this.refs.input ).focus();
	},

	getDefaultProps: function() {
		return { type: 'text' };
	},

	changeValue: function( event ) {
		var inputValue = event.target.value;

		this.setValue( inputValue );
		if ( this.props.onChange ) {
			this.props.onChange( event );
		}

		// handle floating label animation
		if ( this.props.floatingLabel ) {
			if ( !inputValue.length ) {
				this.setState( {floated: false, animating: false} );
				return;
			}
			this.setState( {animating: true} );
			requestAnimationFrame( function() {
				this.setState( {floated: true} );
			}.bind( this ) );
		}
	},

	render: function() {
		var labelClass;

		let { style, labelSuffix, label, className, ...other } = this.props;

		className = classNames( 'dops-field', 'dops-field-' + this.props.name, className );

		if ( this.props.floatingLabel ) {
			className = className + ' dops-floating-label-input';
			labelClass = classNames( {
				floating: true,
				'floating--floated': this.state.animating,
				'floating--floated-active': this.state.floated,
			} );
		}

		if ( this.props.label ) {
			return (
				<Label className={className} labelClassName={labelClass} style={style} label={label} labelSuffix={labelSuffix} htmlFor={this.state.uniqueId} required={this.props.required} description={ this.props.description }>
					{this._renderInput( this.props.label, null, null, ...other )}
				</Label>
			);
		}
		return this._renderInput( this.props.name, style, className, ...other );
	},

	_renderInput: function( label, style, extraClassName, ...other ) {
		var errorMessage;

		style = style || {};

		if ( !this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( !errorMessage ) {
				errorMessage = this.showRequired() ? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' ) : null;
			}
		}

		let className = classNames( {
			'dops-form-text': true,
			'dops-form-error': errorMessage,
		} );

		return (
			<div className={className} style={style}>
				<input
					ref="input"
					className='dops-form-input'
					type={this.props.type}
					id={this.state.uniqueId}
					{ ...other }
					placeholder={this.props.placeholder}
					onChange={this.changeValue}
					onClick={ this.props.onClick }
					value={this.getValue()} />

				{this.props.children}
				<div className="clear"></div>
				<div role="alert">
					{errorMessage && ( <FormInputValidation text={errorMessage} isError={ true }/> )}
				</div>
			</div>
		);
	}
} );
