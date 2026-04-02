/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

import { Button, PanelBody } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { LinkPreviewModal, usePreviewTabs } from '../../exports/link-preview';
import { LinkPreviewPlatform } from '../../exports/link-preview/types';
import { ServiceIconButton } from './service-icon-button';
import styles from './styles.module.scss';

/**
 * Display the link previews panel, showing available services and a trigger to open the preview modal.
 *
 * @return The link previews panel component
 */
export function LinkPreviewPanel() {
	const previewTabs = usePreviewTabs();
	const [ initialTab, setInitialTab ] = useState< LinkPreviewPlatform | undefined >();
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const openModal = useCallback( ( tabName?: LinkPreviewPlatform ) => {
		setInitialTab( tabName );
		setIsModalOpen( true );
	}, [] );

	const openModalDefault = useCallback( () => {
		openModal();
	}, [ openModal ] );

	const closeModal = useCallback( () => {
		setIsModalOpen( false );
	}, [] );

	return (
		<PanelBody title={ __( 'Link preview', 'jetpack-publicize-pkg' ) }>
			<p>
				{ __(
					'Preview what this will look like on social networks and Google search.',
					'jetpack-publicize-pkg'
				) }
			</p>

			<ul className={ styles[ 'social-icons-list' ] }>
				{ previewTabs.map( tab => (
					<li key={ tab.name }>
						<ServiceIconButton tab={ tab } onClick={ openModal } />
					</li>
				) ) }
			</ul>

			<Button
				variant="secondary"
				size="default"
				aria-label={ __( 'Open link preview', 'jetpack-publicize-pkg' ) }
				onClick={ openModalDefault }
			>
				{ _x(
					'Preview',
					'Button label that opens the SEO link previews modal',
					'jetpack-publicize-pkg'
				) }
			</Button>

			{ isModalOpen && (
				<LinkPreviewModal initialTabName={ initialTab } onRequestClose={ closeModal } />
			) }
		</PanelBody>
	);
}
