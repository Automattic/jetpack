import './view.scss';
import '../../shared/memberships.scss';

import domReady from '@wordpress/dom-ready';
import MicroModal from 'micromodal';
import { handleIframeResult, membershipsModalId } from '../../../extensions/shared/memberships';

const modalHtml = `
	<div class="jetpack-memberships-modal" id="${ membershipsModalId }" aria-hidden="true">
		<div class="jetpack-memberships-modal__overlay" tabindex="-1" data-micromodal-close>
			<div class="jetpack-memberships-modal__container" role="dialog" aria-modal="true">
				<div class="jetpack-memberships-modal__loading wpsm-modal_container" role="alert" aria-label="Loading">
					<div class="wpsm-modal_header">
						<div class="wpsm-site-logo">
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M12 0C5.38315 0 0 5.38315 0 12C0 18.6168 5.38315 24 12 24C18.6168 24 24 18.6171 24 12C24 5.38286 18.6166 0 12 0ZM1.21182 12C1.21039 10.4868 1.52856 8.99044 2.14552 7.60877L7.29192 21.7097C3.69251 19.9611 1.21182 16.2703 1.21182 12ZM12 22.79C10.9683 22.7897 9.94188 22.6417 8.95212 22.3504L12.1895 12.9434L15.5054 22.0295C15.5272 22.0807 15.5531 22.1302 15.5829 22.1772C14.4319 22.583 13.2204 22.7901 12 22.79ZM13.4867 6.94108C14.1369 6.90709 14.7216 6.83882 14.7216 6.83882C15.303 6.76995 15.2344 5.91547 14.653 5.94975C14.653 5.94975 12.9053 6.0869 11.7771 6.0869C10.7169 6.0869 8.93586 5.94975 8.93586 5.94975C8.35389 5.91547 8.28562 6.80424 8.86729 6.83882C8.86729 6.83882 9.41763 6.90709 9.99901 6.94108L11.6796 11.5466L9.31803 18.6278L5.38966 6.94108C6.0399 6.90709 6.62424 6.83882 6.62424 6.83882C7.20562 6.76995 7.13675 5.91547 6.55537 5.94975C6.55537 5.94975 4.80798 6.0869 3.6801 6.0869C3.47764 6.0869 3.23882 6.08158 2.98522 6.0736C4.91468 3.14483 8.23064 1.21182 12 1.21182C14.6979 1.20812 17.2986 2.2193 19.2854 4.04453C19.2393 4.04128 19.1938 4.03567 19.1459 4.03567C18.086 4.03567 17.3341 4.95872 17.3341 5.95064C17.3341 6.8397 17.8469 7.59163 18.394 8.48099C18.8039 9.19951 19.2833 10.1226 19.2833 11.4562C19.2833 12.3801 19.0097 13.5427 18.4623 14.9438L17.3858 18.5391L13.4867 6.94108ZM17.4242 21.3251L20.7192 11.7975C21.3352 10.2582 21.54 9.02749 21.54 7.9333C21.5407 7.56224 21.5164 7.19155 21.4673 6.82374C22.3366 8.41033 22.791 10.1909 22.7882 12C22.7882 15.9798 20.6305 19.4551 17.4242 21.3251Z" fill="#1E1E1E"></path>
							</svg>
						</div>
						<h1 class="wpsm-site-title">HelloWord</h1>
						<a href="#" class="modal_close" data-micromodal-close>
							<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path fill-rule="evenodd" clip-rule="evenodd" d="M12 13.0607L15.7123 16.773L16.773 15.7123L13.0607 12L16.773 8.28772L15.7123 7.22706L12 10.9394L8.28771 7.22705L7.22705 8.28771L10.9394 12L7.22706 15.7123L8.28772 16.773L12 13.0607Z" fill="#1E1E1E"></path>
							</svg>
						</a>
					</div>
					<div class="wpsm-placeholders">
						<div></div>
						<div></div>
					</div>
					<div class="wpsm-footer">Powered by <a target="_blank" rel="noopener noreferer" href="https://wordpress.com">WordPress.com</a></div>
				</div>
				<iframe class="jetpack-memberships-modal__iframe" scrolling="no" frameborder="0" allowtransparency="true"></iframe>
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
					closeTrigger: 'data-custom-close', // [4]
					openClass: 'is-open',
					disableScroll: true,
					disableFocus: false,
					awaitOpenAnimation: true,
					awaitCloseAnimation: true,
					// debugMode: false,
				} );
			}

			modal.classList.add( 'is-loading' );
			MicroModal.show( membershipsModalId );

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
			iframe.addEventListener( 'load', () => {
				modal.classList.remove( 'is-loading' );
			} );

			window.addEventListener( 'message', handleIframeResult, false );
		} );
	}
} );
