import { useSelect } from '@wordpress/data';
import { date } from '@wordpress/date';
import { store as editorStore } from '@wordpress/editor';
import { useCallback } from '@wordpress/element';
import { useMemo } from 'react';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions from '../../hooks/use-media-restrictions';
import { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions/constants';
import usePublicizeConfig from '../../hooks/use-publicize-config';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

export const useConnectionState = () => {
	const { connections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();
	const { attachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;

	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ]
	);

	const postDate = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'date' ) as string | undefined,
		[]
	);

	// Derive the period from the post date so quota checks apply to the correct month.
	const postPeriod = postDate ? date( 'Y-m', postDate ) : null;

	const canShareNow = useSelect( select => select( socialStore ).canShareToXNow(), [] );

	const canScheduleFor = useSelect(
		select => select( socialStore ).canScheduleXShareFor( postPeriod ),
		[ postPeriod ]
	);

	/**
	 * Returns whether a connection is in good shape.
	 *
	 * A connection is in good shape if:
	 * - It is healthy
	 * - It has no validation errors
	 * - It does not have a NO_MEDIA_ERROR when media is required
	 */
	const isInGoodShape = useCallback(
		( connection: Connection ) => {
			const { connection_id: id, status } = connection;

			// 1. Be healthy
			const isHealthy = status !== 'broken';

			// 2. Have no validation errors
			const hasValidationErrors = validationErrors[ id ] !== undefined && ! isConvertible;

			// 3. Not have a NO_MEDIA_ERROR when media is required
			const hasNoMediaError = validationErrors[ id ] === NO_MEDIA_ERROR;

			return isHealthy && ! hasValidationErrors && ! hasNoMediaError;
		},
		[ isConvertible, validationErrors ]
	);

	/**
	 * Returns whether a connection should be disabled.
	 * Disabled here means the disabled prop of the ToggleControl
	 *
	 * A connection can be disabled if:
	 * - Publicize is disabled
	 * - There are no more connections available
	 * - The connection is not in good shape
	 * - X quota is exceeded for the post's target month
	 */
	const shouldBeDisabled = useCallback(
		( connection: Connection ) => {
			return (
				// Publicize is disabled
				! isPublicizeEnabled ||
				// or the connection is not in good shape
				! isInGoodShape( connection ) ||
				// or X quota is exceeded for the post's target month
				( connection.service_name === 'x' && ! canScheduleFor )
			);
		},
		[ isInGoodShape, isPublicizeEnabled, canScheduleFor ]
	);

	/**
	 * Returns whether a connection can be enabled.
	 * Enabled here means the checked state of the ToggleControl
	 *
	 * A connection can be enabled if:
	 * - Publicize is not disabled due to the current site plan
	 * - The connection is in good shape
	 * - X quota allows sharing for the post's target month
	 */
	const canBeTurnedOn = useCallback(
		( connection: Connection ) => {
			return (
				// Publicize is not disabled due to the current site plan
				! isPublicizeDisabledBySitePlan &&
				// and the connection is in good shape
				isInGoodShape( connection ) &&
				// and X quota allows sharing for the post's target month
				! ( connection.service_name === 'x' && ! canScheduleFor )
			);
		},
		[ isInGoodShape, isPublicizeDisabledBySitePlan, canScheduleFor ]
	);

	/**
	 * Returns whether a connection can be used for scheduling a share.
	 */
	const canSchedule = useCallback(
		( connection: Connection ) => {
			return (
				isPublicizeEnabled &&
				! isPublicizeDisabledBySitePlan &&
				isInGoodShape( connection ) &&
				! ( connection.service_name === 'x' && ! canScheduleFor )
			);
		},
		[ isInGoodShape, isPublicizeEnabled, isPublicizeDisabledBySitePlan, canScheduleFor ]
	);

	const getDisabledReason = useCallback(
		( connection: Connection ) => {
			if ( connection.service_name === 'x' && ! canScheduleFor ) {
				return 'quota_exceeded';
			}
			return undefined;
		},
		[ canScheduleFor ]
	);

	const getWarningReason = useCallback(
		( connection: Connection ) => {
			// Show the "schedule for a future month" hint only when the current month is
			// exceeded and no specific post date is set yet. If the post already targets
			// a future month with available quota, the hint is redundant.
			if ( connection.service_name === 'x' && ! canShareNow && ! postPeriod ) {
				return 'quota_exceeded_schedule_hint';
			}
			return undefined;
		},
		[ canShareNow, postPeriod ]
	);

	return useMemo(
		() => ( {
			shouldBeDisabled,
			canBeTurnedOn,
			canSchedule,
			getDisabledReason,
			getWarningReason,
		} ),
		[ shouldBeDisabled, canBeTurnedOn, canSchedule, getDisabledReason, getWarningReason ]
	);
};
