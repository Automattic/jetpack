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
import { getVideoPressUrl } from '../../../../../lib/url';
/**
 * Types
 */
import type { VideoControlProps } from '../../types';
import type { ReactElement } from 'react';

/**
 * Chapters control react component: opens the shared chapter manager modal
 * from the block toolbar.
 *
 * @param {VideoControlProps} props - Component props.
 * @return {ReactElement}      ChaptersControl block control.
 */
export default function ChaptersControl( {
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
