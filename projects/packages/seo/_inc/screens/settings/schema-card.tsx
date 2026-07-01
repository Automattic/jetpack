import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useSchemaSettings } from '../../data/use-schema-settings';
import OrganizationBusinessSection from './schema-settings/organization-business-section';
import './style.scss';

const notSetLabel = __( 'Not set', 'jetpack-seo' );

/**
 * Site-level Schema settings section.
 *
 * The container the per-schema site controls plug into. Today it holds the
 * Organization / Business info form (name, description, social profiles, contact
 * email); the BreadcrumbList toggle and other primary schema types
 * (LocalBusiness, Person / ProfilePage) ship in their own issues and land here.
 *
 * Owns the schema-settings fetch so the collapsed header can show a configured
 * count badge, and passes the form down to the Organization section.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification).
 *
 * @return The Schema settings card.
 */
function SchemaCard() {
	const form = useSchemaSettings();
	const { organization, defaults } = form;

	// Whether each Organization field counts as "set" for the header badge: `name` /
	// `description` are set when overridden here OR already present in site identity
	// (Site Title / Tagline); `sameAs` when it has at least one profile; `email` when
	// filled. So a typical site (Title + Tagline) reads "2 of 4 set" before the admin
	// adds anything. The total is just the number of checks.
	const fieldsSet = organization
		? [
				organization.name || defaults.name,
				organization.description || defaults.description,
				organization.sameAs.length > 0,
				organization.email,
		  ]
		: [];
	const setCount = fieldsSet.filter( Boolean ).length;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Schema', 'jetpack-seo' ) }</Card.Title>
					{ organization && (
						<Badge intent={ setCount > 0 ? 'stable' : 'draft' }>
							{ setCount > 0
								? sprintf(
										/* translators: %1$d: number of configured Organization fields. %2$d: total number of fields. */
										__( '%1$d of %2$d set', 'jetpack-seo' ),
										setCount,
										fieldsSet.length
								  )
								: notSetLabel }
						</Badge>
					) }
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<OrganizationBusinessSection form={ form } />
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default SchemaCard;
