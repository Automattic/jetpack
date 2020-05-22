/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import getRedirectUrl from 'lib/jp-redirect';

/**
 * Internal dependencies
 */
import Button from 'components/button';

export default function ChecklistCta( { onClick, siteSlug } ) {
	return (
		<div className="jp-landing__plan-features-header-checklist-cta-container">
			<Button
				href={ getRedirectUrl( 'calypso-plans-my-plan', { site: siteSlug, query: 'checklist' } ) }
				onClick={ onClick }
				primary
			>
				{ __( 'View your setup checklist' ) }
			</Button>
		</div>
	);
}
