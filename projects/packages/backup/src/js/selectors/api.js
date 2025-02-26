const APISelectors = {
	getAPIRoot: state => state.API.WP_API_root || null,
	getAPINonce: state => state.API.WP_API_nonce || null,
};

export default APISelectors;
