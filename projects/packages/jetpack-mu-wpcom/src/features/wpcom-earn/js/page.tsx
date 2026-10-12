import AdminPage from '@automattic/jetpack-components/admin-page';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import { isEarnSection, SECTIONS } from './sections.ts';
import type { EarnSection } from './sections.ts';
import type { ReactNode } from 'react';
import './style.scss';

/**
 * The page frame every Monetize route renders: header, route-based tabs and footer.
 *
 * Each tab is its own wp-build route, so the active tab comes from the route's stage.
 *
 * @param props          - Component props.
 * @param props.active   - The section the current route renders.
 * @param props.children - The section's content.
 * @return The rendered page.
 */
export function EarnPage( { active, children }: { active: EarnSection; children: ReactNode } ) {
	const navigate = useNavigate();

	const onTabChange = useCallback(
		( next: unknown ) => {
			if ( isEarnSection( next ) ) {
				navigate( { href: SECTIONS[ next ].path } );
			}
		},
		[ navigate ]
	);

	return (
		<AdminPage
			className="wpcom-earn"
			title={ __( 'Monetize', 'jetpack-mu-wpcom' ) }
			subTitle={ __( 'Explore tools to earn money with your site.', 'jetpack-mu-wpcom' ) }
			unwrapped
		>
			{ /* Content sits inside Tabs.Root so the sticky strip spans the page height. */ }
			<Tabs.Root className="wpcom-earn__tabs" value={ active } onValueChange={ onTabChange }>
				<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="home">{ __( 'Monetization Options', 'jetpack-mu-wpcom' ) }</Tabs.Tab>
						<Tabs.Tab value="paid-subscriptions">
							{ __( 'Paid Subscribers', 'jetpack-mu-wpcom' ) }
						</Tabs.Tab>
						<Tabs.Tab value="payments">{ __( 'Payment Settings', 'jetpack-mu-wpcom' ) }</Tabs.Tab>
						<Tabs.Tab value="ads">{ __( 'Ads', 'jetpack-mu-wpcom' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className="wpcom-earn__content">{ children }</div>
			</Tabs.Root>
		</AdminPage>
	);
}
