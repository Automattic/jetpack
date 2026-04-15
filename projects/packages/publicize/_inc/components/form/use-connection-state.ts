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
import { hasSocialPaidFeatures } from '../../utils/script-data';

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

	// Derive the period from the post's edited date so X quota checks apply to
	// the month the post will actually be published in, rather than always
	// checking the current month.
	const postDate = useSelect(
		select => select( editorStore ).getEditedPostAttribute( 'date' ) as string | undefined,
		[]
	);
	const postPeriod = postDate ? date( 'Y-m', postDate ) : null;

	const canScheduleFor = useSelect(
		select => select( socialStore ).canScheduleXShareFor( postPeriod ),
		[ postPeriod ]
	);

	const canShareNow = useSelect( select => select( socialStore ).canShareToX(), [] );

	/**
	 * Returns whether the connection is blocked by the X sharing quota for the
	 * post's target period.
	 */
	const isXQuotaBlocked = useCallback(
		( connection: Connection ) => connection.service_name === 'x' && ! canScheduleFor,
		[ canScheduleFor ]
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
	 * - The connection is an X connection blocked by the sharing quota
	 */
	const shouldBeDisabled = useCallback(
		( connection: Connection ) => {
			return (
				// Publicize is disabled
				! isPublicizeEnabled ||
				// or the connection is not in good shape
				! isInGoodShape( connection ) ||
				// or X quota is exceeded for X connections
				isXQuotaBlocked( connection )
			);
		},
		[ isInGoodShape, isPublicizeEnabled, isXQuotaBlocked ]
	);

	/**
	 * Returns whether a connection can be enabled.
	 * Enabled here means the checked state of the ToggleControl
	 *
	 * A connection can be enabled if:
	 * - Publicize is not disabled due to the current site plan
	 * - The connection is in good shape
	 * - The connection is not an X connection blocked by the sharing quota
	 */
	const canBeTurnedOn = useCallback(
		( connection: Connection ) => {
			// A connection toggle can be turned ON if
			return (
				// Publicize is not disabled due to the current site plan
				! isPublicizeDisabledBySitePlan &&
				// and the connection is in good shape
				isInGoodShape( connection ) &&
				// and X quota is not exceeded for X connections
				! isXQuotaBlocked( connection )
			);
		},
		[ isInGoodShape, isPublicizeDisabledBySitePlan, isXQuotaBlocked ]
	);

	const getDisabledReason = useCallback(
		( connection: Connection ) => {
			if ( isXQuotaBlocked( connection ) ) {
				return 'quota_exceeded';
			}
			return undefined;
		},
		[ isXQuotaBlocked ]
	);

	/**
	 * Returns a warning reason for a connection that is not disabled but
	 * deserves a hint (e.g. the current-month X quota is exhausted but the
	 * post could still be scheduled for a future month).
	 *
	 * Only surfaced on paid plans, where quota resets monthly. Free plans use
	 * a lifetime quota, so a "pick a future month" hint would be misleading.
	 */
	const getWarningReason = useCallback(
		( connection: Connection ) => {
			if (
				connection.service_name === 'x' &&
				! canShareNow &&
				! postPeriod &&
				hasSocialPaidFeatures()
			) {
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
			getDisabledReason,
			getWarningReason,
		} ),
		[ shouldBeDisabled, canBeTurnedOn, getDisabledReason, getWarningReason ]
	);
};
