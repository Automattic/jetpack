import apiFetch from '@wordpress/api-fetch';
import { Button, ButtonGroup, Modal, PanelBody, Path, SVG } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { useState, useCallback, useEffect } from 'react';

// Fallback SVG for the send icon that will be released with Gutenberg 19.0
// Replace with import { send  } from '@wordpress/icons' when available;
const sendIconSvg = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path
			fillRule="evenodd"
			clipRule="evenodd"
			d="M6.332 5.748c-1.03-.426-2.06.607-1.632 1.636l1.702 3.93 7.481.575c.123.01.123.19 0 .2l-7.483.575-1.7 3.909c-.429 1.029.602 2.062 1.632 1.636l12.265-5.076c1.03-.426 1.03-1.884 0-2.31L6.332 5.748Z"
		/>
	</SVG>
);

const NewsletterMenu = () => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ previewHtml, setPreviewHtml ] = useState( '' );

	const { postId } = useSelect( select => {
		return {
			postId: select( 'core/editor' ).getCurrentPostId(),
		};
	}, [] );

	const fetchPreview = useCallback( async () => {
		if ( ! postId ) {
			return;
		}

		setIsLoading( true );
		try {
			const response = await apiFetch( {
				path: `/wpcom/v2/email-preview/?post_id=${ postId }`,
				method: 'GET',
			} );

			if ( response && response.html ) {
				setPreviewHtml( response.html );
			} else {
				throw new Error( 'Invalid response format' );
			}
		} catch ( error ) {
			setPreviewHtml( `<html><body>${ __( 'Error loading preview', 'jetpack' ) }</body></html>` );
		} finally {
			setIsLoading( false );
		}
	}, [ postId ] );

	const openModal = () => {
		setIsModalOpen( true );
	};

	const closeModal = () => setIsModalOpen( false );

	useEffect( () => {
		if ( isModalOpen ) {
			fetchPreview();
		}
	}, [ isModalOpen, fetchPreview ] );

	const modalContent = (
		<>
			{ isLoading && <p>{ __( 'Loading preview…', 'jetpack' ) }</p> }
			{ ! isLoading && (
				<iframe
					srcDoc={ previewHtml }
					style={ {
						width: '100%',
						height: 'calc(100vh - 120px)',
						border: 'none',
					} }
					title={ __( 'Email Preview', 'jetpack' ) }
				/>
			) }
		</>
	);

	return (
		<>
			<PluginSidebar
				name="newsletter-settings-sidebar"
				title={ __( 'Newsletter', 'jetpack' ) }
				icon={ sendIconSvg }
			>
				<PanelBody>
					<p>
						{ __(
							'Ensure your email looks perfect. Use the buttons below to view a preview or send a test email.',
							'jetpack'
						) }
					</p>
					<ButtonGroup>
						<Button
							onClick={ openModal }
							style={ {
								marginRight: '18px',
							} }
							variant="secondary"
						>
							{ __( 'Preview email', 'jetpack' ) }
						</Button>
						<Button onClick={ openModal } variant="secondary">
							{ __( 'Send a test', 'jetpack' ) }
						</Button>
					</ButtonGroup>
				</PanelBody>
			</PluginSidebar>
			{ isModalOpen && (
				<Modal
					title={ __( 'Preview email', 'jetpack' ) }
					onRequestClose={ closeModal }
					isFullScreen={ true }
				>
					{ modalContent }
				</Modal>
			) }
		</>
	);
};

export default NewsletterMenu;
