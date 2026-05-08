/**
 * Validation rules for the podcast feed — the same checklist Apple Podcasts,
 * Spotify, and Pocket Casts apply at submission. Used both inline in the
 * Settings tab (against the unsaved draft) and as a gate on Distribution
 * Submit buttons (against the saved settings).
 */

import { __ } from '@wordpress/i18n';
import { usePodcastSettings } from './use-podcast-settings';
import type { PodcastSettings } from '../types';

/**
 * Pure rule check. Pass `undefined` for "not loaded yet" — returns an empty
 * array so callers can treat "no issues" and "no data" identically.
 *
 * @param settings - Settings to validate, or undefined.
 * @return          User-facing issue strings, in stable order.
 */
export const getValidationIssues = ( settings: PodcastSettings | undefined ): string[] => {
	if ( ! settings ) {
		return [];
	}
	const issues: string[] = [];
	if ( ! settings.podcasting_category_id ) {
		issues.push( __( 'Choose a category to use as your podcast feed.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_title ) {
		issues.push( __( 'Add a podcast title.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_summary ) {
		issues.push(
			__( 'Write a short summary so listeners know what your show is about.', 'jetpack-podcast' )
		);
	}
	if ( ! settings.podcasting_talent_name ) {
		issues.push( __( 'Set the host or talent name.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_email ) {
		issues.push(
			__( 'Add an owner email so podcast directories can reach you.', 'jetpack-podcast' )
		);
	}
	if ( ! settings.podcasting_category_1 ) {
		issues.push( __( 'Pick at least one Apple Podcasts category.', 'jetpack-podcast' ) );
	}
	if ( ! settings.podcasting_image ) {
		issues.push( __( 'Upload a cover image (1400×1400 to 3000×3000 pixels).', 'jetpack-podcast' ) );
	}
	return issues;
};

/**
 * Hook variant that reads from the saved settings query. Suppresses issues
 * while the query is loading so the UI doesn't flash a misleading "no
 * episodes / missing title" state on first paint.
 *
 * @return Validation state for the saved (server) settings.
 */
export function useValidationIssues() {
	const { data: settings, isLoading } = usePodcastSettings();
	const issues = isLoading ? [] : getValidationIssues( settings );
	return {
		issues,
		isReady: ! isLoading && issues.length === 0,
		isLoading,
	};
}
