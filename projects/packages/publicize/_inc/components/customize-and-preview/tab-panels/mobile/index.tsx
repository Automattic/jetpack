import { TabPanel } from '@wordpress/components';
import clsx from 'clsx';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../../../hooks/use-per-network-customization';
import { CustomizationSection } from '../../customization-section';
import { ConnectionTab } from '../types';
import { useConnectionTabs } from '../use-connection-tabs';
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
			{ ! usingPerNetworkCustomization && (
				<CustomizationSection usingPerNetworkCustomization={ false } />
			) }
			<TabPanel
				className={ styles[ 'tab-panel-mobile' ] }
				// @ts-expect-error -- TODO fix tab type
				tabs={ tabs }
				// @ts-expect-error -- TODO fix type here
				children={ tabRenderer }
			/>
		</div>
	);
}
