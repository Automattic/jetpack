import { TabPanel } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../../../hooks/use-per-network-customization';
import { ConnectionTab } from '../types';
import { useConnectionTabs } from '../use-connection-tabs';
import { CustomizationSection } from './customization-section';
import styles from './styles.module.scss';
import { TabContent } from './tab-content';

/**
 * Tab Panel component for small screens in the social preview modal.
 *
 * @return - Tab Panel component.
 */
export function TabPanelMobile() {
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
			className={ clsx( {
				[ styles[ 'tab-panel-mobile-wrapper-border' ] ]: ! usingPerNetworkCustomization,
			} ) }
		>
			{ ! usingPerNetworkCustomization && <CustomizationSection /> }
			<TabPanel className={ styles[ 'tab-panel-mobile' ] } tabs={ tabs } children={ tabRenderer } />
		</div>
	);
}
