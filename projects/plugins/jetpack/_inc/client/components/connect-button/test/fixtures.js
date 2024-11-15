/**
 * Build an object that can be used as a Redux store initial state.
 *
 * @return {object} – initial Redux state
 */
export function buildInitialState() {
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
			},
			connection: {
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
		},
	};
}
