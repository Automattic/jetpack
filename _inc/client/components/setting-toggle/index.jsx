/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import FormToggle from 'components/form/form-toggle';

export const SettingToggle = React.createClass( {
	propTypes: {
		toggleSetting: React.PropTypes.func,
		activated: React.PropTypes.bool,
		disabled: React.PropTypes.bool,
		className: React.PropTypes.string,
		id: React.PropTypes.string
	},
	getDefaultProps: function() {
		return {
			activated: false
		};
	},
	toggleSetting() {
		return this.props.toggleSetting( this.props.slug, this.props.activated );
	},
	render() {
		return <FormToggle checked={ this.props.activated }
			className={ this.props.className }
			onChange={ this.toggleSetting }
			disabled={ this.props.disabled }
			id={ this.props.id }
		> { this.props.children }</FormToggle>;
	}
} );
