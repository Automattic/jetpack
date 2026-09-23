import clsx from 'clsx';
import { useContext, useEffect } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { GuestFields } from './guest-fields';
import { LogInPrompt } from './log-in-prompt';
import { SignIn } from './sign-in';
import { SignedIn } from './signed-in';
import { hasSubscriptionOptions } from './subscriptions';

import './style.scss';

export const Tray = () => {
	const { formSettings, signedIn, isSignedIn, isEmptyComment, isTrayOpen } =
		useContext( CommentSignals );
	const { mustLogIn, identity } = JetpackComments;

	useEffect( () => {
		if ( isSignedIn.value && ! hasSubscriptionOptions() ) {
			isTrayOpen.value = true;
		}
	}, [ isSignedIn.value, isTrayOpen ] );

	// On the empty-to-not transition only, so closing the tray mid-sentence sticks.
	useEffect( () => {
		const isReturning = isSignedIn.value && ! signedIn.value?.code;

		if ( ! isEmptyComment.value && ! isReturning ) {
			isTrayOpen.value = true;
		}
	}, [ isEmptyComment.value, isSignedIn, signedIn, isTrayOpen ] );

	let view;

	if ( isSignedIn.value ) {
		view = <SignedIn />;
	} else if ( identity.providers.length > 0 ) {
		view = <SignIn />;
	} else {
		view = mustLogIn ? <LogInPrompt /> : <GuestFields />;
	}

	return (
		<div
			id={ `jetpack-comments-tray-${ formSettings.postId }` }
			className={ clsx( 'jetpack-comments__tray', { 'is-open': isTrayOpen.value } ) }
		>
			<div>{ view }</div>
		</div>
	);
};
