import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import { SharesDataView } from './shares-dataview';

/**
 * ShareList component
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareList() {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	return (
		<div>
			<SharesDataView postShareStatus={ shareStatus } />
		</div>
	);
}
