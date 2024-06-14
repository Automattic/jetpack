/**
 * External dependencies
 */
import { Button, ThemeProvider, useBreakpointMatch } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { useState } from 'react';
import { ReactNode } from 'react';
/**
 * Internal dependencies
 */
import VideoFrameSelector from '../../../components/video-frame-selector';
import styles from './style.module.scss';
import { VideoThumbnailSelectorModalProps } from './types';

/**
 * Video Thumbnail Selector component
 *
 * @param {VideoThumbnailSelectorModalProps} props - Component props.
 * @returns {ReactNode} - VideoThumbnailSelector react component.
 */
const VideoThumbnailSelectorModal = ( {
	url,
	selectedTime,
	handleCloseSelectFrame,
	handleVideoFrameSelected,
	handleConfirmFrame,
}: VideoThumbnailSelectorModalProps ) => {
	const [ modalRef, setModalRef ] = useState< HTMLDivElement | null >( null );
	const [ isSm ] = useBreakpointMatch( 'sm' );

	return (
		<Modal
			title={ __( 'Select thumbnail from video', 'jetpack-videopress-pkg' ) }
			onRequestClose={ handleCloseSelectFrame }
			isDismissible={ false }
		>
			<ThemeProvider targetDom={ modalRef }>
				<div
					ref={ setModalRef }
					className={ clsx( styles.selector, {
						[ styles[ 'is-small' ] ]: isSm,
					} ) }
				>
					<VideoFrameSelector
						src={ url }
						onVideoFrameSelected={ handleVideoFrameSelected }
						initialCurrentTime={ selectedTime }
					/>
					<div className={ styles.actions }>
						<Button variant="secondary" onClick={ handleCloseSelectFrame }>
							{ __( 'Close', 'jetpack-videopress-pkg' ) }
						</Button>
						<Button variant="primary" onClick={ handleConfirmFrame }>
							{ __( 'Select this frame', 'jetpack-videopress-pkg' ) }
						</Button>
					</div>
				</div>
			</ThemeProvider>
		</Modal>
	);
};

export default VideoThumbnailSelectorModal;
