/**
 * Build an object that can be used as a Redux store initial state.
 *
 * @param {object} options - Options
 * @param {boolean} options.userIsLinked - whether the current user is connected to wpcom.
 * @returns {object} – initial Redux state
 */
export function buildInitialState( { userIsLinked = true } = {} ) {
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
				WP_API_nonce: 'nonce',
				WP_API_root: '/wp-admin/',
			},
			connection: {
				requests: {
					disconnectingSite: false,
				},
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
						isConnected: userIsLinked,
					},
				},
			},
		},
	};
}
