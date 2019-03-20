/* eslint-disable jsx-a11y/no-onchange */

/** External Dependencies **/
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	classNames = require( 'classnames' ),
	Formsy = require( 'formsy-react' );

const createReactClass = require( 'create-react-class' );

/** Internal Dependencies **/
const Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

module.exports = createReactClass( {
	displayName: 'SelectInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		className: PropTypes.any,
		style: PropTypes.any,
		label: PropTypes.any,
		floatingLabel: PropTypes.bool,
		inline: PropTypes.any,
		labelSuffix: PropTypes.any,
		required: PropTypes.any,
		validations: PropTypes.string,
		validationError: PropTypes.string,
		onChange: PropTypes.func,
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId(),
		};
	},

	handleChange: function( event ) {
		this.setValue( event.target.value );

		if ( this.props.onChange ) {
			this.props.onChange( event );
		}
	},

	render: function() {
		let errorMessage, labelClass;

		if ( ! this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( ! errorMessage ) {
				errorMessage = this.showRequired()
					? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' )
					: null;
			}
		}

		if ( this.props.floatingLabel ) {
			// we fake out the post-floating state because the animation makes
			// no sense for a select input
			labelClass = 'floating floating--floated floating--floated-active';
		}

		const className = classNames(
			{
				'dops-form-select': true,
				'dops-field': true,
				'dops-form-error': errorMessage,
				'dops-form-inline': this.props.inline,
				'dops-floating-label-input': this.props.floatingLabel,
			},
			this.props.className
		);

		return (
			<Label
				className={ className }
				inline={ this.props.inline }
				labelClassName={ labelClass }
				label={ this.props.label }
				labelSuffix={ this.props.labelSuffix }
				htmlFor={ this.state.uniqueId }
				required={ this.props.required }
				style={ this.props.style }
				description={ this.props.description }
			>
				<div className="dops-form-select">
					<select
						ref="select"
						id={ this.state.uniqueId }
						value={ this.getValue() }
						onChange={ this.handleChange }
					>
						{ this.props.children }
					</select>
				</div>
				{ errorMessage && <FormInputValidation text={ errorMessage } isError={ true } /> }
			</Label>
		);
	},
} );
