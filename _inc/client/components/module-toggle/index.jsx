
/**
 * External dependencies
 */
import React from 'react';
import CompactFormToggle from 'components/form/form-toggle/compact';

export const ModuleToggle = React.createClass( {
	propTypes: {
		toggleModule: React.PropTypes.func,
		activated: React.PropTypes.bool,
		disabled: React.PropTypes.bool,
		className: React.PropTypes.string,
		compact: React.PropTypes.bool,
		id: React.PropTypes.string
	},
	getDefaultProps: function() {
		return {
			activated: false,
			disabled: false
		};
	},
	toggleModule() {
		return this.props.toggleModule( this.props.slug, this.props.activated );
	},
	render() {
		return (
			<CompactFormToggle checked={ this.props.activated }
				toggling={ this.props.toggling }
				className = { this.props.className }
				disabled = { this.props.disabled }
				id = { this.props.id }
				onChange={ this.toggleModule }>
				{ this.props.children }
			</CompactFormToggle>
		);
	}
} );
