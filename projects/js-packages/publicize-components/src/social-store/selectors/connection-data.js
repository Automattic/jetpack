/**
 * Returns the connections object from the store.
 *
 * @param {object} state - State object.
 *
 * @returns {Array} The connections list
 */
export function getConnections( state ) {
	return state.connectionData?.connections ?? [];
}

/**
 * Returns the connections admin URL from the store.
 * @param {object} state - State object.
 * @returns {string|null} The connections admin URL.
 */
export function getConnectionsAdminUrl( state ) {
	return state.connectionData?.adminUrl ?? null;
}

/**
 * Returns whether there are connections in the store.
 * @param {object} state - State object.
 * @returns {boolean} Whether there are connections.
 */
export function hasConnections( state ) {
	return getConnections( state ).length > 0;
}

/**
 * Returns the failed Publicize connections.
 *
 * @param {object} state - State object.
 * @returns {Array} List of connections.
 */
export function getFailedConnections( state ) {
	const connections = getConnections( state );

	return connections.filter( connection => false === connection.test_success );
}

/**
 * Returns a list of Publicize connection service names that require reauthentication from users.
 * iFor example, when LinkedIn switched its API from v1 to v2.
 *
 * @param {object} state - State object.
 * @returns {Array} List of service names that need reauthentication.
 */
export function getMustReauthConnections( state ) {
	const connections = getConnections( state );
	return connections
		.filter( connection => 'must_reauth' === connection.test_success )
		.map( connection => connection.service_name );
}

/**
 * Returns a template for linkedIn data, based on the first linkedin account found.
 *
 * @param {object} state - State object.
 * @param {object} args - Arguments.
 * @param {boolean} args.forceDefaults - Whether to use default values.
 * @returns {object} The linkedin account data.
 */
export function getLinkedInDetails( state, { forceDefaults = false } = {} ) {
	if ( ! forceDefaults ) {
		const connection = getConnections( state ).find(
			( { service_name } ) => 'linkedin' === service_name
		);

		if ( connection ) {
			return {
				name: connection.display_name,
				profileImage: connection.profile_picture,
			};
		}
	}

	return { name: '', profileImage: '' };
}

/**
 * Returns a template for nextdoor data, based on the first nextdoor account found.
 * @param {object} state - State object.
 * @param {object} args - Arguments.
 * @param {boolean} args.forceDefaults - Whether to use default values.
 * @returns {{name: string; profileImage: string}} The nextdoor account data.
 */
export function getNextdoorDetails( state, { forceDefaults = false } = {} ) {
	if ( ! forceDefaults ) {
		const connection = getConnections( state ).find(
			( { service_name } ) => 'nextdoor' === service_name
		);

		if ( connection ) {
			return {
				name: connection.display_name,
				profileImage: connection.profile_picture,
			};
		}
	}

	return { name: '', profileImage: '' };
}

/**
 * Returns a template for Instagram data, based on the first Instagram account found.
 * @param {object} state - State object.
 * @returns {{name: string; profileImage: string}} The Instagram account data.
 */
export function getInstagramDetails( state ) {
	const connection = getConnections( state ).find(
		( { service_name } ) => 'instagram-business' === service_name
	);

	if ( connection ) {
		return {
			name: connection.username,
			profileImage: connection.profile_picture,
		};
	}

	return {
		name: 'username',
		profileImage: '',
	};
}

/**
 * Returns a template for tweet data, based on the first Twitter account found.
 *
 * @param {object} state - State object.
 * @returns {object} The Twitter account data.
 */
export function getTweetTemplate( state ) {
	const connections = getConnections( state );
	const twitterAccount = connections?.find( connection => 'twitter' === connection.service_name );

	return {
		name: twitterAccount?.profile_display_name,
		profileImage: twitterAccount?.profile_picture,
		screenName: twitterAccount?.display_name,
	};
}
