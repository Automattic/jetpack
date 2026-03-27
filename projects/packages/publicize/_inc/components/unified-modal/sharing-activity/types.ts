import { ShareStatusItem, UnifiedModalData } from '../../../social-store/types';

/**
 * The activity type discriminator.
 */
export type SharingActivityType = 'shared' | 'scheduled';

/**
 * Status for sharing activity items.
 */
export type SharingActivityStatus = 'success' | 'failure' | 'scheduled';

/**
 * Base interface for sharing activity items.
 */
interface BaseSharingActivityItem {
	/**
	 * Unique identifier for the item.
	 */
	id: string;

	/**
	 * The activity type.
	 */
	activityType: SharingActivityType;

	/**
	 * The status of the activity.
	 */
	status: SharingActivityStatus;

	/**
	 * Unix timestamp (seconds).
	 */
	timestamp: number;

	/**
	 * Service name (e.g., 'facebook', 'linkedin').
	 */
	serviceName: string;

	/**
	 * Display name for the account.
	 */
	displayName: string;

	/**
	 * Profile picture URL.
	 */
	profilePicture: string;
}

/**
 * Shared activity item (already shared to social).
 */
export interface SharedActivityItem extends BaseSharingActivityItem {
	/**
	 * Discriminator for shared items.
	 */
	activityType: 'shared';

	/**
	 * Status of the share - success or failure.
	 */
	status: 'success' | 'failure';

	/**
	 * Message - URL for success, error message for failure.
	 */
	message: string;

	/**
	 * Original ShareStatusItem for action handling.
	 */
	originalItem: ShareStatusItem;
}

/**
 * Scheduled activity item (pending share).
 */
export interface ScheduledActivityItem extends BaseSharingActivityItem {
	/**
	 * Discriminator for scheduled items.
	 */
	activityType: 'scheduled';

	/**
	 * Status is always 'scheduled' for pending shares.
	 */
	status: 'scheduled';

	/**
	 * Scheduled share ID.
	 */
	scheduleId: number;
}

/**
 * Union type for all sharing activity items.
 */
export type SharingActivityItem = SharedActivityItem | ScheduledActivityItem;

/**
 * Filter values for the DataViews.
 */
export type SharingActivityFilter = NonNullable<
	NonNullable< UnifiedModalData[ 'sharingActivity' ] >[ 'initialTab' ]
>;
