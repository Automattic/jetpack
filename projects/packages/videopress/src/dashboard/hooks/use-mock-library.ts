import { useSyncExternalStore } from '@wordpress/element';
import { generateMockLibrary } from '../fixtures/library';
import type {
	LibraryItemPrivacy,
	MockLibraryItem,
	UploadStatus,
	VideoDetailsPatch,
} from '../types/library';

const MOCK_INITIAL_LOAD_MS = 1_000;
const MOCK_UPLOAD_DURATION_MS = 10_000;
const MOCK_UPLOAD_TICK_MS = 120;

type StartUploadInput = File | { name: string; sizeBytes: number };

type Action =
	| { type: 'set'; items: MockLibraryItem[] }
	| { type: 'prepend'; item: MockLibraryItem }
	| { type: 'remove'; ids: string[] }
	| {
			type: 'patchUpload';
			id: string;
			status: UploadStatus;
			progress: number;
			thumbnailUrl?: string | null;
			flipToVideoPress?: boolean;
	  }
	| { type: 'patchPrivacy'; id: string; privacy: LibraryItemPrivacy }
	| { type: 'patchVideoDetails'; id: string; patch: VideoDetailsPatch };

const PROMOTED_THUMBNAIL = ( () => {
	const svg =
		`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">` +
		`<rect width="16" height="9" fill="#3858E9"/></svg>`;
	return `data:image/svg+xml;utf8,${ encodeURIComponent( svg ) }`;
} )();

/**
 * Pure reducer over the library items array. Each action mutates the array
 * immutably so React's identity tracking re-renders the affected card only.
 *
 * @param state  - Current items array.
 * @param action - Mutation to apply.
 * @return Next items array.
 */
function reducer( state: MockLibraryItem[], action: Action ): MockLibraryItem[] {
	switch ( action.type ) {
		case 'set':
			return action.items;
		case 'prepend':
			return [ action.item, ...state ];
		case 'remove': {
			const drop = new Set( action.ids );
			return state.filter( item => ! drop.has( item.id ) );
		}
		case 'patchUpload':
			return state.map( item => {
				if ( item.id !== action.id ) {
					return item;
				}
				return {
					...item,
					type: action.flipToVideoPress ? 'videopress' : item.type,
					thumbnailUrl: action.thumbnailUrl !== undefined ? action.thumbnailUrl : item.thumbnailUrl,
					upload: { status: action.status, progress: action.progress },
				};
			} );
		case 'patchPrivacy':
			return state.map( item =>
				item.id === action.id ? { ...item, privacy: action.privacy } : item
			);
		case 'patchVideoDetails':
			return state.map( item => ( item.id === action.id ? { ...item, ...action.patch } : item ) );
		default:
			return state;
	}
}

// ── Window-attached singleton store ───────────────────────────────────
// Each lazy-loaded route bundle (library, video, …) ships its own copy
// of this module — wp-build/webpack don't dedupe small modules across
// chunks. So a plain `let items = …` at module scope produces one
// instance per route, defeating cross-route persistence: the Save on
// /video/$id mutates Video's copy; navigate to /library and Library
// reads from its independent fresh copy.
//
// Attaching the store to `window` is the smallest cross-bundle escape
// hatch: every chunk reaches the same instance. Phase 6 swaps this
// whole hook for TanStack Query, whose QueryClient is also a global
// singleton, so the architecture maps cleanly forward.

type GlobalStore = {
	items: MockLibraryItem[];
	isLoading: boolean;
	subscribers: Set< () => void >;
	intervals: Map< string, ReturnType< typeof setInterval > >;
	forcedFailIds: Set< string >;
	sessionCounter: number;
	initialLoadTimerScheduled: boolean;
};

declare global {
	interface Window {
		__jetpackVideopressMockLibrary?: GlobalStore;
	}
}

const STORE_KEY = '__jetpackVideopressMockLibrary' as const;

/**
 * Lazily creates and returns the window-attached singleton mock store.
 * Subsequent calls (from any chunk) return the same instance.
 *
 * @return The singleton store.
 */
function getStore(): GlobalStore {
	if ( ! window[ STORE_KEY ] ) {
		window[ STORE_KEY ] = {
			items: generateMockLibrary( 50 ),
			isLoading: true,
			subscribers: new Set(),
			intervals: new Map(),
			forcedFailIds: new Set(),
			sessionCounter: 0,
			initialLoadTimerScheduled: false,
		};
	}
	return window[ STORE_KEY ];
}

/**
 * Schedules the one-time initial-load delay (sets `isLoading` to false
 * after MOCK_INITIAL_LOAD_MS). Idempotent — safe to call from every
 * `useMockLibrary` mount.
 */
function ensureInitialLoadTimer(): void {
	const store = getStore();
	if ( store.initialLoadTimerScheduled ) {
		return;
	}
	store.initialLoadTimerScheduled = true;
	setTimeout( () => {
		store.isLoading = false;
		store.subscribers.forEach( fn => fn() );
	}, MOCK_INITIAL_LOAD_MS );
}

/**
 * Notifies every store subscriber that state has changed.
 */
function notify(): void {
	getStore().subscribers.forEach( fn => fn() );
}

