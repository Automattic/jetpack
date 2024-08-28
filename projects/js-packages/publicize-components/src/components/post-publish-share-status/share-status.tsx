import { Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { getDate, isInTheFuture } from '@wordpress/date';
import { store as editorStore } from '@wordpress/editor';
import { useEffect } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { store as socialStore } from '../../social-store';
import Notice from '../notice';
import { ShareStatusModalTrigger } from '../share-status';
import styles from './styles.module.scss';

export type ShareStatusProps = {
	postId: number;
};

const ONE_MINUTE_IN_MS = 60 * 1000;

/**
 * Share status component.
 *
 * @param {ShareStatusProps} props - Component props.
 *
 * @return {import('react').ReactNode} - Share status UI.
 */
export function ShareStatus( { postId }: ShareStatusProps ) {
	const shareStatus = useSelect(
		select => select( socialStore ).getPostShareStatus( postId ),
		[ postId ]
	);

	// Whether the post has been published more than one minute ago.
	const hasBeenMoreThanOneMinute = useSelect( select => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any -- `@wordpress/editor` is a nightmare to work with TypeScript
		const date = ( select( editorStore ) as any ).getEditedPostAttribute( 'date' );

		const oneMinuteAfterPostDate = new Date( Number( getDate( date ) ) + ONE_MINUTE_IN_MS );

		// @ts-expect-error isInTheFuture is typed incorrectly as it should accept a Date object apart from a string.
		return ! isInTheFuture( oneMinuteAfterPostDate );
	}, [] );

	// @ts-expect-error `invalidateResolution` exists in every store
	const { invalidateResolution } = useDispatch( socialStore );

	useEffect( () => {
		if ( ! hasBeenMoreThanOneMinute && ! shareStatus.loading && ! shareStatus.done ) {
			// Fire the next request as soon as the previous one is done but we are not done yet.
			invalidateResolution( 'getPostShareStatus', [ postId ] );
		}
	}, [
		hasBeenMoreThanOneMinute,
		invalidateResolution,
		postId,
		shareStatus.loading,
		shareStatus.done,
	] );

	if ( shareStatus.loading ) {
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
		return <span>{ __( 'The request to share your post is still in progress.', 'jetpack' ) }</span>;
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
			<ShareStatusModalTrigger />
		</>
	);
}
