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
import ModuleCard from './module-control';
import InstantSearchConfigCard from './instant-search-configurator';
import './style.scss';

const useComponentWillMount = func => {
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
			<div className="jp-lower">
				<ModuleCard />
				<InstantSearchConfigCard />
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
