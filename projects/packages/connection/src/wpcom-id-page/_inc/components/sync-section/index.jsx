import { __ } from '@wordpress/i18n';

/**
 * Placeholder Sync section. Will be replaced with real sync data in a future update.
 *
 * @return {import('react').ReactNode} The rendered component.
 */
export default function SyncSection() {
	return (
		<div className="wpcom-id-page__section">
			<h2>{ __( 'Sync Status', 'jetpack-connection' ) }</h2>
			<p className="wpcom-id-page__placeholder-text">
				{ __( 'Sync data will be displayed here in a future update.', 'jetpack-connection' ) }
			</p>
			<button type="button" className="button" disabled>
				{ __( 'View Sync Details', 'jetpack-connection' ) }
			</button>
		</div>
	);
}
