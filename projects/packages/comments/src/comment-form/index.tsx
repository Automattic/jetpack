import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentingAs } from '../identity/commenting-as';
import { GuestFields } from '../identity/guest-fields';
import { LogInPrompt } from '../identity/log-in-prompt';
import { CommentSignals, createSignals } from '../shared/state';
import { CommentField } from './comment-field';
import { saveDraft } from './draft';
import { SubmitButton } from './submit-button';

import './style.scss';

type CommentFormProps = {
	form: HTMLFormElement;
};

const CommentForm = ( { form }: CommentFormProps ) => {
	const { postId, commentParent, commentValue, isSavingComment } = useContext( CommentSignals );
	const { isLoggedIn, mustLogIn } = JetpackComments;

	// Checked synchronously, so a second click before the page navigates cannot
	// post the comment twice.
	const isSubmitting = useRef( false );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		commentParent.value = Number( parentInput.getAttribute( 'value' ) );

		// WordPress moves the form and rewrites this value when Reply is clicked.
		const observer = new MutationObserver( () => {
			commentParent.value = Number( parentInput.getAttribute( 'value' ) );
		} );
		observer.observe( parentInput, { attributes: true, attributeFilter: [ 'value' ] } );

		return () => observer.disconnect();
	}, [ form, commentParent ] );

	useEffect( () => saveDraft( postId, commentValue.value ), [ postId, commentValue.value ] );

	useEffect( () => {
		const onSubmit = () => {
			if ( isSubmitting.current ) {
				return;
			}

			isSubmitting.current = true;
			isSavingComment.value = true;
			saveDraft( postId, '' );
		};

		// A bfcache restore leaves the form usable again.
		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				isSubmitting.current = false;
				isSavingComment.value = false;
			}
		};

		form.addEventListener( 'submit', onSubmit );
		window.addEventListener( 'pageshow', onPageShow );

		return () => {
			form.removeEventListener( 'submit', onSubmit );
			window.removeEventListener( 'pageshow', onPageShow );
		};
	}, [ form, postId, isSavingComment ] );

	return (
		<>
			<CommentField />
			{ mustLogIn && <LogInPrompt /> }
			{ ! mustLogIn && ! isLoggedIn && <GuestFields /> }
			<div className="jetpack-comments__footer">
				{ isLoggedIn && <CommentingAs /> }
				<SubmitButton />
			</div>
		</>
	);
};

document.querySelectorAll< HTMLElement >( '.jetpack-comments' ).forEach( element => {
	const form = element.closest( 'form' );

	if ( ! form ) {
		return;
	}

	// Read from the form rather than the settings, which are printed once per page.
	const postId = Number( form.querySelector< HTMLInputElement >( '#comment_post_ID' )?.value ?? 0 );

	render(
		<CommentSignals.Provider value={ createSignals( postId ) }>
			<CommentForm form={ form } />
		</CommentSignals.Provider>,
		element
	);
} );
