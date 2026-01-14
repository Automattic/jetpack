import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../../../social-store';
import { ConnectionToggle } from '../../connection-toggle';
import { PreviewSection } from '../preview-section';
import { CustomizationSection } from './customization-section';
import styles from './styles.module.scss';

export type TabContentProps = {
	connectionId: string;
	perNetwork: boolean;
};

/**
 * The tab content component.
 *
 * @param {TabContentProps} props - The component props.
 *
 * @return The rendered component
 */
export function TabContent( { connectionId, perNetwork }: TabContentProps ) {
	const connection = useSelect(
		select => select( socialStore ).getConnectionById( connectionId ),
		[ connectionId ]
	);

	return (
		<div className={ styles[ 'tab-content' ] }>
			{ perNetwork ? (
				<CustomizationSection connection={ connection } />
			) : (
				<div className={ styles[ 'connection-toggle-wrapper' ] }>
					<ConnectionToggle connection={ connection } />
				</div>
			) }
			<PreviewSection connection={ connection } />
		</div>
	);
}
