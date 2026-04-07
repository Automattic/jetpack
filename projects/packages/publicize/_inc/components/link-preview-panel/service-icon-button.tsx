/**
 * A single social service icon button that opens the preview modal for that service.
 */

import { Button } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback } from 'react';
import { LinkPreviewPlatform } from '../../exports/link-preview/types';
import { PreviewTab } from '../../exports/link-preview/use-preview-tabs';
import styles from './styles.module.scss';

type ServiceIconButtonProps = {
	/**
	 * The preview tab definition.
	 */
	tab: PreviewTab;

	/**
	 * Callback when the button is clicked, receives the tab name.
	 */
	onClick: ( name: LinkPreviewPlatform ) => void;
};

/**
 * A single social service icon button that opens the preview modal for that service.
 *
 * @param {ServiceIconButtonProps} props - Component props.
 *
 * @return The service icon button component.
 */
export function ServiceIconButton( { tab, onClick }: ServiceIconButtonProps ) {
	const handleClick = useCallback( () => {
		onClick( tab.name );
	}, [ onClick, tab.name ] );

	return (
		<Button
			className={ styles[ 'social-icon-button' ] }
			label={ sprintf(
				/* translators: %s is the name of a social media service, e.g. "Facebook" */
				__( 'Preview for %s', 'jetpack-publicize-pkg' ),
				tab.title
			) }
			showTooltip
			onClick={ handleClick }
		>
			{ typeof tab.icon === 'function' ? <tab.icon /> : tab.icon }
		</Button>
	);
}
