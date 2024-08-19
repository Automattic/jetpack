type FormatTimeFunction = ( seconds: number ) => string;

const formatTime: FormatTimeFunction = ( seconds: number ) => {
	const minutes = Math.floor( seconds / 60 );
	const hours = Math.floor( minutes / 60 );
	const days = Math.floor( hours / 24 );
	const years = Math.floor( days / 365 );

	if ( years > 0 ) {
		return `${ years }y ${ days % 365 }d`;
	}

	if ( days > 0 ) {
		return `${ days }d ${ hours % 24 }h`;
	}

	if ( hours > 0 ) {
		return `${ hours }h ${ minutes % 60 }m`;
	}

	if ( minutes > 0 ) {
		return `${ minutes }m ${ seconds % 60 }s`;
	}

	return `${ seconds }s`;
};

export default formatTime;
