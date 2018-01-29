/** External Dependencies **/
var React = require( 'react' ),
	classNames = require( 'classnames' ),
	Formsy = require( 'formsy-react' );

/** Internal Dependencies **/
var Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

var Radios = React.createClass( {

	propTypes: {
		name: React.PropTypes.string,
		choices: React.PropTypes.array,
		selected: React.PropTypes.any,
		uniqueId: React.PropTypes.string,
		changeValue: React.PropTypes.func,
	},

	getDefaultProps: function() {
		return {
			choices: [],
		};
	},

	onChange: function( event ) {
		this.props.changeValue( event );
	},

	render: function() {
		var uniqueId = this.props.uniqueId,
			choices = this.props.choices.map( function( choice, i ) {
				var checked = this.props.selected === choice.value;
				return (
					<div className='dops-form-checkbox' key={ i }>
						<Label inline label={ choice.label } htmlFor={ uniqueId + i }>
							<input type='radio' id={ uniqueId + i } value={ choice.value } name={ this.props.name } checked={ checked } onChange={ this.onChange } />
						</Label>
					</div>
				);
			}.bind( this ) );

		return (
			<fieldset>
				{ choices }
			</fieldset>
		);
	}
} );

module.exports = React.createClass( {
	displayName: 'RadioInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: React.PropTypes.string.isRequired,
		description: React.PropTypes.string,
		choices: React.PropTypes.any,
		selected: React.PropTypes.any,
		required: React.PropTypes.any,
		validations: React.PropTypes.string,
		validationError: React.PropTypes.string
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId(),
			selectedItem: this.props.selected,
		};
	},

	componentWillMount: function() {
		this.setValue( this.props.selected );
	},

	getDefaultProps: function() {
		return { required: false };
	},

	changeValue: function( event ) {
		this.setState( { selectedItem: event.target.value } );
		this.setValue( event.target.value );
	},

	render: function() {
		var errorMessage;

		if ( ! this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( ! errorMessage ) {
				errorMessage = this.showRequired() ? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' ) : null;
			}
		}

		let className = classNames( {
			'dops-field': true,
			'dops-form-radio': true,
			'dops-form-error': errorMessage,
		}, this.props.className );

		return (
			<div className={ className }>

				<Radios name={ this.props.name } uniqueId={ this.state.uniqueId } choices={ this.props.choices } changeValue={ this.changeValue } selected={ this.state.selectedItem } />

				{ errorMessage && ( <FormInputValidation text={ errorMessage } isError={ true } /> ) }
			</div>
		);
	}
} );
