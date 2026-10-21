/**
 * Which account sections the Connectors card renders for a viewer.
 *
 * Pure, so the card's render conditions can be tested without a DOM.
 *
 * @see connectors-card.js ExpandedDetails()
 */

/**
 * Whether a connection error notice offers to reconnect the connection owner's account.
 *
 * An owner error with action `none` is informational: ownership is locked for this viewer.
 *
 * @param {object|null} notice - A useConnectionErrorNotice() result.
 * @return {boolean} True when a displayed owner error carries a CTA.
 */
export function offersOwnerReconnect( notice ) {
	return Boolean(
		notice?.displayableErrors?.some(
			error => error.audience === 'owner' && error.error_data?.action !== 'none'
		)
	);
}

/**
 * Which connect prompt copy applies to a viewer whose account is not linked.
 *
 * @param {object|null} owner         - The card's connection owner, or null.
 * @param {boolean}     ownerIsViewer - Whether the viewer is the connection owner.
 * @return {string} `reconnect-owner`, `take-over`, `secondary`, or `first`.
 */
export function getConnectPromptKind( owner, ownerIsViewer ) {
	if ( owner?.isConnectionBroken ) {
		// Authorizing while the owner's token is broken takes the vacant owner slot.
		return ownerIsViewer ? 'reconnect-owner' : 'take-over';
	}

	return owner ? 'secondary' : 'first';
}

/**
 * Decide which account rows and prompts to render, so no viewer sees the same account twice.
 *
 * @param {object}      state                         - Card state.
 * @param {object|null} state.viewer                  - The viewer's linked account, or null.
 * @param {object|null} state.owner                   - The connection owner, or null.
 * @param {boolean}     state.ownerIsViewer           - Whether the viewer is the connection owner.
 * @param {boolean}     state.canConnect              - Whether the card offers a connect action.
 * @param {boolean}     state.isOwnerReconnectOffered - Whether the error banner offers to reconnect the owner.
 * @param {boolean}     state.isProtectedOwnerPending - Whether a protected owner is unconfirmed.
 * @return {{connectPrompt: boolean, unconfirmedOwnerRow: boolean, ownerRow: boolean}} Sections to render.
 */
export function getAccountSections( {
	viewer,
	owner,
	ownerIsViewer,
	canConnect,
	isOwnerReconnectOffered,
	isProtectedOwnerPending,
} ) {
	const isOwnerConnectionBroken = Boolean( owner?.isConnectionBroken );
	// A broken owner viewing the card is covered by the prompt or the banner, not by a row.
	const showsOwnerRow = Boolean( owner ) && ! ownerIsViewer;

	// A broken owner is still the owner of record, so pending protected-owner state can't unconfirm them.
	const isOwnerUnconfirmed = isProtectedOwnerPending && ! isOwnerConnectionBroken;

	return {
		// The owner banner already says who must reconnect and offers the CTA.
		connectPrompt:
			! viewer && canConnect && ! ( isOwnerConnectionBroken && isOwnerReconnectOffered ),
		unconfirmedOwnerRow: showsOwnerRow && isOwnerUnconfirmed,
		ownerRow: showsOwnerRow && ! isOwnerUnconfirmed,
	};
}
