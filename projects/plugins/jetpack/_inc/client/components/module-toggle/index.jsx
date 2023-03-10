import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import CompactFormToggle from 'components/form/form-toggle/compact';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
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
		overrideCondition: PropTypes.string,
	};

	static defaultProps = {
		activated: false,
		disabled: false,
		overrideCondition: '',
	};

	toggleModule = () => {
		this.trackModuleToggle( this.props.slug, this.props.activated );
		return this.props.toggleModule( this.props.slug, this.props.activated );
	};

	trackModuleToggle = ( slug, activated ) => {
		// The stats check is a hack around the fact that we're using <ModuleToggle for the settings there...
		'stats' !== slug &&
			analytics.tracks.recordEvent( 'jetpack_wpa_module_toggle', {
				module: slug,
				toggled: activated ? 'off' : 'on',
			} );
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
			link: (
				<a
					href={ getRedirectUrl( 'jetpack-support-module-overrides' ) }
					target="_blank"
					rel="noopener noreferrer"
					style={ { textDecoration: 'underline' } }
				/>
			),
		};

		switch ( override ) {
			case 'active':
				return createInterpolateElement(
					__(
						'This feature has been enabled by a site administrator. <link>Learn more</link>.',
						'jetpack'
					),
					args
				);
			case 'inactive':
				return createInterpolateElement(
					__(
						'This feature has been disabled by a site administrator. <link>Learn more</link>.',
						'jetpack'
					),
					args
				);
			default:
				return createInterpolateElement(
					__(
						'This feature is being managed by a site administrator. <link>Learn more</link>.',
						'jetpack'
					),
					args
				);
		}
	};

	render() {
		return (
			<CompactFormToggle
				checked={ this.props.activated || this.props.isModuleActivated }
				toggling={ this.props.toggling }
				className={ this.props.className }
				disabled={ this.props.disabled || this.isDisabledByOverride() }
				id={ this.props.id }
				onChange={ this.toggleModule }
				disabledReason={ this.getDisabledReason() }
				aria-label={ this.props[ 'aria-label' ] }
			>
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
