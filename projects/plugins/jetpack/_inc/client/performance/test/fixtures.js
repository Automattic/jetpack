/**
 * Build site data.
 *
 * @returns {object} - Site data.
 */
function siteDataFixture() {
	return {
		requests: {
			isFetchingSiteDiscount: false,
			isFetchingSitePurchases: false,
		},
		data: {
			site: {
				features: {
					active: [ 'search' ],
				},
			},
		},
	};
}

/**
 * Build an object that can be used as a Redux store initial state.
 *
 * @param {object} options - Options
 * @param {boolean} options.themeSupportsWidgets - whether the current theme supports widgets
 * @returns {object} – initial Redux state
 */
export function buildInitialState( { themeSupportsWidgets = false } = {} ) {
	return {
		jetpack: {
			initialState: {
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
				themeData: {
					support: {
						widgets: themeSupportsWidgets,
					},
				},
			},
			modules: {
				items: {},
			},
			dashboard: {
				requests: {
					checkingAkismetKey: true,
				},
			},
			connection: {
				status: {
					siteConnected: {
						offlineMode: {
							isActive: false,
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
			settings: {
				items: {
					search: true,
				},
				requests: {
					settingsSent: {
						search: true,
					},
				},
			},
			siteData: siteDataFixture(),
		},
	};
}
