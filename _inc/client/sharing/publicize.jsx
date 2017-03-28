/**
 * External dependencies
 */
import React, { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';

export class Publicize extends Component {
	trackClickConfigure() {
		analytics.tracks.recordJetpackClick( {
			target: 'configure-publicize',
			page: 'sharing'
		} );
	}

	render() {
		const unavailableInDevMode = this.props.isUnavailableInDevMode( 'publicize' ),
			isLinked = this.props.isLinked,
			connectUrl = this.props.connectUrl,
			siteRawUrl = this.props.siteRawUrl,
			siteAdminUrl = this.props.siteAdminUrl;

		const configCard = () => {
			const settingsLink = unavailableInDevMode
				? siteAdminUrl + 'wp-admin/options-general.php?page=sharing'
				: 'https://wordpress.com/sharing/' + siteRawUrl;

			return isLinked
				? <Card compact className="jp-settings-card__configure-link" onClick={ this.trackClickConfigure } href={ settingsLink }>{ __( 'Connect your social media accounts' ) }</Card>
				: <Card compact className="jp-settings-card__configure-link" href={ `${ connectUrl }&from=unlinked-user-connect-publicize` }>{ __( 'Connect your user account to WordPress.com to use this feature' ) }</Card>;
		};

		return (
			<SettingsCard
				{ ...this.props }
				header={ __( 'Publicize connections', { context: 'Settings header' } ) }
				module="publicize"
				hideButton>
				<SettingsGroup disableInDevMode module={ { module: 'publicize' } } support="https://jetpack.com/support/publicize/">
					{
						__( 'Publicize lets you connect your site to various social networking services.  Once connected to a ' +
							'service, you can share your posts with that service automatically.' )
					}
				</SettingsGroup>
				{
					configCard()
				}
			</SettingsCard>
		);
	}
}
