import { useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { useMemo } from 'react';
import { usePublicizeConfig } from '../../..';
import useAttachedMedia from '../../hooks/use-attached-media';
import useFeaturedImage from '../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../hooks/use-image-generator-config';
import useMediaDetails from '../../hooks/use-media-details';
import useMediaRestrictions, { NO_MEDIA_ERROR } from '../../hooks/use-media-restrictions';
import useSocialMediaConnections from '../../hooks/use-social-media-connections';
import { store as socialStore } from '../../social-store';
import { Connection } from '../../social-store/types';

export const useConnectionState = () => {
	const { connections, enabledConnections } = useSocialMediaConnections();
	const { isPublicizeEnabled, isPublicizeDisabledBySitePlan } = usePublicizeConfig();
	const { isEnabled: isSocialImageGeneratorEnabledForPost } = useImageGeneratorConfig();
	const { showShareLimits, numberOfSharesRemaining } = useSelect( select => {
		return {
			showShareLimits: select( socialStore ).showShareLimits(),
			numberOfSharesRemaining: select( socialStore ).numberOfSharesRemaining(),
		};
	}, [] );
	const { attachedMedia, shouldUploadAttachedMedia } = useAttachedMedia();
	const featuredImageId = useFeaturedImage();
	const mediaId = attachedMedia[ 0 ]?.id || featuredImageId;

	const { validationErrors, isConvertible } = useMediaRestrictions(
		connections,
		useMediaDetails( mediaId )[ 0 ],
		{
			isSocialImageGeneratorEnabledForPost,
			shouldUploadAttachedMedia,
		}
	);

	const isAutoConversionEnabled = useSelect(
		select => select( socialStore ).isAutoConversionEnabled(),
		[]
	);
	const shouldAutoConvert = isAutoConversionEnabled && isConvertible;

	const outOfConnections = showShareLimits && numberOfSharesRemaining <= enabledConnections.length;

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
			const { id, is_healthy, connection_id } = connection;
			const currentId = connection_id ? connection_id : id;

			// 1. Be healthy
			const isHealthy = false !== is_healthy;

			// 2. Have no validation errors
			const hasValidationErrors =
				validationErrors[ currentId ] !== undefined && ! shouldAutoConvert;

			// 3. Not have a NO_MEDIA_ERROR when media is required
			const hasNoMediaError = validationErrors[ currentId ] === NO_MEDIA_ERROR;

			return isHealthy && ! hasValidationErrors && ! hasNoMediaError;
		},
		[ shouldAutoConvert, validationErrors ]
	);

	/**
	 * Returns whether a connection should be disabled.
	 * Disabled here means the disabled prop of the ToggleControl
	 *
	 * A connection can be disabled if:
	 * - Publicize is disabled
	 * - There are no more connections available
	 * - The connection is not in good shape
	 */
	const shouldBeDisabled = useCallback(
		( connection: Connection ) => {
			const { enabled, toggleable } = connection;

			const isOutOfConnections = ! enabled && toggleable && outOfConnections;
			// A connection toggle should be disabled if
			return (
				// Publicize is disabled
				! isPublicizeEnabled ||
				// or if there are no more connections available
				isOutOfConnections ||
				// or the connection is not in good shape
				! isInGoodShape( connection )
			);
		},
		[ isInGoodShape, isPublicizeEnabled, outOfConnections ]
	);

	/**
	 * Returns whether a connection can be enabled.
	 * Enabled here means the checked state of the ToggleControl
	 *
	 * A connection can be enabled if:
	 * - Publicize is not disabled due to the current site plan
	 * - The connection is in good shape
	 */
	const canBeTurnedOn = useCallback(
		( connection: Connection ) => {
			// A connection toggle can be turned ON if
			return (
				// Publicize is not disabled due to the current site plan
				! isPublicizeDisabledBySitePlan &&
				// and the connection is in good shape
				isInGoodShape( connection )
			);
		},
		[ isInGoodShape, isPublicizeDisabledBySitePlan ]
	);

	return useMemo(
		() => ( {
			shouldBeDisabled,
			canBeTurnedOn,
		} ),
		[ shouldBeDisabled, canBeTurnedOn ]
	);
};
