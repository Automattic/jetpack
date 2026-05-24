/*
 * Optional release-lead context supplied outside the changelog/PR stream.
 *
 * Expected JSON shape:
 * {
 *   "preamble": "Markdown shown under the release title",
 *   "manual_sections": [
 *     { "title": "Jetpack Connector", "important": "...", "context": "...", "steps": ["..."] }
 *   ],
 *   "site_assignments": { "47826": "Use the free-plan Jurassic Ninja site." },
 *   "accepted_demotions": [46342]
 * }
 */

import fs from 'fs';

/**
 * Load and normalize a release-context JSON file.
 *
 * @param {string|null} filePath - Context JSON path.
 * @return {object|null} Normalized release context.
 */
export function loadReleaseContextFile( filePath ) {
	if ( ! filePath ) {
		return null;
	}
	const parsed = JSON.parse( fs.readFileSync( filePath, 'utf8' ) );
	return normalizeReleaseContext( parsed );
}

/**
 * Normalize optional context fields so renderers and validators can consume
 * the object without defensive shape checks everywhere.
 *
 * @param {object|null} context - Raw context.
 * @return {object|null} Normalized context.
 */
export function normalizeReleaseContext( context ) {
	if ( ! context || typeof context !== 'object' ) {
		return null;
	}
	const siteAssignments =
		context.site_assignments && typeof context.site_assignments === 'object'
			? Object.fromEntries(
					Object.entries( context.site_assignments )
						.map( ( [ pr, note ] ) => [
							String( parseInt( pr, 10 ) ),
							normalizeStringOrLines( note ),
						] )
						.filter( ( [ pr, note ] ) => pr !== 'NaN' && note )
			  )
			: {};
	return {
		preamble: normalizeStringOrLines( context.preamble ),
		manual_sections: Array.isArray( context.manual_sections )
			? context.manual_sections.map( normalizeManualSection ).filter( Boolean )
			: [],
		site_assignments: siteAssignments,
		accepted_demotions: Array.isArray( context.accepted_demotions )
			? context.accepted_demotions.map( Number ).filter( Number.isInteger )
			: [],
	};
}

/**
 * Normalize a manual section or sub-test.
 *
 * @param {object} section - Raw manual section.
 * @return {object|null} Normalized manual section.
 */
function normalizeManualSection( section ) {
	if ( ! section || typeof section !== 'object' || ! section.title ) {
		return null;
	}
	return {
		title: String( section.title ).trim(),
		related_prs: Array.isArray( section.related_prs )
			? section.related_prs.map( Number ).filter( Number.isInteger )
			: [],
		important: normalizeStringOrLines( section.important ),
		context: normalizeStringOrLines( section.context ),
		steps: Array.isArray( section.steps )
			? section.steps.map( normalizeStringOrLines ).filter( Boolean )
			: [],
		sub_tests: Array.isArray( section.sub_tests )
			? section.sub_tests.map( normalizeManualSection ).filter( Boolean )
			: [],
	};
}

/**
 * Normalize a string-or-lines field to markdown text.
 *
 * @param {*} value - Raw value.
 * @return {string} Normalized text.
 */
function normalizeStringOrLines( value ) {
	if ( Array.isArray( value ) ) {
		return value
			.map( v => String( v ).trim() )
			.filter( Boolean )
			.join( '\n' );
	}
	if ( typeof value === 'string' ) {
		return value.trim();
	}
	return '';
}
