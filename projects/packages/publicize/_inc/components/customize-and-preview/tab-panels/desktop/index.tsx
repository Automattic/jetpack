import { TabPanel } from '@wordpress/components';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../../../hooks/use-per-network-customization';
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
	const { isEnabled: usingPerNetworkCustomization } = usePerNetworkCustomization();

	const tabRenderer = useCallback(
		( tab: ConnectionTab ) => {
			return (
				<TabContent
					connectionId={ tab.connectionId }
					usingPerNetworkCustomization={ usingPerNetworkCustomization }
				/>
			);
		},
		[ usingPerNetworkCustomization ]
	);

	return (
		<TabPanel
			className={ styles[ 'tab-panel-desktop' ] }
			orientation="vertical"
			// @ts-expect-error -- TODO fix tab type
			tabs={ tabs }
			// @ts-expect-error -- TODO fix type here
			children={ tabRenderer }
		/>
	);
}
