import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import Overview from './components/overview';
import SettingsTab from './components/settings-tab';
import useProtectSettings from './data/use-protect-settings';
import sections from './sections';
import './route.scss';

/**
 * Boot stage for the Protect dashboard: Overview, any section tabs, then Settings; the active one in `?tab=`.
 *
 * @return The Protect page.
 */
const Stage = () => {
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as { tab?: string };
	const navigate = useNavigate();
	const goTo = useCallback(
		( next: unknown ) => {
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: next === 'overview' ? undefined : next,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);
	const openSettings = useCallback( () => goTo( 'settings' ), [ goTo ] );
	const settings = useProtectSettings();
	const context = useMemo( () => ( { settings, openSettings } ), [ settings, openSettings ] );

	const state = window.jetpackProtectDashboard ?? {};
	const sectionTabs = sections.flatMap( section =>
		section.tab && section.tab.isAvailable( { ...context, state: state[ section.key ] } )
			? [ { key: section.key, ...section.tab } ]
			: []
	);
	const tabValues = [ 'overview', ...sectionTabs.map( tab => tab.value ), 'settings' ];
	const activeTab = tabValues.includes( search.tab ?? '' ) ? ( search.tab as string ) : 'overview';

	return (
		<AdminPage
			className="jp-protect-dashboard"
			// "Protect" is a product name and is not translated.
			title="Protect"
			subTitle={ __(
				'Security tools that keep your site safe and sound, from posts to plugins.',
				'jetpack'
			) }
		>
			<Tabs.Root value={ activeTab } onValueChange={ goTo }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack' ) }</Tabs.Tab>
						{ sectionTabs.map( tab => (
							<Tabs.Tab key={ tab.value } value={ tab.value }>
								{ tab.label() }
							</Tabs.Tab>
						) ) }
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className="jp-protect-dashboard__body">
					<Tabs.Panel value="overview">
						{ activeTab === 'overview' && <Overview { ...context } /> }
					</Tabs.Panel>
					{ sectionTabs.map( ( { key, value, Panel } ) => (
						<Tabs.Panel key={ value } value={ value }>
							{ activeTab === value && <Panel { ...context } state={ state[ key ] } /> }
						</Tabs.Panel>
					) ) }
					<Tabs.Panel value="settings">
						{ activeTab === 'settings' && <SettingsTab { ...context } /> }
					</Tabs.Panel>
				</div>
			</Tabs.Root>
		</AdminPage>
	);
};

export { Stage as stage };
