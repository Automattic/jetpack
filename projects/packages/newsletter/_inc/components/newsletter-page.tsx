import { Page } from '@wordpress/admin-ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { getNewsletterScriptData } from '../../src/settings/script-data';
import type { ReactNode } from 'react';

export type NewsletterTab = 'subscribers' | 'settings';

type Props = {
	activeTab: NewsletterTab;
	actions?: ReactNode;
	hasPadding?: boolean;
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
 * `@wordpress/admin-ui` plus the Subscribers / Settings tab nav. Each
 * route's stage renders its content as `children`; the shell handles the
 * title, subtitle, actions slot, and tab routing.
 *
 * The Subscribers tab is hidden when
 * `jetpack_wp_admin_subscriber_management_enabled` is filtered to false
 * (server-side), keeping the page Settings-only on hosts that defer
 * subscriber management to Calypso.
 *
 * @param props            - Component props.
 * @param props.activeTab  - Which tab the current route represents.
 * @param props.actions    - Optional actions slot (top-right of the Page header).
 * @param props.hasPadding - Whether `Page` should apply its default content padding.
 * @param props.children   - Tab content.
 * @return The unified Newsletter page shell.
 */
export default function NewsletterPage( {
	activeTab,
	actions,
	hasPadding = true,
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

	return (
		<Page
			title={ PRODUCT_NAME }
			ariaLabel={ PRODUCT_NAME }
			subTitle={ SUBTITLES[ activeTab ]() }
			actions={ actions }
			hasPadding={ hasPadding }
		>
			{ subscribersEnabled ? (
				<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
					<Tabs.List variant="minimal">
						<Tabs.Tab value="subscribers">{ __( 'Subscribers', 'jetpack-newsletter' ) }</Tabs.Tab>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-newsletter' ) }</Tabs.Tab>
					</Tabs.List>
				</Tabs.Root>
			) : null }
			{ children }
		</Page>
	);
}
