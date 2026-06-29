import { store as coreStore } from '@wordpress/core-data';
import {
	dispatch as dataDispatch,
	select as dataSelect,
	useDispatch,
	useSelect,
} from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { getPodcatcherIds } from '../podcatchers';
import type {
	PodcastSettings,
	PodcastSettingsUpdate,
	PodcastShowState,
	PodcastShowStates,
	PodcastShowUrls,
	PodcatcherId,
} from '../types';

const ENTITY_KIND = 'wpcom/v2';
const ENTITY_NAME = 'podcast/settings';

if (
	! dataSelect( coreStore )
		.getEntitiesConfig( ENTITY_KIND )
		.some( ( { name } ) => name === ENTITY_NAME )
) {
	dataDispatch( coreStore ).addEntities( [
		{
			kind: ENTITY_KIND,
			name: ENTITY_NAME,
			baseURL: `/${ ENTITY_KIND }/${ ENTITY_NAME }`,
			label: __( 'Podcast settings', 'jetpack-podcast' ),
		},
	] );
}

const PODCAST_KEYS: Array< keyof PodcastSettings > = [
	'podcasting_category_id',
	'podcasting_title',
	'podcasting_talent_name',
	'podcasting_summary',
	'podcasting_copyright',
	'podcasting_explicit',
	'podcasting_image',
	'podcasting_image_id',
	'podcasting_category_1',
	'podcasting_category_2',
	'podcasting_category_3',
	'podcasting_email',
	'podcasting_show_urls',
	'podcasting_show_states',
];

// Ids from the injected map, plus the record's own keys, so a missing map never
// drops stored values.
const podcatcherIds = ( source: Record< string, unknown > ): readonly PodcatcherId[] =>
	[ ...new Set( [ ...getPodcatcherIds(), ...Object.keys( source ) ] ) ] as PodcatcherId[];

const normalizeShowUrls = ( raw: unknown ): PodcastShowUrls => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowUrls;
	for ( const id of podcatcherIds( source ) ) {
		const value = source[ id ];
		out[ id ] = typeof value === 'string' ? value : '';
	}
	return out;
};

const SHOW_STATES: readonly PodcastShowState[] = [ '', 'pending', 'active' ] as const;

const normalizeShowStates = ( raw: unknown ): PodcastShowStates => {
	const source = ( raw && typeof raw === 'object' ? raw : {} ) as Record< string, unknown >;
	const out = {} as PodcastShowStates;
	for ( const id of podcatcherIds( source ) ) {
		const value = source[ id ];
		out[ id ] =
			typeof value === 'string' && ( SHOW_STATES as readonly string[] ).includes( value )
				? ( value as PodcastShowState )
				: '';
	}
	return out;
};

const pickPodcastFields = ( raw: Record< string, unknown > ): PodcastSettings => {
	const numericKey = ( key: keyof PodcastSettings ) =>
		key === 'podcasting_category_id' || key === 'podcasting_image_id';

	const toString = ( value: unknown ): string => {
		if ( typeof value === 'string' ) {
			return value;
		}
		if ( value == null ) {
			return '';
		}
		return String( value );
	};

	const out: Record< string, unknown > = {};
	for ( const key of PODCAST_KEYS ) {
		const value = raw[ key ];
		if ( numericKey( key ) ) {
			out[ key ] = typeof value === 'number' ? value : Number( value ?? 0 ) || 0;
		} else if ( key === 'podcasting_explicit' ) {
			out[ key ] = Boolean( value );
		} else if ( key === 'podcasting_show_urls' ) {
			out[ key ] = normalizeShowUrls( value );
		} else if ( key === 'podcasting_show_states' ) {
			out[ key ] = normalizeShowStates( value );
		} else if (
			key === 'podcasting_category_1' ||
			key === 'podcasting_category_2' ||
			key === 'podcasting_category_3'
		) {
			// Legacy WPCOM stored Apple categories HTML-entity encoded
			// ("Fashion &amp; Beauty"); decode so the value matches the raw
			// catalog keys in topics.ts.
			out[ key ] = decodeEntities( toString( value ) );
		} else {
			out[ key ] = toString( value );
		}
	}
	return out as unknown as PodcastSettings;
};

