import {
	BlueskyPostPreview,
	FacebookLinkPreview,
	FacebookPostPreview,
	InstagramPostPreview,
	LinkedInPostPreview,
	MastodonPostPreview,
	NextdoorPostPreview,
	ThreadsPostPreview,
	TumblrPostPreview,
} from '@automattic/social-previews';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { InstagramNoMediaNotice } from '../../form/instagram-no-media-notice';
import type { ConnectionPreviewData } from '../../../hooks/use-connection-preview-data';
import type { Connection } from '../../../social-store/types';

export type PostPreviewProps = {
	connection: Connection;
	previewData: ConnectionPreviewData;
};

/**
 * Combines title and excerpt, removing internal line breaks from the excerpt.
 * Social networks display title on a separate line, then the excerpt without internal line breaks.
 *
 * @param {string} title   - The title text.
 * @param {string} excerpt - The excerpt text.
 *
 * @return {string} - Combined text with title and excerpt separated by double newline.
 */
function getCombinedText( title: string, excerpt: string ): string {
	const excerptWithoutLineBreaks = excerpt.replace( /\n+/g, ' ' );
	return `${ title }\n\n${ excerptWithoutLineBreaks }`;
}

/**
 * Post preview component.
 *
 * @param {PostPreviewProps} props - PostPreview component props.
 *
 * @return - Post preview component.
 */
export function PostPreview( { connection, previewData }: PostPreviewProps ) {
	const user = useMemo(
		() => ( {
			displayName: connection.display_name,
			profileImage: connection.profile_picture,
			externalName: connection.external_handle,
		} ),
		[ connection ]
	);

	const { image, imageFocalPoint, media, title, description, url, excerpt, message, hyperlinks } =
		previewData;

	const commonProps = useMemo(
		() => ( {
			description,
			image,
			imageFocalPoint,
			media,
			title,
			url,
			hyperlinks,
		} ),
		[ hyperlinks, description, image, imageFocalPoint, media, title, url ]
	);

	const siteName = useSelect( select => {
		const { getUnstableBase } = select( coreStore );

		return decodeEntities( getUnstableBase( undefined )?.name );
	}, [] );

	const hasMedia = media?.some(
		( { type } ) => type.startsWith( 'image/' ) || type.startsWith( 'video/' )
	);

	switch ( connection.service_name ) {
		case 'bluesky': {
			const firstMediaItem = media?.[ 0 ];

			const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

			return (
				<BlueskyPostPreview
					{ ...commonProps }
					description={ decodeEntities( excerpt ) }
					user={ {
						avatarUrl: user.profileImage,
						address: user.externalName,
						displayName: user.displayName,
					} }
					customText={ decodeEntities(
						message || `${ title }\n\n${ excerpt.replaceAll( /[\s\n]/g, ' ' ) }`
					) }
					customImage={ customImage }
				/>
			);
		}

		case 'facebook': {
			let customText = title;

			if ( message ) {
				customText = message;
			} else if ( title && excerpt ) {
				customText = getCombinedText( title, excerpt );
			}

			return hasMedia ? (
				<FacebookPostPreview
					{ ...commonProps }
					type="article"
					customText={ customText }
					user={ {
						...user,
						avatarUrl: user.profileImage,
					} }
				/>
			) : (
				<FacebookLinkPreview
					{ ...commonProps }
					type="article"
					customText={ customText }
					user={ {
						...user,
						avatarUrl: user.profileImage,
					} }
				/>
			);
		}

		case 'instagram-business': {
			const hasImage = Boolean( image );

			let instagramCaption = title;

			if ( message ) {
				instagramCaption = message;
			} else if ( title && excerpt ) {
				instagramCaption = getCombinedText( title, excerpt );
			}

			return ! hasMedia && ! hasImage ? (
				<InstagramNoMediaNotice />
			) : (
				<InstagramPostPreview
					{ ...commonProps }
					image={ media?.[ 0 ]?.url || image }
					name={ user.displayName }
					profileImage={ user.profileImage }
					caption={ instagramCaption }
				/>
			);
		}

		case 'linkedin': {
			let linkedinDescription = title;

			if ( message ) {
				linkedinDescription = message;
			} else if ( title && excerpt ) {
				linkedinDescription = getCombinedText( title, excerpt );
			}

			return (
				<LinkedInPostPreview
					{ ...commonProps }
					jobTitle={ __( 'Job Title (Company Name)', 'jetpack-publicize-pkg' ) }
					name={ user.displayName }
					profileImage={ user.profileImage }
					description={ linkedinDescription }
				/>
			);
		}

		case 'mastodon': {
			const firstMediaItem = media?.[ 0 ];

			const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

			let mastodonText = message;

			if ( ! message && title && excerpt ) {
				mastodonText = getCombinedText( title, excerpt );
			}

			return (
				<MastodonPostPreview
					{ ...commonProps }
					description={ excerpt }
					siteName={ siteName }
					user={ {
						avatarUrl: user.profileImage,
						address: user.displayName,
						displayName: user.displayName,
					} }
					customText={ mastodonText }
					customImage={ customImage }
				/>
			);
		}

		case 'nextdoor': {
			let nextdoorDescription = title;

			if ( message ) {
				nextdoorDescription = message;
			} else if ( title && excerpt ) {
				nextdoorDescription = getCombinedText( title, excerpt );
			}

			return (
				<NextdoorPostPreview
					{ ...commonProps }
					description={ nextdoorDescription }
					name={ user.displayName }
					profileImage={ user.profileImage }
				/>
			);
		}

		case 'threads': {
			let caption = title;

			if ( message ) {
				caption = message;
			} else if ( title && excerpt ) {
				caption = getCombinedText( title, excerpt );
			}

			return (
				<ThreadsPostPreview
					{ ...commonProps }
					caption={ caption }
					name={ user.displayName }
					profileImage={ user.profileImage }
				/>
			);
		}

		case 'tumblr': {
			const desc = message || description;

			return (
				<TumblrPostPreview
					{ ...commonProps }
					title={ message ? '' : title }
					description={ desc }
					user={ { displayName: user.displayName, avatarUrl: user.profileImage } }
				/>
			);
		}

		default:
			return <div>{ __( 'Preview not available.', 'jetpack-publicize-pkg' ) }</div>;
	}
}
