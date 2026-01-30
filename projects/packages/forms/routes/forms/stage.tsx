/**
 * WordPress dependencies
 */
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import * as React from 'react';
/**
 * Internal dependencies
 */
import FormsLogo from '../../src/dashboard/components/forms-logo';
import DataViewsHeaderRow from '../../src/dashboard/wp-build/components/dataviews-header-row';

/**
 * Placeholder stage for the Forms list route (wp-build).
 *
 * @return The stage component.
 */
function Stage() {
	return (
		<Page
			showSidebarToggle={ false }
			title={ <FormsLogo /> }
			subTitle={ __( 'View and manage all your forms in one place.', 'jetpack-forms' ) }
		>
			<DataViewsHeaderRow activeTab="forms" />
			<Stack direction="column" gap="sm">
				<h3>Forms list placeholder page.</h3>
			</Stack>
		</Page>
	);
}

export { Stage as stage };
