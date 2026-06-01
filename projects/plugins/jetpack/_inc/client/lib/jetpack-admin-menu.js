export const getJetpackPageOrder = subMenuItems => {
	const pageOrder = {};
	const urlPatterns = [
		{
			key: 'dashboard',
			pattern: '/wp-admin/admin.php?page=jetpack#/dashboard',
			matchType: 'end',
		},
		{
			key: 'activityLog',
			pattern: 'https://jetpack.com/redirect/?source=cloud-activity-log-wp-menu',
			matchType: 'start',
		},
		{
			key: 'settings',
			pattern: '/wp-admin/admin.php?page=jetpack#/settings',
			matchType: 'end',
		},
	];

	const findIndex = ( urlPattern, matchType ) => {
		let foundIndex = -1;
		subMenuItems.forEach( ( item, index ) => {
			const href = item.href;
			if (
				( matchType === 'end' && href.endsWith( urlPattern ) ) ||
				( matchType === 'start' && href.startsWith( urlPattern ) )
			) {
				foundIndex = index + 1;
			}
		} );
		return foundIndex;
	};

	urlPatterns.forEach( ( { key, pattern, matchType } ) => {
		const index = findIndex( pattern, matchType );
		pageOrder[ key ] = index;
	} );

	return pageOrder;
};

export const getJetpackCurrentMenuKey = ( {
	hash,
	page,
	myJetpackRoutes,
	dashboardRoutes,
	recommendationsRoutes,
	productDescriptionRoutes,
	settingsRoutes,
} ) => {
	if ( myJetpackRoutes.includes( page ) ) {
		return 'myJetpack';
	}

	const normalizedHash = hash.split( '?' )[ 0 ].replace( /#/, '' );

	if (
		dashboardRoutes.includes( normalizedHash ) ||
		recommendationsRoutes.includes( normalizedHash ) ||
		productDescriptionRoutes.includes( normalizedHash )
	) {
		return 'dashboard';
	}

	if ( settingsRoutes.includes( normalizedHash ) ) {
		return 'settings';
	}
};

export const getJetpackEffectiveRoute = ( {
	route,
	isOfflineMode,
	dashboardRoutes,
	offlineModeRoute = '/offline-mode',
} ) => {
	if ( isOfflineMode && dashboardRoutes.includes( route ) ) {
		return offlineModeRoute;
	}

	return route;
};
