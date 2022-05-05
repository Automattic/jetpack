/**
 * External Dependencies
 */
import React from 'react';
import ReactDOM from 'react-dom';
import { withFormsy } from 'formsy-react';
import classNames from 'classnames';
import Payment from 'payment';
import PropTypes from 'prop-types';

/**
 * Internal Dependencies
 */
import Label from './label';
import getUniqueId from './counter';
import FormInputValidation from '../form-input-validation';
import requiredFieldErrorFormatter from './required-error-label';

export default withFormsy(
	class extends React.Component {
		static displayName = 'TextInput';

		static propTypes = {
			name: PropTypes.string.isRequired,
			description: PropTypes.string,
			className: PropTypes.any,
			style: PropTypes.any,
			floatingLabel: PropTypes.any,
			label: PropTypes.any,
			type: PropTypes.string,
			formatter: PropTypes.oneOf( [ 'cardNumber', 'cardExpiry', 'cardCVV', 'cardCVC' ] ),
			labelSuffix: PropTypes.any,
			required: PropTypes.any,
			validations: PropTypes.oneOfType( [ PropTypes.string, PropTypes.object ] ),
			validationError: PropTypes.string,
			onChange: PropTypes.func,
		};

		state = {
			uniqueId: getUniqueId(),
			// for floating label support
			floated: this.props.value ? this.props.value.length > 0 : false,
			animating: this.props.value ? this.props.value.length > 0 : false,
		};

		componentDidMount() {
			const el = this.refs.input.getDOMNode();
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
		}

		focus = () => {
			ReactDOM.findDOMNode( this.refs.input ).focus();
		};

		static defaultProps = { type: 'text' };

		changeValue = event => {
			const inputValue = event.target.value;

			this.setValue( inputValue );
			if ( this.props.onChange ) {
				this.props.onChange( event );
			}

			// handle floating label animation
			if ( this.props.floatingLabel ) {
				if ( ! inputValue.length ) {
					this.setState( { floated: false, animating: false } );
					return;
				}
				this.setState( { animating: true } );
				requestAnimationFrame(
					function () {
						this.setState( { floated: true } );
					}.bind( this )
				);
			}
		};

		render() {
			const { style, labelSuffix, label, ...other } = this.props;
			let className, labelClass;

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
					<Label
						className={ className }
						labelClassName={ labelClass }
						style={ style }
						label={ label }
						labelSuffix={ labelSuffix }
						htmlFor={ this.state.uniqueId }
						required={ this.props.required }
						description={ this.props.description }
					>
						{ this._renderInput( this.props.label, null, null, ...other ) }
					</Label>
				);
			}
			return this._renderInput( this.props.name, style, className, ...other );
		}

		_renderInput( label, style, extraClassName, ...other ) {
			let errorMessage;

			style = style || {};

			if ( ! this.isPristine() ) {
				errorMessage = this.showError() ? this.getErrorMessage() : null;
				if ( ! errorMessage ) {
					errorMessage = this.showRequired()
						? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' )
						: null;
				}
			}

			const className = classNames( {
				'dops-form-text': true,
				'dops-form-error': errorMessage,
			} );

			return (
				<div className={ className } style={ style }>
					<input
						ref="input"
						className="dops-form-input"
						type={ this.props.type }
						id={ this.state.uniqueId }
						{ ...other }
						placeholder={ this.props.placeholder }
						onChange={ this.changeValue }
						onClick={ this.props.onClick }
						value={ this.getValue() }
					/>

					{ this.props.children }
					<div className="clear" />
					<div role="alert">
						{ errorMessage && <FormInputValidation text={ errorMessage } isError={ true } /> }
					</div>
				</div>
			);
		}
	}
);
