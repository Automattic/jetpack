import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';

/**
 * Share status modal component.
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareStatusModal() {
	const { featureFlags } = useSelect( select => {
		const store = select( socialStore );
		return {
			featureFlags: store.featureFlags(),
		};
	}, [] );

	if ( ! featureFlags.useShareStatus ) {
		return null;
	}

	return (
		<div className={ styles.wrapper }>
			<Button variant="secondary">{ __( 'Review sharing status', 'jetpack' ) }</Button>{ ' ' }
		</div>
	);
}
