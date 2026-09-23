/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
/**
 * Types
 */
import type { AllPlaylistsAttributes } from './types';

export type PreviewStatus = 'loading' | 'ready' | 'error';

export type RenderedPreview = {
	status: PreviewStatus;
	// The server-rendered block markup; empty when the site has no playlists.
	html: string;
};

/**
 * Render the block on the server, through core's block renderer endpoint, so
 * the canvas shows the same placeholder markup as the front end.
 *
 * @param attributes - Block attributes to render with.
 * @return The rendered markup and its loading state.
 */
export default function useRenderedPreview( attributes: AllPlaylistsAttributes ): RenderedPreview {
	const { layout } = attributes;
	const [ preview, setPreview ] = useState< RenderedPreview >( { status: 'loading', html: '' } );

	useEffect( () => {
		let cancelled = false;
		setPreview( current => ( { ...current, status: 'loading' } ) );

		apiFetch< { rendered?: string } >( {
			path: addQueryArgs( '/wp/v2/block-renderer/videopress/all-playlists', {
				context: 'edit',
				attributes: { layout },
			} ),
		} )
			.then( response => {
				if ( ! cancelled ) {
					setPreview( { status: 'ready', html: response?.rendered ?? '' } );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setPreview( { status: 'error', html: '' } );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ layout ] );

	return preview;
}
