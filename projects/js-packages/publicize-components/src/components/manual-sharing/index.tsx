import { IconTooltip, Text, ThemeProvider } from '@automattic/jetpack-components';
import { Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { ShareButtons } from '../share-buttons/share-buttons';
import { ManualSharingInfo, ManualSharingInfoProps } from './info';
import styles from './styles.module.scss';

export type ManualSharingProps = ManualSharingInfoProps;

/**
 * Manual sharing component.
 *
 * @param {ManualSharingProps} props - Component props.
 *
 * @returns {import('react').ReactNode} Manual sharing component.
 */
export function ManualSharing( props: ManualSharingProps ) {
	return (
		<ThemeProvider>
			<div className={ styles.wrapper }>
				<Flex align="start" justify="start">
					<Text variant="body-extra-small" className={ styles.title }>
						{ __( 'Manual sharing', 'jetpack' ) }
					</Text>
					<IconTooltip inline={ false } shift iconSize={ 16 } placement="top-end">
						<ManualSharingInfo { ...props } />
					</IconTooltip>
				</Flex>
				<ShareButtons buttonStyle="icon" />
			</div>
		</ThemeProvider>
	);
}
