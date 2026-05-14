import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Tabs } from '@wordpress/ui';
import './social-page.scss';
import type { ReactNode } from 'react';

export type SocialTab = 'overview' | 'settings';

type Props = {
	activeTab: SocialTab;
	actions?: ReactNode;
	children: ReactNode;
};

const PRODUCT_NAME = 'Social'; /** "Social" is a product name, do not translate. */

const SUBTITLES: Record< SocialTab, () => string > = {
	overview: () =>
		__( 'Connect your social accounts and see what drives traffic.', 'jetpack-publicize-pkg' ),
	settings: () =>
		__( 'Customize how your posts are shared to social media.', 'jetpack-publicize-pkg' ),
};

/**
 * Shared chrome for the unified Social page — owns the `Page` from
 * `@wordpress/admin-ui` plus the Overview / Settings tab nav. Routes
 * exchange tabs via `?tab=` so the `Tabs.Root` mounts once and the
 * active-tab indicator slides between tabs instead of remounting.
 *
 * @param props           - Component props.
 * @param props.activeTab - Which tab the current route represents.
 * @param props.actions   - Optional actions slot (top-right of the Page header).
 * @param props.children  - `Tabs.Panel` children.
 * @return The unified Social page shell.
 */
export default function SocialPage( { activeTab, actions, children }: Props ): JSX.Element {
	const navigate = useNavigate();

	// Keep the route at `/` and toggle tabs via a `?tab=` search param so the
	// `Tabs.Root` mounts once and the active-tab indicator can animate.
	const onTabChange = useCallback(
		( next: string | null ) => {
			if ( next !== 'overview' && next !== 'settings' ) {
				return;
			}
			navigate( {
				search: {
					tab: next === 'settings' ? 'settings' : undefined,
				},
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const title = (
		<Stack direction="row" align="center" gap="sm">
			<JetpackLogo height={ 20 } showText={ false } />
			{ /* "Social" is a product name, do not translate. */ }
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
			<Tabs.Root value={ activeTab } onValueChange={ onTabChange }>
				<div className="jetpack-social-page__tabs-row">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-publicize-pkg' ) }</Tabs.Tab>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-publicize-pkg' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className="jetpack-social-page__content jetpack-social-page__content--padded">
					{ children }
				</div>
			</Tabs.Root>
			<JetpackFooter />
		</Page>
	);
}
