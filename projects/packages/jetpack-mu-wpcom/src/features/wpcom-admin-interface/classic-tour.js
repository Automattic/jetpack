/* global wp, wpcomClassicTour */

const wpcomShowClassicTourStep = step => {
	const stepTemplate = document
		.querySelector( '#wpcom-classic-tour-step-template' )
		.content.cloneNode( true ).children[ 0 ];
	const stepConfig = wpcomClassicTour.steps[ step - 1 ];

	stepTemplate.style.position = stepConfig.position;

	const target = document.querySelector( stepConfig.target );
	const targetPosition = target.getBoundingClientRect();
	const placement = stepConfig.placement;
	stepTemplate.classList.add( `is-${ placement }` );
	switch ( placement ) {
		case 'right-bottom':
			stepTemplate.style.top = `${ targetPosition.top }px`;
			stepTemplate.style.left = `${ targetPosition.right }px`;
			break;
		case 'bottom-right':
			stepTemplate.style.top = `${ targetPosition.bottom }px`;
			stepTemplate.style.left = `${ targetPosition.left }px`;
			break;
		case 'bottom':
		default:
			stepTemplate.style.top = `${ targetPosition.bottom }px`;
			stepTemplate.style.left = `${ targetPosition.left + targetPosition.width / 2 }px`;
			break;
	}

	const totalSteps = wpcomClassicTour.steps.length;
	if ( step === 1 ) {
		stepTemplate.classList.add( 'is-first-step' );
	} else if ( step === totalSteps ) {
		stepTemplate.classList.add( 'is-last-step' );
	}

	stepTemplate.innerHTML = stepTemplate.innerHTML
		.replace( '{{title}}', stepConfig.title )
		.replace( '{{description}}', stepConfig.description )
		.replace( '{{currentStep}}', step )
		.replace( '{{totalSteps}}', totalSteps );

	stepTemplate.querySelector( '[data-action="next"]' ).addEventListener( 'click', () => {
		document.body.removeChild( stepTemplate );
		wpcomShowClassicTourStep( step + 1 );
	} );

	stepTemplate.querySelector( '[data-action="prev"]' ).addEventListener( 'click', () => {
		document.body.removeChild( stepTemplate );
		wpcomShowClassicTourStep( step - 1 );
	} );

	stepTemplate.querySelectorAll( '[data-action="dismiss"]' ).forEach( dismissButton => {
		dismissButton.addEventListener( 'click', () => {
			document.body.removeChild( stepTemplate );
			wp.ajax.post( 'wpcom_dismiss_classic_tour', {
				_ajax_nonce: wpcomClassicTour.dismissNonce,
			} );
		} );
	} );

	document.body.appendChild( stepTemplate );
};

document.addEventListener( 'DOMContentLoaded', () => wpcomShowClassicTourStep( 1 ) );
