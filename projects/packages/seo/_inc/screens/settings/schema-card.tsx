import { __, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useSchemaSettings } from '../../data/use-schema-settings';
import OrganizationBusinessSection from './schema-settings/organization-business-section';
import type { SchemaSettings } from '../../data/schema-settings-types';
import './style.scss';

const notSetLabel = __( 'Not set', 'jetpack-seo' );

/**
 * Site-level Schema settings section.
 *
 * The container the per-schema site controls plug into. Today it holds the
 * Organization / Business info form (name, description, social profiles, contact
 * email); the BreadcrumbList toggle and other site-level schema types
 * (LocalBusiness) ship in their own issues and land here. The per-user Author
 * profile (Person / ProfilePage) lives in its own card.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification).
 *
 * @return The Schema settings card.
 */
interface Props {
	initialSettings: SchemaSettings;
	onSave?: ( settings: SchemaSettings ) => void;
}

/**
 * Render the collapsible Schema settings card.
 *
 * @param root0                 - Component props.
 * @param root0.initialSettings - Settings bootstrap from the Settings screen.
 * @param root0.onSave          - Called with the saved schema payload after a successful save.
 * @return The Schema settings card.
 */
function SchemaCard( { initialSettings, onSave }: Props ) {
	const form = useSchemaSettings( initialSettings, onSave );
	const { organization, defaults, localBusiness, localBusinessDefaults } = form;

	// Whether each Organization field counts as "set" for the header badge: `name` /
	// `description` count when overridden here OR present in site identity (Site Title /
	// Tagline); `sameAs` when it has a profile; `email` when filled. So a typical site
	// reads "2 of 4 set" before the admin adds anything.
	const localBusinessAddressSet =
		Object.values( localBusiness.address ).some( Boolean ) ||
		Object.values( localBusinessDefaults.address ).some( Boolean );
	const fieldsSet = [
		organization.name || defaults.name,
		organization.description || defaults.description,
		organization.sameAs.length > 0,
		organization.email,
		...( localBusiness.enabled ? [ localBusinessAddressSet ] : [] ),
	];
	const setCount = fieldsSet.filter( Boolean ).length;

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>{ __( 'Schema', 'jetpack-seo' ) }</Card.Title>
					<Badge intent={ setCount === fieldsSet.length ? 'stable' : 'draft' }>
						{ setCount > 0
							? sprintf(
									/* translators: %1$d: number of configured Organization fields. %2$d: total number of fields. */
									__( '%1$d of %2$d set', 'jetpack-seo' ),
									setCount,
									fieldsSet.length
							  )
							: notSetLabel }
					</Badge>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<OrganizationBusinessSection form={ form } />
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default SchemaCard;
