import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../../social-store';
import { ConnectionToggle } from '../connection-toggle';
import { CustomizationSection } from '../customization-section';
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
		<div
			className={ styles[ 'tab-content' ] }
			data-variant={ usingPerNetworkCustomization ? 'per-network' : 'global' }
		>
			{ usingPerNetworkCustomization ? (
				<CustomizationSection connection={ connection } usingPerNetworkCustomization />
			) : null }
			<div className={ styles[ 'preview-wrapper' ] }>
				<div className={ styles[ 'connection-toggle-wrapper' ] }>
					<ConnectionToggle connection={ connection } />
				</div>
				<PreviewSection connection={ connection } />
			</div>
		</div>
	);
}
