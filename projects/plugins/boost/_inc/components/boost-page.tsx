import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import clsx from 'clsx';
import './boost-page.scss';
import type { ReactNode } from 'react';

export type BoostTab = 'overview' | 'settings';

type Props = {
	activeTab: BoostTab;
	isSubpage: boolean;
	onTabChange: ( tab: string | null ) => void;
	children: ReactNode;
	subpage: ReactNode;
};

export default function BoostPage( {
	activeTab,
	isSubpage,
	onTabChange,
	children,
	subpage,
}: Props ) {
	return (
		<AdminPage
			className={ clsx( 'jetpack-boost-page', { 'jetpack-boost-page--subpage': isSubpage } ) }
			title="Boost"
			apiRoot={ wpApiSettings.root }
			apiNonce={ wpApiSettings.nonce }
			showFooter={ ! isSubpage }
		>
			<div hidden={ isSubpage }>
				<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
					<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-boost' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-boost' ) }</Tabs.Tab>
						</Tabs.List>
					</div>
					<div className="jetpack-boost-page__content">{ children }</div>
				</Tabs.Root>
			</div>
			{ subpage }
		</AdminPage>
	);
}
