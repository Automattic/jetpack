import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { registerPlugin } from '@wordpress/plugins';
// Direct import: the hooks barrel drags the router and private-apis bundles in.
import useCanvasMode from '../../../common/hooks/use-canvas-mode';
import { clickCta, dismissNotice, trackOncePerSession } from './notice.ts';
import type { Cta, TrackProps } from './notice.ts';
import type { MouseEvent } from 'react';

const NOTICE_ID = 'wpcom-expiry-notices/editor-notice';

interface EditorNoticeData {
	metaKey: string;
	content: string;
	// Null when the viewer cannot renew.
	primary: Cta | null;
	secondary: Cta | null;
	isDismissible: boolean;
	surface: string;
	trackProps: TrackProps;
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
	// gets nothing yet, so the notice waits rather than counting an impression.
	const isVisible = data.surface !== 'site_editor' || canvasMode === 'edit';

	useEffect( () => {
		if ( ! isVisible ) {
			return;
		}

		let mounted = true;
		const { metaKey, primary, secondary, trackProps } = data;

		const action = ( ctaId: string, cta: Cta ) => ( {
			label: cta.label,
			url: cta.url,
			variant: ctaId === 'primary' ? 'primary' : undefined,
			onClick: ( event: MouseEvent ) =>
				clickCta( event, cta.message, ctaId, 'jetpack_expiry_banner_cta_click', trackProps ),
		} );

		// The banner's own key, so dismissing here dismisses the wp-admin banner too.
		const show = () =>
			createNotice( 'error', data.content, {
				id: NOTICE_ID,
				isDismissible: data.isDismissible,
				actions: [
					...( primary ? [ action( 'primary', primary ) ] : [] ),
					...( secondary ? [ action( 'secondary', secondary ) ] : [] ),
				],
				onDismiss: () =>
					dismissNotice( metaKey, 'jetpack_expiry_banner_dismiss', trackProps, () => {
						if ( mounted ) {
							show();
						}
					} ),
			} );

		show();
		trackOncePerSession(
			`${ metaKey }_editor_impression_fired`,
			'jetpack_expiry_banner_impression',
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
