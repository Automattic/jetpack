/**
 * Build site data.
 *
 * @return {object} - Site data.
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
 * @param {object}  options             - Options
 * @param {boolean} options.offlineMode - whether the site is in Jetpack offline mode
 * @return {object} – initial Redux state
 */
export function buildInitialState( { offlineMode = false } = {} ) {
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
						widgets: false,
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
							isActive: offlineMode,
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
