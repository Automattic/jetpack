import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useRegistry } from '@wordpress/data';
import { useCallback, useMemo } from 'react';

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
 * The Stats settings, read from core's site settings entity and saved as each change is made.
 *
 * @return The settings, and the action that saves a change.
 */
export function useStatsSettings() {
	// The site settings entity has no ID.
	const site = useEntityRecord< SiteSettings >( 'root', 'site', undefined as unknown as string );
	const { editedRecord, edit } = site;
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const registry = useRegistry();

	/**
	 * Save a change, or put back the stored values of what it changed when the site refuses it.
	 *
	 * @param values - The changed settings.
	 * @return Resolves once saved; rejects with the site's error.
	 */
	const saveChange = useCallback(
		async ( values: Partial< StatsSettings > ) => {
			const { wpcom_reader_views_enabled: readerViews, ...options } = values;
			const optionKeys = Object.keys( options ) as ( keyof StatsOptions )[];
			// Read at call time: another change may have been edited or saved since the last render.
			const read = () => {
				const { getEntityRecord, getEditedEntityRecord } = registry.select( coreStore );
				return {
					stored: getEntityRecord( 'root', 'site' ) as SiteSettings | undefined,
					edited: getEditedEntityRecord( 'root', 'site' ) as SiteSettings,
				};
			};

			edit( {
				...( optionKeys.length > 0 && {
					stats_options: { ...read().edited.stats_options, ...options },
				} ),
				...( readerViews !== undefined && { wpcom_reader_views_enabled: readerViews } ),
			} );
			try {
				await saveEditedEntityRecord( 'root', 'site', undefined, { throwOnError: true } );
			} catch ( error ) {
				const { stored, edited } = read();
				// Editing back to the stored values is how core-data drops an edit.
				edit( {
					...( optionKeys.length > 0 && {
						stats_options: {
							...edited.stats_options,
							...Object.fromEntries(
								optionKeys.map( key => [ key, stored?.stats_options?.[ key ] ] )
							),
						},
					} ),
					...( readerViews !== undefined && {
						wpcom_reader_views_enabled: stored?.wpcom_reader_views_enabled,
					} ),
				} );
				throw error;
			}
		},
		[ edit, registry, saveEditedEntityRecord ]
	);

	const settings = useMemo( () => toSettings( editedRecord ), [ editedRecord ] );

	return {
		settings,
		// The route answers `null` for a stored value its schema refuses.
		isError: site.status === 'ERROR' || ( site.hasResolved && ! settings ),
		saveChange,
	};
}
