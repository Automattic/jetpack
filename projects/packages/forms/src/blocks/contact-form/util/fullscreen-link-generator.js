/**
 * Jetpack Contact Form Fullscreen Link Generator
 *
 * This module adds a utility to generate fullscreen form links.
 * It can be used in the editor to create links that open forms in fullscreen mode.
 */

( function () {
	// Only run in admin context
	if ( typeof wp === 'undefined' || ! wp.blocks || ! wp.element || ! wp.components ) {
		return;
	}

	const { registerPlugin } = wp.plugins;
	const { PluginDocumentSettingPanel } = wp.editPost;
	const { Fragment, useState, useEffect } = wp.element;
	const { Button, TextControl, ClipboardButton, Notice } = wp.components;
	const { select, subscribe } = wp.data;

	/**
	 * Check if the current post has a contact form
	 *
	 * @return {boolean} Whether the post has a contact form
	 */
	const postHasContactForm = () => {
		const { getBlocks } = select( 'core/block-editor' );

		if ( ! getBlocks ) {
			return false;
		}

		const blocks = getBlocks();

		// Check if there's a contact form block
		const hasContactForm = blocks.some( block => {
			// Direct jetpack/contact-form block
			if ( block.name === 'jetpack/contact-form' ) {
				return true;
			}

			// Check inner blocks recursively
			if ( block.innerBlocks && block.innerBlocks.length ) {
				return hasContactFormInnerBlocks( block.innerBlocks );
			}

			return false;
		} );

		return hasContactForm;
	};

	/**
	 * Check for contact form in inner blocks
	 *
	 * @param {Array} innerBlocks - The inner blocks to check
	 * @return {boolean} Whether inner blocks contain a contact form
	 */
	const hasContactFormInnerBlocks = innerBlocks => {
		return innerBlocks.some( block => {
			if ( block.name === 'jetpack/contact-form' ) {
				return true;
			}

			if ( block.innerBlocks && block.innerBlocks.length ) {
				return hasContactFormInnerBlocks( block.innerBlocks );
			}

			return false;
		} );
	};

	/**
	 * Get all contact form IDs in the current post
	 *
	 * @return {Array} The form IDs
	 */
	const getFormIds = () => {
		const { getBlocks } = select( 'core/block-editor' );

		if ( ! getBlocks ) {
			return [];
		}

		const blocks = getBlocks();
		const forms = [];

		// Find contact form blocks
		const findContactForms = blocksToSearch => {
			blocksToSearch.forEach( block => {
				if ( block.name === 'jetpack/contact-form' ) {
					// Extract form ID from attributes or clientId
					const formId = block.attributes.formId || block.clientId;
					forms.push( {
						id: formId,
						title: block.attributes.title || 'Contact Form',
					} );
				}

				if ( block.innerBlocks && block.innerBlocks.length ) {
					findContactForms( block.innerBlocks );
				}
			} );
		};

		findContactForms( blocks );

		return forms;
	};

	/**
	 * Generate fullscreen form link
	 *
	 * @param {string} formId - The form ID (optional)
	 * @return {string} The fullscreen form link
	 */
	const generateFullscreenLink = formId => {
		const { getPermalink } = select( 'core/editor' );

		if ( ! getPermalink ) {
			return '';
		}

		const permalink = getPermalink();

		if ( ! permalink ) {
			return '';
		}

		const url = new URL( permalink );

		if ( formId ) {
			url.searchParams.set( 'fullscreen', formId );
		} else {
			url.searchParams.set( 'fullscreen', 'true' );
		}

		return url.toString();
	};

	/**
	 * Fullscreen Form Link Panel Component
	 */
	const FullscreenFormLinkPanel = () => {
		const [ hasForm, setHasForm ] = useState( false );
		const [ forms, setForms ] = useState( [] );
		const [ copied, setCopied ] = useState( false );

		// Check for contact forms whenever blocks change
		useEffect( () => {
			const unsubscribe = subscribe( () => {
				const currentHasForm = postHasContactForm();
				if ( currentHasForm !== hasForm ) {
					setHasForm( currentHasForm );
				}

				if ( currentHasForm ) {
					setForms( getFormIds() );
				}
			} );

			return unsubscribe;
		}, [ hasForm ] );

		// Initial check
		useEffect( () => {
			setHasForm( postHasContactForm() );
			if ( postHasContactForm() ) {
				setForms( getFormIds() );
			}
		}, [] );

		if ( ! hasForm ) {
			return null;
		}

		return (
			<PluginDocumentSettingPanel
				name="jetpack-contact-form-fullscreen-link"
				title="Contact Form Fullscreen Mode"
			>
				<p>
					Generate links that will open this page's contact form in fullscreen mode, displaying one
					field at a time like Typeform.
				</p>

				{ forms.length === 0 ? (
					// For a post with a form but couldn't identify its ID
					<Fragment>
						<TextControl label="Fullscreen Form Link" value={ generateFullscreenLink() } readOnly />
						<ClipboardButton
							isSecondary
							text={ generateFullscreenLink() }
							onCopy={ () => {
								setCopied( true );
								setTimeout( () => setCopied( false ), 3000 );
							} }
						>
							{ copied ? 'Copied!' : 'Copy Link' }
						</ClipboardButton>
					</Fragment>
				) : (
					// For posts with identifiable forms
					forms.map( form => (
						<div key={ form.id } style={ { marginBottom: '15px' } }>
							<TextControl
								label={ `${ form.title } Link` }
								value={ generateFullscreenLink( form.id ) }
								readOnly
							/>
							<ClipboardButton
								isSecondary
								text={ generateFullscreenLink( form.id ) }
								onCopy={ () => {
									setCopied( form.id );
									setTimeout( () => setCopied( false ), 3000 );
								} }
							>
								{ copied === form.id ? 'Copied!' : 'Copy Link' }
							</ClipboardButton>
						</div>
					) )
				) }

				{ copied && (
					<Notice status="success" isDismissible={ false }>
						Link copied to clipboard!
					</Notice>
				) }

				<p style={ { marginTop: '10px', fontSize: '13px', fontStyle: 'italic' } }>
					Use this link in navigation menus, buttons, or anywhere you want to provide a direct link
					to your form in fullscreen mode.
				</p>
			</PluginDocumentSettingPanel>
		);
	};

	// Register the plugin
	registerPlugin( 'jetpack-contact-form-fullscreen-link', {
		render: FullscreenFormLinkPanel,
		icon: 'feedback',
	} );
} )();
