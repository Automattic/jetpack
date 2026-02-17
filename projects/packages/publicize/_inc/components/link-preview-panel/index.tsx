/**
 * Social Previews panel component.
 *
 * Shows available services and allows opening up the preview modal.
 */

import { PanelBody } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { LinkPreviewModalWithTrigger, usePreviewTabs } from '../../exports/link-preview';
import styles from './styles.module.scss';

/**
 * Display the link previews panel, showing available services and a trigger to open the preview modal.
 *
 * @return The link previews panel component
 */
export function LinkPreviewPanel() {
	const previewTabs = usePreviewTabs();

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
					<li key={ tab.name }>{ typeof tab.icon === 'function' ? <tab.icon /> : tab.icon }</li>
				) ) }
			</ul>

			<LinkPreviewModalWithTrigger
				triggerButtonProps={ {
					size: 'default',
					'aria-label': __( 'Open link preview', 'jetpack-publicize-pkg' ),
					children: _x(
						'Preview',
						'Button label that opens the SEO link previews modal',
						'jetpack-publicize-pkg'
					),
				} }
			/>
		</PanelBody>
	);
}
