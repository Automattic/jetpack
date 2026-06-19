import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { SitePreview } from './site-preview.tsx';
import type { ReactNode } from 'react';

interface Props {
	// The line under the heading: the "X of N completed" progress for the loaded
	// list, or the "Tailoring your checklist…" copy while the AI call is in flight.
	progressLabel: string;
	// Site context for the preview card; omitted when unknown (dev fixtures).
	siteUrl: string | null;
	siteTitle?: string | null;
	// The left column: the task cards, or the loading skeleton.
	children: ReactNode;
}

/**
 * The shared chrome for the tailored list and its loading state: a centered
 * content column with a heading and a progress/status line, the supplied
 * content (task cards or skeleton) on the left, and the site preview on the
 * right. Sharing this between the loaded and loading states keeps the
 * wizard→tailoring→list transition seamless — only the left column and the
 * status line change.
 *
 * @param props               - Component props.
 * @param props.progressLabel - The status line under the heading.
 * @param props.siteUrl       - The site's front-end URL (for the preview).
 * @param props.siteTitle     - The site name (for the preview).
 * @param props.children      - The left column content.
 * @return The layout element.
 */
export function Layout( { progressLabel, siteUrl, siteTitle, children }: Props ) {
	// Without a site URL there's no preview, so collapse to a single column —
	// otherwise the grid reserves an empty preview track and squeezes the tasks.
	const hasPreview = !! siteUrl;

	return (
		<div className="ai-launchpad-tailored-list__layout">
			<header className="ai-launchpad-tailored-list__heading">
				<h1 className="ai-launchpad-tailored-list__title-heading">
					{ __( 'Get the most out of WordPress', 'jetpack-mu-wpcom' ) }
				</h1>
				<p className="ai-launchpad-tailored-list__progress">{ progressLabel }</p>
			</header>
			<div
				className={ clsx( 'ai-launchpad-tailored-list__columns', {
					'has-preview': hasPreview,
				} ) }
			>
				{ children }
				<SitePreview siteUrl={ siteUrl } siteTitle={ siteTitle } />
			</div>
		</div>
	);
}
