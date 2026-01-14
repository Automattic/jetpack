import { useBreakpoint } from '@automattic/viewport-react';
import styles from './styles.module.scss';
import { TabPanelDesktop } from './tab-panels/desktop';
import { TabPanelMobile } from './tab-panels/mobile';

/**
 * Customize and Preview component.
 *
 * @return - Customize and Preview component.
 */
export function CustomizeAndPreview() {
	const isSmallScreen = useBreakpoint( '<782px' );

	return (
		<div className={ styles[ 'customize-and-preview' ] }>
			{ isSmallScreen ? <TabPanelMobile /> : <TabPanelDesktop /> }
		</div>
	);
}
