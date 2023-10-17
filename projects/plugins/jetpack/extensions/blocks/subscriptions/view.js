import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import MicroModal from 'micromodal';
import { handleIframeResult, membershipsModalId } from '../../../extensions/shared/memberships';

/*

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

*/
const modalHtml = `
  <div class="jetpack-memberships-modal" id="${ membershipsModalId }" aria-hidden="true">
    <div class="jetpack-memberships-modal__overlay" tabindex="-1" data-micromodal-close>
      <div class="jetpack-memberships-modal__container" role="dialog" aria-modal="true">
          <iframe class="jetpack-memberships-modal__iframe">
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
			// eslint-disable-next-line no-console
			console.log( 'form submit:', event, form );
			event.preventDefault();

			// Form values
			const email = form.querySelector( 'input[type=email]' ).value;
			const post_id = form.querySelector( 'input[name=post_id]' )?.value ?? '';
			const tier_id = form.querySelector( 'input[name=tier_id]' )?.value ?? '';

			if ( form.resubmitted || ! email ) {
				return;
			}

			// Inject modal HTML if it isn't there already
			let modal = document.getElementById( membershipsModalId );
			if ( ! modal ) {
				// eslint-disable-next-line no-console
				console.log( 'inject modal HTML' );
				document.body.insertAdjacentHTML( 'beforeend', modalHtml );
				modal = document.getElementById( membershipsModalId );

				MicroModal.init( {
					// eslint-disable-next-line no-console
					onShow: modalInstance => console.info( `${ modalInstance.id } is shown` ), // [1]
					// eslint-disable-next-line no-console
					onClose: modalInstance => console.info( `${ modalInstance.id } is hidden` ), // [2]
					// openTrigger: 'data-custom-open', // [3]
					// closeTrigger: 'data-custom-close', // [4]
					openClass: 'is-open',
					disableScroll: true,
					disableFocus: false,
					awaitOpenAnimation: true,
					awaitCloseAnimation: true,
					// debugMode: false,
				} );
			}

			const params = new URLSearchParams( {
				email: encodeURIComponent( email ),
				post_id,
				tier_id,
				blog: form.dataset.blog,
				plan: 'newsletter',
				source: 'jetpack_subscribe',
				post_access_level: form.dataset.post_access_level,
				display: 'alternate',
				TB_iframe: true,
			} );

			const iframe = modal.getElementsByClassName( 'jetpack-memberships-modal__iframe' )[ 0 ];

			iframe.src = 'https://subscribe.wordpress.com/memberships/?' + params.toString();

			MicroModal.show( membershipsModalId );

			//window.scrollTo( 0, 0 );

			/*
			tb_show( null, url + '&TB_iframe=true', null );

			window.addEventListener( 'message', handleIframeResult, false );
			const tbWindow = document.querySelector( '#TB_window' );
			tbWindow.classList.add( 'jetpack-memberships-modal' );
			*/
			window.addEventListener( 'message', handleIframeResult, false );

			// This line has to come after the Thickbox has opened otherwise Firefox doesnt scroll to the top.
			//window.scrollTo( 0, 0 );
		} );
	}
} );
