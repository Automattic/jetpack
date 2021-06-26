/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import restApi from 'rest-api';
import Masthead from 'components/masthead';
import { setInitialState, getApiNonce, getApiRootUrl } from 'state/initial-state';
import ModuleControl from './module-control';
import MockedInstantSearchDialog from './mocked-instant-search-dialog';
import './style.scss';

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
					<h1>Help your visitors find exactly</h1>
					<h1>what they&#39;re looking for, fast</h1>
				</div>
				<div className="jp-search-dashboard__search-dialog">
					<MockedInstantSearchDialog />
				</div>
			</div>
			<div className="jp-search-dashboard__bottom">
				<ModuleControl />
			</div>
		</Fragment>
	);
}

export default connect(
	state => ( {
		apiRootUrl: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
	} ),
	{ setInitialState }
)( SearchDashboard );
