import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import { Tabs } from '@wordpress/ui';
import clsx from 'clsx';
import './boost-page.scss';
import type { ReactNode } from 'react';
import type { Tab } from '../runtime-contract';

type Props = {
	activeTab: Tab;
	isSubpage: boolean;
	onTabChange: ( tab: string | null ) => void;
	children: ReactNode;
	subpage: ReactNode;
	actions?: ReactNode;
};

export default function BoostPage( {
	activeTab,
	isSubpage,
	onTabChange,
	children,
	subpage,
	actions,
}: Props ) {
	return (
		<AdminPage
			className={ clsx( 'jetpack-boost-page', { 'jetpack-boost-page--subpage': isSubpage } ) }
			title="Boost"
			subTitle={ __( 'Improve your site speed and performance.', 'jetpack-boost' ) }
			actions={ actions }
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
