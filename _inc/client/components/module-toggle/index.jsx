
/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';

export class ModuleToggle extends React.Component {
	static propTypes = {
		toggleModule: PropTypes.func,
		activated: PropTypes.bool,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		compact: PropTypes.bool,
		id: PropTypes.string
	};

	static defaultProps = {
		activated: false,
		disabled: false
	};

	toggleModule = () => {
		this.trackModuleToggle( this.props.slug, this.props.activated );
		return this.props.toggleModule( this.props.slug, this.props.activated );
	};

	trackModuleToggle = ( slug, activated ) => {
		// The stats check is a hack around the fact that we're using <ModuleToggle for the settings there...
		'stats' !== slug && analytics.tracks.recordEvent(
			'jetpack_wpa_module_toggle',
			{
				module: slug,
				toggled: activated ? 'off' : 'on'
			}
		);
	};

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
}
