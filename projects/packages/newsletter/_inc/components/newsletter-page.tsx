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
	children: ReactNode;
};

const PRODUCT_NAME = 'Newsletter'; /** "Newsletter" is a product name, do not translate. */

const SUBTITLES: Record< NewsletterTab, () => string > = {
	subscribers: () => __( 'Reach and grow your audience with newsletters.', 'jetpack-newsletter' ),
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
 * @param props.children          - Tab content.
 * @return The unified Newsletter page shell.
 */
export default function NewsletterPage( {
	activeTab,
	actions,
	contentHasPadding = true,
	children,
}: Props ): JSX.Element {
	const navigate = useNavigate();
	const subscribersEnabled = getNewsletterScriptData()?.subscriberManagementEnabled !== false;

	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next === 'subscribers' ) {
				navigate( { to: '/' } as unknown as Parameters< typeof navigate >[ 0 ] );
			} else if ( next === 'settings' ) {
				navigate( { to: '/settings' } as unknown as Parameters< typeof navigate >[ 0 ] );
			}
		},
		[ navigate ]
	);

	const title = (
		<Stack direction="row" align="center" gap="xs">
			<JetpackLogo height={ 20 } showText={ false } />
			<span>{ PRODUCT_NAME }</span>
		</Stack>
	);

	const contentClass = contentHasPadding
		? 'jetpack-newsletter-page__content jetpack-newsletter-page__content--padded'
		: 'jetpack-newsletter-page__content';

	const renderActiveContent = ( tab: NewsletterTab ) =>
		activeTab === tab ? <div className={ contentClass }>{ children }</div> : null;

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
					{ /* Each tab needs a matching Panel (WAI-ARIA pattern). The content
					     is route-driven, so the inactive Panel just stays empty. */ }
					<Tabs.Panel value="subscribers" focusable={ false }>
						{ renderActiveContent( 'subscribers' ) }
					</Tabs.Panel>
					<Tabs.Panel value="settings" focusable={ false }>
						{ renderActiveContent( 'settings' ) }
					</Tabs.Panel>
				</Tabs.Root>
			) : (
				<div className={ contentClass }>{ children }</div>
			) }
		</Page>
	);
}
