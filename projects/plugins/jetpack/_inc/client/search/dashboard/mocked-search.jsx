/**
 * External dependencies
 */
import React, { Fragment } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import MockedInstantSearch from './mocked-instant-search';
import MockedLegacySearch from './mocked-legacy-search';
import { getPlanClass } from 'lib/plans/constants';

/**
 * State dependencies
 */
import { getSitePlan, hasActiveSearchPurchase as selectHasActiveSearchPurchase } from 'state/site';

/**
 * Mocked Search component, which shows mocked Instant Search or legacy Search interface.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Mocked Search interface component.
 */
function MockedSearch( props ) {
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

export default connect( state => {
	const planClass = getPlanClass( getSitePlan( state ).product_slug );
	return {
		hasActiveSearchPurchase: selectHasActiveSearchPurchase( state ),
		isBusinessPlan: 'is-business-plan' === planClass,
	};
} )( MockedSearch );
