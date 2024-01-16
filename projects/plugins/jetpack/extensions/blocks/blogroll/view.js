import './style.scss';

function toggleSubscribeForm( event ) {
	event.preventDefault();
	const parent = event.currentTarget.closest( '.wp-block-jetpack-blogroll-item' );
	if ( parent?.classList.toggle( 'open' ) ) {
		parent.querySelector( '.jetpack-blogroll-item-submit' ).removeAttribute( 'disabled' );
	} else {
		// Disable the submission field-group. This has two benefits:
		// 1. Prevents the hidden fields of an inactive item from being submitted.
		// 2. Prevents the hidden items from stealing focus when tab-navigating.
		parent.querySelector( '.jetpack-blogroll-item-submit' ).setAttribute( 'disabled', 'disabled' );
	}
}

document.addEventListener( 'DOMContentLoaded', function () {
	const blogrollItems = document.querySelectorAll(
		'.jetpack-blogroll-item-subscribe-button, .jetpack-blogroll-item-cancel-button'
	);

	blogrollItems.forEach( item => {
		item.addEventListener( 'click', toggleSubscribeForm );
	} );
} );
