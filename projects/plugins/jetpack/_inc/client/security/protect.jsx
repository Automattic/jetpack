import { getRedirectUrl } from '@automattic/jetpack-components';
import { __, _x } from '@wordpress/i18n';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import { ModuleToggle } from 'components/module-toggle';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { includes } from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import QueryWafSettings from '../components/data/query-waf-bootstrap-path';
import { getSetting } from '../state/settings';
import { getWafIpAllowListInputState, updateWafIpAllowList } from '../state/waf';

const ProtectComponent = class extends Component {
	/**
	 * Component Did Update
	 *
	 * @param {object} prevProps - Previous component properties.
	 */
	componentDidUpdate( prevProps ) {
		// Sync the redux IP allow list input state with the component's settings state.
		if ( prevProps.allowListInputState !== this.props.allowListInputState ) {
			this.props.updateFormStateOptionValue(
				'jetpack_waf_ip_allow_list',
				this.props.allowListInputState
			);
		}
	}

	currentIpIsSafelisted = () => {
		// get current IP allow list in textarea from this.props.allowListInputState;
		return !! includes( this.props.allowListInputState, this.props.currentIp );
	};

	updateIPAllowList = event => {
		// Enable button if IP is not in the textarea
		this.currentIpIsSafelisted();
		// Update the allow list
		this.props.updateWafIpAllowList( event.target.value );
	};

	addToSafelist = () => {
		const newSafelist =
			this.props.allowListInputState +
			( 0 >= this.props.allowListInputState.length ? '' : '\n' ) +
			this.props.currentIp;

		// Update the allow list
		this.props.updateWafIpAllowList( newSafelist );

		analytics.tracks.recordJetpackClick( {
			target: 'add-to-whitelist', // Left as-is to preserve historical stats trends.
			feature: 'protect',
		} );
	};

	trackOpenCard = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'foldable-settings-open',
			feature: 'protect',
		} );
	};

	render() {
		const isProtectActive = this.props.getOptionValue( 'protect' ),
			unavailableInOfflineMode = this.props.isUnavailableInOfflineMode( 'protect' );
		return (
			<SettingsCard
				{ ...this.props }
				module="protect"
				header={ _x( 'Brute force protection', 'Settings header', 'jetpack' ) }
				hideButton={ true }
			>
				{ isProtectActive && <QueryWafSettings /> }
				<SettingsGroup
					hasChild
					disableInOfflineMode
					disableInSiteConnectionMode
					module={ this.props.getModule( 'protect' ) }
					support={ {
						text: __(
							'Protects your site from traditional and distributed brute force login attacks.',
							'jetpack'
						),
						link: getRedirectUrl( 'jetpack-support-protect' ),
					} }
				>
					<ModuleToggle
						slug="protect"
						compact
						disabled={ unavailableInOfflineMode }
						activated={ isProtectActive }
						toggling={ this.props.isSavingAnyOption( 'protect' ) }
						toggleModule={ this.props.toggleModuleNow }
					>
						<span className="jp-form-toggle-explanation">
							{ this.props.getModule( 'protect' ).description }
						</span>
					</ModuleToggle>
				</SettingsGroup>
			</SettingsCard>
		);
	}
};

export const Protect = connect(
	state => {
		const allowListInputState = getWafIpAllowListInputState( state );

		return {
			allowListInputState:
				null !== allowListInputState
					? allowListInputState
					: getSetting( state, 'jetpack_waf_ip_allow_list' ),
		};
	},
	dispatch => {
		return {
			updateWafIpAllowList: allowList => dispatch( updateWafIpAllowList( allowList ) ),
		};
	}
)( withModuleSettingsFormHelpers( ProtectComponent ) );
