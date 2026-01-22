import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../../../social-store';
import { CustomizationSection } from '../../customization-section';
import { PreviewSection } from '../preview-section';
import styles from './styles.module.scss';

export type TabContentProps = {
	connectionId: string;
	usingPerNetworkCustomization: boolean;
};

/**
 * The tab content component.
 *
 * @param {TabContentProps} props - The component props.
 *
 * @return The rendered component
 */
export function TabContent( { connectionId, usingPerNetworkCustomization }: TabContentProps ) {
	const connection = useSelect(
		select => select( socialStore ).getConnectionById( connectionId ),
		[ connectionId ]
	);

	return (
		<div className={ styles[ 'tab-content' ] }>
			<CustomizationSection
				connection={ connection }
				usingPerNetworkCustomization={ usingPerNetworkCustomization }
			/>
			<PreviewSection connection={ connection } />
		</div>
	);
}
