import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';
import clsx from 'clsx';
import { useContext, useRef, useState } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { hasSubscriptionOptions } from '../tray/subscriptions';
import { GearIcon } from '../ui/icons';

const bustAvatarCache = ( avatar: string, stamp: number ) => {
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

export const SettingsButton = () => {
	const { formSettings, signedIn, isTrayOpen } = useContext( CommentSignals );
	const { user, strings, locale } = JetpackComments;
	const [ isRefreshing, setIsRefreshing ] = useState( false );
	const [ stamp, setStamp ] = useState( 0 );
	const editor = useRef< GravatarQuickEditorCore | null >( null );
	const hasOptions = hasSubscriptionOptions();

	const current = user
		? { avatar: user.avatarUrl, name: '', email: user.email }
		: { avatar: signedIn.value?.avatar ?? '', name: signedIn.value?.name ?? '', email: '' };

	const editAvatar = ( event: Event ) => {
		event.preventDefault();

		if ( ! editor.current ) {
			editor.current = new GravatarQuickEditorCore( {
				scope: [ 'avatars' ],
				email: current.email,
				// Gravatar serves the editor from a per-language subdomain; only Chinese has a regional one.
				locale: locale === 'zh_TW' ? 'zh-TW' : locale.replace( /_.*$/, '' ),
				utm: 'jetpack-comments',
				// Gravatar says nothing about when its CDN has the new image; its own editor waits like this too.
				onProfileUpdated: type => {
					if ( type !== 'avatar_updated' ) {
						return;
					}

					setIsRefreshing( true );
					setTimeout( () => {
						setStamp( Date.now() );
						setIsRefreshing( false );
					}, 2000 );
				},
			} );
		}

		editor.current.open();
	};

	return (
		<div className="jetpack-comments__user">
			<div className={ clsx( 'jetpack-comments__user-settings', { 'is-bare': ! hasOptions } ) }>
				<button
					type="button"
					aria-label={ strings.editGravatar }
					className={ clsx( 'jetpack-comments__profile', { 'is-loading': isRefreshing } ) }
					onClick={ editAvatar }
				>
					{ current.avatar && (
						<img
							src={ bustAvatarCache( current.avatar, stamp ) }
							alt={ current.name }
							loading="lazy"
						/>
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
