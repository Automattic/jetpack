import { render } from 'preact';
import { DialogHost, mountDialog } from '../modal/host';
import { resolveSubmitted } from '../shared/draft';
import { CommentSignals, createSignals } from '../shared/state';
import { recordEvent } from '../shared/tracks';
import { CommentForm } from './comment-form';
import type { FormSettings } from '../shared/types';

import './style.scss';
// Here, not with the dialog: its shadow root links this page's stylesheet.
import '../modal/style.scss';

// A page cache can pair settings from an older release with this bundle. The
// mount holds a plain form for that case, for a browser without form-associated
// custom elements, and for a script that never runs.
if (
	JetpackComments.version !== JETPACK_COMMENTS_VERSION ||
	! ( 'attachInternals' in HTMLElement.prototype )
) {
	document
		.querySelectorAll( '.jetpack-comments' )
		.forEach( element => element.classList.add( 'is-plain' ) );
	recordEvent( 'jetpack_comments_plain_form', {
		reason: JetpackComments.version !== JETPACK_COMMENTS_VERSION ? 'version' : 'browser',
	} );
} else {
	if ( ! customElements.get( 'jetpack-comments-dialog' ) ) {
		customElements.define( 'jetpack-comments-dialog', DialogHost );
	}

	document.querySelectorAll< HTMLElement >( '.jetpack-comments' ).forEach( element => {
		const form = element.closest( 'form' );

		if ( ! form ) {
			return;
		}

		let formSettings: FormSettings;

		try {
			// `||`: wp_json_encode() gives false on bad input, which arrives as an empty attribute.
			formSettings = JSON.parse( element.dataset.jetpackComments || '{}' ) as FormSettings;
		} catch {
			return;
		}

		// Before the signals read the draft, so a comment that landed is not offered back.
		resolveSubmitted( formSettings.postId );

		const signals = createSignals( formSettings );

		element.replaceChildren();
		element.classList.add( 'is-mounted' );
		render(
			<CommentSignals.Provider value={ signals }>
				<CommentForm form={ form } />
			</CommentSignals.Provider>,
			element
		);
		mountDialog( form, signals );
	} );
}
