import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanLocalBusiness, cleanOrganization } from './schema-settings-utils';
import type {
	LocalBusinessDefaults,
	LocalBusinessSettings,
	OrganizationDefaults,
	OrganizationSettings,
	SchemaSettings,
} from './schema-settings-types';

const ENDPOINT = '/jetpack/v4/seo/schema-settings';
// Single snackbar id reused across a save so "Saving…" is replaced in place by the result.
const NOTICE_ID = 'jetpack-seo-schema-settings-save';

type EditableSchemaSections = Pick< SchemaSettings, 'organization' | 'localBusiness' >;

const cleanSections = ( sections: EditableSchemaSections ): EditableSchemaSections => ( {
	organization: cleanOrganization( sections.organization ),
	localBusiness: cleanLocalBusiness( sections.localBusiness ),
} );

export interface SchemaSettingsForm {
	/** The editable Organization overrides. */
	organization: OrganizationSettings;
	/** Site-identity values shown as field placeholders (what an empty override falls back to). */
	defaults: OrganizationDefaults;
	/** The editable LocalBusiness overrides. */
	localBusiness: LocalBusinessSettings;
	/** LocalBusiness defaults shown as field placeholders. */
	localBusinessDefaults: LocalBusinessDefaults;
	isSaving: boolean;
	/** Whether the local schema values differ from the last-saved baseline. */
	isDirty: boolean;
	/** Patch one or more Organization fields locally (persisted by `save()`). */
	setOrganizationField: ( patch: Partial< OrganizationSettings > ) => void;
	/** Patch one or more LocalBusiness fields locally (persisted by `save()`). */
	setLocalBusinessField: ( patch: Partial< LocalBusinessSettings > ) => void;
	/** Persist the current schema values through the schema-settings route. */
	save: () => void;
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
		organization: initialSettings.organization,
		localBusiness: initialSettings.localBusiness,
	} );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// The last-saved baseline, kept in a ref so save() compares against the freshest
	// value without re-creating its callback.
	const baselineRef = useRef< EditableSchemaSections >(
		cleanSections( {
			organization: initialSettings.organization,
			localBusiness: initialSettings.localBusiness,
		} )
	);

	const setOrganizationField = useCallback( ( patch: Partial< OrganizationSettings > ) => {
		setSections( current => {
			const next = {
				...current,
				organization: { ...current.organization, ...patch },
			};
			setIsDirty(
				JSON.stringify( cleanSections( next ) ) !== JSON.stringify( baselineRef.current )
			);
			return next;
		} );
	}, [] );

	const setLocalBusinessField = useCallback( ( patch: Partial< LocalBusinessSettings > ) => {
		setSections( current => {
			const next = {
				...current,
				localBusiness: { ...current.localBusiness, ...patch },
			};
			setIsDirty(
				JSON.stringify( cleanSections( next ) ) !== JSON.stringify( baselineRef.current )
			);
			return next;
		} );
	}, [] );

	const save = useCallback( () => {
		if ( isSaving ) {
			return;
		}
		setIsSaving( true );
		createInfoNotice( __( 'Saving schema settings…', 'jetpack-seo' ), {
			id: NOTICE_ID,
			type: 'snackbar',
			isDismissible: false,
		} );
		apiFetch< SchemaSettings >( {
			path: ENDPOINT,
			method: 'POST',
			data: cleanSections( sections ),
		} )
			.then( settings => {
				// Re-seed from the server's response so the form reflects any sanitization
				// (e.g. dropped/deduped URLs); a cleared field comes back empty and shows
				// the placeholder again rather than re-freezing.
				baselineRef.current = cleanSections( settings );
				setSections( {
					organization: settings.organization,
					localBusiness: settings.localBusiness,
				} );
				onSave?.( settings );
				setIsDirty( false );
				createSuccessNotice( __( 'Schema settings saved.', 'jetpack-seo' ), {
					id: NOTICE_ID,
					type: 'snackbar',
				} );
			} )
			.catch( ( error: { message?: string } ) => {
				createErrorNotice(
					error?.message ??
						__( 'Could not save schema settings. Please try again.', 'jetpack-seo' ),
					{ id: NOTICE_ID, type: 'snackbar' }
				);
			} )
			.finally( () => setIsSaving( false ) );
	}, [ sections, isSaving, createInfoNotice, createSuccessNotice, createErrorNotice, onSave ] );

	return {
		organization: sections.organization,
		defaults: initialSettings.defaults.organization,
		localBusiness: sections.localBusiness,
		localBusinessDefaults: initialSettings.defaults.localBusiness,
		isSaving,
		isDirty,
		setOrganizationField,
		setLocalBusinessField,
		save,
	};
}
