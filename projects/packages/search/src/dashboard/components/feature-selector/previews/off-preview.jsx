import { __ } from '@wordpress/i18n';
import { Icon, notAllowed } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import './off-preview.scss';

/**
 * Decorative Off mockup — `aria-hidden`.
 *
 * @return {import('react').Element} - The preview.
 */
export default function OffPreview() {
	return (
		<Stack
			direction="column"
			gap="sm"
			align="center"
			justify="center"
			className="jp-search-feature-selector__off-preview"
			aria-hidden="true"
		>
			<Icon
				className="jp-search-feature-selector__off-preview-icon"
				icon={ notAllowed }
				size={ 48 }
			/>
			<div className="jp-search-feature-selector__off-preview-label">
				{ __( 'Jetpack Search is off', 'jetpack-search-pkg' ) }
			</div>
		</Stack>
	);
}
