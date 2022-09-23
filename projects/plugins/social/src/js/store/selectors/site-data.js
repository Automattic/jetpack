const siteDataSelectors = {
	getAPIRootUrl: state => state.siteData?.apiRoot ?? null,
	getAPINonce: state => state.siteData?.apiNonce ?? null,
	getRegistrationNonce: state => state.siteData?.registrationNonce ?? null,
};

export default siteDataSelectors;
