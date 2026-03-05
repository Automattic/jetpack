import { __ } from '@wordpress/i18n';

/**
 * Placeholder Migration Tools section.
 *
 * @return {import('react').ReactNode} The rendered component.
 */
export default function MigrationTools() {
	return (
		<div className="wpcom-id-page__section">
			<h2>{ __( 'Migration Tools', 'jetpack-connection' ) }</h2>
			<p className="wpcom-id-page__placeholder-text">
				{ __(
					'Tools for migrating your site connection will be available here.',
					'jetpack-connection'
				) }
			</p>
			<button type="button" className="button" disabled>
				{ __( 'Run Migration', 'jetpack-connection' ) }
			</button>
		</div>
	);
}
