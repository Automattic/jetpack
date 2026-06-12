import {
	GoogleSearchPreview,
	FacebookLinkPreview,
	TwitterLinkPreview,
} from '@automattic/social-previews';
import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack } from '@wordpress/ui';
import getSite from '../../data/get-site';
import type { FC } from 'react';

interface Props {
	/** The front-page meta description, from the Settings form (updates live). */
	description: string;
}

/**
 * Read-only preview of how the site's home page appears in Google search
 * results and when shared on Facebook/Twitter. Mirrors the legacy SEO Tools
 * page's social-preview card. Driven by the bootstrapped site identity plus the
 * live front-page description from the Settings form, so the preview tracks
 * edits without a save. Renders nothing if the site data isn't available.
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
				<Stack direction="column" gap="lg">
					<p>
						{ __(
							'A preview of how your home page looks in search results and when shared on social media. It updates as you edit the front-page description above.',
							'jetpack-seo'
						) }
					</p>
					<GoogleSearchPreview
						siteIcon={ site.icon }
						siteTitle={ site.title }
						title={ site.title }
						url={ site.url }
						description={ description }
					/>
					<FacebookLinkPreview
						title={ site.title }
						url={ site.url }
						description={ description }
						image={ site.image }
					/>
					<TwitterLinkPreview
						title={ site.title }
						url={ site.url }
						description={ description }
						image={ site.image }
					/>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
};

export default SocialPreviewsCard;
