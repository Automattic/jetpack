import { useDispatch, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useEffect } from 'react';
import { isDashboardSectionLayouts, migrateSectionLayouts } from '../../config';
import {
	DASHBOARD_LAYOUT_MIGRATIONS_KEY,
	DASHBOARD_PREFERENCES_SCOPE,
	DASHBOARD_SECTION_LAYOUTS_KEY,
} from '../constants';
import type { DashboardSection } from '../../config';

type PreferencesActions = {
	set: ( scope: string, key: string, value: unknown ) => Promise< void > | void;
};

const NO_IDS: readonly string[] = [];

/**
 * Apply the section layout migrations a reader has not had yet, once the
 * sections have resolved: a migration may read a section's default.
 *
 * A reader with no stored layouts gets the defaults, which already carry every
 * move; the migrations are still recorded so a later customization is not rewritten.
 *
 * @param sections    - The dashboard sections, carrying their defaults.
 * @param hasResolved - Whether the sections have resolved.
 */
export function useSectionLayoutMigrations( sections: DashboardSection[], hasResolved: boolean ) {
	const { layouts, applied } = useSelect( select => {
		const { get } = select( preferencesStore ) as unknown as {
			get: ( scope: string, key: string ) => unknown;
		};
		const storedLayouts = get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY );
		const storedApplied = get( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_MIGRATIONS_KEY );

		return {
			layouts: isDashboardSectionLayouts( storedLayouts ) ? storedLayouts : undefined,
			applied: Array.isArray( storedApplied )
				? storedApplied.filter( ( id ): id is string => typeof id === 'string' )
				: NO_IDS,
		};
	}, [] );
	const { set } = useDispatch( preferencesStore ) as unknown as PreferencesActions;

	useEffect( () => {
		if ( ! hasResolved ) {
			return;
		}

		const result = migrateSectionLayouts( layouts ?? {}, applied, sections );
		if ( ! result ) {
			return;
		}

		if ( layouts && result.layouts !== layouts ) {
			void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_SECTION_LAYOUTS_KEY, result.layouts );
		}
		void set( DASHBOARD_PREFERENCES_SCOPE, DASHBOARD_LAYOUT_MIGRATIONS_KEY, result.applied );
	}, [ hasResolved, layouts, applied, sections, set ] );
}
