import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { AdsSettings } from './components/ads-settings';
import Placeholder from './components/placeholder';
import { getAdsSettingsData } from './data/ads-settings-data';
import { getTab, getTabSearch, getTabs } from './data/tabs';
import './route.scss';

/**
 * Boot stage for the Monetize dashboard: one tab per screen, the active one in `?tab=`.
 *
 * @return The Monetize page.
 */
const Stage = () => {
	const tabs = getTabs( Boolean( getAdsSettingsData() ) );
	// `@wordpress/route` types no route tree, so `from` and the navigate argument below need a cast.
	const search: Record< string, unknown > = useSearch( { from: '/' as never, strict: false } );
	const activeTab = getTab( search.tab, tabs ).value;
	const navigate = useNavigate();
	const openTab = useCallback(
		( next: string ) => {
			navigate( {
				search: ( prev: Record< string, unknown > ) => getTabSearch( prev, next ),
			} as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	return (
		<AdminPage
			className="jp-monetize-dashboard"
			title={ __( 'Monetize', 'jetpack-monetize' ) }
			ariaLabel={ __( 'Monetize', 'jetpack-monetize' ) }
		>
			<Tabs.Root value={ activeTab } onValueChange={ openTab }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						{ tabs.map( tab => (
							<Tabs.Tab key={ tab.value } value={ tab.value }>
								{ tab.label() }
							</Tabs.Tab>
						) ) }
					</Tabs.List>
				</div>
				<div className="jp-monetize-dashboard__body">
					{ /* The JITM script moves its card here, since the page template hides the default spot. */ }
					<div id="jp-admin-notices" />
					{ tabs.map( tab => (
						<Tabs.Panel key={ tab.value } value={ tab.value }>
							{ tab.value === 'settings' ? <AdsSettings /> : <Placeholder /> }
						</Tabs.Panel>
					) ) }
				</div>
			</Tabs.Root>
		</AdminPage>
	);
};

export { Stage as stage };
