import { subscribe, useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { sprintf, __ } from '@wordpress/i18n';

const SiteEditorSnackbars = () => {
	const [ canvasMode, setCanvasMode ] = useState();

	const { createInfoNotice, removeNotice } = useDispatch( 'core/notices' );

	const { entityTitle, entityType, isSiteEditor } = useSelect( select => {
		if ( ! select( 'core/edit-site' ) ) {
			return { isSiteEditor: false };
		}

		const { getEditedPostType, getEditedPostId } = select( 'core/edit-site' );
		const { getEntityRecord, getPostType } = select( 'core' );

		const entityRecord = getEntityRecord( 'postType', getEditedPostType(), getEditedPostId() );
		const postType = getPostType( getEditedPostType() );

		return {
			isSiteEditor: true,
			entityTitle: entityRecord?.title?.raw ?? '',
			entityType: postType?.labels?.singular_name ?? '',
		};
	} );

	// Since Gutenberg doesn't provide a stable selector to get the current canvas mode,
	// we need to infer it from the URL.
	useEffect( () => {
		if ( ! isSiteEditor ) {
			return;
		}

		const unsubscribe = subscribe( () => {
			// Gutenberg adds a `canvas` query param after changing the canvas mode, but
			// the subscriber callback runs before the URL actually changes, so we need
			// to delay its execution.
			setTimeout( () => {
				const params = new URLSearchParams( window.location.search );

				if ( ! params.has( 'canvas' ) ) {
					return unsubscribe();
				}

				setCanvasMode( params.get( 'canvas' ) );
			}, 0 );
		}, 'core/edit-site' );

		return () => unsubscribe();
	}, [ isSiteEditor ] );

	// Show a snackbar indicating what's being edited.
	useEffect( () => {
		const noticeId = 'jetpack/site-editor/snackbars';
		removeNotice( noticeId );

		if ( ! isSiteEditor || canvasMode !== 'edit' || ! entityTitle || ! entityType ) {
			return;
		}

		const message = sprintf(
			/* translators: %1$s and %2$s are the title and type, respectively, of the entity being edited (e.g. "Editing the Index template", or "Editing the Header template part").*/
			__( 'Editing the %1$s %2$s', 'jetpack' ),
			entityTitle,
			entityType.toLowerCase()
		);
		createInfoNotice( message, { id: noticeId, type: 'snackbar' } );
	}, [ isSiteEditor, canvasMode, createInfoNotice, removeNotice, entityTitle, entityType ] );

	return null;
};

export const name = 'site-editor-snackbars';

export const settings = { render: SiteEditorSnackbars };
