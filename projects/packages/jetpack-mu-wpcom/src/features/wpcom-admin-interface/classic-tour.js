const wpcomShowClassicTour = () => {
	let currentStep;

	const showStep = step => {
		currentStep = step;

		const stepsTemplate = document
			.querySelector( '#wpcom-classic-tour-steps-template' )
			.content.cloneNode( true );
		const totalSteps = stepsTemplate.children.length;

		const stepTemplate = stepsTemplate.children[ step - 1 ];
		const target = document.querySelector( stepTemplate.dataset.target );
		const targetPosition = target.getBoundingClientRect();
		const placement = stepTemplate.dataset.placement;
		switch ( placement ) {
			case 'right':
			default:
				stepTemplate.style.top = `${ targetPosition.top }px`;
				stepTemplate.style.left = `${ targetPosition.right }px`;
				break;
		}

		if ( step === 1 ) {
			stepTemplate.classList.add( 'is-first-step' );
		} else if ( step === totalSteps ) {
			stepTemplate.classList.add( 'is-last-step' );
		}

		const stepFooterTemplate = document
			.querySelector( '#wpcom-classic-tour-step-footer-template' )
			.content.cloneNode( true ).children[ 0 ];
		stepFooterTemplate.innerHTML = stepFooterTemplate.innerHTML
			.replace( '{{currentStep}}', currentStep )
			.replace( '{{totalSteps}}', totalSteps );
		stepTemplate.appendChild( stepFooterTemplate );

		stepTemplate.querySelector( '.wpcom-classic-tour-step-next' ).addEventListener( 'click', () => {
			document.body.removeChild( stepTemplate );
			showStep( currentStep + 1 );
		} );

		stepTemplate.querySelector( '.wpcom-classic-tour-step-prev' ).addEventListener( 'click', () => {
			document.body.removeChild( stepTemplate );
			showStep( currentStep - 1 );
		} );

		document.body.appendChild( stepTemplate );
	};
	showStep( 1 );

	/*document.querySelector( '.wpcom-site-menu-intro-notice a.close-button' ).addEventListener( 'click', function( event ) {
		event.preventDefault();
		this.closest( '.wpcom-site-menu-intro-notice' ).remove();
		wp.ajax.post( 'wpcom_dismiss_classic_tour', {
			_ajax_nonce: wpcomClassicTour.dismissNonce,
		} );
	} );*/
};

document.addEventListener( 'DOMContentLoaded', wpcomShowClassicTour );
