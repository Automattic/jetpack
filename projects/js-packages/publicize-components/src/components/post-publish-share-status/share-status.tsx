import { Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import { ShareStatusModalTrigger } from '../share-status';
import styles from './styles.module.scss';

type ShareStatusProps = {
	reShareTimestamp?: number;
};

/**
 * Share status component.
 *
 * @param {ShareStatusProps} props - component props
 * @return {import('react').ReactNode} - React element
 */
export function ShareStatus( { reShareTimestamp }: ShareStatusProps ) {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	const currentShares = reShareTimestamp
		? shareStatus.shares.filter( share => share.timestamp > reShareTimestamp )
		: shareStatus.shares;

	if ( shareStatus.polling ) {
		return (
			<div className={ styles[ 'loading-block' ] }>
				<Spinner />
				<span className={ styles[ 'loading-text' ] }>
					{ __( 'Sharing to your social media…', 'jetpack-publicize-components' ) }
				</span>
			</div>
		);
	}

	const numberOfFailedShares = currentShares.filter( share => share.status === 'failure' ).length;

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
							'jetpack-publicize-components'
						),
						numberOfFailedShares
					) }
				</p>
				<ShareStatusModalTrigger
					variant="link"
					analyticsData={ { location: 'post-publish-panel' } }
				>
					{ __( 'Review status and try again', 'jetpack-publicize-components' ) }
				</ShareStatusModalTrigger>
			</Notice>
		);
	}

	if ( ! shareStatus.done ) {
		// If we are here, it means that polling has finished/timedout
		// but we don't know the share status yet.
		return (
			<span>
				{ __(
					'The request to share your post is still in progress.',
					'jetpack-publicize-components'
				) }
				&nbsp;
				{ __( 'Please refresh and check again in a few minutes.', 'jetpack-publicize-components' ) }
			</span>
		);
	}

	if ( ! currentShares.length ) {
		// We should ideally never reach here but just in case.
		return <span>{ __( 'Your post was not shared.', 'jetpack-publicize-components' ) }</span>;
	}

	return (
		<>
			<b>{ __( 'Your post was shared.', 'jetpack-publicize-components' ) }</b>&nbsp;{ '🎉' }
			<p>
				{ sprintf(
					/* translators: %d: number of connections to which a post was shared */
					_n(
						'Your post was successfuly shared to %d connection.',
						'Your post was successfuly shared to %d connections.',
						currentShares.length,
						'jetpack-publicize-components'
					),
					currentShares.length
				) }
			</p>
			<ShareStatusModalTrigger
				analyticsData={ {
					location: reShareTimestamp ? 'resharing-section' : 'post-publish-panel',
				} }
			/>
		</>
	);
}
