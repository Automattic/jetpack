import { IconTooltip } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, Spinner } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import useSharePost from '../../hooks/use-share-post';
import { store as socialStore } from '../../social-store';
import { ShareStatusItem } from '../../social-store/types';
import {
	areShareItemsForSameConnection,
	connectionMatchesShareItem,
} from '../../utils/share-status';
import styles from './styles.module.scss';

export type RetryProps = {
	shareItem: ShareStatusItem;
};

/**
 * Retry component.
 *
 * @param {RetryProps} props - component props
 *
 * @return {import('react').ReactNode} - React element
 */
export function Retry( { shareItem }: RetryProps ) {
	const { recordEvent } = useAnalytics();
	const postId = useSelect( select => select( editorStore ).getCurrentPostId(), [] );
	const connections = useSelect( select => select( socialStore ).getConnections(), [] );

	const connectionStillExists = connections.some( connectionMatchesShareItem( shareItem ) );

	const { doPublicize } = useSharePost( postId );
	const { pollForPostShareStatus } = useDispatch( socialStore );

	const [ isRetrying, setIsRetrying ] = useState( false );

	const onRetry = useCallback( async () => {
		recordEvent( 'jetpack_social_share_status_retry', {
			service: shareItem.service,
			location: 'modal',
		} );
		const connectionMatches = connectionMatchesShareItem( shareItem );

		const skippedConnections = connections
			.filter( connection => ! connectionMatches( connection ) )
			.map( ( { connection_id } ) => connection_id );

		if ( skippedConnections.length === connections.length ) {
			// We should ideally never reach this point,
			// because we disable the retry button if the connection doesn't still exist,
			// but just in case, if we do, we should return early
			return;
		}

		setIsRetrying( true );

		await doPublicize( skippedConnections );

		await pollForPostShareStatus( {
			isRequestComplete( { postShareStatus, lastTimestamp } ) {
				const isComplete = postShareStatus.shares.some( share => {
					return (
						share.timestamp > lastTimestamp && areShareItemsForSameConnection( shareItem, share )
					);
				} );

				if ( isComplete ) {
					setIsRetrying( false );
				}

				return isComplete;
			},
		} );
	}, [ recordEvent, shareItem, connections, doPublicize, pollForPostShareStatus ] );

	if ( isRetrying ) {
		return <Spinner />;
	}

	return (
		<div className={ styles[ 'retry-wrapper' ] }>
			<Button
				variant={ connectionStillExists ? 'link' : 'tertiary' }
				onClick={ connectionStillExists ? onRetry : undefined }
				disabled={ ! connectionStillExists }
			>
				{ __( 'Retry', 'jetpack-publicize-components' ) }
			</Button>
			{ ! connectionStillExists ? (
				<IconTooltip shift placement="bottom-end">
					{
						// If we don't have external_id - in case of old share data,
						// we can't be sure if the connection has been removed or reconnected
						shareItem.external_id
							? _x(
									'This connection has been removed.',
									'Social media connection',
									'jetpack-publicize-components'
							  )
							: _x(
									'This connection has been reconnected or removed.',
									'Social media connection',
									'jetpack-publicize-components'
							  )
					}
				</IconTooltip>
			) : null }
		</div>
	);
}
