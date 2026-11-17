import { PluginPreviewMenuItem } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';
import { useCallback, useState } from 'react';
import { LinkPreviewModal } from '../../exports/link-preview';

/**
 * Adds a "Social preview" item to the editor's Preview dropdown that opens the link preview modal.
 *
 * @return The preview menu item and modal
 */
export function LinkPreviewMenuItem() {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const openModal = useCallback( () => setIsModalOpen( true ), [] );
	const closeModal = useCallback( () => setIsModalOpen( false ), [] );

	// PluginPreviewMenuItem is only available in WordPress 6.7 and later.
	if ( ! PluginPreviewMenuItem ) {
		return null;
	}

	return (
		<>
			<PluginPreviewMenuItem icon={ share } onClick={ openModal }>
				{ __( 'Social preview', 'jetpack-publicize-pkg' ) }
			</PluginPreviewMenuItem>
			{ isModalOpen && <LinkPreviewModal onRequestClose={ closeModal } /> }
		</>
	);
}
