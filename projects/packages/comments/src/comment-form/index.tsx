import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { CommentingAs } from '../identity/commenting-as';
import { GuestFields } from '../identity/guest-fields';
import { LogInPrompt } from '../identity/log-in-prompt';
import { CommentSignals, createSignals } from '../shared/state';
import { CommentField } from './comment-field';
import { saveDraft } from './draft';
import { SubmitButton } from './submit-button';
import type { FormSettings } from '../shared/types';

import './style.scss';

type CommentFormProps = {
	form: HTMLFormElement;
};

const CommentForm = ( { form }: CommentFormProps ) => {
	const { formSettings, commentParent, commentValue, isSavingComment } =
		useContext( CommentSignals );
	const { isLoggedIn, mustLogIn } = JetpackComments;

	const isSubmitting = useRef( false );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		commentParent.value = Number( parentInput.getAttribute( 'value' ) );

		const observer = new MutationObserver( () => {
			commentParent.value = Number( parentInput.getAttribute( 'value' ) );
		} );
		observer.observe( parentInput, { attributes: true, attributeFilter: [ 'value' ] } );

		return () => observer.disconnect();
	}, [ form, commentParent ] );

	useEffect( () => {
		saveDraft( formSettings.postId, commentValue.value );
	}, [ formSettings, commentValue.value ] );

	useEffect( () => {
		const onSubmit = () => {
			if ( isSubmitting.current ) {
				return;
			}

			isSubmitting.current = true;
			isSavingComment.value = true;
			saveDraft( formSettings.postId, '' );
		};

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
	}, [ form, formSettings, isSavingComment ] );

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

	const formSettings = JSON.parse( element.dataset.jetpackComments ?? '{}' ) as FormSettings;

	render(
		<CommentSignals.Provider value={ createSignals( formSettings ) }>
			<CommentForm form={ form } />
		</CommentSignals.Provider>,
		element
	);
} );
