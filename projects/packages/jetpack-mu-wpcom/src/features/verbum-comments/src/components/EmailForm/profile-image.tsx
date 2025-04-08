import { Hovercards } from '@gravatar-com/hovercards';
import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'preact/hooks';
import { CommentUser } from './profile-get';

const UPDATE_DELAY = 2000; // Some time for the caches to clear
const LOCALE_MAP = {
	en: '',
	zh_TW: 'zh-TW',
	fr_ca: 'fr-CA',
};

const getAvatarUrl = ( profile: CommentUser, cacheBuster: number ) => {
	if ( ! profile.avatarUrl ) {
		return `https://0.gravatar.com/avatar/${ profile.emailHash }`;
	}

	return `${ profile.avatarUrl }?v=${ cacheBuster }`;
};

const getLocale = ( locale: string ) => {
	// Convert special locales to Gravatar locales
	if ( LOCALE_MAP[ locale ] ) {
		return LOCALE_MAP[ locale ];
	}

	return locale.replace( /_.*$/, '' );
};

const ProfileImage = ( { profile } ) => {
	const profileImageRef = useRef( null );
	const quickEditorRef = useRef( null );
	const hovercardRef = useRef( null );
	const timerRef = useRef( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ cacheBuster, setCacheBuster ] = useState( new Date().getTime() );

	const openEditor = () => {
		if ( ! quickEditorRef.current ) {
			quickEditorRef.current = new GravatarQuickEditorCore( {
				scope: [ 'avatars' ],
				email: profile?.email,
				locale: getLocale( VerbumComments?.currentLocale || '' ),
				utm: 'jetpack-comments',
				onProfileUpdated: () => {
					setIsLoading( true );

					clearTimeout( timerRef.current );

					// Reload the new avatar
					timerRef.current = setTimeout( () => {
						setIsLoading( false );
						setCacheBuster( new Date().getTime() );
						timerRef.current = null;
					}, UPDATE_DELAY );
				},
			} );
		}

		quickEditorRef.current.open();
	};

	useEffect( () => {
		if ( profileImageRef.current ) {
			hovercardRef.current = new Hovercards( {
				i18n: VerbumComments.hovercardi18n,
				onCanShowHovercard: () => {
					return quickEditorRef.current === null || ! quickEditorRef.current.isOpen();
				},
			} );
			hovercardRef.current.attach( profileImageRef.current );
		}
	}, [] );

	return (
		<button
			type="button"
			onClick={ openEditor }
			className={ clsx( 'verbum-form__profile', isLoading && 'loading' ) }
		>
			<img
				src={ getAvatarUrl( profile, cacheBuster ) }
				alt={ profile?.displayName || '' }
				ref={ profileImageRef }
			/>
		</button>
	);
};

export default ProfileImage;
