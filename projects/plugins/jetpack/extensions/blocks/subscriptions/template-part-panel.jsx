import { useSelect } from '@wordpress/data';
import { PluginDocumentSettingPanel, store as editorStore } from '@wordpress/editor';
import NewsletterSettingsPanel from '../../shared/components/newsletter-settings-panel';
import { getPlacementByTemplatePart } from './settings-placements';

/**
 * Shows the Newsletter settings toggle in the Template Part sidebar of settings-driven template parts.
 *
 * @return {Element|null} The panel.
 */
export default function TemplatePartSettingsPanel() {
	const slug = useSelect( select => {
		const { getCurrentPostType, getEditedPostAttribute } = select( editorStore );
		return getCurrentPostType() === 'wp_template_part' ? getEditedPostAttribute( 'slug' ) : null;
	}, [] );
	const placement = getPlacementByTemplatePart( slug );

	if ( ! placement ) {
		return null;
	}

	return (
		<NewsletterSettingsPanel
			as={ PluginDocumentSettingPanel }
			name="jetpack-newsletter-settings-placement"
			option={ placement.option }
			label={ placement.label }
		/>
	);
}
