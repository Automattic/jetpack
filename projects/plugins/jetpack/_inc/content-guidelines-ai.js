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
const config = window.jetpackContentGuidelinesAiConfig || {};
const isAvailable = config.available ?? false;
const isConnected = config.isConnected ?? false;
const upgradeUrl = config.upgradeUrl ?? null;

function GenerateButton( { slug } ) {
	const [ loading, setLoading ] = useState( false );
	const { setGuideline } = useDispatch( STORE_NAME );
	const { createErrorNotice, createWarningNotice } = useDispatch( noticesStore );
	const draft = useSelect( select => select( STORE_NAME ).getGuideline( slug ), [ slug ] );

	const handleGenerate = async () => {
		if ( ! isAvailable ) {
			const message = ! isConnected
				? __(
						'Jetpack AI is not available. Connect your site to WordPress.com to get started.',
						'jetpack'
				  )
				: __( 'Upgrade now to start using Jetpack AI.', 'jetpack' );

			const actionLabel = ! isConnected ? __( 'Connect', 'jetpack' ) : __( 'Upgrade', 'jetpack' );

			createWarningNotice( message, {
				type: 'snackbar',
				actions: upgradeUrl ? [ { label: actionLabel, url: upgradeUrl } ] : [],
			} );
			return;
		}

		setLoading( true );
		try {
			const body = { sections: [ slug ] };
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
 *
 * @return {boolean} True if all expected sections have been injected.
 */
function injectButtons() {
	let injectedCount = 0;

	document.querySelectorAll( '.content-guidelines__accordion-form' ).forEach( form => {
		const slug = form.id?.replace( 'content-guidelines-', '' );
		if ( ! slug || ! VALID_SECTIONS.includes( slug ) ) {
			return;
		}

		// Already injected.
		if ( form.querySelector( '.jetpack-content-guidelines-ai__container' ) ) {
			injectedCount++;
			return;
		}

		const saveButton = form.querySelector( '.save-button' );
		if ( ! saveButton ) {
			return;
		}

		// Wrap save button and generate button in a horizontal flex row.
		const wrapper = document.createElement( 'div' );
		wrapper.className = 'jetpack-content-guidelines-ai__container';
		wrapper.style.cssText = 'display:flex;gap:8px;align-items:center';
		saveButton.parentNode.insertBefore( wrapper, saveButton );
		wrapper.appendChild( saveButton );

		const root = document.createElement( 'div' );
		wrapper.appendChild( root );
		createRoot( root ).render( createElement( GenerateButton, { slug } ) );

		injectedCount++;
	} );

	return injectedCount === VALID_SECTIONS.length;
}

// Observe DOM until all buttons are injected, then disconnect.
function init() {
	if ( injectButtons() ) {
		return;
	}

	const observer = new MutationObserver( () => {
		if ( injectButtons() ) {
			observer.disconnect();
		}
	} );

	observer.observe( document.body, { childList: true, subtree: true } );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
