import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
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

const ROLE_FIELDS = [ 'roles', 'count_roles' ] as const;

/**
 * Order a role selection as the stored one is ordered, so ticking a role off and on again is no edit.
 *
 * @param next   - The selected roles.
 * @param stored - The stored roles.
 * @return The selection, stored roles first in their stored order.
 */
const orderLike = ( next: string[], stored: string[] = [] ) => [
	...stored.filter( role => next.includes( role ) ),
	...next.filter( role => ! stored.includes( role ) ),
];

const toSettings = ( site: SiteSettings | null | undefined ): StatsSettings | undefined =>
	site?.stats_options && {
		...site.stats_options,
		wpcom_reader_views_enabled: Boolean( site.wpcom_reader_views_enabled ),
	};

/**
 * The Stats settings, read and edited as core's site settings entity. Nothing is saved until `save()`.
 *
 * @param options         - Hook options.
 * @param options.enabled - Whether to read the settings; the drawer reads them only while open.
 * @return The stored and edited settings, and the actions on them.
 */
export function useStatsSettings( { enabled = true }: { enabled?: boolean } = {} ) {
	// The site settings entity has no ID.
	const site = useEntityRecord< SiteSettings >( 'root', 'site', undefined as unknown as string, {
		enabled,
	} );
	const { record, editedRecord, edits, edit, save } = site;
	const isSaving = useSelect(
		select => select( coreStore ).isSavingEntityRecord( 'root', 'site' ),
		[]
	);

	const update = useCallback(
		( values: Partial< StatsSettings > ) => {
			const { wpcom_reader_views_enabled: readerViews, ...options } = values;
			const next: SiteSettings = {};
			if ( Object.keys( options ).length > 0 && editedRecord.stats_options ) {
				const merged = { ...editedRecord.stats_options, ...options };
				for ( const field of ROLE_FIELDS ) {
					merged[ field ] = orderLike( merged[ field ], record?.stats_options?.[ field ] );
				}
				next.stats_options = merged;
			}
			if ( readerViews !== undefined ) {
				next.wpcom_reader_views_enabled = readerViews;
			}
			edit( next );
		},
		[ edit, editedRecord.stats_options, record?.stats_options ]
	);

	// Editing back to the stored values is how core-data drops an edit.
	const discard = useCallback( () => {
		if ( record ) {
			edit( {
				stats_options: record.stats_options,
				wpcom_reader_views_enabled: record.wpcom_reader_views_enabled,
			} );
		}
	}, [ edit, record ] );

	const settings = useMemo( () => toSettings( editedRecord ), [ editedRecord ] );
	const changedFields = useMemo( () => {
		const stored = toSettings( record );
		if (
			! settings ||
			! stored ||
			( ! edits.stats_options && edits.wpcom_reader_views_enabled === undefined )
		) {
			return [];
		}
		return ( Object.keys( settings ) as Array< keyof StatsSettings > ).filter(
			field => JSON.stringify( settings[ field ] ) !== JSON.stringify( stored[ field ] )
		);
	}, [ edits, record, settings ] );

	return {
		settings,
		// The route answers `null` for a stored value its schema refuses.
		isError: site.status === 'ERROR' || ( site.hasResolved && ! settings ),
		changedFields,
		isSaving,
		update,
		save,
		discard,
	};
}
