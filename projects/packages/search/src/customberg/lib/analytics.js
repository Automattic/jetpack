/**
 * Internal dependencies
 */
import {
	initializeTracks,
	identifySite as identifySiteTracks,
	recordEvent as recordEventTracks,
} from 'instant-search/lib/tracks';

// Adhere to following:<source>_<context>_<optional subcontext>_<action>_<optional qualifier>
// (e.g. full event name: "jetpack_search_customberg_save_button_click").
export const eventPrefix = 'jetpack_search_customberg';

// Force enable analytics! Ignore isAnalyticsEnabled flag used by the Instant Search application.
export const initialize = ( ...args ) => initializeTracks( ...args, true );
export const identifySite = ( ...args ) => identifySiteTracks( ...args, true );
export const recordEvent = ( ...args ) => recordEventTracks( ...args, true );
