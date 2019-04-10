/**
 * External dependencies
 *
 * @format
 */

import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';

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
					href={ 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl }
				>
					{ __( 'Manage your plugins' ) }
				</Card>
			);
		};

		render() {
			return (
				<SettingsCard
					{ ...this.props }
					module="manage"
					header={ __( 'Plugin autoupdates', { context: 'Settings header' } ) }
					hideButton
				>
					<SettingsGroup disableInDevMode module={ this.props.getModule( 'manage' ) }>
						<div>
							{ __(
								'When a plugin update is released, the best practice is to update that plugin right away. ' +
									"Choose which plugins you'd like to autoupdate so that your site stays secure."
							) }
						</div>
					</SettingsGroup>
					{ this.configLink() }
				</SettingsCard>
			);
		}
	}
);
