import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useMediaDetails from '../../../hooks/use-media-details';
import { computeAttachedMediaForSource } from '../../../hooks/use-per-network-customization/utils';
import { usePostMeta } from '../../../hooks/use-post-meta';
import { store as socialStore } from '../../../social-store';
import { Connection } from '../../../social-store/types';
import { features } from '../../../utils/constants';
import { SharePostForm, SharePostFormProps } from '../../form/share-post-form';

type PerNetworkCustomizationFormProps = {
	connection: Connection;
};

const CONNECTION_TEMPLATE_HELP = __(
	'Connection template will be used if empty.',
	'jetpack-publicize-pkg'
);
const GLOBAL_TEMPLATE_HELP = __(
	'Global template will be used if empty.',
	'jetpack-publicize-pkg'
);
const DEFAULT_NETWORK_TEMPLATE_HELP = __(
	'The default network template will be used if empty.',
	'jetpack-publicize-pkg'
);

/**
 * Per-Network Customization Form component.
 *
 * @param {PerNetworkCustomizationFormProps} props - The component props.
 * @return - Per-Network Customization Form component.
 */
export function PerNetworkCustomizationForm( { connection }: PerNetworkCustomizationFormProps ) {
	const { customizeConnectionById } = useDispatch( socialStore );
	const templatesEnabled = siteHasFeature( features.MESSAGE_TEMPLATES );
	const {
		attachedMedia: globalAttachedMedia,
		shareMessage: globalMessage,
		mediaSource: globalMediaSource,
	} = usePostMeta();
	const globalMessageTemplate = useSelect(
		select => select( socialStore ).getSocialSettings().messageTemplate,
		[]
	);

	// Get featured image details for forced attachment
	const featuredImageId = useFeaturedImage();
	const [ featuredImageDetails ] = useMediaDetails( featuredImageId );
	const featuredImageUrl = featuredImageDetails?.mediaData?.sourceUrl;
	const featuredImageMime = featuredImageDetails?.metaData?.mime ?? 'image/jpeg';

	const hasConnectionMessage = connection.message !== undefined && connection.message !== '';
	const hasConnectionTemplate = Boolean( connection.template );
	const hasGlobalMessageTemplate = Boolean( globalMessageTemplate );

	let message = connection.message ?? globalMessage ?? '';
	let fallbackHelp: string | undefined;

	if ( templatesEnabled ) {
		message = hasConnectionMessage
			? connection.message ?? ''
			: connection.template ?? globalMessage ?? '';

		if ( hasConnectionTemplate ) {
			fallbackHelp = CONNECTION_TEMPLATE_HELP;
		} else if ( hasGlobalMessageTemplate ) {
			fallbackHelp = GLOBAL_TEMPLATE_HELP;
		} else {
			fallbackHelp = DEFAULT_NETWORK_TEMPLATE_HELP;
		}
	}

	// Don't default to 'none' - let undefined trigger featured image fallback detection
	const mediaSource = connection.media_source ?? globalMediaSource;

	// Compute attached media with forced attachment logic
	// Per-network mode forces attachment, so we need to populate attached_media appropriately
	const attachedMedia = useMemo( () => {
		// If connection has explicit attached_media, use it
		if ( connection.attached_media && connection.attached_media.length > 0 ) {
			return connection.attached_media;
		}

		// Otherwise, compute based on effective media source (like syncConnections does)
		return (
			computeAttachedMediaForSource( {
				mediaSource,
				globalAttachedMedia,
				featuredImageId,
				featuredImageUrl,
				featuredImageMime,
			} ) ?? []
		);
	}, [
		connection.attached_media,
		mediaSource,
		featuredImageId,
		featuredImageUrl,
		featuredImageMime,
		globalAttachedMedia,
	] );

	// Handler for message changes
	const handleMessageChange = useCallback(
		( msg: string ) => {
			customizeConnectionById( connection.connection_id, { message: msg } );
		},
		[ connection.connection_id, customizeConnectionById ]
	);

	// Handler for media changes
	// Per-network mode forces attachment, so when media is cleared (Remove button),
	// we reset to featured image (if available) or nothing
	const handleMediaChange = useCallback< SharePostFormProps[ 'onMediaChange' ] >(
		updates => {
			let attachedMediaToStore = updates.attached_media;
			let mediaSourceToStore = updates.media_source;

			// When clearing media (Remove button), reset to featured image or nothing
			// Don't use SIG as fallback - SIG is an explicit selection, not a default
			const isClearing =
				( ! updates.attached_media || updates.attached_media.length === 0 ) &&
				updates.media_source === undefined;

			if ( isClearing ) {
				// Reset to featured image if available, otherwise no media
				if ( featuredImageId && featuredImageUrl ) {
					attachedMediaToStore = [
						{ id: featuredImageId, url: featuredImageUrl, type: featuredImageMime },
					];
					mediaSourceToStore = 'featured-image';
				} else {
					// No featured image - explicitly set 'none' to prevent fallback to global
					attachedMediaToStore = undefined;
					mediaSourceToStore = 'none';
				}
			}

			customizeConnectionById( connection.connection_id, {
				attached_media: attachedMediaToStore,
				media_source: mediaSourceToStore,
			} );
		},
		[
			connection.connection_id,
			customizeConnectionById,
			featuredImageId,
			featuredImageUrl,
			featuredImageMime,
		]
	);

	return (
		<SharePostForm
			analyticsData={ { location: 'preview-modal' } }
			isInsideNavigatorModal
			disabled={ ! connection.enabled }
			message={ message }
			messageHelp={ fallbackHelp }
			onMessageChange={ handleMessageChange }
			attachedMedia={ attachedMedia }
			onMediaChange={ handleMediaChange }
			mediaSource={ mediaSource }
			forceMediaAsAttachment
		/>
	);
}