export const refreshPodcastSettings = (): void => {
	dataDispatch( coreStore ).invalidateResolution( 'getEntityRecord', [ ENTITY_KIND, ENTITY_NAME ] );
};

interface MutateCallbacks {
	onSuccess?: ( result: PodcastSettings ) => void;
	onError?: ( error: unknown ) => void;
	// Suppress the hook's built-in success/error snackbars when the caller
	// owns its own user-visible feedback (e.g. a modal with an inline Notice).
	silent?: boolean;
}

/**
 * Read the settings off the core-data entity, resolving on first use.
 *
 * @return `{ data, isLoading }`.
 */
export function usePodcastSettings(): { data: PodcastSettings | undefined; isLoading: boolean } {
	const record = useSelect(
		select =>
			select( coreStore ).getEntityRecord< Record< string, unknown > >( ENTITY_KIND, ENTITY_NAME ),
		[]
	);
	const hasResolved = useSelect(
		select =>
			select( coreStore ).hasFinishedResolution( 'getEntityRecord', [ ENTITY_KIND, ENTITY_NAME ] ),
		[]
	);
	// Memoised so the derived object identity is stable across renders. Without
	// this, every render builds a new `data` object, breaking reference checks
	// downstream (Settings' isDirty was permanently true on `podcasting_show_urls`).
	const data = useMemo( () => ( record ? pickPodcastFields( record ) : undefined ), [ record ] );
	return { data, isLoading: ! hasResolved };
}

/**
 * Save a partial update through the entity; the server returns the full merged
 * record. Snackbars dispatch here unless `silent`.
 *
 * @return `{ mutate, mutateAsync, isPending }`.
 */
export function useUpdatePodcastSettings(): {
	mutate: ( updates: PodcastSettingsUpdate, callbacks?: MutateCallbacks ) => void;
	mutateAsync: (
		updates: PodcastSettingsUpdate,
		options?: { silent?: boolean }
	) => Promise< PodcastSettings >;
	isPending: boolean;
} {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const isPending = useSelect(
		select => !! select( coreStore ).isSavingEntityRecord( ENTITY_KIND, ENTITY_NAME, undefined ),
		[]
	);

	const mutateAsync = useCallback(
		async (
			updates: PodcastSettingsUpdate,
			{ silent = false }: { silent?: boolean } = {}
		): Promise< PodcastSettings > => {
			try {
				const record = await saveEntityRecord(
					ENTITY_KIND,
					ENTITY_NAME,
					updates as Record< string, unknown >
				);
				if ( ! record ) {
					throw new Error( 'save returned no record' );
				}
				if ( ! silent ) {
					createSuccessNotice( __( 'Settings saved.', 'jetpack-podcast' ), {
						type: 'snackbar',
					} );
				}
				return pickPodcastFields( record as Record< string, unknown > );
			} catch ( error ) {
				if ( ! silent ) {
					createErrorNotice(
						__( 'Could not save your podcast settings. Please try again.', 'jetpack-podcast' ),
						{ type: 'snackbar' }
					);
				}
				throw error;
			}
		},
		[ saveEntityRecord, createSuccessNotice, createErrorNotice ]
	);

	const mutate = useCallback(
		(
			updates: PodcastSettingsUpdate,
			{ onSuccess, onError, silent = false }: MutateCallbacks = {}
		) => {
			// Default no-op keeps the rejection from going uncaught when no `onError` is passed.
			mutateAsync( updates, { silent } ).then( onSuccess, onError ?? ( () => {} ) );
		},
		[ mutateAsync ]
	);

	return { mutate, mutateAsync, isPending };
}
