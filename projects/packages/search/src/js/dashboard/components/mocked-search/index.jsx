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
 * State dependencies
 */

/**
 * Mocked Search component, which shows mocked Instant Search or legacy Search interface.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Mocked Search interface component.
 */
export default function MockedSearch( props ) {
	const { hasActiveSearchPurchase, isBusinessPlan } = props;
	// We only want to show the legacy search mock to users with bussiness plan but no search subscription.
	// For all other cases, we show our Instant Search experience mock.
	const shouldShowMockedLegacySearch = isBusinessPlan && ! hasActiveSearchPurchase;

	return (
		<Fragment>
			{ shouldShowMockedLegacySearch && <MockedLegacySearch /> }
			{ ! shouldShowMockedLegacySearch && <MockedInstantSearch /> }
		</Fragment>
	);
}
