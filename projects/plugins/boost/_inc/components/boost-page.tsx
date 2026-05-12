import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Stack, Tabs } from '@wordpress/ui';
import './boost-page.scss';
import type { ReactNode } from 'react';

export type BoostTab = 'overview' | 'settings';

type Props = {
	activeTab: BoostTab;
	actions?: ReactNode;
	children: ReactNode;
};

const PRODUCT_NAME = 'Boost'; /** "Boost" is a product name, do not translate. */

const SUBTITLES: Record< BoostTab, () => string > = {
	overview: () => __( 'Improve your site speed and performance.', 'jetpack-boost' ),
	settings: () => __( 'Improve your site speed and performance.', 'jetpack-boost' ),
};

/**
 * Shared chrome for the unified Boost page — owns the `Page` from
 * `@wordpress/admin-ui` plus the Overview / Settings tab nav. Routes
 * exchange tab via `?tab=` so the `Tabs.Root` mounts once and the
 * active-tab indicator slides between tabs instead of remounting.
 *
 * @param props           - Component props.
 * @param props.activeTab - Which tab the current route represents.
 * @param props.actions   - Optional actions slot (top-right of the Page header).
 * @param props.children  - `Tabs.Panel` children.
 * @return The unified Boost page shell.
 */
export default function BoostPage( { activeTab, actions, children }: Props ): JSX.Element {
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
			{ /* "Boost" is a product name, do not translate. */ }
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
				<div className="jetpack-boost-page__tabs-row">
					<Tabs.List variant="minimal">
						<Tabs.Tab value="overview">{ __( 'Overview', 'jetpack-boost' ) }</Tabs.Tab>
						<Tabs.Tab value="settings">{ __( 'Settings', 'jetpack-boost' ) }</Tabs.Tab>
					</Tabs.List>
				</div>
				<div className="jetpack-boost-page__content jetpack-boost-page__content--padded">
					{ children }
				</div>
			</Tabs.Root>
			<JetpackFooter />
		</Page>
	);
}
