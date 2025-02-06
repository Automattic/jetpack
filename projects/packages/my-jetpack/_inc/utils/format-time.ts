type FormatTimeFunction = ( hours: number ) => string;

const formatTime: FormatTimeFunction = ( hours: number ) => {
	hours = Math.floor( hours );
	const days = Math.floor( hours / 24 );
	const years = Math.floor( days / 365 );

	if ( years > 0 ) {
		return `${ years }y ${ days % 365 }d`;
	}

	if ( days > 0 ) {
		return `${ days }d ${ hours % 24 }h`;
	}

	const seconds = Math.floor( hours * 3600 );
	const minutes = Math.floor( seconds / 60 );

	if ( hours > 0 ) {
		return `${ hours }h ${ minutes % 60 }m`;
	}

	if ( minutes > 0 ) {
		return `${ minutes }m ${ seconds % 60 }s`;
	}

	return `${ Math.floor( seconds ) }s`;
};

export default formatTime;
