function getPrettyError( error: string ) {
	const errorMap: { [ key: string ]: string } = {
		SuccessTargetError: 'success-target-error',
		UrlError: 'url-error',
		HttpError: 'http-error',
		UnknownError: 'unknown-error',
		CrossDomainError: 'cross-domain-error',
		LoadTimeoutError: 'load-timeout-error',
		RedirectError: 'redirect-error',
		UrlVerifyError: 'url-verify-error',
		EmptyCSSError: 'empty-css-error',
		XFrameDenyError: 'x-frame-deny-error',
	};

	return errorMap[ error as keyof typeof errorMap ] || error;
}

function getSupportLinkCriticalCss( errorType: string ) {
	return `https://jetpack.com/support/jetpack-boost/troubleshooting-critical-css-issues/#${ getPrettyError(
		errorType
	) }`;
}

export default getSupportLinkCriticalCss;
