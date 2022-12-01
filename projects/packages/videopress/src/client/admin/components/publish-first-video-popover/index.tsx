/**
 * External dependencies
 */
import { ActionPopover, Text } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { STORE_ID } from '../../../state';
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
	const { firstUploadedVideoId, dismissedFirstVideoPopover } = useVideos();
	const showAddToPostPopover =
		Number( firstUploadedVideoId ) === Number( id ) && ! dismissedFirstVideoPopover;

	const closePopover = () => dispatch.dismissFirstVideoPopover();

	return (
		showAddToPostPopover && (
			<ActionPopover
				title={ __( 'Publish your new video', 'jetpack-videopress-pkg' ) }
				buttonContent={ __( 'Add video to post', 'jetpack-videopress-pkg' ) }
				buttonHref={ 'post-new.php' }
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
