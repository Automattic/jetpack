import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanOrganization } from './schema-settings-utils';
import type {
	OrganizationDefaults,
	OrganizationSettings,
	SchemaSettings,
} from './schema-settings-types';

const ENDPOINT = '/jetpack/v4/seo/schema-settings';
// Single snackbar id reused across a save so "Saving…" is replaced in place by
// the result — mirrors the Settings form's two-stage toast.
const NOTICE_ID = 'jetpack-seo-schema-settings-save';

export interface SchemaSettingsForm {
	/** The editable Organization overrides, or `null` while the initial fetch is in flight. */
	organization: OrganizationSettings | null;
	/** Site-identity values shown as field placeholders (what an empty override falls back to). */
	defaults: OrganizationDefaults;
	isLoading: boolean;
	isSaving: boolean;
	/** Whether the local Organization values differ from the last-saved baseline. */
	isDirty: boolean;
	/** Patch one or more Organization fields locally (persisted by `save()`). */
	setOrganizationField: ( patch: Partial< OrganizationSettings > ) => void;
	/** Persist the current Organization values through the schema-settings route. */
	save: () => void;
}

/**
 * Owns the site-level Schema settings form. Seeds from the Settings bootstrap
 * when available, falls back to the package's own REST route, edits locally, and
 * persists through that same schema route on explicit Save. Saving deliberately
 * avoids `/jetpack/v4/settings`, which rejects the nested schema container.
 *
 * @param initialSettings - Optional settings bootstrap from the Settings screen.
 * @param onSave          - Called with the saved schema payload after a successful save.
 * @return The schema-settings form controller.
 */
export function useSchemaSettings(
	initialSettings?: SchemaSettings,
	onSave?: ( settings: SchemaSettings ) => void
): SchemaSettingsForm {
	const [ organization, setOrganization ] = useState< OrganizationSettings | null >(
		initialSettings?.organization ?? null
	);
	// Placeholder defaults (Site Title / Tagline); empty until the initial fetch lands.
	const [ defaults, setDefaults ] = useState< OrganizationDefaults >( {
		name: initialSettings?.defaults.organization.name ?? '',
		description: initialSettings?.defaults.organization.description ?? '',
	} );
	const [ isLoading, setIsLoading ] = useState( ! initialSettings );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	// The last-saved baseline, kept in a ref so save() compares against the freshest
	// value without re-creating its callback.
	const baselineRef = useRef< OrganizationSettings | null >(
		initialSettings ? cleanOrganization( initialSettings.organization ) : null
	);

	// Fetch the effective settings once on mount when the settings bootstrap did
	// not include them.
	useEffect( () => {
		if ( initialSettings ) {
			return;
		}
		let cancelled = false;
		apiFetch< SchemaSettings >( { path: ENDPOINT } )
			.then( settings => {
				if ( cancelled ) {
					return;
				}
				baselineRef.current = cleanOrganization( settings.organization );
				setOrganization( settings.organization );
				setDefaults( settings.defaults.organization );
			} )
			.catch( () => {
				// Leave `organization` null so the section can show a load error.
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ initialSettings ] );

	const setOrganizationField = useCallback( ( patch: Partial< OrganizationSettings > ) => {
		setOrganization( current => {
			if ( ! current ) {
				return current;
			}
			const next = { ...current, ...patch };
			setIsDirty(
				JSON.stringify( cleanOrganization( next ) ) !== JSON.stringify( baselineRef.current )
			);
			return next;
		} );
	}, [] );

	const save = useCallback( () => {
		if ( ! organization || isSaving ) {
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
				// Re-seed from the server's response so the form reflects any
				// sanitization (e.g. dropped/deduped URLs); a cleared field comes back
				// empty, so it shows the placeholder again rather than re-freezing.
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

	return { organization, defaults, isLoading, isSaving, isDirty, setOrganizationField, save };
}
