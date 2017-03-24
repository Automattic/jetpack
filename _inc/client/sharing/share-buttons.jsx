/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export class ShareButtons extends Component {
	render() {
		const unavailableInDevMode = this.props.isUnavailableInDevMode( 'sharing' ),
			isLinked = this.props.isLinked,
			connectUrl = this.props.connectUrl,
			siteRawUrl = this.props.siteRawUrl,
			siteAdminUrl = this.props.siteAdminUrl;

		const configCard = () => {
			const settingsLink = unavailableInDevMode
				? siteAdminUrl + 'wp-admin/options-general.php?page=sharing'
				: 'https://wordpress.com/sharing/' + siteRawUrl;

			return isLinked
				? <Card compact className="jp-settings-card__configure-link" href={ settingsLink }>{ __( 'Configure your sharing buttons' ) }</Card>
				: <Card compact className="jp-settings-card__configure-link" href={ `${ connectUrl }&from=unlinked-user-connect-sharing` }>{ __( 'Connect your user account to WordPress.com to use this feature' ) }</Card>;
		};

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Sharing buttons', { context: 'Settings header' } ) }
				module="sharing"
				hideButton>
				<SettingsGroup disableInDevMode module={ { module: 'sharing' } } support="https://jetpack.com/support/sharing/">
					{
						__( 'Sharing buttons can be added to your posts so that your users can share your content to their social ' +
							'networks and show their support.' )
					}
				</SettingsGroup>
				{
					configCard()
				}
			</SettingsCard>
		);
	}
}
