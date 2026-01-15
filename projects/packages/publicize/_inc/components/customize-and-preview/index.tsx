import { useBreakpoint } from '@automattic/viewport-react';
import { TabPanelDesktop } from './tab-panels/desktop';
import { TabPanelMobile } from './tab-panels/mobile';

/**
 * Customize and Preview component.
 *
 * @return - Customize and Preview component.
 */
export function CustomizeAndPreview() {
	const isSmallScreen = useBreakpoint( '<782px' );

	return isSmallScreen ? <TabPanelMobile /> : <TabPanelDesktop />;
}
