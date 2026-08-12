import { Hovercards } from '@gravatar-com/hovercards';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'preact/hooks';
import getHovercard from '../quick-editor';
import { CommentUser } from './profile-get';
import type { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';

const getAvatarUrl = ( profile: CommentUser, cacheBuster: number ) => {
	if ( ! profile.avatarUrl ) {
		return `https://0.gravatar.com/avatar/${ profile.emailHash }`;
	}

	return `${ profile.avatarUrl }?v=${ cacheBuster }`;
};

const ProfileImage = ( { profile }: { profile: CommentUser } ) => {
	const profileImageRef = useRef< HTMLImageElement >( null );
	const quickEditorRef = useRef< GravatarQuickEditorCore | null >( null );
	const hovercardRef = useRef< Hovercards | null >( null );
	const timerRef = useRef< ReturnType< typeof setTimeout > | null >( null );
	const [ isLoading, setIsLoading ] = useState( false );
	const [ cacheBuster, setCacheBuster ] = useState( new Date().getTime() );

	const openEditor = () => {
		if ( ! quickEditorRef.current ) {
			quickEditorRef.current = getHovercard(
				profile?.email,
				setIsLoading,
				setCacheBuster,
				timerRef.current
			);
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
