import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanLocalBusiness, cleanOrganization, cleanPerson } from './schema-settings-utils';
import type {
	BreadcrumbListSettings,
	LocalBusinessDefaults,
	LocalBusinessSettings,
	OrganizationDefaults,
	OrganizationSettings,
	PersonDefaults,
	PersonSettings,
	SchemaSettings,
	SiteEntityType,
} from './schema-settings-types';

const ENDPOINT = '/jetpack/v4/seo/schema-settings';
// Single snackbar id reused across a save so "Saving…" is replaced in place by the result.
const NOTICE_ID = 'jetpack-seo-schema-settings-save';

type EditableSchemaSections = Pick<
	SchemaSettings,
	'siteRepresents' | 'breadcrumbList' | 'organization' | 'localBusiness' | 'person'
>;

export interface SchemaSettingsForm {
	/** Which entity the site represents (its publisher / main entity). */
	siteRepresents: SiteEntityType;
	/** The editable BreadcrumbList setting. */
	breadcrumbList: BreadcrumbListSettings;
	/** The editable Organization overrides. */
	organization: OrganizationSettings;
	/** Site-identity values shown as Organization field placeholders (what an empty override falls back to). */
	defaults: OrganizationDefaults;
	/** The editable LocalBusiness overrides. */
	localBusiness: LocalBusinessSettings;
	/** LocalBusiness defaults shown as field placeholders. */
	localBusinessDefaults: LocalBusinessDefaults;
	/** The editable Person overrides. */
	person: PersonSettings;
	/** Site-identity values shown as Person field placeholders. */
	personDefaults: PersonDefaults;
	isSaving: boolean;
	/** Whether the local Organization values differ from their last-saved baseline. */
	isOrganizationDirty: boolean;
	/** Whether the local LocalBusiness values differ from their last-saved baseline. */
	isLocalBusinessDirty: boolean;
	/** Whether the local Person values differ from their last-saved baseline. */
	isPersonDirty: boolean;
	/** Patch one or more Organization fields locally (persisted by `saveOrganizationEntity()`). */
	setOrganizationField: ( patch: Partial< OrganizationSettings > ) => void;
	/** Patch the BreadcrumbList setting and persist it immediately (toggles auto-save). */
	commitBreadcrumbList: ( patch: Partial< BreadcrumbListSettings > ) => void;
	/** Set which entity the site represents and persist it immediately. */
	commitSiteRepresents: ( next: SiteEntityType ) => void;
	/** Patch one or more LocalBusiness fields locally (persisted by `saveOrganizationEntity()`). */
	setLocalBusinessField: ( patch: Partial< LocalBusinessSettings > ) => void;
	/** Patch one or more Person fields locally (persisted by `savePerson()`). */
	setPersonField: ( patch: Partial< PersonSettings > ) => void;
	/** Persist the current Organization + LocalBusiness values together (one Save). */
	saveOrganizationEntity: () => void;
	/** Persist the current Person values through the schema-settings route. */
	savePerson: () => void;
}

/**
 * Owns the site-level Schema settings form: seeds from the Settings bootstrap,
 * edits locally, and persists through the package's schema-settings route on Save.
 *
 * @param initialSettings - Settings bootstrap from the Settings screen.
 * @param onSave          - Called with the saved schema payload after a successful save.
 * @return The schema-settings form controller.
 */
