/**
 * External dependencies
 */
import {
	ButtonLink,
	Stack,
	Text,
	getVideoPosterUrl,
} from '@automattic/jetpack-premium-analytics-sdk';
import { currentUserCan, getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Icon, video as videoIcon } from '@wordpress/icons';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { VIDEOPRESS_ADMIN_PAGE } from '../../../../src/dashboard/utils/constants';
import { useUploadedVideo } from './use-uploaded-video';
import './uploaded-video.scss';
import type { VideoMediaProps } from '../../../../src/client/lib/resumable-file-uploader/types';

export type UploadedVideoProps = {
	/**
	 * The uploaded file, for a title until the record answers.
	 */
	file: File;

	/**
	 * The media the upload created.
	 */
	media: VideoMediaProps;
};

/**
 * The video the upload created, followed while it transcodes.
 *
 * @param {UploadedVideoProps} props - Component props.
 * @return The video block.
 */
export function UploadedVideo( { file, media }: UploadedVideoProps ) {
	const video = useUploadedVideo( media.id );
	const title = video?.title || file.name.replace( /\.[^.]+$/, '' );
	const poster = getVideoPosterUrl( video?.thumbnailUrl, 320, 180 );
	const detailsUrl = addQueryArgs( getAdminUrl( VIDEOPRESS_ADMIN_PAGE ), {
		p: `/video/${ media.id }`,
	} );

	let message: string;
	if ( video?.conversionFailed ) {
		message = __(
			'Your video was uploaded, but it couldn’t be processed.',
			'jetpack-videopress-pkg'
		);
	} else if ( ! video || video.isProcessing ) {
		message = __(
			'Your video is uploaded and being processed. Plays will show up here once people watch it.',
			'jetpack-videopress-pkg'
		);
	} else {
		message = __(
			'Your video is ready. Plays will show up here once people watch it.',
			'jetpack-videopress-pkg'
		);
	}

	return (
		<Stack
			direction="column"
			align="center"
			gap="sm"
			className="vp-top-videos-uploaded-video"
			role="status"
		>
			{ poster ? (
				<img className="vp-top-videos-uploaded-video__poster" src={ poster } alt="" />
			) : (
				<Icon icon={ videoIcon } size={ 40 } className="vp-top-videos-uploaded-video__icon" />
			) }

			<Text variant="body-md" className="vp-top-videos-uploaded-video__name">
				{ title }
			</Text>

			<Text variant="body-md" className="vp-top-videos-uploaded-video__message">
				{ message }
			</Text>

			{ currentUserCan( 'manage_options' ) && (
				<ButtonLink variant="solid" href={ detailsUrl }>
					{ __( 'View video', 'jetpack-videopress-pkg' ) }
				</ButtonLink>
			) }
		</Stack>
	);
}
