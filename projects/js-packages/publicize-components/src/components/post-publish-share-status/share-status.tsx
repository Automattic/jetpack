import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import { ShareStatusModalTrigger } from '../share-status';
import styles from './styles.module.scss';

/**
 * Share status component.
 *
 *
 * @return {import('react').ReactNode} - Share status UI.
 */
export function ShareStatus() {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	if ( shareStatus.polling ) {
		return (
			<div className={ styles[ 'loading-block' ] }>
				<Spinner />
				<span className={ styles[ 'loading-text' ] }>
					{ __( 'Sharing to your social media…', 'jetpack' ) }
				</span>
			</div>
		);
	}

	const numberOfFailedShares = shareStatus.shares.filter(
		share => share.status === 'failure'
	).length;

	if ( numberOfFailedShares > 0 ) {
		return (
			<Notice type="warning">
				<p>
					{ sprintf(
						/* translators: %d: number of failed shares */
						_n(
							'Your post was unable to be shared to %d connection.',
							'Your post was unable to be shared to %d connections.',
							numberOfFailedShares,
							'jetpack'
						),
						numberOfFailedShares
					) }
				</p>
				<ShareStatusModalTrigger variant="link">
					{ __( 'Review status and try again', 'jetpack' ) }
				</ShareStatusModalTrigger>
			</Notice>
		);
	}

	if ( ! shareStatus.done ) {
		// If we are here, it means that polling has finished/timedout
		// but we don't know the share status yet.
		return <span>{ __( 'The request to share your post is still in progress.', 'jetpack' ) }</span>;
	}

	if ( ! shareStatus.shares.length ) {
		// We should ideally never reach here but just in case.
		return <span>{ __( 'Your post was not shared.', 'jetpack' ) }</span>;
	}

	return (
		<>
			<b>{ __( 'Your post was shared.', 'jetpack' ) }</b>&nbsp;{ '🎉' }
			<p>
				{ sprintf(
					/* translators: %d: number of connections to which a post was shared */
					_n(
						'You post was successfuly shared to %d connection.',
						'You post was successfuly shared to %d connections.',
						shareStatus.shares.length,
						'jetpack'
					),
					shareStatus.shares.length
				) }
			</p>
			<ShareStatusModalTrigger />
		</>
	);
}
