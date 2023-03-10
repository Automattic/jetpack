import { __, sprintf } from '@wordpress/i18n';
import Discussion from 'discussion';
import Performance from 'performance';
import Privacy from 'privacy';
import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import SearchableModules from 'searchable-modules';
import Security from 'security';
import Sharing from 'sharing';
import { isModuleActivated as isModuleActivatedSelector } from 'state/modules';
import Traffic from 'traffic';
import Writing from 'writing';

class Settings extends React.Component {
	static displayName = 'SearchableSettings';

	render() {
		const {
			location = { pathname: '' },
			rewindStatus,
			searchTerm,
			siteAdminUrl,
			siteRawUrl,
			userCanManageModules,
		} = this.props;
		const { pathname } = location;
		const commonProps = {
			searchTerm,
			rewindStatus,
			userCanManageModules,
		};

		return (
			<div className="jp-settings-container">
				<div className="jp-no-results">
					{ searchTerm
						? sprintf(
								/* translators: placeholder is a searchterm entered in searchform. */
								__( 'No search results found for %s', 'jetpack' ),
								searchTerm
						  )
						: __( 'Enter a search term to find settings or close search.', 'jetpack' ) }
				</div>
				<Security
					siteAdminUrl={ siteAdminUrl }
					siteRawUrl={ siteRawUrl }
					active={
						'/security' === pathname || ( '/settings' === pathname && userCanManageModules )
					}
					{ ...commonProps }
				/>
				<Discussion
					siteRawUrl={ siteRawUrl }
					active={ '/discussion' === pathname }
					{ ...commonProps }
				/>
				<Performance active={ '/performance' === pathname } { ...commonProps } />
				<Traffic
					siteRawUrl={ siteRawUrl }
					siteAdminUrl={ siteAdminUrl }
					active={ '/traffic' === pathname }
					{ ...commonProps }
				/>
				<Writing
					siteAdminUrl={ siteAdminUrl }
					active={
						'/writing' === pathname ||
						( ! userCanManageModules &&
							this.props.isModuleActivated( 'post-by-email' ) &&
							! this.props.isModuleActivated( 'publicize' ) )
					}
					{ ...commonProps }
				/>
				<Sharing
					siteAdminUrl={ siteAdminUrl }
					active={
						'/sharing' === pathname ||
						( '/settings' === pathname &&
							! userCanManageModules &&
							this.props.isModuleActivated( 'publicize' ) )
					}
					{ ...commonProps }
				/>
				<Privacy active={ '/privacy' === pathname } { ...commonProps } />
				<SearchableModules searchTerm={ searchTerm } />
			</div>
		);
	}
}

export default connect( state => {
	return {
		isModuleActivated: module => isModuleActivatedSelector( state, module ),
	};
} )( withRouter( Settings ) );
