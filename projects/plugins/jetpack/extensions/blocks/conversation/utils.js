
export function getParticipantByValue ( participants, value ) {
	const part = participants.filter( ( { participant } ) => ( participant.toLowerCase() === value.toLowerCase() ) );
	return part?.length ? part[ 0 ] : null;
}
