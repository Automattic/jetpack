import { store as coreStore, useEntityRecord } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
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
}

interface CoreDataDispatch {
	saveEntityRecord: (
		kind: string,
		name: string,
		record: UserRecord,
		options: { throwOnError: boolean }
	) => Promise< UserRecord | undefined >;
}

const EMPTY_PROFILE: AuthorProfile = {
	name: '',
	description: '',
	url: '',
	jobTitle: '',
	sameAs: [],
};

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
 * Owns the Author profile form in the Schema settings card. Values read/write
 * the current WordPress user through core-data's user entity.
 *
 * @return The Author profile form controller.
 */
export function useAuthorProfile(): AuthorProfileForm {
	const [ profile, setProfile ] = useState< AuthorProfile >( EMPTY_PROFILE );
	const [ avatarUrl, setAvatarUrl ] = useState( '' );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const { saveEntityRecord } = useDispatch( coreStore ) as CoreDataDispatch;
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const baselineRef = useRef< AuthorProfile >( EMPTY_PROFILE );
	const isMountedRef = useRef( false );
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
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, [] );

	useEffect( () => {
		if ( ! userEntity.record ) {
			return;
		}
		const next = fromUser( userEntity.record );
		baselineRef.current = cleanAuthorProfile( next.profile );
		setProfile( next.profile );
		setAvatarUrl( next.avatarUrl );
		setIsDirty( false );
		loadErrorNoticedRef.current = false;
	}, [ userEntity.record ] );

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

	const setProfileField = useCallback( ( patch: Partial< AuthorProfile > ) => {
		setProfile( current => {
			const next = { ...current, ...patch };
			setIsDirty(
				JSON.stringify( cleanAuthorProfile( next ) ) !== JSON.stringify( baselineRef.current )
			);
			return next;
		} );
	}, [] );

	const save = useCallback( () => {
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

		setIsSaving( true );
		createInfoNotice( __( 'Saving author profile…', 'jetpack-seo' ), {
			id: NOTICE_ID,
			type: 'snackbar',
			isDismissible: false,
		} );
		saveEntityRecord(
			'root',
			'user',
			{
				id: currentUserId,
				name: clean.name,
				description: clean.description,
				url: clean.url,
				meta: {
					jetpack_seo_job_title: clean.jobTitle,
					jetpack_seo_same_as: clean.sameAs,
				},
			},
			{ throwOnError: true }
		)
			.then( user => {
				if ( ! isMountedRef.current ) {
					return;
				}
				if ( ! user ) {
					throw new Error(
						__( 'Could not save author profile. Please try again.', 'jetpack-seo' )
					);
				}
				const next = fromUser( user );
				baselineRef.current = cleanAuthorProfile( next.profile );
				setProfile( next.profile );
				setAvatarUrl( next.avatarUrl );
				setIsDirty( false );
				createSuccessNotice( __( 'Author profile saved.', 'jetpack-seo' ), {
					id: NOTICE_ID,
					type: 'snackbar',
				} );
			} )
			.catch( ( error: { message?: string } ) => {
				if ( ! isMountedRef.current ) {
					return;
				}
				createErrorNotice(
					error?.message ?? __( 'Could not save author profile. Please try again.', 'jetpack-seo' ),
					{ id: NOTICE_ID, type: 'snackbar' }
				);
			} )
			.finally( () => {
				if ( isMountedRef.current ) {
					setIsSaving( false );
				}
			} );
	}, [
		profile,
		isSaving,
		hasLoadError,
		currentUserId,
		saveEntityRecord,
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
		isDirty,
		setProfileField,
		save,
	};
}
