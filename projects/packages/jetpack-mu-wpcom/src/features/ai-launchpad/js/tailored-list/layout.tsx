import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { SitePreview } from './site-preview.tsx';
import type { ReactNode } from 'react';

interface Props {
	// The status line under the heading.
	progressLabel: string;
	// Site context for the preview card; omitted when unknown (dev fixtures).
	siteUrl: string | null;
	siteTitle?: string | null;
	// The Site Editor URL: the preview thumbnail's quick link.
	siteEditUrl?: string | null;
	// The left column: the task cards, or the loading skeleton.
	children: ReactNode;
}

/**
 * The shared chrome for the tailored list and its loading state: a heading and
 * status line, the supplied content on the left, and the site preview on the right.
 *
 * @param props               - Component props.
 * @param props.progressLabel - The status line under the heading.
 * @param props.siteUrl       - The site's front-end URL (for the preview).
 * @param props.siteTitle     - The site name (for the preview).
 * @param props.siteEditUrl   - The Site Editor URL (preview quick link).
 * @param props.children      - The left column content.
 * @return The layout element.
 */
export function Layout( { progressLabel, siteUrl, siteTitle, siteEditUrl, children }: Props ) {
	// Without a site URL, collapse to a single column so the grid doesn't reserve
	// an empty preview track that squeezes the tasks.
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
				<SitePreview siteUrl={ siteUrl } siteTitle={ siteTitle } siteEditUrl={ siteEditUrl } />
			</div>
		</div>
	);
}
