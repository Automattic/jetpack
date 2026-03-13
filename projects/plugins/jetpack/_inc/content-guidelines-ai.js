/**
 * Content Guidelines AI — DOM injection entry point.
 *
 * Finds each guideline accordion form on the Content Guidelines admin page
 * and injects a "Generate with Jetpack" button next to the "Save guidelines" button.
 */

import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { createElement, useState, createRoot } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

const STORE_NAME = 'core/content-guidelines';
const VALID_SECTIONS = [ 'site', 'copy', 'images', 'additional' ];

function GenerateButton( { slug } ) {
	const [ loading, setLoading ] = useState( false );

	const { setGuideline } = useDispatch( STORE_NAME );
	const { createErrorNotice } = useDispatch( noticesStore );
	const draft = useSelect( select => select( STORE_NAME ).getGuideline( slug ), [ slug ] );

	const handleGenerate = async () => {
		setLoading( true );
		try {
			const body = {
				sections: [ slug ],
			};

			if ( draft ) {
				body.existing_content = { [ slug ]: draft };
			}

			const response = await apiFetch( {
				path: '/wpcom/v2/jetpack-ai/suggest-guidelines',
				method: 'POST',
				data: body,
			} );

			const suggestion = response?.suggestions?.[ slug ];
			if ( suggestion ) {
				setGuideline( slug, suggestion );
			}
		} catch {
			createErrorNotice( __( 'Failed to generate guidelines. Please try again.', 'jetpack' ), {
				type: 'snackbar',
			} );
		} finally {
			setLoading( false );
		}
	};

	return createElement(
		Button,
		{
			variant: 'secondary',
			onClick: handleGenerate,
			disabled: loading,
			isBusy: loading,
			className: 'jetpack-content-guidelines-ai__generate-button',
		},
		loading ? __( 'Generating…', 'jetpack' ) : __( 'Generate with Jetpack', 'jetpack' )
	);
}

/**
 * Find all guideline accordion forms and inject generate buttons.
 */
function injectButtons() {
	const forms = document.querySelectorAll( '.content-guidelines__accordion-form' );

	forms.forEach( form => {
		// Derive slug from form id: "content-guidelines-{slug}"
		const slug = form.id?.replace( 'content-guidelines-', '' );

		if ( ! slug || ! VALID_SECTIONS.includes( slug ) ) {
			return;
		}

		// Don't inject twice.
		if ( form.querySelector( '.jetpack-content-guidelines-ai__container' ) ) {
			return;
		}

		const saveButton = form.querySelector( '.save-button' );
		if ( ! saveButton ) {
			return;
		}

		// Create container and render button.
		const container = document.createElement( 'div' );
		container.className = 'jetpack-content-guidelines-ai__container';
		saveButton.parentNode.insertBefore( container, saveButton );

		createRoot( container ).render( createElement( GenerateButton, { slug } ) );
	} );
}

// Wait for the content-guidelines page to render, then inject.
// Use MutationObserver to handle the async React rendering.
function init() {
	// Try immediately in case the DOM is already there.
	injectButtons();

	// Observe for new forms being added (accordion expand, page load).
	const observer = new MutationObserver( () => {
		injectButtons();
	} );

	observer.observe( document.body, {
		childList: true,
		subtree: true,
	} );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
