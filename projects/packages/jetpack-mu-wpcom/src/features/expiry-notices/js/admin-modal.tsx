import { Button, Modal } from '@wordpress/components';
import { createRoot, useState } from '@wordpress/element';
import { Icon, info } from '@wordpress/icons';
import { wpcomTrackEvent } from '../../../common/tracks';
import { clickCta, dismissNotice, recordDismissal } from './notice.ts';
import type { Cta, TrackProps } from './notice.ts';
import type { MouseEvent } from 'react';

interface ExpiryModalData {
	metaKey: string;
	title: string;
	description: string;
	listIntro: string;
	items: string[];
	primary: Cta;
	secondary: Cta | null;
	imageUrl: string;
	trackProps: TrackProps;
}

declare global {
	interface Window {
		wpcomExpiryModal?: ExpiryModalData;
	}
}

const ExpiryModal = ( { data }: { data: ExpiryModalData } ) => {
	const [ isOpen, setIsOpen ] = useState( true );
	const { metaKey, primary, secondary, trackProps } = data;

	if ( ! isOpen ) {
		return null;
	}

	// Closing is the dismissal however it was reached, or Escape would hide a
	// modal that came straight back on the next page load.
	const dismiss = () => {
		setIsOpen( false );
		dismissNotice( metaKey, 'jetpack_expiry_modal_dismiss', trackProps, () => {} );
	};

	// Acting on a CTA settles the modal too; reported as a CTA, not a dismissal.
	const onCtaClick = ( ctaId: string, cta: Cta, event: MouseEvent ) => {
		const openedHere = clickCta(
			event,
			cta.message,
			ctaId,
			'jetpack_expiry_modal_cta_click',
			trackProps
		);
		if ( openedHere ) {
			setIsOpen( false );
		}
		// Keepalive survives the page unload a link starts; at worst the modal shows once more.
		recordDismissal( metaKey, ! openedHere ).catch( () => {} );
	};

	return (
		// `contentLabel` names the dialog: Modal destructures a fixed prop list, so
		// a bare `aria-label` is dropped. The heading renders under the image instead.
		<Modal
			className="wpcom-expiry-modal"
			size="small"
			contentLabel={ data.title }
			// A stray overlay click must not spend the one dismissal; Escape stays,
			// as the only pointer-free way out.
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
						<li key={ item }>
							<Icon icon={ info } size={ 16 } />
							{ item }
						</li>
					) ) }
				</ul>

				<div className="wpcom-expiry-modal__actions">
					{ secondary && (
						<Button
							__next40pxDefaultSize
							variant="secondary"
							href={ secondary.url }
							onClick={ ( event: MouseEvent ) => onCtaClick( 'secondary', secondary, event ) }
						>
							{ secondary.label }
						</Button>
					) }
					<Button
						__next40pxDefaultSize
						variant="primary"
						href={ primary.url }
						onClick={ ( event: MouseEvent ) => onCtaClick( 'primary', primary, event ) }
					>
						{ primary.label }
					</Button>
				</div>
			</div>
		</Modal>
	);
};

const root = document.getElementById( 'wpcom-expiry-modal-root' );
const data = window.wpcomExpiryModal;
if ( root && data ) {
	// No session guard: the server only serves this markup when the modal is due.
	wpcomTrackEvent( 'jetpack_expiry_modal_impression', data.trackProps );
	createRoot( root ).render( <ExpiryModal data={ data } /> );
}
