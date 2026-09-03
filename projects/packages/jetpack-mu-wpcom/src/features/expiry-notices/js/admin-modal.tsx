import apiFetch from '@wordpress/api-fetch';
import { Button, Modal } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { wpcomTrackEvent } from '../../../common/tracks';
import { openHelpCenterWithMessage } from './help-center.ts';
import type { MouseEvent } from 'react';

interface Cta {
	label: string;
	url: string;
	// Present only on the reverted state's CTA, which opens the Help Center with
	// this typed in rather than following its href.
	message?: string;
}

interface ExpiryModalData {
	metaKey: string;
	title: string;
	description: string;
	listIntro: string;
	items: string[];
	primary: Cta;
	secondary: Cta | null;
	imageUrl: string;
	trackProps: Record< string, string | number >;
}

declare global {
	interface Window {
		wpcomExpiryModal?: ExpiryModalData;
	}
}

const ExpiryModal = ( { data }: { data: ExpiryModalData } ) => {
	const [ isOpen, setIsOpen ] = useState( true );

	if ( ! isOpen ) {
		return null;
	}

	const recordDismissal = ( keepalive: boolean ) =>
		apiFetch( {
			path: '/wp/v2/users/me',
			method: 'POST',
			data: { meta: { [ data.metaKey ]: 1 } },
			// Survives the page unload a CTA starts. Without it the browser is
			// free to cancel the write as it navigates, and the modal returns to
			// someone who did what it asked.
			keepalive,
		} );

	// Closing is the dismissal however it was reached, so the record matches what
	// the user saw happen. Writing only from the button would let Escape hide a
	// modal that then came straight back on the next page load.
	const dismiss = async () => {
		setIsOpen( false );

		try {
			await recordDismissal( false );
			wpcomTrackEvent( 'jetpack_expiry_modal_dismiss', data.trackProps );
		} catch ( err ) {
			wpcomTrackEvent( 'jetpack_expiry_modal_dismiss_failed', {
				...data.trackProps,
				error_message: err instanceof Error ? err.message : String( err ),
			} );
			// eslint-disable-next-line no-console
			console.error( 'Failed to record expiry modal dismiss', err );
		}
	};

	// Acting on a CTA settles the modal too: someone who has answered it should
	// not meet it again on the way back. Reported as a CTA rather than a
	// dismissal -- one event per thing the user actually did.
	const onCtaClick = ( cta: string, target: Cta, event: MouseEvent ) => {
		// The support CTA opens the Help Center over this page rather than
		// navigating, so the modal has to close itself; its href is only the
		// fallback for a Help Center that never loaded.
		const openedHere = target.message ? openHelpCenterWithMessage( target.message ) : false;
		if ( openedHere ) {
			event.preventDefault();
			setIsOpen( false );
		}

		wpcomTrackEvent( 'jetpack_expiry_modal_cta_click', {
			...data.trackProps,
			cta: target.message ? 'support' : cta,
		} );
		recordDismissal( ! openedHere ).catch( () => {
			// Nothing useful to do while the page is leaving; at worst the modal
			// shows once more.
		} );
	};

	return (
		// No `title`: the heading belongs under the illustration, so the header is
		// left holding just the close button, which the stylesheet lifts onto the
		// image. `contentLabel` names the dialog in its place -- Modal destructures
		// a fixed prop list, so a bare `aria-label` would be dropped.
		<Modal
			className="wpcom-expiry-modal"
			contentLabel={ data.title }
			// A stray click on the overlay shouldn't spend the one dismissal the
			// user gets, so closing has to be deliberate. Escape still works, and
			// is left alone on purpose: it is the only way out for someone who
			// can't use a pointer.
			shouldCloseOnClickOutside={ false }
			onRequestClose={ dismiss }
		>
			<img className="wpcom-expiry-modal__image" src={ data.imageUrl } alt="" />

			<div className="wpcom-expiry-modal__body">
				<h2 className="wpcom-expiry-modal__title">{ data.title }</h2>
				<p>{ data.description }</p>
				{ data.listIntro && <p>{ data.listIntro }</p> }

				<ul className="wpcom-expiry-modal__list">
					{ data.items.map( item => (
						<li key={ item }>{ item }</li>
					) ) }
				</ul>

				<div className="wpcom-expiry-modal__actions">
					{ data.secondary && (
						<Button
							variant="secondary"
							href={ data.secondary.url }
							onClick={ event => onCtaClick( 'secondary', data.secondary as Cta, event ) }
						>
							{ data.secondary.label }
						</Button>
					) }
					<Button
						variant="primary"
						href={ data.primary.url }
						onClick={ event => onCtaClick( 'primary', data.primary, event ) }
					>
						{ data.primary.label }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

document.addEventListener( 'DOMContentLoaded', () => {
	const root = document.getElementById( 'wpcom-expiry-modal-root' );
	const data = window.wpcomExpiryModal;
	if ( ! root || ! data ) {
		return;
	}

	// No session guard, unlike the banner: the server only serves this markup
	// when the modal is actually due, so a render is already a unique showing.
	wpcomTrackEvent( 'jetpack_expiry_modal_impression', data.trackProps );
	createRoot( root ).render( <ExpiryModal data={ data } /> );
} );
