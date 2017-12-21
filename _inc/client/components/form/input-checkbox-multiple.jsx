/** External Dependencies **/
var React = require( 'react' ),
	isArray = require( 'lodash/isArray' ),
	map = require( 'lodash/map' ),
	Formsy = require( 'formsy-react' );

/** Internal Dependencies **/
var Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

module.exports = React.createClass( {
	displayName: 'MultiCheckboxInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: React.PropTypes.string.isRequired,
		description: React.PropTypes.string,
		className: React.PropTypes.any,
		choices: React.PropTypes.any,
		defaultValue: React.PropTypes.array,
		validations: React.PropTypes.string,
		onChange: React.PropTypes.func,
		showSelectAll: React.PropTypes.bool,
		selectAllLabel: React.PropTypes.string,
	},

	getDefaultProps: function() {
		return {
			showSelectAll: false,
			defaultValue: [],
		};
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId()
		};
	},

	changeValue: function( event ) {
		var i,
			currentSelected = this.getValue(),
			value = parseInt( event.target.value );
		if ( ! isArray( currentSelected ) ) {
			currentSelected = [];
		}
		if ( -1 !== ( i = currentSelected.indexOf( value ) ) ) {
			currentSelected.splice( i, 1 );
		} else {
			currentSelected.push( value );
		}
		this.setValue( currentSelected );

		if ( this.props.showSelectAll ) {
			this.unHighlightAllSites( event );
		}
	},

	highlightAllSites: function( event ) {
		if ( event.target.checked ) {
			this.setValue( map( this.props.choices, 'value' ) );
		} else {
			this.setValue( [] );
		}
	},

	unHighlightAllSites: function( event ) {
		var checked = $( React.findDOMNode( this.refs.allItems ) ).prop( 'checked' );
		if ( checked && ! event.target.checked ) {
			$( React.findDOMNode( this.refs.allItems ) ).prop( 'checked', false );
		}
	},

	render: function() {
		var uniqueId = this.state.uniqueId;
		var currentSelected = this.getValue();
		var errorMessage, selectAll;

		var checkboxes = this.props.choices.map( function( choice, i ) {
			var checked = ( -1 !== currentSelected.indexOf( choice.value ) );
			return (
				<div className='dops-form-checkbox' key={ i }>
					<Label inline label={ choice.label } htmlFor={ uniqueId + i }>
						<input type='checkbox' id={ uniqueId + i } name={ this.props.name + '[]' } defaultValue={ choice.value } checked={ checked } onChange={ this.changeValue } />
					</Label>
				</div>
			);
		}.bind( this ) );

		if ( ! this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( ! errorMessage ) {
				errorMessage = this.showRequired() ? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' ) : null;
			}
		}

		if ( this.props.showSelectAll ) {
			selectAll = (
				<div className='dops-form-checkbox'>
					<Label inline label={ this.props.selectAllLabel } htmlFor={ uniqueId + 'all' }>
						<input type='checkbox' ref='allItems' id={ uniqueId + 'all' } name={ this.props.name + '-all' } defaultChecked={ false } onChange={ this.highlightAllSites } />
					</Label>
				</div>
			);
		}

		return (
			<div>
				{ selectAll }
				{ selectAll && <hr /> }
				{ checkboxes }
				{ errorMessage && ( <FormInputValidation text={ errorMessage } isError={ true } /> ) }

				{ this.props.description && <p className='dops-field-description'>{ this.props.description }</p> }
			</div>
		);
	}
} );
