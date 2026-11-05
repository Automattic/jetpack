/* eslint-disable jsdoc/require-param, jsdoc/require-returns */

import { __ } from '@wordpress/i18n';
import { search } from '@wordpress/icons';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import getSite from '../../data/get-site';
import { buildDefaultPreview, buildPreview } from '../../data/title-format-tokens';
import styles from './social-previews-card.module.scss';
import type { SiteData } from '../../data/get-site';
import type { TitleFormatToken } from '../../data/settings-types';
import type { FC } from 'react';

interface PreviewProps {
	site: SiteData;
	title: string;
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
	<svg className={ styles.platformIcon } viewBox="0 0 48 48" aria-hidden="true">
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
	<svg className={ styles.platformIcon } viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
		<path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.69.24 2.69.24v2.97h-1.52c-1.49 0-1.96.93-1.96 1.89v2.25h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07z" />
	</svg>
);

const XIcon: FC = () => (
	<svg className={ styles.platformIcon } viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

/**
 * The home page's titles. When the Front page format from Title structure
 * produces any text, it is both the document title, which Google shows, and the
 * Open Graph title, which Facebook and X show: Jetpack returns it from
 * `pre_get_document_title` and copies it into `og:title`. When the format is
 * untouched or comes out empty, each falls back. The document title becomes the
 * one WordPress composes (site name, separator, tagline) and the Open Graph title
 * becomes the site name. The front page only allows the site name and tagline, so
 * both are filled with the site's real values and the preview never shows sample
 * text.
 */
function frontPageTitles(
	site: SiteData,
	format: TitleFormatToken[],
	separator: string
): { search: string; social: string } {
	const values = { site_name: site.title, tagline: site.tagline };
	const custom = format.length > 0 ? buildPreview( format, values ) : '';
	return {
		search: custom || buildDefaultPreview( 'front_page', separator, values ),
		social: custom || site.title,
	};
}

/** How the home page appears as a Google search result. */
const GooglePreview: FC< PreviewProps > = ( { site, title, description } ) => (
	<Stack direction="column" gap="xs" className={ `${ styles.preview } ${ styles.google }` }>
		<Stack direction="row" align="center" gap="sm">
			{ site.icon && <img className={ styles.favicon } src={ site.icon } alt="" /> }
			<Text variant="body-sm" className={ styles.muted }>
				{ hostname( site.url ) }
			</Text>
		</Stack>
		<Text variant="body-xl" className={ styles.googleTitle }>
			{ title }
		</Text>
		{ description && (
			<Text variant="body-md" className={ styles.muted }>
				{ description }
			</Text>
		) }
	</Stack>
);

/**
 * How the home page appears as a shared link card. Facebook and X render link
 * cards with the same parts (image, domain, title, description), so they share
 * one component.
 */
const LinkCardPreview: FC< PreviewProps > = ( { site, title, description } ) => (
	<div className={ `${ styles.preview } ${ styles.card }` }>
		{ site.image && (
			<div className={ styles.image } style={ { backgroundImage: `url(${ site.image })` } } />
		) }
		<Stack direction="column" gap="xs" className={ styles.cardBody }>
			<Text variant="body-sm" className={ styles.cardDomain }>
				{ hostname( site.url ) }
			</Text>
			<Text variant="heading-md">{ title }</Text>
			{ description && (
				<Text variant="body-md" className={ styles.muted }>
					{ description }
				</Text>
			) }
		</Stack>
	</div>
);

interface Props {
	/** The front-page meta description, from the Settings form (updates live). */
	description: string;
	/**
	 * The Front page title format from Title structure, from the Settings form
	 * (updates live). Empty when the site keeps WordPress's default title.
	 */
	frontPageTitleFormat: TitleFormatToken[];
	/** The site's document-title separator, for the default front-page title. */
	titleSeparator: string;
}

/**
 * Read-only preview of how the site's home page appears in Google search
 * results and when shared on Facebook/X. Driven by the bootstrapped site
 * identity plus the live front-page description and Front page title format
 * from the Settings form, so the preview tracks edits without a save. Renders
 * nothing if site data is missing.
 *
 * A Front page format sets the title on all three previews. Without one, Google
 * shows WordPress's default title and Facebook and X show the site name.
 *
 * The cards are simple in-house markup rather than the `@automattic/social-previews`
 * library: that library is built for the editor/webpack and misbehaves in this
 * page's wp-build environment (broken styles and, more seriously, it destabilized
 * the page's data loading). See the PR description for the full rationale.
 *
 * @param props                      - Component props.
 * @param props.description          - The current front-page description.
 * @param props.frontPageTitleFormat - The current Front page title format.
 * @param props.titleSeparator       - The site's document-title separator.
 * @return The search/social previews card, or null.
 */
const SocialPreviewsCard: FC< Props > = ( {
	description,
	frontPageTitleFormat,
	titleSeparator,
} ) => {
	const site = getSite();

	if ( ! site ) {
		return null;
	}
	const previewDescription = description || site.tagline;
	const titles = frontPageTitles( site, frontPageTitleFormat, titleSeparator );

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Card.Title>
					<CardTitleIcon
						icon={ search }
						title={ __( 'Search & social previews', 'jetpack-seo' ) }
					/>
				</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="xl">
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'How your home page looks in search results and social shares. Updates as you edit the front-page title structure and description above.',
							'jetpack-seo'
						) }
					</Text>
					<Stack direction="column" gap="2xl">
						{ /* Each block: a platform heading above its preview. The border is on
					   the preview itself (not a group box around heading + preview). */ }
						<Stack direction="column" gap="md">
							<Text variant="heading-lg" render={ <h3 /> }>
								<Stack render={ <span /> } direction="row" align="center" gap="sm">
									<GoogleIcon />
									{ __( 'Google search result', 'jetpack-seo' ) }
								</Stack>
							</Text>
							<GooglePreview
								site={ site }
								title={ titles.search }
								description={ previewDescription }
							/>
						</Stack>
						<Stack direction="column" gap="md">
							<Text variant="heading-lg" render={ <h3 /> }>
								<Stack render={ <span /> } direction="row" align="center" gap="sm">
									<FacebookIcon />
									{ __( 'Facebook', 'jetpack-seo' ) }
								</Stack>
							</Text>
							<LinkCardPreview
								site={ site }
								title={ titles.social }
								description={ previewDescription }
							/>
						</Stack>
						<Stack direction="column" gap="md">
							<Text variant="heading-lg" render={ <h3 /> }>
								<Stack render={ <span /> } direction="row" align="center" gap="sm">
									<XIcon />
									{ __( 'X (Twitter)', 'jetpack-seo' ) }
								</Stack>
							</Text>
							<LinkCardPreview
								site={ site }
								title={ titles.social }
								description={ previewDescription }
							/>
						</Stack>
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SocialPreviewsCard;
