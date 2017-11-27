/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Internal dependencies
 */
import CompactFormToggle from 'components/form/form-toggle/compact';

export const SettingToggle = React.createClass( {
	propTypes: {
		toggleSetting: PropTypes.func,
		activated: PropTypes.bool,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		id: PropTypes.string
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
		return <CompactFormToggle checked={ this.props.activated }
			className={ this.props.className }
			onChange={ this.toggleSetting }
			disabled={ this.props.disabled }
			id={ this.props.id }
		> { this.props.children }</CompactFormToggle>;
	}
} );
