import { ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { code } from '@wordpress/icons';
import { Button, Card, CollapsibleCard, Fieldset, Stack, Text } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import StatusIndicator from '../../components/status-indicator';
import { cleanProfileUrls } from '../../data/schema-settings-utils';
import { useSchemaSettings } from '../../data/use-schema-settings';
import { hasLocalBusinessErrors } from './schema-settings/local-business-fields';
import LocalBusinessSection from './schema-settings/local-business-section';
import OrganizationSection from './schema-settings/organization-section';
import { hasProfileUrlErrors } from './schema-settings/profile-url-list';
import styles from './schema-settings/style.module.scss';
import type { SettingStatus } from '../../components/status-indicator';
import type { SchemaSettings } from '../../data/schema-settings-types';

// Points the Save button at its blocking-error message. Static, matching the
// `jetpack-seo-settings-*` ids used for the field-level errors in this folder.
const SAVE_ERROR_ID = 'jetpack-seo-settings-schema-save-error';

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
 * Author profile (Person / ProfilePage for the signed-in user) is a distinct
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
	const {
		organization,
		defaults,
		localBusiness,
		breadcrumbList,
		isSaving,
		isOrganizationDirty,
		isLocalBusinessDirty,
		commitBreadcrumbList,
		saveOrganizationEntity,
	} = form;

	// A field counts as configured when it has a value — including its smart
	// default (Site Title → name, Tagline → description), because tracking the
	// site's own settings is the preferred state. Only profile links have no
	// default, so in practice they are what completes the module. Email is
	// optional and deliberately excluded. The two toggles are excluded too: a
	// completion status on an on/off preference would grade a deliberate choice.
	//
	// Everything is measured against what would actually be *stored*, not what is
	// typed: whitespace is trimmed, and profile links run through the same
	// `cleanProfileUrls` the save path uses, which drops blank, malformed and
	// duplicate rows. Otherwise the header could read "Complete" off a row that
	// server sanitization is about to discard — while Save sits disabled on the
	// very validation error that makes it uncounted.
	//
	// Each override is trimmed *before* the fallback, mirroring the backend, where
	// `Schema_Settings::text()` trims and the node then falls back to site identity.
	// Trimming the result instead would let a whitespace-only override win the `||`
	// and collapse to empty, dropping the module out of Complete over a value the
	// server will discard in favour of the Site Title that was counting before.
	const configuredFields = [
		organization.name.trim() || defaults.name.trim(),
		organization.description.trim() || defaults.description.trim(),
		cleanProfileUrls( organization.sameAs ).length > 0,
	];
	const configuredCount = configuredFields.filter( Boolean ).length;
	let schemaStatus: SettingStatus = 'not-started';
	if ( configuredCount === configuredFields.length ) {
		schemaStatus = 'complete';
	} else if ( configuredCount > 0 ) {
		schemaStatus = 'in-progress';
	}

	// One Save covers both sections, so an error in either blocks it. Say which
	// way out there is: the button is focusable while disabled (`@wordpress/ui`
	// sets `aria-disabled` rather than the native attribute), and the offending
	// field can be well off screen.
	const hasBlockingErrors =
		hasProfileUrlErrors( organization.sameAs ) ||
		( localBusiness.enabled && hasLocalBusinessErrors( form ) );

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
					<Text variant="body-md" render={ <p /> }>
						{ __(
							'Structured data that tells search engines and AI assistants what your site is and who runs it. Add the details below and Jetpack adds the right markup automatically.',
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

					{ /* A real fieldset, so the Organization details and their local-business
					   refinement stay one named group now that they no longer have a card
					   header each. The legend is hidden — the group is obvious on screen from
					   the hairline rule this wrapper draws — but it keeps the grouping in the
					   accessibility tree, which a bare `Stack` (a plain div) would not. */ }
					<Fieldset.Root className={ styles.entityGroup }>
						<Fieldset.Legend hideFromVision>
							{ __( 'Organization details', 'jetpack-seo' ) }
						</Fieldset.Legend>
						<Stack direction="column" gap="lg">
							<OrganizationSection form={ form } />
							<LocalBusinessSection form={ form } />

							{ /* The visible label stays "Save" to match the other modules, but the
							   accessible name names the module: this tab renders several "Save"
							   buttons, so a bare one is ambiguous in a screen reader's button list. */ }
							<Stack direction="row" justify="flex-end" align="center" gap="sm">
								{ hasBlockingErrors && (
									<Text variant="body-sm" id={ SAVE_ERROR_ID } className={ styles.saveError }>
										{ __( 'Fix the highlighted fields to save.', 'jetpack-seo' ) }
									</Text>
								) }
								<Button
									onClick={ saveOrganizationEntity }
									disabled={
										isSaving ||
										! ( isOrganizationDirty || isLocalBusinessDirty ) ||
										hasBlockingErrors
									}
									aria-label={ __( 'Save schema settings', 'jetpack-seo' ) }
									aria-describedby={ hasBlockingErrors ? SAVE_ERROR_ID : undefined }
								>
									{ __( 'Save', 'jetpack-seo' ) }
								</Button>
							</Stack>
						</Stack>
					</Fieldset.Root>
				</Stack>
			</CollapsibleCard.Content>
		</CollapsibleCard.Root>
	);
}

export default SchemaCard;
