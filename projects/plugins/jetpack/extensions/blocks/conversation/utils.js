
/**
 * WordPress dependencies
 */
import { create, getTextContent } from '@wordpress/rich-text';

export function getParticipantBySlug( participants, participantSlug ) {
	const part = participants.filter( ( { slug } ) => ( slug === participantSlug ) );
	return part?.length ? part[ 0 ] : null;
}

export function getParticipantByLabel ( participants, participantLabel ) {
	const part = participants.filter( ( { label } ) => ( label?.toLowerCase() === participantLabel?.toLowerCase() ) );
	return part?.length ? part[ 0 ] : null;
}

export function cleanFormatStyle( html ) {
	return getTextContent( create( { html } ) )?.trim();
}
