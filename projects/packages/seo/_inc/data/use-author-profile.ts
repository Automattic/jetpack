import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanProfileUrls } from './schema-settings-utils';

const ENDPOINT = '/wp/v2/users/me';
const EDIT_ENDPOINT = `${ ENDPOINT }?context=edit`;
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

interface UserMeResponse {
	name?: string;
	description?: string;
	url?: string;
	avatar_urls?: Record< string, string >;
	meta?: {
		jetpack_seo_job_title?: string;
		jetpack_seo_same_as?: unknown;
	};
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

const fromUser = ( user: UserMeResponse ): { profile: AuthorProfile; avatarUrl: string } => ( {
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
 * the current WordPress user through core's users REST endpoint.
 *
 * @return The Author profile form controller.
 */
export function useAuthorProfile(): AuthorProfileForm {
	const [ profile, setProfile ] = useState< AuthorProfile >( EMPTY_PROFILE );
	const [ avatarUrl, setAvatarUrl ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ hasLoadError, setHasLoadError ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDirty, setIsDirty ] = useState( false );
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const baselineRef = useRef< AuthorProfile >( EMPTY_PROFILE );

	useEffect( () => {
		let isMounted = true;
		apiFetch< UserMeResponse >( { path: EDIT_ENDPOINT } )
			.then( user => {
				if ( ! isMounted ) {
					return;
				}
				const next = fromUser( user );
				baselineRef.current = cleanAuthorProfile( next.profile );
				setProfile( next.profile );
				setAvatarUrl( next.avatarUrl );
				setIsDirty( false );
				setHasLoadError( false );
			} )
			.catch( ( error: { message?: string } ) => {
				if ( ! isMounted ) {
					return;
				}
				setHasLoadError( true );
				createErrorNotice(
					error?.message ??
						__( 'Could not load author profile settings. Please try again.', 'jetpack-seo' ),
					{ id: NOTICE_ID, type: 'snackbar' }
				);
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsLoading( false );
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [ createErrorNotice ] );

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
		if ( isSaving ) {
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
		apiFetch< UserMeResponse >( {
			path: ENDPOINT,
			method: 'POST',
			data: {
				name: clean.name,
				description: clean.description,
				url: clean.url,
				meta: {
					jetpack_seo_job_title: clean.jobTitle,
					jetpack_seo_same_as: clean.sameAs,
				},
			},
		} )
			.then( user => {
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
				createErrorNotice(
					error?.message ?? __( 'Could not save author profile. Please try again.', 'jetpack-seo' ),
					{ id: NOTICE_ID, type: 'snackbar' }
				);
			} )
			.finally( () => setIsSaving( false ) );
	}, [ profile, isSaving, createInfoNotice, createSuccessNotice, createErrorNotice ] );

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
