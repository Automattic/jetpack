const APISelectors = {
	getAPIRoot: state => state.WP_API_root || null,
	getAPINonce: state => state.WP_API_nonce || null,
};

export default APISelectors;
