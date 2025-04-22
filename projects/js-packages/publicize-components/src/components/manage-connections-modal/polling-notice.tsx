import { Notice, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { useServiceLabel } from '../services/use-service-label';
import styles from './style.module.scss';

/**
 * Polling notice component
 *
 * @return React element
 */
export function PollingNotice() {
	const keyringRequest = useSelect( select => select( socialStore ).getKeyringRequest(), [] );
	const { abortPollingForLastKeyringResult } = useDispatch( socialStore );

	const getServiceLabel = useServiceLabel();

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
				{ sprintf(
					// translators: %s: Social media service name
					__( 'Getting your %s accounts to connect, please wait…', 'jetpack-publicize-components' ),
					getServiceLabel( keyringRequest.service )
				) }
			</Notice>
		</div>
	);
}
