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
			className="jp-search-off-preview"
			aria-hidden="true"
		>
			<Icon className="jp-search-off-preview__icon" icon={ notAllowed } size={ 48 } />
			<div className="jp-search-off-preview__label">
				{ __( 'Jetpack Search is off', 'jetpack-search-pkg' ) }
			</div>
		</Stack>
	);
}
