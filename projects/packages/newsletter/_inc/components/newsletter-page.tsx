import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Tabs } from '@wordpress/ui';
import { getNewsletterScriptData } from '../../src/settings/script-data';
import './newsletter-page.scss';
import type { ReactNode } from 'react';

export type NewsletterTab = 'subscribers' | 'settings';

type Props = {
	activeTab: NewsletterTab;
	actions?: ReactNode;
	/**
	 * Whether the active tab's CONTENT should sit inside a horizontally-padded
	 * container. The tab nav itself is always padded the same way regardless
	 * of this prop, so the bar doesn't shift between Subscribers and Settings.
	 */
	contentHasPadding?: boolean;
	/**
	 * Hide the `JetpackFooter` at the bottom of the page. Mirrors VideoPress's
	 * `DashboardLayout` prop: cards-style tabs (Settings) keep the footer,
	 * DataViews-driven tabs (Subscribers) opt out because the wrapper grows
	 * to fill the viewport and leaves no room beneath it.
	 */
	hideFooter?: boolean;
	/**
	 * `Tabs.Panel` children. The shell renders one `Tabs.Root` + `Tabs.List`
	 * shared across both tabs so the animated active-tab indicator slides
	 * between them — clients hand in the panels, the shell handles routing.
	 */
	children: ReactNode;
};

const PRODUCT_NAME = 'Newsletter'; /** "Newsletter" is a product name, do not translate. */

const SUBTITLES: Record< NewsletterTab, () => string > = {
	subscribers: () => __( 'Manage everyone subscribed to your site.', 'jetpack-newsletter' ),
	settings: () =>
		__(
			'Configure how your newsletter looks, behaves, and reaches subscribers.',
			'jetpack-newsletter'
		),
};

/**
 * Shared chrome for the unified Newsletter page — owns the `Page` from
 * `@wordpress/admin-ui` plus the Subscribers / Settings tab nav. The shell
 * always passes `hasPadding={ false }` to `Page` and applies its own padding
 * to the tab bar + content via `newsletter-page.scss`, so the bar holds a
 * consistent position no matter which tab is active.
 *
 * The Subscribers tab is hidden when
 * `jetpack_wp_admin_subscriber_management_enabled` is filtered to false
 * (server-side), keeping the page Settings-only on hosts that defer
 * subscriber management to Calypso.
 *
 * @param props                   - Component props.
 * @param props.activeTab         - Which tab the current route represents.
 * @param props.actions           - Optional actions slot (top-right of the Page header).
 * @param props.contentHasPadding - Whether the active tab's content gets the page's horizontal padding (defaults to true).
 * @param props.hideFooter        - When true, suppresses the `JetpackFooter` rendered beneath the body slot.
 * @param props.children          - Tab content.
 * @return The unified Newsletter page shell.
 */
export default function NewsletterPage( {
	activeTab,
	actions,
	contentHasPadding = true,
	hideFooter = false,
	children,
}: Props ): JSX.Element {
	const navigate = useNavigate();
	const subscribersEnabled = getNewsletterScriptData()?.subscriberManagementEnabled !== false;

	// Keep the route at `/` and toggle tabs via a `?tab=` search param so the
	// `Tabs.Root` mounts once and the active-tab indicator can animate.
	// Clear the subscriber-detail inspector params (`subscriber`, `u`) on
	// every tab switch — those are Subscribers-tab-only state, but
	// `route.inspector` decides visibility from search alone, so without
	// this reset the inspector hitchhikes across to Settings.
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'subscribers' && next !== 'settings' ) {
				return;
			}
			navigate( {
				search: {
					tab: next === 'settings' ? 'settings' : undefined,
					subscriber: undefined,
					u: undefined,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const contentClass = contentHasPadding
		? 'jetpack-newsletter-page__content jetpack-newsletter-page__content--padded'
		: 'jetpack-newsletter-page__content';

	// Render the Jetpack mark alongside the product name in the page header,
	// matching the title convention other modernized Jetpack products
	// (Forms, Backup, VideoPress) use on the wp-build chassis.
	const title = (
		<Stack direction="row" align="center" gap="sm">
			<JetpackLogo height={ 20 } showText={ false } />
			{ /* "Newsletter" is a product name, do not translate. */ }
			<span>{ PRODUCT_NAME }</span>
		</Stack>
	);

	return (
		<Page
			title={ title }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ SUBTITLES[ activeTab ]() }
			actions={ actions }
			hasPadding={ false }
		>
			{ subscribersEnabled ? (
				<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
					{ /* Wrapper carries the full-width bottom border. The Tabs.List
					     inside keeps its native `width: fit-content` so the
					     animated active-tab indicator slides smoothly. */ }
					<div className="jetpack-newsletter-page__tabs-row">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="subscribers">{ __( 'Subscribers', 'jetpack-newsletter' ) }</Tabs.Tab>
							<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-newsletter' ) }</Tabs.Tab>
						</Tabs.List>
					</div>
					<div className={ contentClass }>{ children }</div>
				</Tabs.Root>
			) : (
				<div className={ contentClass }>{ children }</div>
			) }
			{ ! hideFooter && <JetpackFooter /> }
		</Page>
	);
}
