/**
 * Fills shared channel pages in with the signed-in viewer's history after load: watched badges and
 * progress bars on video entries, Continue watching and Recently watched shelves, the watched toggle
 * on a video page, and the Hide watched auto-submit.
 */
import { __ } from '@wordpress/i18n';
import { progressPercent, resumeUrl, shelfItems } from './history';
import type { HistoryItem } from './history';

type Config = {
	root: string;
	nonce: string;
	videoUrl: string;
	startVar: string;
	guid: string;
	epoch: number;
	pickUrl: string;
};

declare global {
	interface Window {
		videoPressViewerDiscovery?: Config;
	}
}

const GUID_BATCH = 100;

const api = async ( config: Config, path: string, init: RequestInit = {} ) => {
	const response = await fetch( config.root + path, {
		credentials: 'same-origin',
		...init,
		headers: { 'X-WP-Nonce': config.nonce, 'Content-Type': 'application/json' },
	} );
	return response.ok ? response.json() : null;
};

const markEntries = async ( config: Config ) => {
	const entries = Array.from(
		document.querySelectorAll< HTMLElement >( '.videopress-playlist__select[data-guid]' )
	);
	const guids = Array.from( new Set( entries.map( entry => entry.dataset.guid as string ) ) );
	const byGuid = new Map< string, HistoryItem >();
	for ( let i = 0; i < guids.length; i += GUID_BATCH ) {
		const query = guids
			.slice( i, i + GUID_BATCH )
			.map( guid => 'guids[]=' + encodeURIComponent( guid ) )
			.join( '&' );
		const data = await api( config, '?' + query );
		( data?.items ?? [] ).forEach( ( item: HistoryItem ) => byGuid.set( item.guid, item ) );
	}
	entries.forEach( entry => {
		const item = byGuid.get( entry.dataset.guid as string );
		if ( ! item || item.status === 'none' ) {
			return;
		}
		const holder = entry.closest( 'li' ) ?? entry;
		holder.classList.add( `has-history-${ item.status.replace( '_', '-' ) }` );
		const thumb = entry.querySelector( '.videopress-playlist__entry-thumb' );
		if ( ! thumb || thumb.querySelector( '.videopress-history-progress' ) ) {
			return;
		}
		if ( item.status === 'watched' ) {
			const badge = document.createElement( 'span' );
			badge.className = 'videopress-history-badge';
			badge.textContent = __( 'Watched', 'jetpack-videopress-pkg' );
			thumb.appendChild( badge );
		}
		const bar = document.createElement( 'span' );
		bar.className = 'videopress-history-progress';
		bar.style.setProperty( '--videopress-history-progress', `${ progressPercent( item ) }%` );
		thumb.appendChild( bar );
	} );
};

const posterFor = async ( guid: string ) => {
	try {
		const response = await fetch(
			`https://public-api.wordpress.com/rest/v1.1/videos/${ encodeURIComponent( guid ) }`
		);
		const data = response.ok ? await response.json() : null;
		return { title: ( data?.title as string ) || '', poster: ( data?.poster as string ) || '' };
	} catch {
		return { title: '', poster: '' };
	}
};

const fillShelves = async ( config: Config ) => {
	const shelves = Array.from(
		document.querySelectorAll< HTMLElement >( '.videopress-continue-watching' )
	);
	if ( ! shelves.length ) {
		return;
	}
	const data = await api( config, '?per_page=50' );
	const items: HistoryItem[] = data?.items ?? [];
	for ( const shelf of shelves ) {
		const picked = shelfItems(
			items,
			shelf.dataset.show ?? 'continue',
			Number( shelf.dataset.count ) || 8
		);
		const list = shelf.querySelector( '.videopress-continue-watching__list' );
		if ( ! picked.length || ! list ) {
			continue;
		}
		const details = await Promise.all( picked.map( item => posterFor( item.guid ) ) );
		picked.forEach( ( item, index ) => {
			const li = document.createElement( 'li' );
			li.className = 'videopress-continue-watching__item';
			const link = document.createElement( 'a' );
			link.href = resumeUrl( config.videoUrl, config.startVar, item );
			const thumb = document.createElement( 'span' );
			thumb.className = 'videopress-continue-watching__thumb';
			if ( details[ index ].poster ) {
				const img = document.createElement( 'img' );
				img.src = details[ index ].poster;
				img.alt = '';
				img.loading = 'lazy';
				thumb.appendChild( img );
			}
			const bar = document.createElement( 'span' );
			bar.className = 'videopress-history-progress';
			bar.style.setProperty( '--videopress-history-progress', `${ progressPercent( item ) }%` );
			thumb.appendChild( bar );
			const title = document.createElement( 'span' );
			title.className = 'videopress-continue-watching__title';
			title.textContent = details[ index ].title || item.title || item.guid;
			link.append( thumb, title );
			li.appendChild( link );
			list.appendChild( li );
		} );
		shelf.hidden = false;
	}
};

const watchedToggle = async ( config: Config ) => {
	const anchor = document.querySelector( '.videopress-video-details__title' );
	if ( ! config.guid || ! anchor ) {
		return;
	}
	let item = await api( config, '/' + encodeURIComponent( config.guid ) );
	if ( ! item ) {
		return;
	}
	const button = document.createElement( 'button' );
	button.type = 'button';
	button.className = 'videopress-history-toggle';
	// Separate statements so minification can't merge the two strings' calls.
	const unmarkLabel = __( 'Watched · Mark as unwatched', 'jetpack-videopress-pkg' );
	const markLabel = __( 'Mark as watched', 'jetpack-videopress-pkg' );
	const render = () => {
		const watched = item.status === 'watched';
		button.setAttribute( 'aria-pressed', watched ? 'true' : 'false' );
		button.textContent = watched ? unmarkLabel : markLabel;
	};
	button.addEventListener( 'click', async () => {
		button.disabled = true;
		const next = await api( config, '/' + encodeURIComponent( config.guid ), {
			method: 'POST',
			body: JSON.stringify( {
				action: item.status === 'watched' ? 'unwatched' : 'watched',
				epoch: item.epoch ?? config.epoch,
			} ),
		} );
		if ( next ) {
			item = next;
		}
		button.disabled = false;
		render();
	} );
	render();
	anchor.insertAdjacentElement( 'afterend', button );
};

const autosubmit = () =>
	document
		.querySelectorAll< HTMLInputElement >( 'input[data-autosubmit]' )
		.forEach( input => input.addEventListener( 'change', () => input.form?.submit() ) );

/**
 * Run every enhancement for the signed-in viewer.
 *
 * @param config - Routes, nonce and URL templates.
 */
export function startViewerDiscovery( config: Config ): void {
	autosubmit();
	void markEntries( config );
	void fillShelves( config );
	void watchedToggle( config );
}

if ( typeof window !== 'undefined' && window.videoPressViewerDiscovery ) {
	const start = () => startViewerDiscovery( window.videoPressViewerDiscovery as Config );
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}
