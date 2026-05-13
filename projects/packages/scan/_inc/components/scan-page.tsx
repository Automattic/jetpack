import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { useHeaderActions } from '../../src/js/header-actions-context';
import './scan-page.scss';
import type { ReactNode } from 'react';

export type ScanTab = 'active' | 'history';

type Props = {
	activeTab: ScanTab;
	children: ReactNode;
};

/**
 * Shared chrome for the Scan page — wraps the Jetpack `AdminPage`
 * (header + footer + the `.jp-admin-page` selector hook the
 * `jetpack-admin-page-layout` mixin keys off) and hosts a single
 * `Tabs.Root` so the active-tab indicator slides between Active and
 * History instead of remounting on each route hop.
 *
 * @param props           - Component props.
 * @param props.activeTab - Which tab the current route represents.
 * @param props.children  - Tab panel content (Tabs.Panel siblings).
 * @return The Scan page shell.
 */
export default function ScanPage( { activeTab, children }: Props ): JSX.Element {
	const navigate = useNavigate();
	const headerActions = useHeaderActions();

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'active' && next !== 'history' ) {
				return;
			}
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab: next === 'history' ? 'history' : undefined,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	return (
		<AdminPage
			title={ 'Scan' /* product name; not translated */ }
			subTitle={ __(
				'Find and fix vulnerabilities and suspicious files on your site.',
				'jetpack-scan-page'
			) }
			actions={ headerActions }
		>
			<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
				<div className="jp-admin-page-tabs">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="active">{ __( 'Active threats', 'jetpack-scan-page' ) }</Tabs.Tab>
						<Tabs.Tab value="history">{ __( 'History', 'jetpack-scan-page' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				{ children }
			</Tabs.Root>
		</AdminPage>
	);
}
