export const getClientId = element => {
	if ( ! element ) {
		return null;
	}

	const clientId = element.getAttribute( 'data-block' );

	if ( clientId ) {
		return clientId;
	}

	return getClientId( element.parentElement );
};
