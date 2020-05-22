/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const ManagePlugins = withModuleSettingsFormHelpers(
	class extends Component {
		trackOpenCard = () => {
			analytics.tracks.recordJetpackClick( {
				target: 'foldable-settings-open',
				feature: 'manage-plugins',
			} );
		};

		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-plugins',
				page: 'plugins-manage',
			} );
		}

		configLink = () => {
			return (
				<Card
					compact
					className="jp-settings-card__configure-link"
					onClick={ this.trackClickConfigure }
					target="_blank"
					rel="noopener noreferrer"
					href={ getRedirectUrl( 'calypso-plugins-manage', { site: this.props.siteRawUrl } ) }
				>
					{ __( 'Choose which plugins to auto-update' ) }
				</Card>
			);
		};

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					module="manage"
					header={ __( 'Auto-update plugins', { context: 'Settings header' } ) }
					hideButton
				>
					<SettingsGroup disableInDevMode module={ this.props.getModule( 'manage' ) }>
						<div>
							{ __(
								'With Jetpack you can choose to have your plugins auto-updated with each new plugin release. ' +
									'You’ll get the latest security and bug fixes right away, ensuring your site stays secure.'
							) }
						</div>
					</SettingsGroup>
					{ this.configLink() }
				</SettingsCard>
			);
		}
	}
);
