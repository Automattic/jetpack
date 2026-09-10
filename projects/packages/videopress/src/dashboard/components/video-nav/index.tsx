/**
 * External dependencies
 */
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';

export type VideoNavTab = 'details' | 'editor';

const TAB_VALUES: VideoNavTab[] = [ 'details', 'editor' ];

/**
 * Build the dashboard path for a per-video tab.
 *
 * @param videoId - The video's attachment id.
 * @param tab     - The per-video tab.
 * @return The route path for that tab.
 */
export function videoTabPath( videoId: string, tab: VideoNavTab ): string {
	return tab === 'details' ? `/video/${ videoId }` : `/video/${ videoId }/${ tab }`;
}

type Props = {
	videoId: string;
	activeTab: VideoNavTab;
	confirmNavigation?: () => boolean;
};

/**
 * The Details / Editor sub-nav for a single video. Same visual
 * pattern as DashboardTabs, but self-contained: unlike the dashboard strip
 * (whose `Tabs.Root` lives in DashboardLayout next to the content panels),
 * each of these tabs is a sibling route, so this component owns its own
 * `Tabs.Root` and navigates on tab activation instead of swapping panels.
 *
 * @param props                   - Component props.
 * @param props.videoId           - The video's attachment id, used to build tab paths.
 * @param props.activeTab         - Currently active per-video tab.
 * @param props.confirmNavigation - Optional guard invoked before navigating
 *                                away; return false to cancel (e.g. unsaved
 *                                changes). The active tab never prompts.
 * @return The sub-nav element.
 */
export default function VideoNav( { videoId, activeTab, confirmNavigation }: Props ) {
	const navigate = useNavigate();

	const onValueChange = useCallback(
		( next: string ) => {
			if ( next === activeTab || ! TAB_VALUES.includes( next as VideoNavTab ) ) {
				return;
			}
			if ( confirmNavigation && ! confirmNavigation() ) {
				return;
			}
			navigate( { href: videoTabPath( videoId, next as VideoNavTab ) } );
		},
		[ navigate, videoId, activeTab, confirmNavigation ]
	);

	return (
		<Tabs.Root className="vp-video-nav" value={ activeTab } onValueChange={ onValueChange }>
			<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
				<Tabs.List variant="minimal">
					<Tabs.Tab value="details">{ __( 'Details', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
					<Tabs.Tab value="editor">{ __( 'Editor', 'jetpack-videopress-pkg' ) }</Tabs.Tab>
				</Tabs.List>
			</div>
			{ /* Each tab's real content is a sibling route, not a panel; these
			     empty panels only satisfy the dev-mode Tabs validator, which
			     requires the Tab and Panel counts to match. */ }
			{ TAB_VALUES.map( tab => (
				<Tabs.Panel key={ tab } value={ tab } />
			) ) }
		</Tabs.Root>
	);
}
