import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { registerPlugin } from '@wordpress/plugins';
// Direct import: the hooks barrel drags the router and private-apis bundles in.
import useCanvasMode from '../../../common/hooks/use-canvas-mode';
import { wpcomTrackEvent } from '../../../common/tracks';
import { recordDismissal } from './dismiss.ts';
import { noticeActions } from './editor-notice-content.ts';
import { openHelpCenterWithMessage } from './help-center.ts';
import { trackOncePerSession } from './track-once.ts';
import type { Cta } from './types.ts';
import type { MouseEvent } from 'react';

const NOTICE_ID = 'wpcom-expiry-notices/editor-notice';

interface EditorNoticeData {
	metaKey: string;
	content: string;
	primary: Cta;
	secondary: Cta | null;
	isDismissible: boolean;
	context: string;
	trackProps: Record< string, string | number >;
}

declare global {
	interface Window {
		wpcomExpiryEditorNotice?: EditorNoticeData;
	}
}

const ExpiryEditorNotice = ( { data }: { data: EditorNoticeData } ) => {
	const { createNotice, removeNotice } = useDispatch( noticesStore );
	const canvasMode = useCanvasMode();

	// The site editor renders store notices in its edit canvas only; browse mode
	// gets nothing yet, so the notice waits rather than counting an impression
	// nobody could see.
	const isVisible = data.context !== 'site-editor' || canvasMode === 'edit';

	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}

		let mounted = true;
		const trackProps = { ...data.trackProps, context: data.context };

		const onCtaClick = ( cta: string, target: Cta, event: MouseEvent ) => {
			// The support CTA opens the Help Center over the editor; its href is
			// only the fallback for a Help Center that never loaded.
			const openedHere = target.message ? openHelpCenterWithMessage( target.message ) : false;
			if ( openedHere ) {
				event.preventDefault();
			}
			wpcomTrackEvent( 'jetpack_expiry_editor_notice_cta_click', {
				...trackProps,
				cta: target.message ? 'support' : cta,
			} );
		};

		// Closing the notice writes the banner's own key, so dismissing here
		// dismisses the wp-admin banner too, and vice versa.
		const onDismiss = async () => {
			try {
				await recordDismissal( data.metaKey );
				wpcomTrackEvent( 'jetpack_expiry_editor_notice_dismiss', trackProps );
			} catch ( err ) {
				// Put it back, so a failed write reads as something going wrong
				// rather than as a notice that returns on the next load.
				if ( mounted ) {
					show();
				}
				wpcomTrackEvent( 'jetpack_expiry_editor_notice_dismiss_failed', {
					...trackProps,
					error_message: err instanceof Error ? err.message : String( err ),
				} );
				// eslint-disable-next-line no-console
				console.error( 'Failed to record expiry editor notice dismiss', err );
			}
		};

		const show = () =>
			createNotice( 'error', data.content, {
				id: NOTICE_ID,
				isDismissible: data.isDismissible,
				actions: noticeActions( data, onCtaClick ),
				onDismiss,
			} );

		show();
		trackOncePerSession(
			`${ data.metaKey }_editor_impression_fired`,
			'jetpack_expiry_editor_notice_impression',
			trackProps
		);

		return () => {
			mounted = false;
			removeNotice( NOTICE_ID );
		};
	}, [ createNotice, data, isVisible, removeNotice ] );

	return null;
};

const data = window.wpcomExpiryEditorNotice;
if ( data ) {
	registerPlugin( 'wpcom-expiry-editor-notice', {
		render: () => <ExpiryEditorNotice data={ data } />,
	} );
}
