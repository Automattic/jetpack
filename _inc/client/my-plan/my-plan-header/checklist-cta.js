/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';

export default function ChecklistCta( { placeholder, siteSlug } ) {
	return (
		<div className="jp-landing__plan-features-header-checklist-cta-container">
			<Button
				primary
				href={ placeholder ? undefined : `https://wordpress.com/plans/my-plan/${ siteSlug }` }
			>
				{ __( 'View your setup checklist' ) }
			</Button>
		</div>
	);
}
