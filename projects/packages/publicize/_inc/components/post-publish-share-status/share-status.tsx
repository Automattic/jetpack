import { Notice, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import { ShareStatusModalTrigger } from '../share-status';
import styles from './styles.module.scss';

type ShareStatusProps = {
	reShareTimestamp?: number;
};

/**
 * Share status component.
 *
 * @param {ShareStatusProps} props - component props
 * @return React element
 */
export function ShareStatus( { reShareTimestamp }: ShareStatusProps ) {
	const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

	const currentShares = reShareTimestamp
		? shareStatus.shares.filter( share => share.timestamp > reShareTimestamp )
		: shareStatus.shares;

	if ( shareStatus.polling ) {
		// Not using the `Notice` component here because we show a snackbar,
		// that announces that sharing is in progress to screen readers.
		return (
			<div className={ styles[ 'loading-block' ] }>
				<Spinner />
				<span className={ styles[ 'loading-text' ] }>
					{ __( 'Sharing to your social media…', 'jetpack-publicize-pkg' ) }
				</span>
			</div>
		);
	}

	const numberOfFailedShares = currentShares.filter( share => share.status === 'failure' ).length;

	if ( numberOfFailedShares > 0 ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				<p>
					{ sprintf(
						/* translators: %d: number of failed shares */
						_n(
							'Your post was unable to be shared to %d connection.',
							'Your post was unable to be shared to %d connections.',
							numberOfFailedShares,
							'jetpack-publicize-pkg'
						),
						numberOfFailedShares
					) }
				</p>
				<ShareStatusModalTrigger
					variant="link"
					analyticsData={ { location: 'post-publish-panel' } }
				>
					{ __( 'Review status and try again', 'jetpack-publicize-pkg' ) }
				</ShareStatusModalTrigger>
			</Notice>
		);
	}

	if ( ! shareStatus.done ) {
		// If we are here, it means that polling has finished/timedout
		// but we don't know the share status yet.
		return (
			<Notice isDismissible={ false }>
				{ __( 'The request to share your post is still in progress.', 'jetpack-publicize-pkg' ) }
				<br />
				{ __( 'Please refresh and check again in a few minutes.', 'jetpack-publicize-pkg' ) }
			</Notice>
		);
	}

	if ( ! currentShares.length ) {
		// We should ideally never reach here but just in case.
		return (
			<Notice isDismissible={ false } status="warning">
				{ __( 'Your post was not shared.', 'jetpack-publicize-pkg' ) }
			</Notice>
		);
	}

	return (
		<Notice status="success" isDismissible={ false }>
			<b>{ __( 'Your post was shared.', 'jetpack-publicize-pkg' ) }</b>&nbsp;
			<span aria-hidden="true">{ '🎉' }</span>
			<p>
				{ sprintf(
					/* translators: %d: number of connections to which a post was shared */
					_n(
						'Your post was successfuly shared to %d connection.',
						'Your post was successfuly shared to %d connections.',
						currentShares.length,
						'jetpack-publicize-pkg'
					),
					currentShares.length
				) }
			</p>
			<ShareStatusModalTrigger
				analyticsData={ {
					location: reShareTimestamp ? 'resharing-section' : 'post-publish-panel',
				} }
			/>
		</Notice>
	);
}
