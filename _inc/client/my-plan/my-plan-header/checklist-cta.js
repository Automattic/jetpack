/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import getRedirectUrl from 'lib/jp-redirect';

export default function ChecklistCta( { onClick, siteSlug } ) {
	return (
		<div className="jp-landing__plan-features-header-checklist-cta-container">
			<Button
				href={ getRedirectUrl( 'calypso-plans-my-plan', { site: siteSlug, query: 'checklist' } ) }
				onClick={ onClick }
				primary
			>
				{ __( 'View your setup checklist', 'jetpack' ) }
			</Button>
		</div>
	);
}
