import { render } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';
import { Footer } from '../footer';
import { CommentSignals, createSignals } from '../shared/state';
import { Tray } from '../tray';
import { CommentField } from './comment-field';
import { markSubmitted, resolveSubmitted, saveDraft } from './draft';
import type { FormSettings } from '../shared/types';

import '../ui/style.scss';
import './style.scss';

type CommentFormProps = {
	form: HTMLFormElement;
};

const CommentForm = ( { form }: CommentFormProps ) => {
	const { formSettings, commentParent, commentValue, isSavingComment } =
		useContext( CommentSignals );
	const isSubmitting = useRef( false );

	useEffect( () => {
		const parentInput = form.querySelector< HTMLInputElement >( '#comment_parent' );

		if ( ! parentInput ) {
			return;
		}

		const readParent = () => {
			commentParent.value = Number( parentInput.value ) || 0;
		};

		readParent();

		const observer = new MutationObserver( readParent );
		observer.observe( parentInput, { attributes: true, attributeFilter: [ 'value' ] } );

		return () => observer.disconnect();
	}, [ form, commentParent ] );

	useEffect( () => {
		// Short enough that a reader who navigates away mid-sentence keeps the draft.
		const timer = setTimeout( () => saveDraft( formSettings.postId, commentValue.value ), 300 );

		return () => clearTimeout( timer );
	}, [ formSettings, commentValue.value ] );

	useEffect( () => {
		const onSubmit = () => {
			if ( isSubmitting.current ) {
				return;
			}

			isSubmitting.current = true;
			isSavingComment.value = true;
			// Kept, not cleared: the server can still turn this away.
			saveDraft( formSettings.postId, commentValue.peek() );
			markSubmitted( formSettings.postId );
		};

		const onPageShow = ( event: PageTransitionEvent ) => {
			if ( event.persisted ) {
				isSubmitting.current = false;
				isSavingComment.value = false;
			}
		};

		// pagehide rather than beforeunload, which would keep the page out of bfcache.
		const onPageHide = () => saveDraft( formSettings.postId, commentValue.peek() );

		form.addEventListener( 'submit', onSubmit );
		window.addEventListener( 'pageshow', onPageShow );
		window.addEventListener( 'pagehide', onPageHide );

		return () => {
			form.removeEventListener( 'submit', onSubmit );
			window.removeEventListener( 'pageshow', onPageShow );
			window.removeEventListener( 'pagehide', onPageHide );
		};
	}, [ form, formSettings, isSavingComment, commentValue ] );

	return (
		<>
			<CommentField />
			<Tray />
			<Footer />
		</>
	);
};

document.querySelectorAll< HTMLElement >( '.jetpack-comments' ).forEach( element => {
	const form = element.closest( 'form' );

	if ( ! form ) {
		return;
	}

	let formSettings: FormSettings;

	try {
		// `||`, not `??`: a wp_json_encode() failure lands here as an empty string.
		formSettings = JSON.parse( element.dataset.jetpackComments || '{}' ) as FormSettings;
	} catch {
		return;
	}

	// Before the signals read the draft, so a comment that landed is not offered back.
	resolveSubmitted( formSettings.postId );

	render(
		<CommentSignals.Provider value={ createSignals( formSettings ) }>
			<CommentForm form={ form } />
		</CommentSignals.Provider>,
		element
	);
} );
