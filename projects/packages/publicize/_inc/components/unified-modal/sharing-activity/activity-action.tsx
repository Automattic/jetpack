import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { AlertDialog, Link } from '@wordpress/ui';
import { store as socialStore } from '../../../social-store';
import { Retry } from '../../share-status/retry';
import { ScheduledActivityItem, SharedActivityItem, SharingActivityItem } from './types';

interface ActivityActionProps {
	item: SharingActivityItem;
}

/**
 * Action component for sharing activity items.
 * Renders different actions based on item type and status.
 *
 * @param {ActivityActionProps} props - Component props
 *
 * @return React element
 */
export function ActivityAction( { item }: ActivityActionProps ) {
	const { recordEvent } = useAnalytics();
	const { deleteScheduledShare } = useDispatch( socialStore );
	const [ showConfirmation, setShowConfirmation ] = useState( false );

	const openConfirmation = useCallback( () => setShowConfirmation( true ), [] );

	const handleViewClick = useCallback( () => {
		if ( item.activityType === 'shared' ) {
			recordEvent( 'jetpack_social_share_status_view', {
				service: item.serviceName,
				location: 'modal',
			} );
		}
	}, [ recordEvent, item ] );

	const handleDelete = useCallback( () => {
		if ( item.activityType === 'scheduled' ) {
			const scheduledItem = item as ScheduledActivityItem;
			recordEvent( 'jetpack_social_scheduled_share_delete', {
				service: item.serviceName,
				location: 'modal',
			} );
			deleteScheduledShare( scheduledItem.scheduleId );
		}
	}, [ recordEvent, item, deleteScheduledShare ] );

	// Shared items - success shows View link
	if ( item.activityType === 'shared' && item.status === 'success' ) {
		const sharedItem = item as SharedActivityItem;
		return (
			<Link openInNewTab href={ sharedItem.message } onClick={ handleViewClick }>
				{ __( 'View', 'jetpack-publicize-pkg' ) }
			</Link>
		);
	}

	// Shared items - failure shows Retry button
	if ( item.activityType === 'shared' && item.status === 'failure' ) {
		const sharedItem = item as SharedActivityItem;
		return <Retry shareItem={ sharedItem.originalItem } />;
	}

	// Scheduled items - show Delete button
	if ( item.activityType === 'scheduled' ) {
		return (
			<div>
				<Button variant="link" isDestructive onClick={ openConfirmation }>
					{ __( 'Delete', 'jetpack-publicize-pkg' ) }
				</Button>
				<AlertDialog.Root
					open={ showConfirmation }
					onOpenChange={ setShowConfirmation }
					onConfirm={ handleDelete }
				>
					<AlertDialog.Popup
						intent="irreversible"
						title={ __( 'Delete scheduled share', 'jetpack-publicize-pkg' ) }
						description={ __(
							'Are you sure you want to delete this scheduled share?',
							'jetpack-publicize-pkg'
						) }
						confirmButtonText={ __( 'Delete', 'jetpack-publicize-pkg' ) }
					/>
				</AlertDialog.Root>
			</div>
		);
	}

	return null;
}
