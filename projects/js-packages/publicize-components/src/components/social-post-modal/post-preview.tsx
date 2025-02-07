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
import useSocialMediaMessage from '../../hooks/use-social-media-message';
import { Connection } from '../../social-store/types';
import { InstagramNoMediaNotice } from '../form/instagram-no-media-notice';
import { usePostData } from '../social-previews/use-post-data';

export type PostPreviewProps = {
	connection: Connection;
};

/**
 * Post preview component.
 *
 * @param {PostPreviewProps} props - PostPreview component props.
 *
 * @return {import('react').ReactNode} - Post preview component.
 */
export function PostPreview( { connection }: PostPreviewProps ) {
	const user = useMemo(
		() => ( {
			displayName: connection.display_name,
			profileImage: connection.profile_picture,
			externalName: connection.external_handle,
		} ),
		[ connection ]
	);

	const { image, media, title, description, url, excerpt } = usePostData();
	const message = ( useSocialMediaMessage().message || '' ).trim();

	const commonProps = useMemo(
		() => ( {
			description,
			image,
			media,
			title,
			url,
		} ),
		[ description, image, media, title, url ]
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

		case 'facebook':
			return hasMedia ? (
				<FacebookPostPreview
					{ ...commonProps }
					type="article"
					customText={ message || excerpt || title }
					user={ {
						...user,
						avatarUrl: user.profileImage,
					} }
				/>
			) : (
				<FacebookLinkPreview
					{ ...commonProps }
					type="article"
					customText={ message || excerpt || title }
					user={ {
						...user,
						avatarUrl: user.profileImage,
					} }
				/>
			);

		case 'instagram-business': {
			const hasImage = Boolean( image );

			return ! hasMedia && ! hasImage ? (
				<InstagramNoMediaNotice />
			) : (
				<InstagramPostPreview
					{ ...commonProps }
					image={ media?.[ 0 ]?.url || image }
					name={ user.displayName }
					profileImage={ user.profileImage }
					caption={ message || title || description }
				/>
			);
		}

		case 'linkedin':
			return (
				<LinkedInPostPreview
					{ ...commonProps }
					jobTitle={ __( 'Job Title (Company Name)', 'jetpack-publicize-components' ) }
					name={ user.displayName }
					profileImage={ user.profileImage }
					description={ message || title || description }
				/>
			);

		case 'mastodon': {
			const firstMediaItem = media?.[ 0 ];

			const customImage = firstMediaItem?.type.startsWith( 'image/' ) ? firstMediaItem.url : null;

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
					customText={ message }
					customImage={ customImage }
				/>
			);
		}

		case 'nextdoor': {
			// Add the URL to the description if there is media
			const desc = `${ message || title || description } ${ media.length ? url : '' }`.trim();

			return (
				<NextdoorPostPreview
					{ ...commonProps }
					description={ desc }
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
				caption = `${ title }\n\n${ excerpt }`;
			}

			const captionLength =
				// 500 characters
				500 -
				// Number of characters in the article URL
				url.length -
				// 2 characters for line break
				2;

			caption = decodeEntities( caption ).slice( 0, captionLength );

			caption += `\n\n${ url }`;

			return (
				<ThreadsPostPreview
					{ ...commonProps }
					caption={ caption }
					name={ user.displayName }
					profileImage={ user.profileImage }
				/>
			);
		}

		case 'tumblr':
			return (
				<TumblrPostPreview
					{ ...commonProps }
					user={ { displayName: user.displayName, avatarUrl: user.profileImage } }
					customText={ message }
				/>
			);

		default:
			return null;
	}
}
