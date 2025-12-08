/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Flex, FlexBlock, PanelRow, __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import illustration from '../../assets/networks-illustration.png';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';
import { UserConnectionNotice } from './user-connection-notice';

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
			<Flex justify="center" direction="column" align="center" gap={ 4 }>
				{
					// Do not show illustration if there are connections
					! hasConnections && <img className={ styles.illustration } src={ illustration } alt="" />
				}
				{ needsUserConnection ? (
					<UserConnectionNotice />
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
