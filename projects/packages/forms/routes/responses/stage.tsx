/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

/**
 *
 */
export function stage() {
	return (
		<Page title={ __( 'Form Responses', 'jetpack-forms' ) }>
			<div style={ { padding: '20px' } }>
				<h2>Form Responses</h2>
				<p>This is a test without DataViews.</p>
				<ul>
					<li>Response 1 - John Doe</li>
					<li>Response 2 - Jane Smith</li>
				</ul>
			</div>
		</Page>
	);
}
