import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useMemo, useRef } from 'react';

export type StatsSettings = {
	admin_bar: boolean;
	roles: string[];
	count_roles: string[];
	wpcom_reader_views_enabled: boolean;
};

type StatsOptions = Omit< StatsSettings, 'wpcom_reader_views_enabled' >;

type SiteSettings = {
	stats_options?: StatsOptions;
	wpcom_reader_views_enabled?: boolean;
};

const toSettings = ( site: SiteSettings | null | undefined ): StatsSettings | undefined =>
	site?.stats_options && {
		...site.stats_options,
		wpcom_reader_views_enabled: Boolean( site.wpcom_reader_views_enabled ),
	};

/**
 * Some settings in the shape the site settings entity holds them.
 *
 * @param values - The settings to carry.
 * @param site   - The site settings that supply the rest of `stats_options`.
 * @return The site settings holding `values`.
 */
function toSite( values: Partial< StatsSettings >, site: SiteSettings | undefined ): SiteSettings {
	const { wpcom_reader_views_enabled: readerViews, ...options } = values;
	return {
		...( Object.keys( options ).length > 0 && {
			stats_options: { ...site?.stats_options, ...options } as StatsOptions,
		} ),
		...( 'wpcom_reader_views_enabled' in values && { wpcom_reader_views_enabled: readerViews } ),
	};
}

/**
 * The Stats settings, read from core's site settings entity and saved as each change is made.
 *
 * @return The settings, and the action that saves a change.
 */
export function useStatsSettings() {
	// The site settings entity has no ID.
	const site = useEntityRecord< SiteSettings >( 'root', 'site', undefined as unknown as string );
	const { editedRecord, edit } = site;
	const { saveEntityRecord } = useDispatch( coreStore );
	const registry = useRegistry();
	// The change that last edited each setting; a failed save puts back only the settings it still owns.
	const owners = useRef( new Map< keyof StatsSettings, symbol >() );
	// Saves go one at a time, in the order made: the site does not apply overlapping requests in order.
	const queue = useRef< Promise< unknown > >( Promise.resolve() );

	/**
	 * Save a change, or put back the stored values of what it changed when the site refuses it.
	 *
	 * @param values - The changed settings.
	 * @return Resolves once saved; rejects with the site's error.
	 */
	const saveChange = useCallback(
		async ( values: Partial< StatsSettings > ) => {
			const change = Symbol();
			const keys = Object.keys( values ) as ( keyof StatsSettings )[];
			keys.forEach( key => owners.current.set( key, change ) );
			const ownedKeys = () => keys.filter( key => owners.current.get( key ) === change );
			// Read at call time: another change may have been edited or saved since the last render.
			const read = () => {
				const { getEntityRecord, getEditedEntityRecord } = registry.select( coreStore );
				return {
					stored: getEntityRecord( 'root', 'site' ) as SiteSettings | undefined,
					edited: getEditedEntityRecord( 'root', 'site' ) as SiteSettings,
				};
			};
			const editOwned = ( source: Partial< StatsSettings > | undefined ) =>
				edit(
					toSite(
						Object.fromEntries( ownedKeys().map( key => [ key, source?.[ key ] ] ) ),
						read().edited
					)
				);

			editOwned( values );
			const send = () => {
				// A setting changed back to its stored value holds no edit, so the earlier save's answer replaced it in the form.
				editOwned( values );
				// `saveEditedEntityRecord` sends nothing for a setting changed back to its stored value.
				return saveEntityRecord( 'root', 'site', toSite( values, read().edited ), {
					throwOnError: true,
				} );
			};
			const save = queue.current.then( send, send );
			queue.current = save;
			try {
				await save;
			} catch ( error ) {
				// Editing back to the stored values is how core-data drops an edit.
				editOwned( toSettings( read().stored ) );
				throw error;
			}
		},
		[ edit, registry, saveEntityRecord ]
	);

	const settings = useMemo( () => toSettings( editedRecord ), [ editedRecord ] );

	return {
		settings,
		// The route answers `null` for a stored value its schema refuses.
		isError: site.status === 'ERROR' || ( site.hasResolved && ! settings ),
		saveChange,
	};
}
