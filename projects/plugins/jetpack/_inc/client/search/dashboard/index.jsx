/**
 * External dependencies
 */
import React, { Fragment, useMemo } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { JetpackFooter } from '@automattic/jetpack-components';
import restApi from '@automattic/jetpack-api';
import Masthead from 'components/masthead';
import LoadingPlaceHolder from 'components/loading-placeholder';
import ModuleControl from './module-control';
import MockedSearch from './mocked-search';
import analytics from '../../lib/analytics';
import './style.scss';

/**
 * State dependencies
 */
import { isFetchingSitePurchases } from 'state/site';
import {
	setInitialState,
	getApiNonce,
	getApiRootUrl,
	getSiteAdminUrl,
	getTracksUserData,
	getCurrentVersion,
} from 'state/initial-state';

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
	const {
		apiRootUrl,
		apiNonce,
		setInitialState: setSearchDashboardInitialState,
		siteAdminUrl,
	} = props;

	const initializeAnalytics = () => {
		const tracksUser = props.tracksUserData;

		if ( tracksUser ) {
			analytics.initialize( tracksUser.userid, tracksUser.username, {
				blog_id: tracksUser.blogid,
			} );
		}
	};

	useComponentWillMount( () => {
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
		setSearchDashboardInitialState && setSearchDashboardInitialState();
		initializeAnalytics();
		analytics.tracks.recordEvent( 'jetpack_search_admin_page_view', {
			current_version: props.currentVersion,
		} );
	} );

	const aboutPageUrl = siteAdminUrl + 'admin.php?page=jetpack_about';

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
							<MockedSearch />
						</div>
					</div>
					<div className="jp-search-dashboard__bottom">
						<ModuleControl />
						<JetpackFooter
							a8cLogoHref={ aboutPageUrl }
							moduleName={ __( 'Jetpack Search', 'jetpack' ) }
						/>
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
			siteAdminUrl: getSiteAdminUrl( state ),
			tracksUserData: getTracksUserData( state ),
			currentVersion: getCurrentVersion( state ),
		};
	},
	{ setInitialState }
)( SearchDashboard );
