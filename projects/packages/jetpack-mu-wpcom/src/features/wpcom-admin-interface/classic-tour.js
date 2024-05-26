/* global wp, wpcomClassicTour */

const wpcomShowClassicTourStep = step => {
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
		.replace( '{{currentStep}}', step )
		.replace( '{{totalSteps}}', totalSteps );
	stepTemplate.appendChild( stepFooterTemplate );

	stepTemplate.querySelector( '.wpcom-classic-tour-step-next' ).addEventListener( 'click', () => {
		document.body.removeChild( stepTemplate );
		wpcomShowClassicTourStep( step + 1 );
	} );

	stepTemplate.querySelector( '.wpcom-classic-tour-step-prev' ).addEventListener( 'click', () => {
		document.body.removeChild( stepTemplate );
		wpcomShowClassicTourStep( step - 1 );
	} );

	stepTemplate.querySelector( '.wpcom-classic-tour-step-done' ).addEventListener( 'click', () => {
		document.body.removeChild( stepTemplate );
		wp.ajax.post( 'wpcom_dismiss_classic_tour', {
			_ajax_nonce: wpcomClassicTour.dismissNonce,
		} );
	} );

	document.body.appendChild( stepTemplate );
};

document.addEventListener( 'DOMContentLoaded', () => wpcomShowClassicTourStep( 1 ) );
