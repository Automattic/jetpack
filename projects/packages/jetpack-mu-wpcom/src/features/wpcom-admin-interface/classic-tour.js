const wpcomShowClassicTour = () => {
	const template = document
		.querySelector( '#wpcom-classic-tour-step-template' )
		.content.cloneNode( true );
	const step1 = template.children[ 0 ];
	const target = document.querySelector( step1.dataset.target );
	const targetPosition = target.getBoundingClientRect();
	const placement = step1.dataset.placement;
	switch ( placement ) {
		case 'right':
		default:
			step1.style.top = `${ targetPosition.top }px`;
			step1.style.left = `${ targetPosition.right }px`;
			break;
	}

	document.body.appendChild( step1 );

	/*document.querySelector( '.wpcom-site-menu-intro-notice a.close-button' ).addEventListener( 'click', function( event ) {
		event.preventDefault();
		this.closest( '.wpcom-site-menu-intro-notice' ).remove();
		wp.ajax.post( 'wpcom_dismiss_classic_tour', {
			_ajax_nonce: wpcomClassicTour.dismissNonce,
		} );
	} );*/
};

document.addEventListener( 'DOMContentLoaded', wpcomShowClassicTour );
