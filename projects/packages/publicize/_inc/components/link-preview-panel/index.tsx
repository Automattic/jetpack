/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

import { Button, PanelBody } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useCallback, useState } from 'react';
import { LinkPreviewModal, usePreviewTabs } from '../../exports/link-preview';
import { LinkPreviewPlatform } from '../../exports/link-preview/types';
import { PreviewTab } from '../../exports/link-preview/use-preview-tabs';
import styles from './styles.module.scss';

/**
 * A single social service icon button that opens the preview modal for that service.
 *
 * @param {object}   props         - Component props.
 * @param {object}   props.tab     - The preview tab definition.
 * @param {Function} props.onClick - Callback when the button is clicked, receives the tab name.
 * @return The service icon button component.
 */
function ServiceIconButton( {
	tab,
	onClick,
}: {
	tab: PreviewTab;
	onClick: ( name: LinkPreviewPlatform ) => void;
} ) {
	const handleClick = useCallback( () => {
		onClick( tab.name );
	}, [ onClick, tab.name ] );

	return (
		<Button
			className={ styles[ 'social-icon-button' ] }
			label={ sprintf(
				/* translators: %s is the name of a social media service, e.g. "Facebook" */
				__( 'Preview on %s', 'jetpack-publicize-pkg' ),
				tab.title
			) }
			showTooltip
			onClick={ handleClick }
		>
			{ typeof tab.icon === 'function' ? <tab.icon /> : tab.icon }
		</Button>
	);
}

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
