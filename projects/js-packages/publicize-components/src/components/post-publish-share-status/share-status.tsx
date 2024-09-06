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

	if ( shareStatus.loading || ! shareStatus.done ) {
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
				<ShareStatusModalTrigger
					variant="link"
					analyticsData={ { location: 'post-publish-panel' } }
				>
					{ __( 'Review status and try again', 'jetpack' ) }
				</ShareStatusModalTrigger>
			</Notice>
		);
	}

	if ( ! shareStatus.shares.length ) {
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
			<ShareStatusModalTrigger analyticsData={ { location: 'post-publish-panel' } } />
		</>
	);
}
