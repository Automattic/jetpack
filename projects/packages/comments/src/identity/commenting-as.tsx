import clsx from 'clsx';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { hasSubscriptionOptions } from '../subscriptions';
import { GearIcon } from './checkpoint/icons';
import { openGravatarEditor } from './gravatar-editor';

import './style.scss';

// Gravatar's caches take a moment to see a new avatar.
const AVATAR_REFRESH_MS = 2000;

/**
 * The avatar with a fresh query string, so a just-changed one is fetched again.
 *
 * @param avatar - The avatar URL.
 * @param stamp  - When it was last changed, or 0 for never.
 * @return The URL to draw.
 */
const bust = ( avatar: string, stamp: number ) => {
	if ( ! stamp ) {
		return avatar;
	}

	try {
		const url = new URL( avatar, window.location.href );
		url.searchParams.set( 'v', String( stamp ) );
		return url.toString();
	} catch {
		return avatar;
	}
};

type Current = {
	avatar: string;
	name: string;
	email: string;
};

/**
 * Who the comment will be attributed to: the avatar, which opens the Gravatar
 * editor, and the gear that opens the tray. Nothing for a guest.
 *
 * @return The footer group, or null.
 */
export const CommentingAs = () => {
	const { signedIn } = useContext( CommentSignals );
	const { user } = JetpackComments;

	if ( user ) {
		return <UserSettings current={ { avatar: user.avatarUrl, name: '', email: user.email } } />;
	}

	if ( signedIn.value ) {
		return (
			<UserSettings
				current={ { avatar: signedIn.value.avatar, name: signedIn.value.name, email: '' } }
			/>
		);
	}

	return null;
};

type UserSettingsProps = {
	current: Current;
};

/**
 * The avatar and gear group, and the Edit Gravatar link while the tray is open.
 *
 * @param props         - Component props.
 * @param props.current - Whose avatar this is.
 * @return The footer group.
 */
const UserSettings = ( { current }: UserSettingsProps ) => {
	const { formSettings, isTrayOpen } = useContext( CommentSignals );
	const { strings } = JetpackComments;
	const [ isLoading, setIsLoading ] = useState( false );
	const [ stamp, setStamp ] = useState( 0 );
	const timer = useRef< ReturnType< typeof setTimeout > | null >( null );
	const hasOptions = hasSubscriptionOptions();

	useEffect( () => {
		return () => {
			if ( timer.current !== null ) {
				clearTimeout( timer.current );
			}
		};
	}, [] );

	const editAvatar = ( event: Event ) => {
		event.preventDefault();

		openGravatarEditor( current.email, () => {
			setIsLoading( true );

			if ( timer.current !== null ) {
				clearTimeout( timer.current );
			}

			timer.current = setTimeout( () => {
				setIsLoading( false );
				setStamp( Date.now() );
				timer.current = null;
			}, AVATAR_REFRESH_MS );
		} );
	};

	return (
		<div className="jetpack-comments__user">
			<div className={ clsx( 'jetpack-comments__user-settings', { 'is-bare': ! hasOptions } ) }>
				<button
					type="button"
					aria-label={ strings.editGravatar }
					className={ clsx( 'jetpack-comments__profile', { 'is-loading': isLoading } ) }
					onClick={ editAvatar }
				>
					{ current.avatar && (
						<img src={ bust( current.avatar, stamp ) } alt={ current.name } loading="lazy" />
					) }
				</button>
				{ hasOptions && (
					<button
						type="button"
						aria-label={ strings.settings }
						aria-pressed={ isTrayOpen.value }
						aria-expanded={ isTrayOpen.value }
						aria-controls={ `jetpack-comments-tray-${ formSettings.postId }` }
						className={ clsx( 'jetpack-comments__tray-toggle', { 'is-open': isTrayOpen.value } ) }
						onClick={ () => ( isTrayOpen.value = ! isTrayOpen.value ) }
					>
						<GearIcon expanded={ isTrayOpen.value } />
					</button>
				) }
			</div>
			{ isTrayOpen.value && (
				<a
					className="jetpack-comments__edit-gravatar"
					href="https://gravatar.com/profile/avatars"
					aria-label={ strings.editGravatar }
					onClick={ editAvatar }
				>
					{ strings.editGravatar }
				</a>
			) }
		</div>
	);
};
