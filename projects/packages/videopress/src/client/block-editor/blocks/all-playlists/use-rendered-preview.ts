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

export type IndexStats = {
	playlists: number;
	videos: number;
};

export type RenderedPreview = {
	status: PreviewStatus;
	// The server-rendered block markup; empty when the site has no playlists.
	html: string;
	// What the playlist index holds, as reported by the render.
	stats: IndexStats;
};

const EMPTY_STATS: IndexStats = { playlists: 0, videos: 0 };

/**
 * Read the index totals the render stamps on its wrapper.
 *
 * @param html - Rendered block markup.
 * @return The totals; zeros when the markup carries none.
 */
export function readIndexStats( html: string ): IndexStats {
	const wrapper = new DOMParser()
		.parseFromString( html, 'text/html' )
		.querySelector( '[data-playlist-total]' );
	if ( ! wrapper ) {
		return EMPTY_STATS;
	}

	return {
		playlists: Number( wrapper.getAttribute( 'data-playlist-total' ) ) || 0,
		videos: Number( wrapper.getAttribute( 'data-video-total' ) ) || 0,
	};
}

/**
 * Render the block on the server, through core's block renderer endpoint, so
 * the canvas shows the same markup as the front end.
 *
 * @param attributes - Block attributes to render with.
 * @return The rendered markup, the index totals and the loading state.
 */
export default function useRenderedPreview( attributes: AllPlaylistsAttributes ): RenderedPreview {
	const {
		layout,
		columns,
		perPage,
		orderBy,
		showDescription,
		showVideoCount,
		showTotalRuntime,
		pagination,
	} = attributes;
	const [ preview, setPreview ] = useState< RenderedPreview >( {
		status: 'loading',
		html: '',
		stats: EMPTY_STATS,
	} );

	useEffect( () => {
		let cancelled = false;
		setPreview( current => ( { ...current, status: 'loading' } ) );

		apiFetch< { rendered?: string } >( {
			path: addQueryArgs( '/wp/v2/block-renderer/videopress/all-playlists', {
				context: 'edit',
				attributes: {
					layout,
					columns,
					perPage,
					orderBy,
					showDescription,
					showVideoCount,
					showTotalRuntime,
					pagination,
				},
			} ),
		} )
			.then( response => {
				if ( ! cancelled ) {
					const html = response?.rendered ?? '';
					setPreview( { status: 'ready', html, stats: readIndexStats( html ) } );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setPreview( { status: 'error', html: '', stats: EMPTY_STATS } );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [
		layout,
		columns,
		perPage,
		orderBy,
		showDescription,
		showVideoCount,
		showTotalRuntime,
		pagination,
	] );

	return preview;
}
