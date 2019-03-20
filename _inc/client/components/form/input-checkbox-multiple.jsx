/** External Dependencies **/
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	ReactDOM = require( 'react-dom' ),
	isArray = require( 'lodash/isArray' ),
	map = require( 'lodash/map' ),
	Formsy = require( 'formsy-react' );

const createReactClass = require( 'create-react-class' );

/** Internal Dependencies **/
const Label = require( './label' ),
	getUniqueId = require( './counter' ),
	FormInputValidation = require( '../form-input-validation' ),
	requiredFieldErrorFormatter = require( './required-error-label' );

module.exports = createReactClass( {
	displayName: 'MultiCheckboxInput',

	mixins: [ Formsy.Mixin ],

	propTypes: {
		name: PropTypes.string.isRequired,
		description: PropTypes.string,
		className: PropTypes.any,
		choices: PropTypes.any,
		defaultValue: PropTypes.array,
		validations: PropTypes.string,
		onChange: PropTypes.func,
		showSelectAll: PropTypes.bool,
		selectAllLabel: PropTypes.string,
	},

	getDefaultProps: function() {
		return {
			showSelectAll: false,
			defaultValue: [],
		};
	},

	getInitialState: function() {
		return {
			uniqueId: getUniqueId(),
		};
	},

	changeValue: function( event ) {
		const value = parseInt( event.target.value );
		let currentSelected = this.getValue();
		let i;
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
		const checked = $( ReactDOM.findDOMNode( this.refs.allItems ) ).prop( 'checked' );
		if ( checked && ! event.target.checked ) {
			$( ReactDOM.findDOMNode( this.refs.allItems ) ).prop( 'checked', false );
		}
	},

	mapChoices() {
		const uniqueId = this.state.uniqueId;
		const currentSelected = this.getValue();

		return this.props.choices.map( ( choice, i ) => {
			const checked = -1 !== currentSelected.indexOf( choice.value );
			return (
				<div className="dops-form-checkbox" key={ i }>
					<Label inline label={ choice.label } htmlFor={ uniqueId + i }>
						<input
							type="checkbox"
							id={ uniqueId + i }
							name={ this.props.name + '[]' }
							defaultValue={ choice.value }
							checked={ checked }
							onChange={ this.changeValue }
						/>
					</Label>
				</div>
			);
		} );
	},

	render: function() {
		const uniqueId = this.state.uniqueId;
		let errorMessage, selectAll;

		const checkboxes = this.mapChoices();

		if ( ! this.isPristine() ) {
			errorMessage = this.showError() ? this.getErrorMessage() : null;
			if ( ! errorMessage ) {
				errorMessage = this.showRequired()
					? requiredFieldErrorFormatter( this.props.label || this.props.placeholder || '' )
					: null;
			}
		}

		if ( this.props.showSelectAll ) {
			selectAll = (
				<div className="dops-form-checkbox">
					<Label inline label={ this.props.selectAllLabel } htmlFor={ uniqueId + 'all' }>
						<input
							type="checkbox"
							ref="allItems"
							id={ uniqueId + 'all' }
							name={ this.props.name + '-all' }
							defaultChecked={ false }
							onChange={ this.highlightAllSites }
						/>
					</Label>
				</div>
			);
		}

		return (
			<div>
				{ selectAll }
				{ selectAll && <hr /> }
				{ checkboxes }
				{ errorMessage && <FormInputValidation text={ errorMessage } isError={ true } /> }

				{ this.props.description && (
					<p className="dops-field-description">{ this.props.description }</p>
				) }
			</div>
		);
	},
} );
