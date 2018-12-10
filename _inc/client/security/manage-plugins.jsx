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
import { ModuleSettingsForm as moduleSettingsForm } from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export const ManagePlugins = moduleSettingsForm(
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

		render() {
			const configLink = () => {
				if ( this.props.isUnavailableInDevMode( 'manage' ) ) {
					return;
				}

				return (
					<Card
						compact
						className="jp-settings-card__configure-link"
						onClick={ this.trackClickConfigure }
						target="_blank"
						rel="noopener noreferrer"
						href={ 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl }
					>
						{ __( 'Manage plugins' ) }
					</Card>
				);
			};

			return (
				<SettingsCard
					{ ...this.props }
					module="manage"
					header={ __( 'Plugin Autoupdates', { context: 'Settings header' } ) }
					hideButton
				>
					<SettingsGroup disableInDevMode module={ this.props.getModule( 'manage' ) } >
						<p>
							{ __(
								'When a plugin update is released, the best practice is to update that plugin right away. ' +
									"Choose which plugins you'd like to autoupdate so that your site stays secure."
							) }
						</p>
					</SettingsGroup>
					{ configLink() }
				</SettingsCard>
			);
		}
	}
);
