export const isSafari = () => {
	if ( typeof navigator !== 'undefined' && navigator.userAgent ) {
		return /^((?!chrome|android).)*safari/i.test( navigator.userAgent );
	}
	return false;
};
