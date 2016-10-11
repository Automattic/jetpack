/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
var analytics = require( 'lib/analytics' );

module.exports = React.createClass( {
	displayName: 'SharingButtonsStyle',

	propTypes: {
		onChange: React.PropTypes.func,
		value: React.PropTypes.string,
		disabled: React.PropTypes.bool
	},

	getDefaultProps: function() {
		return {
			onChange: function() {},
			disabled: false
		};
	},

	onChange: function( value ) {
		this.props.onChange( value );
		analytics.ga.recordEvent( 'Sharing', 'Clicked Button Style Radio Button', value );
	},

	getOptions: function() {
		return [
			{ value: 'icon-text', label: __( 'Icon & Text', { context: 'Sharing: Sharing button option label' } ) },
			{ value: 'icon', label: __( 'Icon Only', { context: 'Sharing: Sharing button option label' } ) },
			{ value: 'text', label: __( 'Text Only', { context: 'Sharing: Sharing button option label' } ) },
			{ value: 'official', label: __( 'Official Buttons', { context: 'Sharing: Sharing button option label' } ) }
		].map( function( option ) {
			return (
				<label key={ option.value }>
					<input name="sharing_button_style" type="radio" checked={ option.value === this.props.value } onChange={ this.onChange.bind( null, option.value ) } disabled={ this.props.disabled } />
					{ option.label }
				</label>
			);
		}, this );
	},

	render: function() {
		return (
			<fieldset className="sharing-buttons__fieldset">
				<legend className="sharing-buttons__fieldset-heading">{ __( 'Button style', { context: 'Sharing: Sharing button option heading' } ) }</legend>
				{ this.getOptions() }
			</fieldset>
		);
	}
} );
