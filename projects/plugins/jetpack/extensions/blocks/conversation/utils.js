/**
 * WordPress dependencies
 */
import { create, getTextContent } from '@wordpress/rich-text';
import { escapeHTML } from '@wordpress/escape-html';

export function getParticipantBySlug( participants, participantSlug ) {
	const part = participants.filter( ( { slug } ) => slug === participantSlug );
	return part?.length ? part[ 0 ] : null;
}

export function getParticipantByLabel( participants, participantLabel ) {
	const part = participants.filter(
		( { label } ) => label?.toLowerCase() === participantLabel?.toLowerCase()
	);
	return part?.length ? part[ 0 ] : null;
}

export function getPlainText( html, escape = false ) {
	const text = getTextContent( create( { html } ) )?.trim();
	if ( ! escape ) {
		return text;
	}

	return escapeHTML( text );
}
