import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { useMemo } from 'react';
import type { Activity } from './types';
import type { Action } from '@wordpress/dataviews';

type UseActivityActionsOptions = {
	isLoading: boolean;
};

/**
 * Row actions for the DataViews table. Phase 5 wires the "Manage backup"
 * action into the Backup package's admin page; for now the action is
 * present but disabled so the column space is preserved and the planned
 * feature is visible.
 *
 * @param options           - Hook options.
 * @param options.isLoading - Whether the list is currently fetching. Kept
 *                          in the API so Phase 5 doesn't need to refactor
 *                          the call site.
 * @return The actions array for `<DataViews actions=… />`.
 */
export function useActivityActions( {
	isLoading,
}: UseActivityActionsOptions ): Action< Activity >[] {
	return useMemo( () => {
		const backupAction: Action< Activity > = {
			id: 'backup',
			isPrimary: true,
			label: __( 'Manage backup', 'jetpack-activity-log' ),
			icon: <Icon icon={ backup } />,
			// Phase 5: enable and deep-link into the Backup package's admin page.
			disabled: true,
			isEligible: item => item.activityIsRewindable,
			callback: async () => {
				/* no-op until Phase 5 */
			},
		};

		// Keep the flag referenced so the param isn't flagged as unused.
		void isLoading;

		return [ backupAction ];
	}, [ isLoading ] );
}
