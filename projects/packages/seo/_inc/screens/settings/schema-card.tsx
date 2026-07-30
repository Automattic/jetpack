import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { code } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import { useSchemaSettings } from '../../data/use-schema-settings';
import { hasLocalBusinessErrors } from './schema-settings/local-business-fields';
import LocalBusinessSection from './schema-settings/local-business-section';
import OrganizationSection from './schema-settings/organization-section';
import { hasProfileUrlErrors } from './schema-settings/profile-url-list';
import styles from './schema-settings/style.module.scss';
import type { SettingStatus } from '../../components/status-indicator';
import type { SchemaSettings } from '../../data/schema-settings-types';

interface Props {
	initialSettings: SchemaSettings;
	onSave?: ( settings: SchemaSettings ) => void;
}

/**
 * Site-level Schema settings module.
 *
 * One card for everything the site's own schema graph needs: a Breadcrumbs
 * toggle, then the Organization details behind the site. Local-business details
 * are a refinement of the Organization (a sub-toggle under it), not a peer
 * choice — schema.org models LocalBusiness as a kind of Organization. The
 * per-user Author profile (Person / ProfilePage for each writer) is a distinct
 * concern and lives in its own card.
 *
 * Collapsed by default and built from the shared `CollapsibleCard` compound,
 * matching the other Settings modules (Canonical URLs, Title structure, Site
 * verification).
 *
 * @param root0                 - Component props.
 * @param root0.initialSettings - Settings bootstrap from the Settings screen.
 * @param root0.onSave          - Called with the saved schema payload after a successful save.
 * @return The Schema settings card.
 */
function SchemaCard( { initialSettings, onSave }: Props ) {
	const form = useSchemaSettings( initialSettings, onSave );
	const { organization, defaults, localBusiness, breadcrumbList, isSaving, commitBreadcrumbList } =
		form;

	// Completion status for the module header. A field counts as configured when it
	// has a value — its smart default counts, because the defaults (Site Title →
	// name, Tagline → description) are the preferred state: they keep the schema in
	// sync with the site's own settings. The core fields are name, description, and
	// social/profile links; name and description are almost always covered by their
	// defaults, so in practice adding social links (which have no default) is what
	// completes the module. Email is an optional extra and doesn't affect the status.
	const configuredCount = [
		Boolean( organization.name || defaults.name ),
		Boolean( organization.description || defaults.description ),
		organization.sameAs.length > 0,
	].filter( Boolean ).length;
	let schemaStatus: SettingStatus = 'not-started';
	if ( configuredCount === 3 ) {
		schemaStatus = 'complete';
	} else if ( configuredCount > 0 ) {
		schemaStatus = 'in-progress';
	}

	return (
		<CollapsibleCard.Root defaultOpen={ false }>
			<CollapsibleCard.Header render={ <h2 /> }>
				<Stack direction="row" justify="space-between" align="center" gap="sm">
					<Card.Title>
						<CardTitleIcon icon={ code } title={ __( 'Schema', 'jetpack-seo' ) } />
					</Card.Title>
					<CollapsibleCard.HeaderDescription>
						<StatusIndicator status={ schemaStatus } />
					</CollapsibleCard.HeaderDescription>
				</Stack>
			</CollapsibleCard.Header>
			<CollapsibleCard.Content>
				<Stack direction="column" gap="lg">
					<Text variant="body-sm" className={ styles.muted } render={ <p /> }>
						{ __(
							'Structured data that tells search engines and AI what your site is and who’s behind it. Fill in the details below and Jetpack adds the right markup automatically.',
							'jetpack-seo'
						) }
					</Text>

					<ToggleControl
						label={ __( 'Breadcrumbs', 'jetpack-seo' ) }
						help={ __(
							'Add breadcrumb markup so search results can show where a page sits in your site (for example Home › Blog › Post).',
							'jetpack-seo'
						) }
						checked={ breadcrumbList.enabled }
						// eslint-disable-next-line react/jsx-no-bind
						onChange={ next => commitBreadcrumbList( { enabled: next } ) }
						disabled={ isSaving }
						__nextHasNoMarginBottom
					/>

					<hr className={ styles.sectionDivider } />

					<OrganizationSection form={ form } />
					<LocalBusinessSection form={ form } />

					{ /* One Save for the whole entity — persists the Organization fields and
					   the LocalBusiness refinement together. */ }
					<Stack direction="row" justify="flex-end">
						<Button
							onClick={ form.saveOrganizationEntity }
							disabled={
								isSaving ||
								! ( form.isOrganizationDirty || form.isLocalBusinessDirty ) ||
								hasProfileUrlErrors( organization.sameAs ) ||
								( localBusiness.enabled && hasLocalBusinessErrors( form ) )
							}
						>
							{ __( 'Save', 'jetpack-seo' ) }
						</Button>
					</Stack>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default SchemaCard;
