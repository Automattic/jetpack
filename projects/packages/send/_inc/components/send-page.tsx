import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Badge, Tabs, Text, Tooltip, VisuallyHidden } from '@wordpress/ui';
import './send-page.scss';
import type { ReactNode } from 'react';

/**
 * What Development mode means. The header badge's tooltip and Settings › Domain both say it, so it
 * can be read without hovering.
 *
 * @return The hint.
 */
export const devModeHint = () =>
	__(
		'This site makes its own sending accounts for development, instead of getting them from WordPress.com.',
		'jetpack-send-pkg'
	);

export type SendTab = 'overview' | 'log' | 'settings' | 'debug-log';

const ROUTE_BY_TAB: Record< SendTab, string > = {
	overview: '/',
	log: '/log',
	settings: '/settings',
	'debug-log': '/debug-log',
};

type Props = {
	/** The tab for the currently rendered route. */
	active: SendTab;
	/** Log and Settings only exist once the site has an account; Overview's tab shows from the start. */
	showTabs: boolean;
	/** The Debug log tab, which shows while the debug log records: the reminder that it's on. */
	showDebugTab?: boolean;
	/** Whether to render the Jetpack footer; DataViews tabs hide it. Defaults to true. */
	showFooter?: boolean;
	/** Full-width, full-height content with no padding, for DataViews tabs. */
	flush?: boolean;
	/** A wider column, for the two-column setup page and the dashboard. */
	wide?: boolean;
	/** Accounts come from the local development provisioner. */
	devMode?: boolean;
	children: ReactNode;
};

/**
 * Shared chrome for every Send route: the Jetpack header and footer plus tab navigation.
 *
 * @param props              - Component props.
 * @param props.active       - The active tab.
 * @param props.showTabs     - Whether to show the Log and Settings tabs.
 * @param props.showDebugTab - Whether to show the Debug log tab.
 * @param props.showFooter   - Whether to render the Jetpack footer.
 * @param props.flush        - Render the content full-bleed.
 * @param props.wide         - Render the wider column.
 * @param props.devMode      - Show the development mode badge.
 * @param props.children     - The route's screen.
 * @return The Send page.
 */
const SendPage = ( {
	active,
	showTabs,
	showDebugTab = false,
	showFooter = true,
	flush = false,
	wide = false,
	devMode = false,
	children,
}: Props ) => {
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

	let contentClass = 'jetpack-send-page__content';
	if ( flush ) {
		contentClass += ' jetpack-send-page__content--flush';
	} else if ( wide ) {
		contentClass += ' jetpack-send-page__content--wide';
	}
	const content = <div className={ contentClass }>{ children }</div>;

	return (
		<AdminPage
			title="Send"
			subTitle={ __( 'Reliable delivery for the emails your site sends.', 'jetpack-send-pkg' ) }
			apiRoot={ site?.rest_root }
			apiNonce={ site?.rest_nonce }
			showFooter={ showFooter }
			actions={
				devMode ? (
					<Tooltip.Root>
						<Tooltip.Trigger className="jetpack-send-status-trigger">
							<Badge intent="informational">{ __( 'Development mode', 'jetpack-send-pkg' ) }</Badge>
							<VisuallyHidden render={ <span /> }>{ devModeHint() }</VisuallyHidden>
						</Tooltip.Trigger>
						<Tooltip.Popup>
							<Text variant="body-md">{ devModeHint() }</Text>
						</Tooltip.Popup>
					</Tooltip.Root>
				) : undefined
			}
		>
			{ /* The strip shows from the start, so the page doesn't drop when Log and Settings join it mid-setup. */ }
			<Tabs.Root className="jetpack-send-tabs" value={ active } onValueChange={ onTabChange }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-send-pkg' ) }</Tabs.Tab>
						{ showTabs && <Tabs.Tab value="log">{ __( 'Log', 'jetpack-send-pkg' ) }</Tabs.Tab> }
						{ showTabs && (
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-send-pkg' ) }</Tabs.Tab>
						) }
						{ showTabs && showDebugTab && (
							<Tabs.Tab value="debug-log">{ __( 'Debug log', 'jetpack-send-pkg' ) }</Tabs.Tab>
						) }
					</Tabs.List>
				</div>
				{ content }
			</Tabs.Root>
		</AdminPage>
	);
};

export default SendPage;
