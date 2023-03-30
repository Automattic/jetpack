export const getDisplayName = response => {
	if ( response.author_name ) {
		return response.author_name;
	}

	if ( response.author_email ) {
		return response.author_email;
	}

	return response.ip;
};

export const getMonthName = monthNumber => {
	const date = new Date();
	date.setMonth( monthNumber - 1 );

	return date.toLocaleString( 'en-US', {
		month: 'long',
	} );
};

export const getPath = response => {
	const url = new URL( response.entry_permalink );

	return url.pathname;
};

export const formatFieldName = fieldName => {
	const match = fieldName.match( /^(\d+_)?(.*)/i );

	if ( match ) {
		return match[ 2 ];
	}

	return fieldName;
};
