/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import Masthead from 'components/masthead';
import { setInitialState, getApiNonce, getApiRootUrl } from 'state/initial-state';
import ModuleControl from './module-control';
import MockedInstantSearch from './mocked-instant-search';
import { getPlanClass } from 'lib/plans/constants';
import './style.scss';

/**
 * State dependencies
 */
import { getSitePlan, hasActiveSearchPurchase as selectHasActiveSearchPurchase } from 'state/site';
import MockedSearch from './mocked-search';

const useComponentWillMount = func => {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useMemo( func, [] );
};

/**
 * SearchDashboard component definition.
 *
 * @param {object} props - Component properties.
 * @returns {React.Component} Search dashboard component.
 */
function SearchDashboard( props ) {
	// TODO: Re-enable once react-redux@7 is live on repo.
	// const apiRootUrl = useSelector( state => getApiRootUrl( state ) );
	// const apiNonce = useSelector( state => getApiNonce( state ) );
	// const setInitialState = useDispatch( dispatch => dispatch( setInitialStateAction() ) );

	// NOTE: API root and nonce must be set before any components are mounted!
	const { apiRootUrl, apiNonce, setInitialState: dispatchedSetInitialState } = props;
	const showMockedInstantSearch = ! props.isBusinessPlan && props.hasActiveSearchPurchase;

	useComponentWillMount( () => {
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		dispatchedSetInitialState && dispatchedSetInitialState();
	} );

	return (
		<Fragment>
			<Masthead></Masthead>
			<div className="jp-search-dashboard__top">
				<div className="jp-search-dashboard__title">
					<h1>
						{ __( "Help your visitors find exactly what they're looking for, fast", 'jetpack' ) }
					</h1>
				</div>
				<div className="jp-search-dashboard__search-dialog">
					{ showMockedInstantSearch ? <MockedInstantSearch /> : <MockedSearch /> }
				</div>
			</div>
			<div className="jp-search-dashboard__bottom">
				<ModuleControl />
			</div>
		</Fragment>
	);
}

export default connect(
	state => {
		const planClass = getPlanClass( getSitePlan( state ).product_slug );
		return {
			apiRootUrl: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			isBusinessPlan: 'is-business-plan' === planClass,
			hasActiveSearchPurchase: selectHasActiveSearchPurchase( state ),
		};
	},
	{ setInitialState }
)( SearchDashboard );
