import { useBreakpoint } from '@automattic/viewport-react';
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
