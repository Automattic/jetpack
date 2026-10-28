import apiFetch from '@wordpress/api-fetch';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { cleanProfileUrls } from './schema-settings-utils';

// Not `/wp/v2/users/me`: WordPress.com Simple's API proxy strips user fields from it.
const ENDPOINT = '/jetpack/v4/seo/author-profile';
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
	/** Where name, bio and website are edited instead, when WordPress.com owns them; empty otherwise. */
	accountProfileUrl: string;
	isLoading: boolean;
	hasLoadError: boolean;
	isSaving: boolean;
	isDirty: boolean;
	setProfileField: ( patch: Partial< AuthorProfile > ) => void;
	save: () => void;
}

interface AuthorProfileResponse extends AuthorProfile {
	avatarUrl: string;
	accountProfileUrl: string;
}

const EMPTY_PROFILE: AuthorProfile = {
	name: '',
	description: '',
	url: '',
	jobTitle: '',
	sameAs: [],
};

const cleanAuthorProfile = ( profile: AuthorProfile ): AuthorProfile => ( {
	...profile,
	name: profile.name.trim(),
	url: profile.url.trim(),
	jobTitle: profile.jobTitle.trim(),
	sameAs: cleanProfileUrls( profile.sameAs ),
} );

/**
 * Owns the Author profile form: loads the signed-in user's profile from the
 * package's author-profile route, edits it locally, and persists it on Save.
 *
 * @return The Author profile form controller.
 */
export function useAuthorProfile(): AuthorProfileForm {
	const { createInfoNotice, createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );
	const [ profile, setProfile ] = useState< AuthorProfile >( EMPTY_PROFILE );
	const [ savedProfile, setSavedProfile ] = useState< AuthorProfile >( EMPTY_PROFILE );
	const [ avatarUrl, setAvatarUrl ] = useState( '' );
	const [ accountProfileUrl, setAccountProfileUrl ] = useState( '' );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ hasLoadError, setHasLoadError ] = useState( false );
	const [ isSaving, setIsSaving ] = useState( false );

	const applyResponse = useCallback(
		( { avatarUrl: avatar, accountProfileUrl: accountUrl, ...stored }: AuthorProfileResponse ) => {
			setProfile( stored );
			setSavedProfile( stored );
			setAvatarUrl( avatar );
			setAccountProfileUrl( accountUrl );
		},
		[]
	);

	useEffect( () => {
		let cancelled = false;
		apiFetch< AuthorProfileResponse >( { path: ENDPOINT } )
			.then( response => {
				if ( ! cancelled ) {
					applyResponse( response );
				}
			} )
			.catch( () => {
				if ( cancelled ) {
					return;
				}
				setHasLoadError( true );
				createErrorNotice(
					__( 'Could not load author profile settings. Please try again.', 'jetpack-seo' ),
					{ id: NOTICE_ID, type: 'snackbar' }
				);
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setIsLoading( false );
				}
			} );
		return () => {
			cancelled = true;
		};
	}, [ applyResponse, createErrorNotice ] );

	const setProfileField = useCallback(
		( patch: Partial< AuthorProfile > ) => setProfile( current => ( { ...current, ...patch } ) ),
		[]
	);

	const isDirty =
		JSON.stringify( cleanAuthorProfile( profile ) ) !==
		JSON.stringify( cleanAuthorProfile( savedProfile ) );

	const save = useCallback( async () => {
		if ( isSaving || isLoading || hasLoadError ) {
			return;
		}

		const clean = cleanAuthorProfile( profile );
		if ( ! accountProfileUrl && '' === clean.name ) {
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

		try {
			// The response is the profile as stored, so the form shows what actually persisted.
			applyResponse(
				await apiFetch< AuthorProfileResponse >( {
					path: ENDPOINT,
					method: 'POST',
					data: accountProfileUrl ? { jobTitle: clean.jobTitle, sameAs: clean.sameAs } : clean,
				} )
			);
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
		} finally {
			setIsSaving( false );
		}
	}, [
		profile,
		isSaving,
		isLoading,
		hasLoadError,
		accountProfileUrl,
		applyResponse,
		createInfoNotice,
		createSuccessNotice,
		createErrorNotice,
	] );

	return {
		profile,
		avatarUrl,
		accountProfileUrl,
		isLoading,
		hasLoadError,
		isSaving,
		isDirty,
		setProfileField,
		save,
	};
}
