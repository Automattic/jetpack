const getWpcomUser = state => {
	return state?.userConnectionData?.currentUser?.wpcomUser;
};

const getBlogId = state => {
	return state?.userConnectionData?.currentUser?.blogId;
};

const connectionSelectors = {
	getConnectionStatus: state => state.connectionStatus || {},
	/**
	 * Checks whether the store is fetching the connection status from the server
	 *
	 * @deprecated since 0.14.0
	 * @return {boolean} Is the store is fetching the connection status from the server?
	 */
	getConnectionStatusIsFetching: () => false,
	getSiteIsRegistering: state => state.siteIsRegistering || false,
	getUserIsConnecting: state => state.userIsConnecting || false,
	getRegistrationError: state => state.registrationError || false,
	getAuthorizationUrl: state => state.authorizationUrl || false,
	getUserConnectionData: state => state.userConnectionData || false,
	getConnectedPlugins: state => state.connectedPlugins || [],
	getConnectionOwner: state => state.connectionOwner || null,
	getConnectionErrors: state => state.connectionErrors || [],
	getConnectionHealthErrors: state => state.connectionHealthErrors || {},
	getIsOfflineMode: state => state.isOfflineMode || false,

	/*
	 * Protected owner. `getProtectedOwner` is null when the server withheld the state because the
	 * viewer cannot manage the connection — which is not the same as there being no owner. The
	 * booleans below all read false in that case, so a caller that must tell "no" from "cannot
	 * say" checks `getProtectedOwner` for null first rather than trusting them.
	 */
	getProtectedOwner: state => state.protectedOwner || null,
	isProtectedOwnerRequired: state => state.protectedOwner?.required === true,
	hasProtectedOwner: state => state.protectedOwner?.protected === true,
	isOwnershipLocked: state => state.protectedOwner?.locked === true,
	getProtectedOwnerStatus: state => state.protectedOwner?.status || null,
	isCurrentUserTheProtectedOwner: state => state.protectedOwner?.isCurrentUserTheOwner === true,

	getWpcomUser,
	getBlogId,
};

const selectors = {
	...connectionSelectors,
};

export default selectors;
