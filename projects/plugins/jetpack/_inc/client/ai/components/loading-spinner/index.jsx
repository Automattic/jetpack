import { Spinner, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * A spinner that screen readers announce as a loading status.
 *
 * @return {import('react').ReactElement} The spinner.
 */
export default function LoadingSpinner() {
	return (
		<div className="jetpack-ai-admin__loading" role="status">
			<Spinner />
			<VisuallyHidden>{ __( 'Loading…', 'jetpack' ) }</VisuallyHidden>
		</div>
	);
}
