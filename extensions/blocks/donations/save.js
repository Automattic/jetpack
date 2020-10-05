const Save = ( { attributes } ) => {
	const { fallbackLinkUrl, fallbackLinkText, oneTimeDonation } = attributes;

	if ( ! oneTimeDonation || ! oneTimeDonation.show || oneTimeDonation.planId === -1 ) {
		return null;
	}

	return (
		<a
			className="jetpack-donations-fallback-link"
			href={ fallbackLinkUrl }
			target="_blank"
			rel="noopener noreferrer"
		>
			{ fallbackLinkText }
		</a>
	);
};

export default Save;
