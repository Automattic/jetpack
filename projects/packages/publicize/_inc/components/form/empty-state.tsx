/* eslint-disable @wordpress/no-unsafe-wp-apis */
import { Flex, FlexBlock, PanelRow, __experimentalText as Text } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import illustration from '../../assets/networks-illustration.webp';
import { SettingsButton } from './settings-button';
import styles from './styles.module.scss';

/**
 * Empty state component for Publicize form.
 *
 * @return React element or null
 */
export function EmptyState() {
	return (
		<PanelRow className={ styles[ 'empty-state' ] }>
			<Flex justify="center" direction="column" align="center" gap={ 4 }>
				<img className={ styles.illustration } src={ illustration } alt="" />
				<Text className={ styles[ 'connect-account-text' ] }>
					{ __(
						'Automatically share your website content to your favorite social media platforms, from one place.',
						'jetpack-publicize-pkg'
					) }
				</Text>
				<FlexBlock className={ styles[ 'connect-account-button' ] }>
					<SettingsButton label={ __( 'Connect your accounts', 'jetpack-publicize-pkg' ) } />
				</FlexBlock>
			</Flex>
		</PanelRow>
	);
}
