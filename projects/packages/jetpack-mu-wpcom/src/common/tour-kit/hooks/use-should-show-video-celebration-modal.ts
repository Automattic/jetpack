import { useState, useEffect } from '@wordpress/element';
import request from 'wpcom-proxy-request';
import { useHasSeenVideoCelebrationModal } from '../contexts/has-seen-video-celebration-modal-context';
import useSiteIntent from './use-site-intent';

interface Site {
	options?: {
		launchpad_checklist_tasks_statuses?: {
			video_uploaded: boolean;
		};
	};
}
const useShouldShowVideoCelebrationModal = ( isEditorSaving: boolean ) => {
	const { siteIntent: intent } = useSiteIntent();

	const [ shouldShowVideoCelebrationModal, setShouldShowVideoCelebrationModal ] = useState( false );
	const { hasSeenVideoCelebrationModal } = useHasSeenVideoCelebrationModal();

	useEffect( () => {
		const maybeRenderVideoCelebrationModal = async () => {
			// Get latest site options since the video may have just been uploaded.
			const siteObj = ( await request( {
				path: `/sites/${ window._currentSiteId }?http_envelope=1`,
				apiVersion: '1.1',
			} ) ) as Site;

			if ( siteObj?.options?.launchpad_checklist_tasks_statuses?.video_uploaded ) {
				setShouldShowVideoCelebrationModal( true );
			}
		};

		if ( 'videopress' === intent && ! hasSeenVideoCelebrationModal ) {
			maybeRenderVideoCelebrationModal();
		} else if ( hasSeenVideoCelebrationModal ) {
			setShouldShowVideoCelebrationModal( false );
		}
	}, [
		isEditorSaving, // included so that we check whether the video has been uploaded on save.
		intent,
		hasSeenVideoCelebrationModal,
	] );
	return shouldShowVideoCelebrationModal;
};
export default useShouldShowVideoCelebrationModal;
