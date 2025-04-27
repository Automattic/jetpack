import { getMyJetpackUrl } from '@automattic/jetpack-script-data';
import { PanelRow } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';

export const ConnectionNotice: React.FC = () => {
	const { hasConnections } = useSocialMediaConnections();
	const { needsUserConnection } = usePublicizeConfig();

	if ( needsUserConnection ) {
		return (
			<PanelRow>
				<p>
					{ __(
						'You must connect your WordPress.com account to be able to add social media connections.',
						'jetpack-publicize-components'
					) }
					&nbsp;
					<a href={ getMyJetpackUrl( '#/connection' ) }>
						{ __( 'Connect now', 'jetpack-publicize-components' ) }
					</a>
				</p>
			</PanelRow>
		);
	}

	if ( ! hasConnections ) {
		return (
			<PanelRow>
				<div>
					<span className={ styles[ 'no-connections-text' ] }>
						{ __(
							'Sharing is disabled because there are no social media accounts connected.',
							'jetpack-publicize-components'
						) }
					</span>
					<SettingsButton label={ __( 'Connect an account', 'jetpack-publicize-components' ) } />
				</div>
			</PanelRow>
		);
	}

	return null;
};