export function useSchemaSettings(
	initialSettings: SchemaSettings,
	onSave?: ( settings: SchemaSettings ) => void
): SchemaSettingsForm {
	const [ sections, setSections ] = useState< EditableSchemaSections >( {
		siteRepresents: initialSettings.siteRepresents,
		breadcrumbList: initialSettings.breadcrumbList,
		organization: initialSettings.organization,
		localBusiness: initialSettings.localBusiness,
		person: initialSettings.person,
	} );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// The last-saved baseline, kept in a ref so each section can be saved without
	// disturbing pending edits in the others.
	const baselineRef = useRef< EditableSchemaSections >( {
		siteRepresents: initialSettings.siteRepresents,
		breadcrumbList: { ...initialSettings.breadcrumbList },
		organization: cleanOrganization( initialSettings.organization ),
		localBusiness: cleanLocalBusiness( initialSettings.localBusiness ),
		person: cleanPerson( initialSettings.person ),
	} );
	const isOrganizationDirty =
		JSON.stringify( cleanOrganization( sections.organization ) ) !==
		JSON.stringify( baselineRef.current.organization );
	const isLocalBusinessDirty =
		JSON.stringify( cleanLocalBusiness( sections.localBusiness ) ) !==
		JSON.stringify( baselineRef.current.localBusiness );
	const isPersonDirty =
		JSON.stringify( cleanPerson( sections.person ) ) !==
		JSON.stringify( baselineRef.current.person );

	// The one POST path: in-flight guard, the "Saving…" → result snackbar, and error
	// handling, all in one place. `onSuccess` re-seeds only the sections the caller
	// actually sent, so pending edits elsewhere in the form survive the round trip.
	// `onError` lets an optimistic caller (the auto-saving toggle) roll back.
	const persist = useCallback(
		(
			data: Partial< EditableSchemaSections >,
			savingNotice: string,
			onSuccess: ( settings: SchemaSettings ) => void,
			onError?: () => void
		) => {
			setIsSaving( true );
			createInfoNotice( savingNotice, {
				id: NOTICE_ID,
				type: 'snackbar',
				isDismissible: false,
			} );
			apiFetch< SchemaSettings >( { path: ENDPOINT, method: 'POST', data } )
				.then( settings => {
					onSuccess( settings );
					onSave?.( settings );
					createSuccessNotice( __( 'Schema settings saved.', 'jetpack-seo' ), {
						id: NOTICE_ID,
						type: 'snackbar',
					} );
				} )
				.catch( ( error: { message?: string } ) => {
					onError?.();
					createErrorNotice(
						error?.message ??
							__( 'Could not save schema settings. Please try again.', 'jetpack-seo' ),
						{ id: NOTICE_ID, type: 'snackbar' }
					);
				} )
				.finally( () => setIsSaving( false ) );
		},
		[ onSave, createInfoNotice, createSuccessNotice, createErrorNotice ]
	);

	const commitBreadcrumbList = useCallback(
		( patch: Partial< BreadcrumbListSettings > ) => {
			// Guard before the optimistic update, not just before the request, so a
			// toggle during an in-flight save doesn't move the switch either.
			if ( isSaving ) {
				return;
			}
			// Update local for immediate UI feedback, but persist only this section so
			// pending Organization / LocalBusiness edits stay local until the module's
			// Save — matching the toggle sections of the main Settings form.
			const next = { ...sections.breadcrumbList, ...patch };
			setSections( current => ( { ...current, breadcrumbList: next } ) );
			persist(
				{ breadcrumbList: next },
				__( 'Saving breadcrumbs…', 'jetpack-seo' ),
				settings => {
					baselineRef.current = {
						...baselineRef.current,
						breadcrumbList: { ...settings.breadcrumbList },
					};
					setSections( current => ( { ...current, breadcrumbList: settings.breadcrumbList } ) );
				},
				// The optimistic update above is unpersisted, so roll it back to the
				// last-saved value rather than leaving the UI asserting a state the
				// server rejected.
				() =>
					setSections( current => ( {
						...current,
						breadcrumbList: baselineRef.current.breadcrumbList,
					} ) )
			);
		},
		[ isSaving, sections, persist ]
	);

	const commitSiteRepresents = useCallback(
		( next: SiteEntityType ) => {
			// Guard before the optimistic update, not just before the request, so a
			// select during an in-flight save doesn't move the choice either.
			if ( isSaving ) {
				return;
			}
			// The entity choice persists immediately on select (like the toggles),
			// while the Organization / Person field edits stay local until the
			// module's Save. Switching entity never discards those pending edits.
			setSections( current => ( { ...current, siteRepresents: next } ) );
			persist(
				{ siteRepresents: next },
				__( 'Saving schema settings…', 'jetpack-seo' ),
				settings => {
					baselineRef.current = {
						...baselineRef.current,
						siteRepresents: settings.siteRepresents,
					};
					setSections( current => ( { ...current, siteRepresents: settings.siteRepresents } ) );
				},
				// Roll the optimistic switch back to the last-saved entity so a failed
				// save can't leave the card showing (and editing) an entity the server
				// never accepted.
				() =>
					setSections( current => ( {
						...current,
						siteRepresents: baselineRef.current.siteRepresents,
					} ) )
			);
		},
		[ isSaving, persist ]
	);

	const setOrganizationField = useCallback( ( patch: Partial< OrganizationSettings > ) => {
		setSections( current => ( {
			...current,
			organization: { ...current.organization, ...patch },
		} ) );
	}, [] );

	const setLocalBusinessField = useCallback( ( patch: Partial< LocalBusinessSettings > ) => {
		setSections( current => ( {
			...current,
			localBusiness: { ...current.localBusiness, ...patch },
		} ) );
	}, [] );

	const setPersonField = useCallback( ( patch: Partial< PersonSettings > ) => {
		setSections( current => ( {
			...current,
			person: { ...current.person, ...patch },
		} ) );
	}, [] );

	// The Organization entity and its LocalBusiness refinement share one Save, so a
	// single click persists both (the backend merges partial section payloads).
	const saveOrganizationEntity = useCallback( () => {
		if ( isSaving ) {
			return;
		}
		persist(
			{
				organization: cleanOrganization( sections.organization ),
				localBusiness: cleanLocalBusiness( sections.localBusiness ),
			},
			__( 'Saving schema settings…', 'jetpack-seo' ),
			settings => {
				baselineRef.current = {
					...baselineRef.current,
					organization: cleanOrganization( settings.organization ),
					localBusiness: cleanLocalBusiness( settings.localBusiness ),
				};
				setSections( current => ( {
					...current,
					organization: settings.organization,
					localBusiness: settings.localBusiness,
				} ) );
			}
		);
	}, [ isSaving, persist, sections ] );

	const savePerson = useCallback( () => {
		if ( isSaving ) {
			return;
		}
		persist(
			{ person: cleanPerson( sections.person ) },
			__( 'Saving schema settings…', 'jetpack-seo' ),
			settings => {
				baselineRef.current = {
					...baselineRef.current,
					person: cleanPerson( settings.person ),
				};
				setSections( current => ( { ...current, person: settings.person } ) );
			}
		);
	}, [ isSaving, persist, sections ] );

	return {
		siteRepresents: sections.siteRepresents,
		breadcrumbList: sections.breadcrumbList,
		organization: sections.organization,
		defaults: initialSettings.defaults.organization,
		localBusiness: sections.localBusiness,
		localBusinessDefaults: initialSettings.defaults.localBusiness,
		person: sections.person,
		personDefaults: initialSettings.defaults.person,
		isSaving,
		isOrganizationDirty,
		isLocalBusinessDirty,
		isPersonDirty,
		commitBreadcrumbList,
		commitSiteRepresents,
		setOrganizationField,
		setLocalBusinessField,
		setPersonField,
		saveOrganizationEntity,
		savePerson,
	};
}
