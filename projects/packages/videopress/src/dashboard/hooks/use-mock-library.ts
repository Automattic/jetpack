import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from '@wordpress/element';
import { generateMockLibrary } from '../fixtures/library';
import type { LibraryItemPrivacy, MockLibraryItem, UploadStatus } from '../types/library';

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
	| { type: 'patchPrivacy'; id: string; privacy: LibraryItemPrivacy };

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
		default:
			return state;
	}
}

/**
 * Mock-data hook for the Library tab. Owns 50 generated fixture items, a
 * one-second initial loading window, and a 10-second per-item upload
 * simulation. Hook signature matches the TanStack Query hook Phase 6 will
 * swap in.
 *
 * @return Library state and mutators.
 */
export function useMockLibrary() {
	const [ items, dispatch ] = useReducer( reducer, undefined, () => generateMockLibrary( 50 ) );
	const [ isLoading, setIsLoading ] = useState( true );
	const intervalsRef = useRef< Map< string, ReturnType< typeof setInterval > > >( new Map() );

	useEffect( () => {
		const handle = setTimeout( () => setIsLoading( false ), MOCK_INITIAL_LOAD_MS );
		return () => clearTimeout( handle );
	}, [] );

	useEffect( () => {
		const intervals = intervalsRef.current;
		return () => {
			intervals.forEach( clearInterval );
			intervals.clear();
		};
	}, [] );

	const sessionCounterRef = useRef( 0 );
	const forcedFailIdsRef = useRef< Set< string > >( new Set() );

	const runUpload = useCallback( ( id: string, isPromote: boolean, isRetry = false ) => {
		const tickIncrement = ( 100 * MOCK_UPLOAD_TICK_MS ) / MOCK_UPLOAD_DURATION_MS;
		let progress = 0;
		let willFail = false;
		if ( ! isRetry ) {
			sessionCounterRef.current += 1;
			if ( sessionCounterRef.current % 5 === 0 ) {
				willFail = true;
				forcedFailIdsRef.current.add( id );
			}
		} else {
			forcedFailIdsRef.current.delete( id );
		}

		const interval = setInterval( () => {
			progress = Math.min( 100, progress + tickIncrement );
			if ( willFail && progress >= 60 ) {
				clearInterval( interval );
				intervalsRef.current.delete( id );
				dispatch( { type: 'patchUpload', id, status: 'failed', progress: 60 } );
				return;
			}
			if ( progress >= 100 ) {
				clearInterval( interval );
				intervalsRef.current.delete( id );
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

		intervalsRef.current.set( id, interval );
	}, [] );

	const startUpload = useCallback(
		( file: StartUploadInput ) => {
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
			};
			dispatch( { type: 'prepend', item } );
			runUpload( id, true );
		},
		[ runUpload ]
	);

	const promoteLocal = useCallback(
		( id: string ) => {
			dispatch( { type: 'patchUpload', id, status: 'uploading', progress: 0 } );
			runUpload( id, true );
		},
		[ runUpload ]
	);

	const deleteItems = useCallback( ( ids: string[] ) => {
		dispatch( { type: 'remove', ids } );
	}, [] );

	const setPrivacy = useCallback( ( id: string, privacy: LibraryItemPrivacy ) => {
		dispatch( { type: 'patchPrivacy', id, privacy } );
	}, [] );

	const retryUpload = useCallback(
		( id: string ) => {
			const target = items.find( item => item.id === id );
			const isPromote = target?.type === 'local' || forcedFailIdsRef.current.has( id );
			dispatch( { type: 'patchUpload', id, status: 'uploading', progress: 0 } );
			runUpload( id, isPromote, true );
		},
		[ items, runUpload ]
	);

	return useMemo(
		() => ( {
			items,
			isLoading,
			startUpload,
			promoteLocal,
			retryUpload,
			deleteItems,
			setPrivacy,
		} ),
		[ items, isLoading, startUpload, promoteLocal, retryUpload, deleteItems, setPrivacy ]
	);
}

export type UseMockLibrary = ReturnType< typeof useMockLibrary >;
