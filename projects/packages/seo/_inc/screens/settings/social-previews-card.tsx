/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard } from '@wordpress/ui';
import getSite from '../../data/get-site';
import type { SiteData } from '../../data/get-site';
import type { FC } from 'react';

interface PreviewProps {
	site: SiteData;
	description: string;
}

/** The site's hostname, without a leading www., for the preview chrome. */
function hostname( url: string ): string {
	try {
		return new URL( url ).hostname.replace( /^www\./, '' );
	} catch {
		return url;
	}
}

// Small inline brand marks for the preview headings (no icon dependency). Each
// is hidden from assistive tech — the heading text already names the platform.

const GoogleIcon: FC = () => (
	<svg className="jetpack-seo-preview__platform-icon" viewBox="0 0 48 48" aria-hidden="true">
		<path
			fill="#EA4335"
			d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
		/>
		<path
			fill="#4285F4"
			d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
		/>
		<path
			fill="#FBBC05"
			d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
		/>
		<path
			fill="#34A853"
			d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
		/>
	</svg>
);

const FacebookIcon: FC = () => (
	<svg
		className="jetpack-seo-preview__platform-icon"
		viewBox="0 0 24 24"
		fill="#1877F2"
		aria-hidden="true"
	>
		<path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
	</svg>
);

const XIcon: FC = () => (
	<svg
		className="jetpack-seo-preview__platform-icon"
		viewBox="0 0 24 24"
		fill="currentColor"
		aria-hidden="true"
	>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

/** How the home page appears as a Google search result. */
const GooglePreview: FC< PreviewProps > = ( { site, description } ) => (
	<div className="jetpack-seo-preview jetpack-seo-preview--google">
		<div className="jetpack-seo-preview__google-site">
			{ site.icon && <img className="jetpack-seo-preview__favicon" src={ site.icon } alt="" /> }
			<div className="jetpack-seo-preview__google-url">{ hostname( site.url ) }</div>
		</div>
		<div className="jetpack-seo-preview__google-title">{ site.title }</div>
		{ description && <div className="jetpack-seo-preview__desc">{ description }</div> }
	</div>
);

/**
 * How the home page appears as a shared link card. Facebook and X render link
 * cards with the same parts (image, domain, title, description), so they share
 * one component.
 */
const LinkCardPreview: FC< PreviewProps > = ( { site, description } ) => (
	<div className="jetpack-seo-preview jetpack-seo-preview--card">
		{ site.image && (
			<div
				className="jetpack-seo-preview__image"
				style={ { backgroundImage: `url(${ site.image })` } }
			/>
		) }
		<div className="jetpack-seo-preview__card-body">
			<div className="jetpack-seo-preview__card-domain">{ hostname( site.url ) }</div>
			<div className="jetpack-seo-preview__card-title">{ site.title }</div>
			{ description && <div className="jetpack-seo-preview__desc">{ description }</div> }
		</div>
	</div>
);

interface Props {
	/** The front-page meta description, from the Settings form (updates live). */
	description: string;
}

/**
 * Read-only preview of how the site's home page appears in Google search
 * results and when shared on Facebook/X. Driven by the bootstrapped site
 * identity plus the live front-page description from the Settings form, so the
 * preview tracks edits without a save. Renders nothing if site data is missing.
 *
 * The cards are simple in-house markup rather than the `@automattic/social-previews`
 * library: that library is built for the editor/webpack and misbehaves in this
 * page's wp-build environment (broken styles and, more seriously, it destabilized
 * the page's data loading). See the PR description for the full rationale.
 *
 * @param props             - Component props.
 * @param props.description - The current front-page description.
 * @return The search/social previews card, or null.
 */
const SocialPreviewsCard: FC< Props > = ( { description } ) => {
	const site = getSite();

	if ( ! site ) {
		return null;
	}

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Card.Title>{ __( 'Search & social previews', 'jetpack-seo' ) }</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p className="jetpack-seo-settings__preview-intro">
					{ __(
						'A preview of how your home page looks in search results and when shared on social media. It updates as you edit the front-page description above.',
						'jetpack-seo'
					) }
				</p>
				<div className="jetpack-seo-settings__preview-list">
					{ /* Each block: a platform heading above its preview. The border is on
					   the preview itself (not a group box around heading + preview). */ }
					<div>
						<h3 className="jetpack-seo-settings__preview-label">
							<GoogleIcon />
							{ __( 'Google search result', 'jetpack-seo' ) }
						</h3>
						<GooglePreview site={ site } description={ description } />
					</div>
					<div>
						<h3 className="jetpack-seo-settings__preview-label">
							<FacebookIcon />
							{ __( 'Facebook', 'jetpack-seo' ) }
						</h3>
						<LinkCardPreview site={ site } description={ description } />
					</div>
					<div>
						<h3 className="jetpack-seo-settings__preview-label">
							<XIcon />
							{ __( 'X (Twitter)', 'jetpack-seo' ) }
						</h3>
						<LinkCardPreview site={ site } description={ description } />
					</div>
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SocialPreviewsCard;
