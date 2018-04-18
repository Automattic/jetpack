/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { getModuleOverride } from 'state/modules';

class ModuleToggleComponent extends Component {
	static displayName = 'ModuleToggle';

	static propTypes = {
		toggleModule: PropTypes.func,
		activated: PropTypes.bool,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		compact: PropTypes.bool,
		id: PropTypes.string,
		overrideCondition: PropTypes.string
	};

	static defaultProps = {
		activated: false,
		disabled: false,
		overrideCondition: ''
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

	isDisabledByOverride = () => {
		const override = this.props.getModuleOverride( this.props.slug );
		if ( this.props.overrideCondition ) {
			return this.props.overrideCondition === override;
		}

		return !! override;
	};

	getDisabledReason = () => {
		if ( ! this.isDisabledByOverride() ) {
			return null;
		}
		const override = this.props.getModuleOverride( this.props.slug );
		const args = {
			components: {
				link: (
					<a
						href="http://jetpack.com/support/module-overrides/"
						target="_blank"
						rel="noopener noreferrer"
						style={ { textDecoration: 'underline' } }
					/>
				)
			}
		};

		switch ( override ) {
			case 'active':
				return __( 'This feature has been enabled by a site administrator. {{link}}Learn more{{/link}}.', args );
			case 'inactive':
				return __( 'This feature has been disabled by a site administrator. {{link}}Learn more{{/link}}.', args );
			default:
				return __( 'This feature is being managed by a site administrator. {{link}}Learn more{{/link}}.', args );
		}
	};

	render() {
		return (
			<CompactFormToggle checked={ this.props.activated || this.props.isModuleActivated }
				toggling={ this.props.toggling }
				className = { this.props.className }
				disabled = { this.props.disabled || this.isDisabledByOverride() }
				id = { this.props.id }
				onChange={ this.toggleModule }
				disabledReason={ this.getDisabledReason() }>
				{ this.props.children }
			</CompactFormToggle>
		);
	}
}

export const ModuleToggle = connect( state => {
	return {
		getModuleOverride: module_name => getModuleOverride( state, module_name ),
	};
} )( ModuleToggleComponent );