/**
 * Applies an action to the singleton store via the reducer and notifies
 * subscribers.
 *
 * @param action - Mutation to apply.
 */
function dispatch( action: Action ): void {
	const store = getStore();
	store.items = reducer( store.items, action );
	notify();
}

/**
 * Drives the simulated upload progress for a single item: ticks every
 * MOCK_UPLOAD_TICK_MS, dispatches `patchUpload` updates, and forces every
 * fifth fresh upload to fail at 60% so the failure UI is exercisable.
 *
 * @param id        - Library item id whose upload to drive.
 * @param isPromote - True when the item should flip from `local` to
 *                  `videopress` on successful completion (i.e., a
 *                  Library row's "Upload to VideoPress" action).
 * @param isRetry   - True when called from `retryUpload`, which clears
 *                  the forced-fail flag instead of incrementing the
 *                  session counter.
 */
function runUpload( id: string, isPromote: boolean, isRetry = false ): void {
	const store = getStore();
	const tickIncrement = ( 100 * MOCK_UPLOAD_TICK_MS ) / MOCK_UPLOAD_DURATION_MS;
	let progress = 0;
	let willFail = false;
	if ( ! isRetry ) {
		store.sessionCounter += 1;
		if ( store.sessionCounter % 5 === 0 ) {
			willFail = true;
			store.forcedFailIds.add( id );
		}
	} else {
		store.forcedFailIds.delete( id );
	}

	const interval = setInterval( () => {
		progress = Math.min( 100, progress + tickIncrement );
		if ( willFail && progress >= 60 ) {
			clearInterval( interval );
			store.intervals.delete( id );
			dispatch( { type: 'patchUpload', id, status: 'failed', progress: 60 } );
			return;
		}
		if ( progress >= 100 ) {
			clearInterval( interval );
			store.intervals.delete( id );
			dispatch( {
				type: 'patchUpload',
				id,
				status: 'idle',
				progress: 0,
				flipToVideoPress: isPromote,
				thumbnailUrl: isPromote ? PROMOTED_THUMBNAIL : undefined,
			} );
			return;
		}
		dispatch( { type: 'patchUpload', id, status: 'uploading', progress } );
	}, MOCK_UPLOAD_TICK_MS );

	store.intervals.set( id, interval );
}

const startUpload = ( file: StartUploadInput ): void => {
	const sizeBytes = file instanceof File ? file.size : file.sizeBytes;
	const name = file.name;
	const id = `upload-${ Date.now() }-${ Math.random().toString( 36 ).slice( 2, 7 ) }`;
	const item: MockLibraryItem = {
		id,
		type: 'local',
		title: name.replace( /\.[^.]+$/, '' ) || 'Untitled',
		filename: name,
		thumbnailUrl: null,
		durationSeconds: 0,
		uploadDate: new Date().toISOString(),
		privacy: 'site-default',
		fileSizeBytes: sizeBytes,
		upload: { status: 'uploading', progress: 0 },
		description: '',
		rating: 'G',
		allowSharing: false,
		allowDownloads: false,
		shortcode: `[videopress ${ id }]`,
	};
	dispatch( { type: 'prepend', item } );
	runUpload( id, true );
};

const promoteLocal = ( id: string ): void => {
	dispatch( { type: 'patchUpload', id, status: 'uploading', progress: 0 } );
	runUpload( id, true );
};

const deleteItems = ( ids: string[] ): void => {
	dispatch( { type: 'remove', ids } );
};

const setPrivacy = ( id: string, privacy: LibraryItemPrivacy ): void => {
	dispatch( { type: 'patchPrivacy', id, privacy } );
};

const updateVideoDetails = ( id: string, patch: VideoDetailsPatch ): void => {
	dispatch( { type: 'patchVideoDetails', id, patch } );
};

const retryUpload = ( id: string ): void => {
	const store = getStore();
	const target = store.items.find( item => item.id === id );
	const isPromote = target?.type === 'local' || store.forcedFailIds.has( id );
	dispatch( { type: 'patchUpload', id, status: 'uploading', progress: 0 } );
	runUpload( id, isPromote, true );
};

const subscribe = ( cb: () => void ): ( () => void ) => {
	const store = getStore();
	store.subscribers.add( cb );
	return () => {
		store.subscribers.delete( cb );
	};
};

const getItemsSnapshot = (): MockLibraryItem[] => getStore().items;
const getIsLoadingSnapshot = (): boolean => getStore().isLoading;

/**
 * Mock-data hook for the Library tab and Video details screen. Subscribes
 * to a window-attached singleton store via `useSyncExternalStore`, plus
 * stable references to mutators (they live at module scope and call into
 * the singleton, so their identity is stable for the page session). Hook
 * signature matches the TanStack Query hook Phase 6 will swap in.
 *
 * @return Library state and mutators.
 */
export function useMockLibrary() {
	ensureInitialLoadTimer();
	const items = useSyncExternalStore( subscribe, getItemsSnapshot );
	const isLoading = useSyncExternalStore( subscribe, getIsLoadingSnapshot );
	return {
		items,
		isLoading,
		startUpload,
		promoteLocal,
		retryUpload,
		deleteItems,
		setPrivacy,
		updateVideoDetails,
	};
}

export type UseMockLibrary = ReturnType< typeof useMockLibrary >;
