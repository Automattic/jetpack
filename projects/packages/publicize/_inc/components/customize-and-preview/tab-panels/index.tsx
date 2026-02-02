import { TabPanel } from '@wordpress/components';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../../hooks/use-per-network-customization';
import { hasSocialPaidFeatures } from '../../../utils';
import { CustomizationSection } from '../customization-section';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';
import { ConnectionTab } from './types';
import { useConnectionTabs } from './use-connection-tabs';

/**
 * Tab Panel wrapper component in the social preview modal.
 *
 * @return - Tab Panel wrapper component.
 */
export function TabPanelWrapper() {
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
		<div
			className={ styles[ 'tab-panel-wrapper' ] }
			data-variant={ usingPerNetworkCustomization ? 'per-network' : 'global' }
			data-plan={ hasSocialPaidFeatures() ? 'paid' : 'free' }
		>
			{ ! usingPerNetworkCustomization && <CustomizationSection /> }
			<TabPanel
				className={ styles[ 'tab-panel' ] }
				tabs={ tabs }
				children={ tabRenderer }
				data-variant={ usingPerNetworkCustomization ? 'per-network' : 'global' }
			/>
		</div>
	);
}
