import { useSyncMediaToConnections } from '../../hooks/use-sync-media-to-connections';
import { hasSocialPaidFeatures } from '../../utils';
import { CustomizationToggle } from './customization-toggle';
import styles from './styles.module.scss';
import { TabPanelWrapper } from './tab-panels';

/**
 * Customize and Preview component.
 *
 * @return - Customize and Preview component.
 */
export function CustomizeAndPreview() {
	const hasPaidFeatures = hasSocialPaidFeatures();

	// Sync media URLs (SIG, featured image) to connections when they change
	useSyncMediaToConnections();

	return (
		<div
			className={ styles[ 'customize-and-preview' ] }
			data-plan={ hasPaidFeatures ? 'paid' : 'free' }
		>
			{ hasPaidFeatures && <CustomizationToggle /> }
			<TabPanelWrapper />
		</div>
	);
}
