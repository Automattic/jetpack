import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import MicroModal from 'micromodal';
// import { handleIframeResult } from '../../../extensions/shared/memberships';

const modalId = 'jetpack-subscriptions__modal';

const modalHtml = `
  <div class="jetpack-memberships-modal micromodal-slide" id="${ modalId }" aria-hidden="true">
    <div class="jetpack-memberships-modal__overlay" tabindex="-1" data-micromodal-close>
      <div class="jetpack-memberships-modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
        <header class="jetpack-memberships-modal__header">
          <h2 class="jetpack-memberships-modal__title">
            Micromodal
          </h2>
          <button class="jetpack-memberships-modal__close" aria-label="Close modal" data-micromodal-close></button>
        </header>
        <main class="jetpack-memberships-modal__content">
          <iframe class="jetpack-memberships-modal__iframe">
        </main>
        <footer class="jetpack-memberships-modal__footer">
          <button class="jetpack-memberships-modal__btn jetpack-memberships-modal__btn-primary">Continue</button>
          <button class="jetpack-memberships-modal__btn" data-micromodal-close aria-label="Close this dialog window">Close</button>
        </footer>
      </div>
    </div>
  </div>
`;

domReady( function () {
	const form = document.querySelector( '.wp-block-jetpack-subscriptions__container form' );
	if ( ! form ) {
		return;
	}

	if ( ! form.payments_attached ) {
		form.payments_attached = true;
		form.addEventListener( 'submit', function ( event ) {
			event.preventDefault();

			const email = form.querySelector( 'input[type=email]' ).value;

			if ( form.resubmitted || ! email ) {
				return;
			}

			// Inject modal HTML if it isn't there already
			const modal = document.getElementById( modalId );
			if ( ! modal ) {
				// eslint-disable-next-line no-console
				console.log( 'inject modal HTML' );
				document.body.insertAdjacentHTML( 'beforeend', modalHtml );
				MicroModal.init( {
					// eslint-disable-next-line no-console
					onShow: modalInstance => console.info( `${ modalInstance.id } is shown` ), // [1]
					// eslint-disable-next-line no-console
					onClose: modalInstance => console.info( `${ modalInstance.id } is hidden` ), // [2]
					openTrigger: 'data-custom-open', // [3]
					closeTrigger: 'data-custom-close', // [4]
					openClass: 'is-open', // [5]
					disableScroll: false, // [6]
					disableFocus: false, // [7]
					awaitOpenAnimation: true, // [8]
					awaitCloseAnimation: true, // [9]
					debugMode: true, // [10]
				} );
			}

			const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
			const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';

			const params = new URLSearchParams( {
				email: encodeURIComponent( email ),
				post_id,
				tier_id,
				blog: form.dataset.blog,
				plan: 'newsletter',
				source: 'jetpack_subscribe',
				post_access_level: form.dataset.post_access_level,
				display: 'alternate',
			} );

			const url = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

			const iframe = modal.getElementsByClassName( 'jetpack-memberships-modal__iframe' )[ 0 ];

			iframe.src = url;

			MicroModal.show( modalId );

			//window.scrollTo( 0, 0 );

			/*
			tb_show( null, url + '&TB_iframe=true', null );

			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );
			*/

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			//window.scrollTo( 0, 0 );
		} );
	}
} );
