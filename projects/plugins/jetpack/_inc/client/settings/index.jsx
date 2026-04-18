// NOTE: `ThemeProvider` is imported from `@automattic/jetpack-components` because
// neither `@wordpress/ui` nor `@wordpress/components` exposes an equivalent that
// injects Jetpack's `--jp-*` CSS custom properties consumed by `style.scss`.
// It is a theming shim (CSS-variable injector), not a UI primitive, so it
// remains until an upstream equivalent is available.
import { ThemeProvider } from '@automattic/jetpack-components';
import { SnackbarList } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
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

/**
 * Renders the global snackbar notices list for the Settings page.
 *
 * Inlined here (instead of importing `GlobalNotices` from the forbidden
 * `@automattic/jetpack-components`) so that UI primitives come from
 * `@wordpress/components` (`SnackbarList`). `@wordpress/ui` has no snackbar
 * equivalent at this time.
 *
 * @return {import('react').ReactNode} The snackbar notices list.
 */
const SettingsGlobalNotices = () => {
	const { removeNotice } = useDispatch( noticesStore );
	const notices = useSelect( select => select( noticesStore ).getNotices(), [] );
	const snackbarNotices = notices.filter( ( { type } ) => type === 'snackbar' ).slice( -3 );

	return <SnackbarList notices={ snackbarNotices } onRemove={ removeNotice } />;
};

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
					<Subscriptions
						siteRawUrl={ siteRawUrl }
						blogID={ blogID }
						active={ '/newsletter' === pathname }
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
					<SearchableModules searchTerm={ searchTerm } />
				</div>
				<SettingsGlobalNotices />
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
