import { effect } from '@preact/signals';
import { render } from 'preact';
import { CommentSignals, type CommentSignalsValue } from '../shared/state';

/**
 * The dialog's host, a form control, so the dialog can live in a shadow root out
 * of the theme's reach and still post with the comment.
 */
export class DialogHost extends HTMLElement {
	static formAssociated = true;
	internals = this.attachInternals();
}

/**
 * A guest's details, as the host posts them.
 *
 * @param signals           - The form's signals.
 * @param signals.commenter - Who is commenting.
 * @param signals.details   - A guest's details.
 * @return The form data.
 */
export const guestValue = ( {
	commenter,
	details,
}: Pick< CommentSignalsValue, 'commenter' | 'details' > ) => {
	const data = new FormData();
	const { kind } = commenter.value;

	if ( ( kind === 'guest' || kind === 'unknown' ) && ! JetpackComments.mustLogIn ) {
		Object.entries( details.value ).forEach( ( [ name, value ] ) => data.append( name, value ) );
	}

	return data;
};

/**
 * Add the dialog's host to a comment form, and the dialog once the reader reaches for the form.
 *
 * @param form    - The theme's comment form.
 * @param signals - The form's signals.
 */
export const mountDialog = ( form: HTMLFormElement, signals: CommentSignalsValue ) => {
	const { isBoxOpen, isDialogOpen } = signals;
	const { mustLogIn, identity } = JetpackComments;
	// Inside the form, so what it hands over posts with it. A page can hold two
	// comment forms, both with core's id, so nothing here may find the form by id.
	const host = form.appendChild(
		document.createElement( 'jetpack-comments-dialog' ) as DialogHost
	);
	const root = host.attachShadow( { mode: 'open' } );
	// A returning guest can post without the dialog; once it renders, its own value takes over.
	const stopGuestValue = effect( () => host.internals.setFormValue( guestValue( signals ) ) );
	// Nothing opens the dialog where the only way in is the site's own login.
	let loading = mustLogIn && ! identity.canSignIn;

	const load = () => {
		if ( loading ) {
			return;
		}

		loading = true;
		// Webpack forgets a chunk that failed, so the next reach tries again.
		import( /* webpackChunkName: "modal" */ '.' )
			.then( ( { Dialog } ) => {
				stopWatching();
				stopGuestValue();
				render(
					<CommentSignals.Provider value={ signals }>
						<Dialog internals={ host.internals } />
					</CommentSignals.Provider>,
					root
				);
			} )
			.catch( () => {
				loading = false;
				// So the next submit or click asks again.
				isDialogOpen.value = false;
			} );
	};

	// Usually loaded on the way to the box, ahead of the click that needs it.
	form.addEventListener( 'pointerenter', load, { once: true } );
	const stopWatching = effect( () => {
		// Both read every time, so either one wakes this.
		const boxOpen = isBoxOpen.value;
		const dialogOpen = isDialogOpen.value;

		if ( boxOpen || dialogOpen ) {
			load();
		}
	} );
};
