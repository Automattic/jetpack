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
 *Mocked Search component, which shows mocked Instant Search or legacy Search interface.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Mocked Search interface component.
 */
function MockedSearch( props ) {
	const { hasActiveSearchPurchase, isBusinessPlan } = props;
	const shouldShowMockedInstantSearch = ! isBusinessPlan || hasActiveSearchPurchase;

	return (
		<Fragment>
			{ shouldShowMockedInstantSearch && <MockedInstantSearch /> }
			{ ! shouldShowMockedInstantSearch && <MockedLegacySearch /> }
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
