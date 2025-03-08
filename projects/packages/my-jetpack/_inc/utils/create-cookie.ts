const createCookie = ( cookieKey: string, expirationDays: number ) => {
	const expireDate = new Date( Date.now() + 1000 * 3600 * 24 * expirationDays );

	document.cookie = `${ cookieKey }=1; expires=${ expireDate.toString() }; SameSite=None; Secure`;
};

export default createCookie;
