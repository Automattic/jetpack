/**
 * External dependencies
 */
import { useSearch } from '@tanstack/react-router';

/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';

/**
 *
 */
export function inspector() {
	const searchParams = useSearch( { from: '/responses/$view' } );
	const responseIds = searchParams?.responseIds || [];

	// Don't render if no response is selected
	if ( ! responseIds.length ) {
		return null;
	}

	return (
		<Page title={ __( 'Response Details', 'jetpack-forms' ) }>
			<div style={ { padding: '20px' } }>
				<h3>Inspector Panel</h3>
				<p>Selected response ID: { responseIds[ 0 ] }</p>
			</div>
		</Page>
	);
}
