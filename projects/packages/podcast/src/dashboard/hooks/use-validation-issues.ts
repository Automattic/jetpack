// Apple/Spotify/Pocket Casts submission requirements. The pure form is used
// against the unsaved draft in Settings; the hook variant reads the saved
// settings query for the Distribution gate.

import { __ } from '@wordpress/i18n';
import { usePodcastSettings } from './use-podcast-settings';
import type { PodcastSettings } from '../types';

/**
 * Pure rule check; returns user-facing issue strings in stable order.
 *
 * @param settings - Settings to validate, or undefined for "not loaded yet".
 * @return          Empty array when settings are missing or all rules pass.
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
 * Validation state for the saved settings — Distribution gates Submit on this.
 *
 * @return `{ issues, isReady, isLoading }` — issues suppressed during load.
 */
export function useValidationIssues() {
	const { data: settings, isLoading } = usePodcastSettings();
	// Suppress issues during load so the UI doesn't flash a false-positive banner.
	const issues = isLoading ? [] : getValidationIssues( settings );
	return {
		issues,
		isReady: ! isLoading && issues.length === 0,
		isLoading,
	};
}
