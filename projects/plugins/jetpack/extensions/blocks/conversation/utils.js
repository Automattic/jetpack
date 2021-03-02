
/**
 * WordPress dependencies
 */
import { create, getTextContent } from '@wordpress/rich-text';
import { escapeHTML } from '@wordpress/escape-html';

export function getParticipantBySlug( participants, participantSlug ) {
	const part = participants.filter( ( { slug } ) => ( slug === participantSlug ) );
	return part?.length ? part[ 0 ] : null;
}

export function getParticipantByLabel ( participants, participantLabel ) {
	const part = participants.filter( ( { label } ) => ( label?.toLowerCase() === participantLabel?.toLowerCase() ) );
	return part?.length ? part[ 0 ] : null;
}

export function getPlainText( html, escape = false ) {
	const text = getTextContent( create( { html } ) )?.trim();
	if ( ! escape ) {
		return text;
	}

	return escapeHTML( text );
}

export const FILE_EXTENSION_SRT = '.srt';
export const FILE_EXTENSION_TXT = '.txt';
export const FILE_EXTENSION_VTT = '.vtt';
export const FILE_EXTENSION_SBV = '.sbv';

export const ACCEPTED_FILE_EXT_ARRAY = [
	FILE_EXTENSION_SRT,
	FILE_EXTENSION_TXT,
	FILE_EXTENSION_VTT,
	FILE_EXTENSION_SBV,
];

export const ACCEPTED_FILE_EXTENSIONS = ACCEPTED_FILE_EXT_ARRAY.join( ', ' );