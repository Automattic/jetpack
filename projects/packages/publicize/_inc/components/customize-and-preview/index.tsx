import { useBreakpoint } from '@automattic/viewport-react';
import { useSyncMediaToConnections } from '../../hooks/use-sync-media-to-connections';
import { hasSocialPaidFeatures } from '../../utils';
import { CustomizationToggle } from './customization-toggle';
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
	const hasPaidFeatures = hasSocialPaidFeatures();

	// Sync media URLs (SIG, featured image) to connections when they change
	useSyncMediaToConnections();

	return (
		<div className={ styles[ 'customize-and-preview' ] }>
			{ hasPaidFeatures && (
				<div className={ styles[ 'customization-toggle-wrapper' ] }>
					<CustomizationToggle />
				</div>
			) }
			<div>{ isSmallScreen ? <TabPanelMobile /> : <TabPanelDesktop /> }</div>
		</div>
	);
}
