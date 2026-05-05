/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';

export type DashboardTab = 'overview' | 'library' | 'settings';

const TAB_PATHS: Record< DashboardTab, string > = {
	overview: '/',
	library: '/library',
	settings: '/settings',
};

type Props = {
	activeTab: DashboardTab;
};

/**
 * Top-level Overview / Library / Settings tab strip for the wp-build
 * VideoPress dashboard. Tab clicks navigate between sibling routes.
 *
 * @param props           - Component props.
 * @param props.activeTab - Tab to render with the active indicator.
 * @return The tab strip element.
 */
export default function DashboardTabs( { activeTab }: Props ) {
	const navigate = useNavigate();

	const onValueChange = useCallback(
		( next: string ) => {
			const target = TAB_PATHS[ next as DashboardTab ];
			if ( target ) {
				navigate( { href: target } );
			}
		},
		[ navigate ]
	);

	return (
		<Tabs.Root value={ activeTab } onValueChange={ onValueChange }>
			<Tabs.List variant="minimal">
				<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="library">{ __( 'Library', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
			</Tabs.List>
		</Tabs.Root>
	);
}
