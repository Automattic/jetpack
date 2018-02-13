/** External Dependencies **/
var PropTypes = require( 'prop-types' );
var React = require( 'react' ),
	classNames = require( 'classnames' ),
	Formsy = require( 'formsy-react' );

/** Internal Dependencies **/
var Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

module.exports = React.createClass( {
	displayName: 'CheckboxInput',

	mixins: [Formsy.Mixin],

	propTypes: {
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		className: PropTypes.any,
		style: PropTypes.any,
		label: PropTypes.any.isRequired,
		labelSuffix: PropTypes.any,
		required: PropTypes.any,
		validations: PropTypes.string,
		validationError: PropTypes.string
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId()
		};
	},

	getDefaultProps: function() {
		return { required: false };
	},

	changeValue: function( event ) {
		this.setValue( event.target.checked );
	},

	render: function() {
		var { style, labelSuffix, label, ...other } = this.props;
		var uniqueId = this.state.uniqueId;
		var errorMessage;

		if ( !this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( !errorMessage ) {
				errorMessage = this.showRequired() ? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' ) : null;
			}
		}

		let className = classNames( {
			'dops-field': true,
			'dops-form-checkbox': true,
			'dops-form-error': errorMessage,
		}, this.props.className );

		return (
			<div className={className} style={style}>
				<Label inline label={label} labelSuffix={labelSuffix} htmlFor={uniqueId} required={this.props.required} description={ this.props.description }>
					<input
						type="checkbox"
						id={uniqueId}
						{ ...other }
						onChange={this.changeValue}
						checked={this.getValue()}
						className='dops-form-checkbox' />
				</Label>
				{errorMessage && ( <FormInputValidation text={errorMessage} isError={ true }/> )}
			</div>
		);
	}
} );
