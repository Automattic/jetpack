/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import getRedirectUrl from 'lib/jp-redirect';
import { withModuleSettingsFormHelpers } from 'components/module-settings/with-module-settings-form-helpers';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { ModuleToggle } from 'components/module-toggle';

export const ShareButtons = withModuleSettingsFormHelpers(
	class extends Component {
		trackClickConfigure() {
			analytics.tracks.recordJetpackClick( {
				target: 'configure-sharing',
				page: 'sharing',
			} );
		}

		render() {
			const isLinked = this.props.isLinked,
				connectUrl = this.props.connectUrl,
				siteRawUrl = this.props.siteRawUrl,
				siteAdminUrl = this.props.siteAdminUrl,
				isOfflineMode = this.props.isOfflineMode,
				isActive = this.props.getOptionValue( 'sharedaddy' );

			const configCard = () => {
				if ( isOfflineMode ) {
					return (
						<Card
							compact
							className="jp-settings-card__configure-link"
							href={ siteAdminUrl + 'options-general.php?page=sharing' }
						>
							{ __( 'Configure your sharing buttons', 'jetpack' ) }
						</Card>
					);
				}

				if ( isLinked ) {
					return (
						<Card
							compact
							className="jp-settings-card__configure-link"
							onClick={ this.trackClickConfigure }
							target="_blank"
							rel="noopener noreferrer"
							href={ getRedirectUrl( 'calypso-marketing-sharing-buttons', { site: siteRawUrl } ) }
						>
							{ __( 'Configure your sharing buttons', 'jetpack' ) }
						</Card>
					);
				}

				return (
					<Card
						compact
						className="jp-settings-card__configure-link"
						target="_blank"
						rel="noopener noreferrer"
						href={ `${ connectUrl }&from=unlinked-user-connect-sharing` }
					>
						{ __( 'Create a Jetpack account to use this feature', 'jetpack' ) }
					</Card>
				);
			};

			return (
				<SettingsCard
					{ ...this.props }
					header={ _x( 'Sharing buttons', 'Settings header', 'jetpack' ) }
					module="sharing"
					hideButton
				>
					<SettingsGroup
						disableInOfflineMode
						module={ { module: 'sharing' } }
						support={ {
							text: __(
								'You can customize the sharing buttons and choose which services to display.',
								'jetpack'
							),
							link: getRedirectUrl( 'jetpack-support-sharing' ),
						} }
					>
						<p>
							{ __(
								'Add sharing buttons so visitors can share your posts and pages on social media with a couple of quick clicks.',
								'jetpack'
							) }
						</p>
						<ModuleToggle
							slug="sharedaddy"
							activated={ isActive }
							toggling={ this.props.isSavingAnyOption( 'sharedaddy' ) }
							toggleModule={ this.props.toggleModuleNow }
						>
							{ __( 'Add sharing buttons to your posts and pages', 'jetpack' ) }
						</ModuleToggle>
					</SettingsGroup>
					{ isActive && configCard() }
				</SettingsCard>
			);
		}
	}
);
