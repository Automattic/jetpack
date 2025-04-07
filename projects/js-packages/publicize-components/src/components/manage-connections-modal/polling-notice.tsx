import { Notice, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import styles from './style.module.scss';

/**
 * Polling notice component
 *
 * @return React element
 */
export function PollingNotice() {
	const keyringRequest = useSelect( select => select( socialStore ).getKeyringRequest(), [] );
	const { abortPollingForLastKeyringResult } = useDispatch( socialStore );

	if ( ! keyringRequest?.polling ) {
		return null;
	}

	return (
		<div className={ styles[ 'polling-notice-wrapper' ] }>
			<Notice
				className={ styles[ 'polling-notice' ] }
				status="success"
				onRemove={ abortPollingForLastKeyringResult }
			>
				<Spinner />
				{ __(
					'Refreshing the available connections, please wait…',
					'jetpack-publicize-components'
				) }
			</Notice>
		</div>
	);
}
