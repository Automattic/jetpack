import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { SharesDataView } from './shares-dataview';
import styles from './styles.module.scss';

/**
 * ShareList component
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareList() {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	return (
		<div>
			{ shareStatus.loading && (
				<div className={ styles.spinner }>
					<Spinner /> { __( 'Loading…', 'jetpack' ) }
				</div>
			) }
			<SharesDataView />
		</div>
	);
}
