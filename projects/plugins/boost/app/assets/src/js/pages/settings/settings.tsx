import { __ } from '@wordpress/i18n';
import { code, desktop, image, pending } from '@wordpress/icons';
import { Card, CollapsibleCard, Icon, Stack } from '@wordpress/ui';
import { useCornerstoneSummary } from '$features/cornerstone-pages/cornerstone-pages';
import CornerstonePagesCard from '$features/cornerstone-pages/cornerstone-pages-card';
import CloudCssModule from '$features/critical-css/cloud-css-module/cloud-css-module';
import CriticalCssModule from '$features/critical-css/critical-css-module/critical-css-module';
import ImageCdn from '$features/image-cdn/image-cdn';
import ImageGuide from '$features/image-guide/image-guide';
import LcpModule from '$features/lcp/lcp';
import MinifyCss from '$features/minify-css/minify-css';
import MinifyJs from '$features/minify-js/minify-js';
import { ModuleSurfaceProvider } from '$features/module/surface';
import PageCacheModule from '$features/page-cache/page-cache';
import RenderBlockingJs from '$features/render-blocking-js/render-blocking-js';
import { useRef } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useSettingsExposure, useSettingsVisit } from '$lib/utils/use-settings-exposure';
import type { SettingsGroup } from '$lib/utils/use-settings-exposure';
import styles from './settings.module.scss';
import type { ComponentProps, ReactNode } from 'react';

const Group = ( {
	group,
	visit,
	title,
	description,
	summary,
	icon,
	defaultOpen = true,
	children,
}: {
	group: SettingsGroup;
	visit: ReturnType< typeof useSettingsVisit >;
	title: string;
	description?: string;
	summary?: ReactNode;
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	defaultOpen?: boolean;
	children: ReactNode;
} ) => {
	const header = useRef< HTMLHeadingElement >( null );
	const openState = useRef( defaultOpen );
	useSettingsExposure( header, { visit, group, open: openState } );

	return (
		<CollapsibleCard.Root
			defaultOpen={ defaultOpen }
			// WordPress forwards Base UI event details, but its callback type omits them.
			onOpenChange={ ( open, eventDetails?: { reason: string } ) => {
				openState.current = open;
				if ( eventDetails?.reason === 'trigger-press' ) {
					recordBoostEvent( 'settings_group_toggle', { group, status: open ? 'open' : 'close' } );
				}
			} }
		>
			<CollapsibleCard.Header ref={ header } render={ <h3 /> }>
				<Stack direction="column" gap="md">
					<Stack direction="row" align="center" gap="sm" wrap="wrap">
						<Card.Title>
							<Stack direction="row" align="center" gap="sm">
								<Icon icon={ icon } />
								{ title }
							</Stack>
						</Card.Title>
						{ summary && (
							<CollapsibleCard.HeaderDescription>{ summary }</CollapsibleCard.HeaderDescription>
						) }
					</Stack>
					{ description && (
						<CollapsibleCard.HeaderDescription>{ description }</CollapsibleCard.HeaderDescription>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="xl" className={ styles.rows }>
					{ children }
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

const Settings = ( { active = true }: { active?: boolean } ) => {
	const summary = useCornerstoneSummary( false );
	const section = useRef< HTMLDivElement >( null );
	const visit = useSettingsVisit( active );
	useSettingsExposure( section, { visit } );

	return (
		<ModuleSurfaceProvider value="row">
			<Stack ref={ section } direction="column" gap="xl" className={ styles.settings }>
				<Group
					group="cornerstone_pages"
					visit={ visit }
					title={ __( 'Cornerstone Pages', 'jetpack-boost' ) }
					description={ __(
						'Choose the pages that matter most on your site so Boost can give them its most targeted optimizations.',
						'jetpack-boost'
					) }
					summary={ summary }
					icon={ desktop }
					defaultOpen={ false }
				>
					<CornerstonePagesCard />
				</Group>
				<Group
					group="page_loading"
					visit={ visit }
					title={ __( 'Page loading', 'jetpack-boost' ) }
					description={ __(
						'Manage how your page content is loaded for visitors.',
						'jetpack-boost'
					) }
					icon={ pending }
				>
					<CriticalCssModule />
					<CloudCssModule />
					<PageCacheModule />
					<RenderBlockingJs />
				</Group>
				<Group
					group="code_optimization"
					visit={ visit }
					title={ __( 'Code optimization', 'jetpack-boost' ) }
					description={ __( 'Reduce the code needed to load your site.', 'jetpack-boost' ) }
					icon={ code }
				>
					<MinifyJs />
					<MinifyCss />
				</Group>
				<Group
					group="images"
					visit={ visit }
					title={ __( 'Images', 'jetpack-boost' ) }
					description={ __(
						'Tools to load and deliver images more efficiently.',
						'jetpack-boost'
					) }
					icon={ image }
				>
					<LcpModule />
					<ImageCdn />
					<ImageGuide />
				</Group>
			</Stack>
		</ModuleSurfaceProvider>
	);
};

export default Settings;
