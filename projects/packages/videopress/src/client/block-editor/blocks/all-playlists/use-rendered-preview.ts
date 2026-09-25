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
	// The server-rendered cards and pagination, without the header the editor
	// renders itself; empty when the site has no playlists.
	html: string;
	// The header's "N playlists" / "Showing X of N" line.
	summary: string;
};

/**
 * Split the server render into what the canvas shows: the header's summary
 * line and the markup without the header (the editor renders the heading as
 * an inner block).
 *
 * @param html - Rendered block markup.
 * @return The preview parts; empty when the markup carries no block.
 */
export function splitRenderedPreview( html: string ): Pick< RenderedPreview, 'html' | 'summary' > {
	const document = new DOMParser().parseFromString( html, 'text/html' );
	const wrapper = document.querySelector< HTMLElement >( '[data-playlist-total]' );
	if ( ! wrapper ) {
		return { html: '', summary: '' };
	}

	const header = wrapper.querySelector( '.videopress-all-playlists__header' );
	const summary = header?.querySelector( '.videopress-all-playlists__summary' )?.textContent ?? '';
	header?.remove();

	return {
		html: wrapper.outerHTML,
		summary,
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
		summary: '',
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
					setPreview( { status: 'ready', ...splitRenderedPreview( response?.rendered ?? '' ) } );
				}
			} )
			.catch( () => {
				if ( ! cancelled ) {
					setPreview( { status: 'error', html: '', summary: '' } );
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
