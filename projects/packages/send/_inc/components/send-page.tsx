import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs, useEnableWpCompatOverlaySlot } from '@wordpress/ui';
import './send-page.scss';
import type { ReactNode } from 'react';

export type SendTab = 'overview' | 'log' | 'settings';

const ROUTE_BY_TAB: Record< SendTab, string > = {
	overview: '/',
	log: '/log',
	settings: '/settings',
};

type Props = {
	/** The tab for the currently rendered route. */
	active: SendTab;
	/** Log and Settings only exist once the site is set up. */
	showTabs: boolean;
	/** Whether to render the Jetpack footer; DataViews tabs hide it. Defaults to true. */
	showFooter?: boolean;
	/** Full-width, full-height content with no padding, for DataViews tabs. */
	flush?: boolean;
	children: ReactNode;
};

/**
 * Shared chrome for every Send route: the Jetpack header and footer plus tab navigation.
 *
 * @param props            - Component props.
 * @param props.active     - The active tab.
 * @param props.showTabs   - Whether to show the tab strip.
 * @param props.showFooter - Whether to render the Jetpack footer.
 * @param props.flush      - Render the content full-bleed.
 * @param props.children   - The route's screen.
 * @return The Send page.
 */
const SendPage = ( { active, showTabs, showFooter = true, flush = false, children }: Props ) => {
	// Opts into the overlay slot that stacks @wordpress/ui overlays above the wp-admin menu.
	useEnableWpCompatOverlaySlot();
	const navigate = useNavigate();
	const site = getSiteData();
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next && next in ROUTE_BY_TAB ) {
				navigate( { href: ROUTE_BY_TAB[ next as SendTab ] } );
			}
		},
		[ navigate ]
	);

	const contentClass = flush
		? 'jetpack-send-page__content jetpack-send-page__content--flush'
		: 'jetpack-send-page__content';
	const content = <div className={ contentClass }>{ children }</div>;

	return (
		<AdminPage
			title="Send"
			subTitle={ __( 'Reliable delivery for the emails your site sends.', 'jetpack-send-pkg' ) }
			apiRoot={ site?.rest_root }
			apiNonce={ site?.rest_nonce }
			showFooter={ showFooter }
		>
			{ showTabs ? (
				<Tabs.Root className="jetpack-send-tabs" value={ active } onValueChange={ onTabChange }>
					<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-send-pkg' ) }</Tabs.Tab>
							<Tabs.Tab value="log">{ __( 'Log', 'jetpack-send-pkg' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-send-pkg' ) }</Tabs.Tab>
						</Tabs.List>
					</div>
					{ content }
				</Tabs.Root>
			) : (
				content
			) }
		</AdminPage>
	);
};

export default SendPage;
