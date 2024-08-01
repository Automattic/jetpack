import apiFetch from '@wordpress/api-fetch';
import { Button, Modal } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { PluginSidebar } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { atSymbol } from '@wordpress/icons';
import { useState, useCallback, useEffect } from 'react';

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
				icon={ atSymbol }
			>
				<Button onClick={ openModal } isPrimary>
					{ __( 'Email Preview', 'jetpack' ) }
				</Button>
			</PluginSidebar>
			{ isModalOpen && (
				<Modal
					title={ __( 'Email Preview', 'jetpack' ) }
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
