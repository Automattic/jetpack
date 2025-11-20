/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { getUserConnectionUrl } from '@automattic/jetpack-connection';
import {
	Flex,
	FlexBlock,
	Notice,
	PanelRow,
	__experimentalText as Text,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import illustration from '../../assets/illustration.png';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';

/**
 * Empty state component for Publicize form.
 *
 * @return React element or null
 */
export function EmptyState() {
	const { hasConnections } = useSocialMediaConnections();
	const { needsUserConnection } = usePublicizeConfig();

	if ( hasConnections && ! needsUserConnection ) {
		return null;
	}

	return (
		<PanelRow className={ styles[ 'empty-state' ] }>
			<Flex justify="center" direction="column" align="center" gap={ 6 }>
				{
					// Do not show illustration if there are connections
					! hasConnections && <img className={ styles.illustration } src={ illustration } alt="" />
				}
				{ needsUserConnection ? (
					<Notice
						status="warning"
						isDismissible={ false }
						actions={ [
							{
								url: getUserConnectionUrl(),
								label: __( 'Connect now', 'jetpack-publicize-components' ),
								variant: 'link',
							},
						] }
					>
						{ __(
							'You must connect your WordPress.com account to be able to connect social media accounts.',
							'jetpack-publicize-components'
						) }
					</Notice>
				) : (
					<>
						<Text className={ styles[ 'connect-account-text' ] }>
							{ __(
								'Automatically share your website content to your favorite social media platforms, from one place.',
								'jetpack-publicize-components'
							) }
						</Text>
						<FlexBlock className={ styles[ 'connect-account-button' ] }>
							<SettingsButton
								label={ __( 'Connect your accounts', 'jetpack-publicize-components' ) }
							/>
						</FlexBlock>
					</>
				) }
			</Flex>
		</PanelRow>
	);
}
