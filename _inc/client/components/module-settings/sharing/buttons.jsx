/**
 * External dependencies
 */
import React from 'react';
import assign from 'lodash/assign';
import async from 'async';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
var observe = require( 'lib/mixins/data-observe' ),
	ButtonsAppearance = require( './appearance' ),
	ButtonsOptions = require( './options' ),
	notices = require( 'notices' ),
	protectForm = require( 'lib/mixins/protect-form' ).mixin;

module.exports = React.createClass( {
	displayName: 'SharingButtons',

	mixins: [
		observe( 'site', 'buttons', 'postTypes' ),
		protectForm
	],

	propTypes: {
		site: React.PropTypes.object.isRequired,
		buttons: React.PropTypes.object.isRequired,
		postTypes: React.PropTypes.object.isRequired
	},

	getInitialState: function() {
		return {
			values: {},
			isSaving: false,
			buttonsPendingSave: null
		};
	},

	saveChanges: function( event ) {
		event.preventDefault();
	},

	onSaveComplete: function( error ) {
		if ( error ) {
			notices.error( __( 'There was a problem saving your changes. Please, try again.' ) );
		} else {
			notices.success( __( 'Settings saved successfully!' ) );
		}

		this.markSaved();
		this.setState( {
			values: {},
			isSaving: false,
			buttonsPendingSave: null
		} );
	},

	handleChange: function( option, value ) {
		var pairs;

		if ( undefined === value ) {
			pairs = option;
		} else {
			pairs = {};
			pairs[ option ] = value;
		}

		this.markChanged();
		this.setState( {
			values: assign( {}, this.state.values, pairs )
		} );
	},

	handleButtonsChange: function( buttons ) {
		this.markChanged();
		this.setState( { buttonsPendingSave: buttons } );
	},

	getPreviewButtons: function() {
		return this.state.buttonsPendingSave || this.props.buttons.get( 'visible' );
	},

	render: function() {
		var settings = assign( {}, this.props.site.settings, this.state.values );

		return (
			<form onSubmit={ this.saveChanges } id="sharing-buttons" className="sharing-settings sharing-buttons">
				<ButtonsAppearance
					site={ this.props.site }
					buttons={ this.getPreviewButtons() }
					values={ settings }
					onChange={ this.handleChange }
					onButtonsChange={ this.handleButtonsChange }
					saving={ this.state.isSaving } />
				<ButtonsOptions
					site={ this.props.site }
					postTypes={ [] }
					buttons={ this.props.buttons.get( 'visible' ) }
					values={ settings }
					onChange={ this.handleChange }
					saving={ this.state.isSaving } />
			</form>
		);
	}
} );
