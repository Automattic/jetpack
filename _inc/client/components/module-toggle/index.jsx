
/**
 * External dependencies
 */
import React from 'react';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';

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
		this.trackModuleToggle( this.props.slug, this.props.activated  );
		return this.props.toggleModule( this.props.slug, this.props.activated );
	},

	trackModuleToggle( slug, activated ) {
		// The stats check is a hack around the fact that we're using <ModuleToggle for the settings there...
		'stats' !== slug && analytics.tracks.recordEvent(
			'jetpack_wpa_module_toggle',
			{
				module: slug,
				toggled: activated ? 'off' : 'on'
			}
		);
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
