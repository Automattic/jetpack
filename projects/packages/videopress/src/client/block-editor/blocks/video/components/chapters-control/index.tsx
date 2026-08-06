/**
 * External dependencies
 */
import { ToolbarButton } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { formatListNumbered } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ChapterManagerModal from '../../../../../components/chapter-manager-modal/lazy';
import { isChaptersEditorEnabled } from '../../../../../lib/chapters-editor';
import { getVideoPressUrl } from '../../../../../lib/url';
/**
 * Types
 */
import type { VideoControlProps } from '../../types';
import type { ReactElement } from 'react';

/**
 * The toolbar button and its modal, once the chapters editor is known to be
 * enabled. Split from the exported gate below so none of these hooks run —
 * and the lazy modal chunk is never requested — for gated-off users.
 *
 * @param {VideoControlProps} props - Component props.
 * @return {ReactElement}      The chapters block control.
 */
function ChaptersControlEnabled( {
	attributes,
	setAttributes,
}: VideoControlProps ): ReactElement | null {
	const { guid, id, description, isPrivate, title } = attributes;
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const invalidateResolution = useDispatch( coreStore ).invalidateResolution;
	/*
	 * The modal needs the guid (item fetch, track sync, preview) AND the
	 * attachment id (the description meta POST).
	 */
	const isAvailable = !! guid && !! id;

	const onSaved = useCallback(
		( nextDescription: string ) => {
			if ( ! guid ) {
				return;
			}

			const videoPressUrl = getVideoPressUrl( guid, attributes );

			/*
			 * Only the (serializable) description enters the block attributes —
			 * the chapters VTT itself lives server-side. Refreshing the embed
			 * preview picks up the regenerated track.
			 */
			setAttributes( { description: nextDescription } );
			invalidateResolution( 'getEmbedPreview', [ videoPressUrl ] );
		},
		[ attributes, guid, invalidateResolution, setAttributes ]
	);

	return (
		<>
			<ToolbarButton
				icon={ formatListNumbered }
				label={ __( 'Manage chapters', 'jetpack-videopress-pkg' ) }
				onClick={ () => setIsModalOpen( true ) }
				disabled={ ! isAvailable }
			/>
			{ isAvailable && isModalOpen && (
				<ChapterManagerModal
					isOpen
					guid={ guid }
					attachmentId={ id }
					description={ description ?? '' }
					title={ title }
					isPrivate={ isPrivate }
					onClose={ () => setIsModalOpen( false ) }
					onSaved={ onSaved }
				/>
			) }
		</>
	);
}

/**
 * Chapters control react component: opens the shared chapter manager modal
 * from the block toolbar.
 *
 * Gated on `Admin_UI::is_chapters_editor_enabled()` (mirrored to the block
 * editor through `videoPressEditorState`), which defaults to off — the whole
 * control, modal included, is absent until a site opts in.
 *
 * @param {VideoControlProps} props - Component props.
 * @return {ReactElement}      ChaptersControl block control, or null when the chapters editor is disabled.
 */
export default function ChaptersControl( props: VideoControlProps ): ReactElement | null {
	if ( ! isChaptersEditorEnabled() ) {
		return null;
	}

	return <ChaptersControlEnabled { ...props } />;
}
