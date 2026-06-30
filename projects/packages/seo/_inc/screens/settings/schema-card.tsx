import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard } from '@wordpress/ui';
import './style.scss';

/**
 * Site-level Schema settings section.
 *
 * This is the container/shell that the per-schema site controls plug into: the
 * BreadcrumbList toggle and the primary site schema type — Organization,
 * LocalBusiness, or Person / ProfilePage — populated from data already on the
 * site (title, tagline, URL, logo, author profile). Those controls ship in
 * their own issues; here it's just the collapsed section they land in.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification).
 *
 * @return The Schema settings card.
 */
function SchemaCard() {
	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Card.Title>{ __( 'Schema', 'jetpack-seo' ) }</Card.Title>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<p className="jetpack-seo-settings__schema-placeholder">
					{ __( 'Site-level schema controls will appear here.', 'jetpack-seo' ) }
				</p>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default SchemaCard;
