/**
 * External dependencies
 */
import AdminPage from '@automattic/jetpack-components/admin-page';
import { Breadcrumbs } from '@wordpress/admin-ui';
import VideoNav, { type VideoNavTab } from '../video-nav';
import './style.scss';
import type { ReactNode } from 'react';

/**
 * Parent breadcrumb item — labelled "VideoPress" in every case, but the
 * link target depends on where the user arrived from. Duplicated from
 * routes/video/stage.tsx (see the rationale there); the two copies should
 * merge when that stage migrates to this layout.
 *
 * @return The parent breadcrumb item.
 */
const getParentBreadcrumbItem = (): { label: string; to: string } => {
	const from = ( window.history.state as { from?: string } | null )?.from;
	return { label: 'VideoPress', to: from === 'stats' ? '/stats' : '/' };
};

type Props = {
	videoId: string;
	activeTab: VideoNavTab;
	breadcrumbLabel: string;
	actions?: ReactNode;
	confirmNavigation?: () => boolean;
	children: ReactNode;
};

/**
 * Shared chrome for per-video screens: `AdminPage` with breadcrumbs and an
 * actions slot, plus the Details / Editor sub-nav. Extracted from
 * the structure routes/video/stage.tsx builds inline — that stage still builds
 * its own chrome and should migrate here eventually.
 *
 * @param props                   - Component props.
 * @param props.videoId           - The video's attachment id.
 * @param props.activeTab         - Currently active per-video tab.
 * @param props.breadcrumbLabel   - Label for the current breadcrumb item.
 * @param props.actions           - Optional content for the page header's
 *                                top-right actions slot.
 * @param props.confirmNavigation - Optional guard invoked before the sub-nav
 *                                navigates away; return false to cancel.
 * @param props.children          - The screen's body content.
 * @return The wrapped page element.
 */
export default function VideoLayout( {
	videoId,
	activeTab,
	breadcrumbLabel,
	actions,
	confirmNavigation,
	children,
}: Props ) {
	return (
		<AdminPage
			breadcrumbs={
				<div className="vp-video-layout__breadcrumbs">
					<Breadcrumbs items={ [ getParentBreadcrumbItem(), { label: breadcrumbLabel } ] } />
				</div>
			}
			actions={ actions }
		>
			<VideoNav
				videoId={ videoId }
				activeTab={ activeTab }
				confirmNavigation={ confirmNavigation }
			/>
			{ children }
		</AdminPage>
	);
}
