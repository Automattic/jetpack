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
				<div className="jetpack-seo-settings__preview-group">
					<h3 className="jetpack-seo-settings__preview-label">
						{ __( 'Google search result', 'jetpack-seo' ) }
					</h3>
					<GooglePreview site={ site } description={ description } />
				</div>
				<div className="jetpack-seo-settings__preview-group">
					<h3 className="jetpack-seo-settings__preview-label">
						{ __( 'Facebook', 'jetpack-seo' ) }
					</h3>
					<LinkCardPreview site={ site } description={ description } />
				</div>
				<div className="jetpack-seo-settings__preview-group">
					<h3 className="jetpack-seo-settings__preview-label">
						{ __( 'X (Twitter)', 'jetpack-seo' ) }
					</h3>
					<LinkCardPreview site={ site } description={ description } />
				</div>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SocialPreviewsCard;
