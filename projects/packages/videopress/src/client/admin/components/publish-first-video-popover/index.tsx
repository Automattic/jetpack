/**
 * External dependencies
 */
import { ActionPopover, Text } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
import useVideo from '../../hooks/use-video';
import useVideos from '../../hooks/use-videos';
import styles from './styles.module.scss';
/**
 * Types
 */
import { PublishFirstVideoPopoverProps } from './types';
import type React from 'react';

/**
 * Publish First Video Popover component
 *
 * @param {PublishFirstVideoPopoverProps} props - Component props.
 * @returns {React.ReactNode} - PublishFirstVideoPopover react component.
 */
const PublishFirstVideoPopover = ( {
	id,
	position = null,
	anchor = null,
}: PublishFirstVideoPopoverProps ) => {
	const dispatch = useDispatch( STORE_ID );
	const { data } = useVideo( Number( id ) );
	const { firstUploadedVideoId, firstVideoProcessed, dismissedFirstVideoPopover } = useVideos();
	const showAddToPostPopover =
		Number( firstUploadedVideoId ) === Number( id ) &&
		firstVideoProcessed &&
		! dismissedFirstVideoPopover;

	const closePopover = () => dispatch.dismissFirstVideoPopover();

	const nonce = window.jetpackVideoPressInitialState?.contentNonce ?? '';
	const newPostURL = addQueryArgs( 'post-new.php', {
		videopress_guid: data.guid,
		_wpnonce: nonce,
	} );

	return (
		showAddToPostPopover && (
			<ActionPopover
				title={ __( 'Publish your new video', 'jetpack-videopress-pkg' ) }
				buttonContent={ __( 'Add video to post', 'jetpack-videopress-pkg' ) }
				buttonHref={ newPostURL }
				buttonExternalLink
				anchor={ anchor }
				onClose={ closePopover }
				onClick={ closePopover }
				noArrow={ false }
				className={ styles[ 'action-popover' ] }
				position={ position }
			>
				<Text>
					{ __(
						"Now that your video has been uploaded to VideoPress, it's time to show it to the world.",
						'jetpack-videopress-pkg'
					) }
				</Text>
			</ActionPopover>
		)
	);
};

export default PublishFirstVideoPopover;
