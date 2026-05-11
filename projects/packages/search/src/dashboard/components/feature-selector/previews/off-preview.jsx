import { __ } from '@wordpress/i18n';
import { Icon, notAllowed } from '@wordpress/icons';
import './off-preview.scss';

/**
 * Static visual preview rendered in the Off panel: the same "notAllowed"
 * icon used in the option row, with a one-line label. Sized to match the
 * other previews so switching between rows doesn't shift the panel.
 *
 * @return {import('react').Element} - The preview illustration.
 */
export default function OffPreview() {
	return (
		<div className="jp-search-feature-selector__off-preview" aria-hidden="true">
			<Icon
				className="jp-search-feature-selector__off-preview-icon"
				icon={ notAllowed }
				size={ 48 }
			/>
			<div className="jp-search-feature-selector__off-preview-label">
				{ __( 'Jetpack Search is off', 'jetpack-search-pkg' ) }
			</div>
		</div>
	);
}
