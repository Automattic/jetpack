import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanOrganization } from './schema-settings-utils';
import type {
	OrganizationDefaults,
	OrganizationSettings,
	SchemaSettings,
} from './schema-settings-types';

const ENDPOINT = '/jetpack/v4/seo/schema-settings';
// Single snackbar id reused across a save so "Saving…" is replaced in place by the result.
const NOTICE_ID = 'jetpack-seo-schema-settings-save';

export interface SchemaSettingsForm {
	/** The editable Organization overrides. */
	organization: OrganizationSettings;
	/** Site-identity values shown as field placeholders (what an empty override falls back to). */
	defaults: OrganizationDefaults;
	isSaving: boolean;
	/** Whether the local Organization values differ from the last-saved baseline. */
	isDirty: boolean;
	/** Patch one or more Organization fields locally (persisted by `save()`). */
	setOrganizationField: ( patch: Partial< OrganizationSettings > ) => void;
	/** Persist the current Organization values through the schema-settings route. */
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
	const [ organization, setOrganization ] = useState< OrganizationSettings >(
		initialSettings.organization
	);
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// The last-saved baseline, kept in a ref so save() compares against the freshest
	// value without re-creating its callback.
	const baselineRef = useRef< OrganizationSettings >(
		cleanOrganization( initialSettings.organization )
	);

	const setOrganizationField = useCallback( ( patch: Partial< OrganizationSettings > ) => {
		setOrganization( current => {
			const next = { ...current, ...patch };
			setIsDirty(
				JSON.stringify( cleanOrganization( next ) ) !== JSON.stringify( baselineRef.current )
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
			data: { organization: cleanOrganization( organization ) },
		} )
			.then( settings => {
				// Re-seed from the server's response so the form reflects any sanitization
				// (e.g. dropped/deduped URLs); a cleared field comes back empty and shows
				// the placeholder again rather than re-freezing.
				baselineRef.current = cleanOrganization( settings.organization );
				setOrganization( settings.organization );
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
	}, [ organization, isSaving, createInfoNotice, createSuccessNotice, createErrorNotice, onSave ] );

	return {
		organization,
		defaults: initialSettings.defaults.organization,
		isSaving,
		isDirty,
		setOrganizationField,
		save,
	};
}
