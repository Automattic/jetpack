import { ToggleControl } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import { useSchemaSettings } from '../../data/use-schema-settings';
import LocalBusinessSection from './schema-settings/local-business-section';
import OrganizationSection from './schema-settings/organization-section';
import type { SchemaSettings } from '../../data/schema-settings-types';

const notSetLabel = __( 'Not set', 'jetpack-seo' );
const enabledLabel = __( 'Enabled', 'jetpack-seo' );
const disabledLabel = __( 'Disabled', 'jetpack-seo' );

/**
 * Site-level Schema settings section.
 *
 * Renders the site-level BreadcrumbList, Organization, and LocalBusiness controls
 * in separate collapsible cards. The per-user Author profile (Person /
 * ProfilePage) lives in its own card.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification).
 *
 * @return The Schema settings cards.
 */
interface Props {
	initialSettings: SchemaSettings;
	onSave?: ( settings: SchemaSettings ) => void;
}

/**
 * Render the collapsible Schema settings cards.
 *
 * @param root0                 - Component props.
 * @param root0.initialSettings - Settings bootstrap from the Settings screen.
 * @param root0.onSave          - Called with the saved schema payload after a successful save.
 * @return The Schema settings cards.
 */
function SchemaCard( { initialSettings, onSave }: Props ) {
	const form = useSchemaSettings( initialSettings, onSave );
	const { breadcrumbList, organization, defaults, localBusiness, isSaving, commitBreadcrumbList } =
		form;

	// Whether each Organization field counts as "set" for the header badge: `name` /
	// `description` count when overridden here OR present in site identity (Site Title /
	// Tagline); `sameAs` when it has a profile; `email` when filled. So a typical site
	// reads "2 of 4 set" before the admin adds anything.
	const fieldsSet = [
		organization.name || defaults.name,
		organization.description || defaults.description,
		organization.sameAs.length > 0,
		organization.email,
	];
	const setCount = fieldsSet.filter( Boolean ).length;

	return (
		<Stack direction="column" gap="lg">
			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Breadcrumbs', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ breadcrumbList.enabled ? 'stable' : 'draft' }>
							{ breadcrumbList.enabled ? enabledLabel : disabledLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<ToggleControl
						label={ __( 'Enable breadcrumb schema', 'jetpack-seo' ) }
						help={ __(
							'Adds breadcrumb structured data to help search engines understand your site hierarchy.',
							'jetpack-seo'
						) }
						checked={ breadcrumbList.enabled }
						// eslint-disable-next-line react/jsx-no-bind
						onChange={ next => commitBreadcrumbList( { enabled: next } ) }
						disabled={ isSaving }
						__nextHasNoMarginBottom
					/>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Organization', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ setCount === fieldsSet.length ? 'stable' : 'draft' }>
							{ setCount > 0
								? sprintf(
										/* translators: %1$d: number of configured Organization fields. %2$d: total number of fields. */
										_x( '%1$d of %2$d set', 'Organization fields are configured', 'jetpack-seo' ),
										setCount,
										fieldsSet.length
								  )
								: notSetLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<OrganizationSection form={ form } />
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>

			<CollapsibleCard.Root defaultOpen={ false }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						<Card.Title>{ __( 'Local business', 'jetpack-seo' ) }</Card.Title>
						<Badge intent={ localBusiness.enabled ? 'stable' : 'draft' }>
							{ localBusiness.enabled ? enabledLabel : disabledLabel }
						</Badge>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<LocalBusinessSection form={ form } />
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
	);
}

export default SchemaCard;
