/**
 * External dependencies
 */
import { useRegistry, useSelect } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { PREFERENCES_SCOPE } from '../constants';
import type * as Contract from '@automattic/jetpack-announcements';

const TEASER_OFF_KEY = 'teaserOff';

type PreferencesSelectors = {
	get: ( scope: string, key: string ) => unknown;
};

type PreferencesActions = {
	set: ( scope: string, key: string, value: boolean ) => void;
};

/**
 * Reads and writes the switch that turns the teaser off for the current user.
 *
 * The switch lives in the user's preferences, which WordPress persists.
 *
 * @return Whether the teaser is on, and the function that turns it on or off.
 */
export const useTeaserSwitch: typeof Contract.useTeaserSwitch = () => {
	const registry = useRegistry();

	const isOn = useSelect(
		storeSelect =>
			( storeSelect( preferencesStore ) as PreferencesSelectors ).get(
				PREFERENCES_SCOPE,
				TEASER_OFF_KEY
			) !== true,
		[]
	);

	const setIsOn = useCallback(
		( next: boolean ) => {
			( registry.dispatch( preferencesStore ) as PreferencesActions ).set(
				PREFERENCES_SCOPE,
				TEASER_OFF_KEY,
				! next
			);
		},
		[ registry ]
	);

	return { isOn, setIsOn };
};
