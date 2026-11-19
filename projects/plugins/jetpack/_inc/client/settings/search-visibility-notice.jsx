import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Explain restricted indexing without depending on the SEO module.
 *
 * @param {object}  props         - Component props.
 * @param {boolean} props.visible - Whether search indexing is allowed.
 * @return {import('react').ReactNode} The visibility warning, or null.
 */
export default function SearchVisibilityNotice( { visible } ) {
	if ( visible !== false ) {
		return null;
	}
	return (
		<Notice.Root intent="warning" className="jp-settings__visibility-notice">
			<Notice.Description>
				{ __(
					"This site's visibility settings discourage or prevent search engines from indexing it.",
					'jetpack'
				) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionLink href={ getAdminUrl( 'options-reading.php' ) }>
					{ __( 'Review site visibility settings', 'jetpack' ) }
				</Notice.ActionLink>
			</Notice.Actions>
		</Notice.Root>
	);
}
