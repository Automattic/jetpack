import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanProfileUrls } from './schema-settings-utils';

const NOTICE_ID = 'jetpack-seo-author-profile';

export interface AuthorProfile {
	name: string;
	description: string;
	url: string;
	jobTitle: string;
	sameAs: string[];
}

export interface AuthorProfileForm {
	profile: AuthorProfile;
	avatarUrl: string;
	isLoading: boolean;
	hasLoadError: boolean;
	isSaving: boolean;
	isDirty: boolean;
	setProfileField: ( patch: Partial< AuthorProfile > ) => void;
	save: () => void;
}

interface UserRecord {
	id?: number;
	name?: string;
	description?: string;
	url?: string;
	avatar_urls?: Record< string, string >;
	meta?: {
		jetpack_seo_job_title?: string;
		jetpack_seo_same_as?: unknown;
	};
}

interface CoreDataSelect {
	getCurrentUser: () => { id?: number } | undefined;
	getResolutionState: ( selectorName: string, args: unknown[] ) => { status?: string } | undefined;
	isSavingEntityRecord: ( kind: string, name: string, recordId: number ) => boolean;
}

const stringsFromMeta = ( value: unknown ): string[] =>
	Array.isArray( value )
		? value.filter( ( item ): item is string => typeof item === 'string' )
		: [];

const fromUser = ( user: UserRecord ): { profile: AuthorProfile; avatarUrl: string } => ( {
	profile: {
		name: user.name ?? '',
		description: user.description ?? '',
		url: user.url ?? '',
		jobTitle: user.meta?.jetpack_seo_job_title ?? '',
		sameAs: stringsFromMeta( user.meta?.jetpack_seo_same_as ),
	},
	avatarUrl: user.avatar_urls?.[ '96' ] ?? '',
} );

const cleanAuthorProfile = ( profile: AuthorProfile ): AuthorProfile => ( {
	...profile,
	name: profile.name.trim(),
	url: profile.url.trim(),
	jobTitle: profile.jobTitle.trim(),
	sameAs: cleanProfileUrls( profile.sameAs ),
} );

/**
 * Maps an `AuthorProfile` patch to a core-data user-entity edit. `name`,
 * `description`, and `url` pass through; `jobTitle`/`sameAs` become the two
 * Jetpack meta keys. The user entity has no `mergedEdits` for `meta`, so a meta
 * edit replaces the previous one — both keys ride every meta edit, seeding the
 * untouched key from the current edited profile.
 *
 * @param patch   - The requested profile changes.
 * @param current - The current edited profile, source for untouched meta keys.
 * @return The equivalent user-entity edit.
 */
const toUserEdit = (
	patch: Partial< AuthorProfile >,
	current: AuthorProfile
): Partial< UserRecord > => {
	const edit: Partial< UserRecord > = {};
	if ( 'name' in patch ) {
		edit.name = patch.name;
	}
	if ( 'description' in patch ) {
		edit.description = patch.description;
	}
	if ( 'url' in patch ) {
		edit.url = patch.url;
	}
	if ( 'jobTitle' in patch || 'sameAs' in patch ) {
		edit.meta = {
			jetpack_seo_job_title: patch.jobTitle ?? current.jobTitle,
			jetpack_seo_same_as: patch.sameAs ?? current.sameAs,
		};
	}
	return edit;
};

/**
 * Owns the Author profile form in the Schema settings card. The core-data user
 * entity is the single source of truth: values are derived from its edited
 * record, edits write straight back through `edit()`, and `save()` persists
 * them — no local mirror of the profile state.
 *
 * @return The Author profile form controller.
 */
export function useAuthorProfile(): AuthorProfileForm {
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const loadErrorNoticedRef = useRef( false );

	const { currentUserId, currentUserHasResolved, currentUserHasLoadError } = useSelect( select => {
		const core = select( coreStore ) as CoreDataSelect;
		const currentUser = core.getCurrentUser();
		const status = core.getResolutionState( 'getCurrentUser', [] )?.status;
		return {
			currentUserId: currentUser?.id ?? 0,
			currentUserHasResolved: !! currentUser?.id || 'finished' === status || 'error' === status,
			currentUserHasLoadError: 'error' === status,
		};
	}, [] );

	const userEntity = useEntityRecord< UserRecord >( 'root', 'user', currentUserId, {
		enabled: !! currentUserId,
	} );
	const { editedRecord, edit, hasEdits } = userEntity;

	const isSaving = useSelect(
		select =>
			!! currentUserId &&
			( select( coreStore ) as CoreDataSelect ).isSavingEntityRecord(
				'root',
				'user',
				currentUserId
			),
		[ currentUserId ]
	);

	const { profile, avatarUrl } = useMemo( () => fromUser( editedRecord ?? {} ), [ editedRecord ] );

	const hasLoadError =
		currentUserHasLoadError ||
		( currentUserHasResolved && ! currentUserId ) ||
		'ERROR' === userEntity.status ||
		( userEntity.hasResolved && ! userEntity.record );
	const isLoading =
		! hasLoadError &&
		( ! currentUserHasResolved ||
			userEntity.isResolving ||
			( !! currentUserId && ! userEntity.hasResolved && ! userEntity.record ) );

	useEffect( () => {
		if ( ! hasLoadError || isLoading || loadErrorNoticedRef.current ) {
			return;
		}
		loadErrorNoticedRef.current = true;
		createErrorNotice(
			__( 'Could not load author profile settings. Please try again.', 'jetpack-seo' ),
			{
				id: NOTICE_ID,
				type: 'snackbar',
			}
		);
	}, [ hasLoadError, isLoading, createErrorNotice ] );

	const setProfileField = useCallback(
		( patch: Partial< AuthorProfile > ) => edit( toUserEdit( patch, profile ) ),
		[ edit, profile ]
	);

	const save = useCallback( async () => {
		if ( isSaving || hasLoadError || ! currentUserId ) {
			return;
		}

		const clean = cleanAuthorProfile( profile );
		if ( '' === clean.name ) {
			createErrorNotice( __( 'Author name cannot be empty.', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
			} );
			return;
		}

		createInfoNotice( __( 'Saving author profile…', 'jetpack-seo' ), {
			id: NOTICE_ID,
			type: 'snackbar',
			isDismissible: false,
		} );

		try {
			// Stage the cleaned values (same pattern as seo-inspector), then persist.
			// Both meta keys ride the edit since the user entity replaces meta edits.
			edit( {
				name: clean.name,
				description: clean.description,
				url: clean.url,
				meta: {
					jetpack_seo_job_title: clean.jobTitle,
					jetpack_seo_same_as: clean.sameAs,
				},
			} );
			// `throwOnError` so a failed save rejects and hits the catch below —
			// core-data suppresses save errors by default, which would otherwise
			// let the success notice fire even when persistence failed.
			await saveEditedEntityRecord( 'root', 'user', currentUserId, { throwOnError: true } );
			createSuccessNotice( __( 'Author profile saved.', 'jetpack-seo' ), {
				id: NOTICE_ID,
				type: 'snackbar',
			} );
		} catch ( error ) {
			createErrorNotice(
				( error as { message?: string } )?.message ??
					__( 'Could not save author profile. Please try again.', 'jetpack-seo' ),
				{ id: NOTICE_ID, type: 'snackbar' }
			);
		}
	}, [
		profile,
		isSaving,
		hasLoadError,
		currentUserId,
		edit,
		saveEditedEntityRecord,
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	return {
		profile,
		avatarUrl,
		isLoading,
		hasLoadError,
		isSaving,
		isDirty: hasEdits,
		setProfileField,
		save,
	};
}
