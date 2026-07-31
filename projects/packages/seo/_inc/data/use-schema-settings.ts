import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanLocalBusiness, cleanOrganization } from './schema-settings-utils';
import type {
	BreadcrumbListSettings,
	LocalBusinessDefaults,
	LocalBusinessSettings,
	OrganizationDefaults,
	OrganizationSettings,
	SchemaSettings,
} from './schema-settings-types';

const ENDPOINT = '/jetpack/v4/seo/schema-settings';
// Single snackbar id reused across a save so "Saving…" is replaced in place by the result.
const NOTICE_ID = 'jetpack-seo-schema-settings-save';

type EditableSchemaSections = Pick<
	SchemaSettings,
	'breadcrumbList' | 'organization' | 'localBusiness'
>;

export interface SchemaSettingsForm {
	/** The editable BreadcrumbList setting. */
	breadcrumbList: BreadcrumbListSettings;
	/** The editable Organization overrides. */
	organization: OrganizationSettings;
	/** Site-identity values shown as field placeholders (what an empty override falls back to). */
	defaults: OrganizationDefaults;
	/** The editable LocalBusiness overrides. */
	localBusiness: LocalBusinessSettings;
	/** LocalBusiness defaults shown as field placeholders. */
	localBusinessDefaults: LocalBusinessDefaults;
	isSaving: boolean;
	/** Whether the local Organization values differ from their last-saved baseline. */
	isOrganizationDirty: boolean;
	/** Whether the local LocalBusiness values differ from their last-saved baseline. */
	isLocalBusinessDirty: boolean;
	/** Patch one or more Organization fields locally (persisted by `saveOrganizationEntity()`). */
	setOrganizationField: ( patch: Partial< OrganizationSettings > ) => void;
	/** Patch the BreadcrumbList setting and persist it immediately (toggles auto-save). */
	commitBreadcrumbList: ( patch: Partial< BreadcrumbListSettings > ) => void;
	/** Patch one or more LocalBusiness fields locally (persisted by `saveOrganizationEntity()`). */
	setLocalBusinessField: ( patch: Partial< LocalBusinessSettings > ) => void;
	/** Persist the current Organization + LocalBusiness values together (one Save). */
	saveOrganizationEntity: () => void;
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
		breadcrumbList: initialSettings.breadcrumbList,
		organization: initialSettings.organization,
		localBusiness: initialSettings.localBusiness,
	} );
	const [ isSaving, setIsSaving ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// The last-saved baseline, kept in a ref so each section can be saved without
	// disturbing pending edits in the others.
	const baselineRef = useRef< EditableSchemaSections >( {
		breadcrumbList: { ...initialSettings.breadcrumbList },
		organization: cleanOrganization( initialSettings.organization ),
		localBusiness: cleanLocalBusiness( initialSettings.localBusiness ),
	} );
	const isOrganizationDirty =
		JSON.stringify( cleanOrganization( sections.organization ) ) !==
		JSON.stringify( baselineRef.current.organization );
	const isLocalBusinessDirty =
		JSON.stringify( cleanLocalBusiness( sections.localBusiness ) ) !==
		JSON.stringify( baselineRef.current.localBusiness );

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

	// The Organization entity and its LocalBusiness refinement share one Save, so a
	// single click persists both — but the request carries only the sections that
	// actually changed. The route merges partial payloads, so an untouched section
	// keeps whatever is stored. Sending both unconditionally would widen the
	// lost-update window from one section to two: with the page open twice, saving
	// Organization in one tab would overwrite a local-business edit saved from the
	// other with this tab's stale copy.
	const saveOrganizationEntity = useCallback( () => {
		if ( isSaving ) {
			return;
		}
		const data: Partial< EditableSchemaSections > = {};
		if ( isOrganizationDirty ) {
			data.organization = cleanOrganization( sections.organization );
		}
		if ( isLocalBusinessDirty ) {
			data.localBusiness = cleanLocalBusiness( sections.localBusiness );
		}
		persist( data, __( 'Saving schema settings…', 'jetpack-seo' ), settings => {
			// Re-seed both from the response regardless of what was sent: neither is
			// dirty afterwards, so there are no pending edits to lose, and a section
			// changed elsewhere is picked up instead of silently ignored.
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
		} );
	}, [ isSaving, isOrganizationDirty, isLocalBusinessDirty, persist, sections ] );

	return {
		breadcrumbList: sections.breadcrumbList,
		organization: sections.organization,
		defaults: initialSettings.defaults.organization,
		localBusiness: sections.localBusiness,
		localBusinessDefaults: initialSettings.defaults.localBusiness,
		isSaving,
		isOrganizationDirty,
		isLocalBusinessDirty,
		commitBreadcrumbList,
		setOrganizationField,
		setLocalBusinessField,
		saveOrganizationEntity,
	};
}
