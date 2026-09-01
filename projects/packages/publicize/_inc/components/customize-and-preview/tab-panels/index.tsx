import { TabPanel } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from 'react';
import { usePerNetworkCustomization } from '../../../hooks/use-per-network-customization';
import { useDriveRenderedMessagesFetch } from '../../../hooks/use-render-message-items';
import { store as socialStore } from '../../../social-store';
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
	// Mounted regardless of which tab (or none) is currently focused, so this is
	// the right place to drive the rendered-messages fetch. Without it, switching
	// to a disabled-connection tab would leave the resolver untriggered.
	useDriveRenderedMessagesFetch();

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

	const { setUnifiedModalData } = useDispatch( socialStore );

	const initialTab = useSelect( select => {
		return select( socialStore ).getUnifiedModalData()?.socialPreview?.initialTab;
	}, [] );

	const onSelect = useCallback(
		( tabName: string ) => {
			setUnifiedModalData( { socialPreview: { initialTab: tabName } } );
		},
		[ setUnifiedModalData ]
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
				initialTabName={ initialTab }
				onSelect={ onSelect }
				tabs={ tabs }
				children={ tabRenderer }
				data-variant={ usingPerNetworkCustomization ? 'per-network' : 'global' }
			/>
		</div>
	);
}
