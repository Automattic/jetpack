type FormAttributes = {
	emailNotifications?: boolean | string;
	to?: string;
	saveResponses?: boolean | string;
	jetpackCRM?: boolean | string;
	mailpoet?: { enabledForForm?: boolean } | null;
	hostingerReach?: { enabledForForm?: boolean } | null;
	salesforceData?: { sendToSalesforce?: boolean; organizationId?: string } | null;
	[ key: string ]: unknown;
};

/**
 * Normalize a possibly-boolean-or-string toggle attribute to a boolean.
 *
 * Toggle attributes are booleans in the editor but persist as 'yes'/'no'
 * strings in some contexts, so both forms must be handled.
 *
 * @param value    - The attribute value.
 * @param fallback - Value to use when the attribute is undefined/null.
 * @return The normalized boolean.
 */
function isTruthy( value: boolean | string | undefined | null, fallback: boolean ): boolean {
	if ( value === undefined || value === null ) {
		return fallback;
	}
	if ( typeof value === 'string' ) {
		return ! [ '', 'no', 'false', '0' ].includes( value.trim().toLowerCase() );
	}
	return !! value;
}

/**
 * Determine whether a form is configured to collect its responses anywhere.
 *
 * A form "collects responses" when submissions are delivered to at least one
 * destination: emailed to a recipient, saved to the responses dashboard, or
 * routed to an active data integration. When all are off, submissions are
 * silently dropped.
 *
 * Keep this in sync with the PHP helper `Contact_Form::is_collecting_responses()`.
 *
 * @param attributes - The contact-form block attributes.
 * @return True when the form has at least one response destination.
 */
export function isCollectingResponses( attributes: FormAttributes = {} ): boolean {
	// Email destination: on by default. A blank or invalid recipient is not a dead
	// end — submissions fall back to the site admin email at send time — so email
	// being on always counts as a real destination.
	const emailActive = isTruthy( attributes.emailNotifications, true );

	// Saving to the responses dashboard: on by default.
	const savingActive = isTruthy( attributes.saveResponses, true );

	// Integrations that actually persist or route the submission. Akismet (spam
	// filtering) and Google Drive (exports already-saved responses) are excluded.
	// Webhooks are excluded too: they only fire for forms whose author can
	// manage_options, so counting them from attributes alone (with no author
	// context here) would wrongly silence the warning for editor-authored forms.
	const integrationActive =
		isTruthy( attributes.jetpackCRM, false ) ||
		!! attributes.mailpoet?.enabledForForm ||
		!! attributes.hostingerReach?.enabledForForm ||
		( !! attributes.salesforceData?.sendToSalesforce &&
			!! attributes.salesforceData?.organizationId );

	return emailActive || savingActive || integrationActive;
}
