/**
 * External dependencies
 */
import React, { Fragment } from 'react';

/**
 * Internal dependencies
 */
import MockedInstantSearch from './mocked-instant-search';
import MockedLegacySearch from './mocked-legacy-search';

/**
 * Mocked Search component, which shows mocked Instant Search or legacy Search interface.
 *
 * @param {object} props - Component properties.
 * @param {boolean} props.supportsOnlyClassicSearch - true if site has plan that supports only Classic Search.
 * @param {boolean} props.supportsInstantSearch - true if site has plan that supports Instant Search.
 * @returns {React.Component} Mocked Search interface component.
 */
export default function MockedSearch( {
	supportsInstantSearch = true,
	supportsOnlyClassicSearch = false,
} ) {
	// We only want to show the legacy search mock to users with bussiness plan but no search subscription.
	// For all other cases, we show our Instant Search experience mock.
	const shouldShowMockedLegacySearch = supportsOnlyClassicSearch && ! supportsInstantSearch;

	return (
		<Fragment>
			{ shouldShowMockedLegacySearch && <MockedLegacySearch /> }
			{ ! shouldShowMockedLegacySearch && <MockedInstantSearch /> }
		</Fragment>
	);
}
