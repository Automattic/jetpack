
export function getParticipantIndex ( slug, participants ) {
	return participants.map( part => part.slug ).indexOf( slug );
}

export function getNextParticipantIndex ( slug, participants, offset = 0 ) {
	return ( getParticipantIndex( slug, participants ) + 1 + offset ) % participants.length;
}

export function getNextParticipant ( slug, participants, offset = 0 ) {
	return participants[ getNextParticipantIndex( slug, participants, offset ) ];
}
