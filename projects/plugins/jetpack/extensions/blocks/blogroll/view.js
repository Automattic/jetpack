import './style.scss';

function closeSubscribeForm( subscribePopup ) {
	subscribePopup.classList.add( 'closing' );

	subscribePopup.addEventListener( 'animationend', function cleanUp( animationEvent ) {
		if ( animationEvent.animationName === 'blogrollOut' ) {
			subscribePopup.classList.remove( 'closing', 'open' );
			subscribePopup.removeEventListener( 'animationend', cleanUp );
		}
	} );
}

function openSubscribeForm( event ) {
	event.preventDefault();

	// Close any open forms
	const openForm = document.querySelector( '.jetpack-blogroll-item-subscribe-form.open' );
	if ( openForm && openForm !== event.target.nextElementSibling ) {
		closeSubscribeForm( openForm );
		return;
	}

	const emailInput = document.querySelector( 'input#jetpack-blogroll-item-form-email' );
	const subscribePopup = event.target.nextElementSibling;
	if ( emailInput && subscribePopup ) {
		subscribePopup.prepend( emailInput );
		emailInput.classList.add( 'showing' );
		subscribePopup.classList.toggle( 'open' );
		event.stopPropagation();

		// Close the form if the user clicks outside of it
		document.addEventListener( 'click', function outsideClickClose( offEvent ) {
			if ( ! subscribePopup.contains( offEvent.target ) ) {
				closeSubscribeForm( subscribePopup );
				document.removeEventListener( 'click', outsideClickClose );
			}
		} );
	}
}

document.addEventListener( 'DOMContentLoaded', function () {
	const blogrollItems = document.querySelectorAll(
		'button#jetpack-blogroll-item-subscribe-button'
	);

	blogrollItems.forEach( item => {
		item.addEventListener( 'click', openSubscribeForm );
	} );
} );
