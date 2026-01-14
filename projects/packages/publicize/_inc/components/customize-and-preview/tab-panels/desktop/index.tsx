import { TabPanel } from '@wordpress/components';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../customization-toggle/use-per-network-customization';
import { ConnectionTab } from '../types';
import { useConnectionTabs } from '../use-connection-tabs';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';

/**
 * Tab Panel component for desktop screens in the social preview modal.
 *
 * @return - Tab Panel component.
 */
export function TabPanelDesktop() {
	const tabs = useConnectionTabs();
	const { isEnabled: perNetwork } = usePerNetworkCustomization();

	const tabRenderer = useCallback(
		( tab: ConnectionTab ) => {
			return <TabContent connectionId={ tab.connectionId } perNetwork={ perNetwork } />;
		},
		[ perNetwork ]
	);

	return (
		<TabPanel
			className={ styles[ 'tab-panel-desktop' ] }
			orientation="vertical"
			tabs={ tabs }
			children={ tabRenderer }
		/>
	);
}
