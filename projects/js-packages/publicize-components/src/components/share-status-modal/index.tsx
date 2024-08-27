import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { getSocialScriptData } from '../../utils/script-data';
import styles from './styles.module.scss';

/**
 * Share status modal component.
 *
 * @return {import('react').ReactNode} - Share status modal component.
 */
export function ShareStatusModal() {
	const { feature_flags } = getSocialScriptData();

	if ( ! feature_flags.useShareStatus ) {
		return null;
	}

	return (
		<div className={ styles.wrapper }>
			<Button variant="secondary">{ __( 'Review sharing status', 'jetpack' ) }</Button>{ ' ' }
		</div>
	);
}
