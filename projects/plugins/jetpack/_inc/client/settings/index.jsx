import { GlobalNotices, ThemeProvider } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { EmptyState, Stack } from '@wordpress/ui';
import { Component } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router';
import Discussion from 'discussion';
import Earn from 'earn';
import Subscriptions from 'newsletter';
import Performance from 'performance';
import Privacy from 'privacy';
import Reader from 'reader';
import SearchableModules from 'searchable-modules';
import Security from 'security';
import Sharing from 'sharing';
import { isModuleActivated as isModuleActivatedSelector } from 'state/modules';
import { hasAnyMatchingModule as hasAnyMatchingModuleSelector } from 'state/search';
import Traffic from 'traffic';
import Writing from 'writing';
import { FEATURE_JETPACK_EARN } from '../lib/plans/constants';

class Settings extends Component {
	static displayName = 'SearchableSettings';

	render() {
		const {
			location = { pathname: '' },
			rewindStatus,
			searchTerm,
			siteAdminUrl,
			siteRawUrl,
			blogID,
			userCanManageModules,
			hasAnyMatchingModule,
		} = this.props;
		const { pathname } = location;
		const commonProps = {
			searchTerm,
			rewindStatus,
			userCanManageModules,
		};
		const showEmptySearchState = !! searchTerm && ! hasAnyMatchingModule;

		return (
			<ThemeProvider>
				<div className="jp-settings-container">
					{ showEmptySearchState && (
						<Stack justify="center" className="jp-settings__empty-search-results">
							<EmptyState.Root>
								<EmptyState.Visual>
									<EmptyState.Icon icon={ search } />
								</EmptyState.Visual>
								<EmptyState.Title>{ __( 'No matching settings', 'jetpack' ) }</EmptyState.Title>
								<EmptyState.Description>
									{ sprintf(
										/* translators: %s: a search term entered in search form. */
										__( 'No search results found for %s', 'jetpack' ),
										searchTerm
									) }
								</EmptyState.Description>
							</EmptyState.Root>
						</Stack>
					) }
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
					<Reader active={ '/reader' === pathname } blogID={ blogID } { ...commonProps } />
					<Earn
						siteRawUrl={ siteRawUrl }
						active={ '/earn' === pathname }
						feature={ FEATURE_JETPACK_EARN }
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
					<Subscriptions siteAdminUrl={ siteAdminUrl } searchTerm={ searchTerm } />
					<SearchableModules searchTerm={ searchTerm } />
				</div>
				<GlobalNotices />
			</ThemeProvider>
		);
	}
}

export default connect( state => {
	return {
		isModuleActivated: module => isModuleActivatedSelector( state, module ),
		hasAnyMatchingModule: hasAnyMatchingModuleSelector( state ),
	};
} )( props => <Settings { ...props } location={ useLocation() } /> );
