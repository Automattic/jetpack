/**
 * Build an object that can be used as a Redux store initial state.
 *
 * @param {object} options - Options
 * @param {boolean} options.isOffline - whether we're in offline mode.
 * @returns {object} – initial Redux state
 */
export function buildInitialState( { isOffline = false } = {} ) {
	return {
		jetpack: {
			connection: {
				requests: {
					disconnectingSite: false,
				},
				status: {
					siteConnected: {
						offlineMode: {
							isActive: isOffline,
						},
						isActive: true,
					},
				},
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			dashboard: {
				requests: {
					fetchingVaultPressData: false,
				},
			},
			modules: {
				items: {},
			},
			pluginsData: {
				items: {},
				requests: {
					isFetchingPluginsData: false,
				},
			},
			siteData: {
				requests: {
					isFetchingSiteData: false,
					isFetchingSiteFeatures: false,
					isFetchingSitePlans: false,
					isFetchingSitePurchases: false,
				},
			},
		},
	};
}
