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
import LoadingPlaceHolder from 'components/loading-placeholder';
import ModuleControl from './module-control';
import MockedInstantSearch from './mocked-instant-search';
import './style.scss';

/**
 * State dependencies
 */
import { isFetchingSitePurchases } from 'state/site';
import { setInitialState, getApiNonce, getApiRootUrl } from 'state/initial-state';

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
	// NOTE: API root and nonce must be set before any components are mounted!
	const { apiRootUrl, apiNonce, setInitialState: setSearchDashboardInitialState } = props;

	useComponentWillMount( () => {
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		setSearchDashboardInitialState && setSearchDashboardInitialState();
	} );

	return (
		<Fragment>
			{ props.isLoading && <LoadingPlaceHolder /> }
			{ ! props.isLoading && (
				<Fragment>
					<Masthead></Masthead>
					<div className="jp-search-dashboard__top">
						<div className="jp-search-dashboard__title">
							<h1>
								{ __(
									"Help your visitors find exactly what they're looking for, fast",
									'jetpack'
								) }
							</h1>
						</div>
						<div className="jp-search-dashboard__mocked-search-interface">
							<MockedInstantSearch />
						</div>
					</div>
					<div className="jp-search-dashboard__bottom">
						<ModuleControl />
					</div>
				</Fragment>
			) }
		</Fragment>
	);
}

export default connect(
	state => {
		return {
			apiRootUrl: getApiRootUrl( state ),
			apiNonce: getApiNonce( state ),
			isLoading: isFetchingSitePurchases( state ),
		};
	},
	{ setInitialState }
)( SearchDashboard );
