/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
// TODO: Re-enable when @wordpress/image-cropper is available
// import { ImageCropperProvider } from '@wordpress/image-cropper';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import MediaEditorNotices from '../notices/';
import MediaEditorHeader from '../header/';
import MediaEditorSidebar from '../sidebar/';
import MediaEditorCanvas from '../editor-canvas/';
import { EditingToolsToolbar } from '../media-renderer/image/editing-tools';
import { useMediaEditorState } from '../provider/with-media-editor-state-provider';
import { FloatingChat } from '../agenttic-chat';
import { getUnlock } from '../../utils/unlock';
import './style.scss';

const unlock = getUnlock();
const unlockedAPIs = unlock ? unlock( editorPrivateApis ) : null;
const InterfaceSkeleton = unlockedAPIs?.InterfaceSkeleton;
const ComplementaryArea = unlockedAPIs?.ComplementaryArea;

export default function MediaEditorLayout() {
	const isMobileViewport = useViewportMatch( 'medium', '<' );
	const { isImageEditorOpen } = useMediaEditorState();
	const isMobileImageEditorOpen = isMobileViewport && isImageEditorOpen;

	// Fallback layout when InterfaceSkeleton is not available
	if ( ! InterfaceSkeleton || ! ComplementaryArea ) {
		return (
			<div className="next-admin-site-editor next-admin-site-editor__media-editor-layout">
				<div className="interface-interface-skeleton">
					<MediaEditorHeader />
					<div className="interface-interface-skeleton__body">
						<div className="interface-interface-skeleton__content">
							{ isMobileImageEditorOpen && <EditingToolsToolbar /> }
							<MediaEditorCanvas />
						</div>
						<div className="interface-interface-skeleton__sidebar">
							<MediaEditorSidebar />
						</div>
					</div>
				</div>
				<MediaEditorNotices />
				<FloatingChat />
			</div>
		);
	}

	return (
		// TODO: Re-enable ImageCropperProvider when @wordpress/image-cropper is available
		// <ImageCropperProvider>
		<div className="next-admin-site-editor next-admin-site-editor__media-editor-layout">
			<InterfaceSkeleton
				header={ <MediaEditorHeader /> }
				sidebar={ <ComplementaryArea.Slot scope="core/edit-media" /> }
				content={
					<>
						{ isMobileImageEditorOpen && <EditingToolsToolbar /> }
						<MediaEditorCanvas />
					</>
				}
				secondarySidebar={ null }
			/>
			<MediaEditorNotices />
			<MediaEditorSidebar />
			<FloatingChat />
		</div>
		// </ImageCropperProvider>
	);
}
