import { PanelRow, ToggleControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import usePublicizeConfig from '../../hooks/use-publicize-config';

/**
 * Auto-share toggle component
 *
 * @return The auto-share toggle component
 */
export function AutoShareToggle() {
	const { isPublicizeEnabled, togglePublicizeFeature } = usePublicizeConfig();
	const isPostPublished = useSelect( select => select( editorStore ).isCurrentPostPublished(), [] );

	// We do not want to show the toggle if the post is already published.
	if ( isPostPublished ) {
		return null;
	}

	return (
		<PanelRow>
			<ToggleControl
				label={ __( 'Auto-share post', 'jetpack-publicize-pkg' ) }
				onChange={ togglePublicizeFeature }
				checked={ isPublicizeEnabled }
				__nextHasNoMarginBottom={ true }
			/>
		</PanelRow>
	);
}
