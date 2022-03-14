export const setProducts = products => ( {
	type: 'SET_PRODUCTS',
	products,
} );

export const setConnectUrl = connectUrl => ( {
	type: 'SET_CONNECT_URL',
	connectUrl,
} );

export const setApiState = apiState => ( {
	type: 'SET_API_STATE',
	apiState,
} );

export const setShouldUpgrade = shouldUpgrade => ( {
	type: 'SET_SHOULD_UPGRADE',
	shouldUpgrade,
} );

export const setSiteSlug = siteSlug => ( {
	type: 'SET_SITE_SLUG',
	siteSlug,
} );
