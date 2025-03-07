const checkForCookie = ( cookieName: string ) => {
	return document.cookie
		.split( ';' )
		.map( cookie => cookie.trim() )
		.some( cookie => cookie.startsWith( cookieName + '=' ) );
};

export default checkForCookie;
