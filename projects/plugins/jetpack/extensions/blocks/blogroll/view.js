import './style.scss';

function toggleSubscribeForm( event ) {
	event.preventDefault();
	const parent = event.currentTarget.closest( '.wp-block-jetpack-blogroll-item' );
	if ( parent?.classList.toggle( 'open' ) ) {
		parent.querySelector( '.jetpack-blogroll-item-submit' ).removeAttribute( 'disabled' );
	} else {
		// Remove name for other fields, because they can override the active email field.
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
