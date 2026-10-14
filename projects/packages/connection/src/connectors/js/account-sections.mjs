/**
 * Which account sections the Connectors card renders for a viewer.
 *
 * Pure, so the card's render conditions can be tested without a DOM.
 *
 * @see connectors-card.js ExpandedDetails()
 */

/**
 * Whether a connection error notice describes the connection owner's account.
 *
 * @param {object|null} notice - A useConnectionErrorNotice() result.
 * @return {boolean} True when one of the displayed errors is the owner's.
 */
export function hasOwnerError( notice ) {
	return Boolean( notice?.displayableErrors?.some( error => error.audience === 'owner' ) );
}

/**
 * Which connect prompt copy applies to a viewer whose account is not linked.
 *
 * @param {object|null} connectionOwner - The card's connectionOwner data.
 * @return {string} `reconnect-owner`, `take-over`, `secondary`, or `first`.
 */
export function getConnectPromptKind( connectionOwner ) {
	if ( connectionOwner?.isConnectionBroken ) {
		// Authorizing while the owner's token is broken takes the vacant owner slot.
		return connectionOwner.isCurrentUser ? 'reconnect-owner' : 'take-over';
	}

	return connectionOwner ? 'secondary' : 'first';
}

/**
 * Decide which account rows and prompts to render, so no viewer sees the same account twice.
 *
 * @param {object}      state                         - Card state.
 * @param {object|null} state.currentUser             - The viewer's linked account, or null.
 * @param {object|null} state.connectionOwner         - The connection owner, or null.
 * @param {boolean}     state.canConnect              - Whether the card offers a connect action.
 * @param {boolean}     state.isOwnerErrorShown       - Whether the error banner shows an owner error.
 * @param {boolean}     state.isProtectedOwnerPending - Whether a protected owner is unconfirmed.
 * @return {{connectPrompt: boolean, unconfirmedOwnerRow: boolean, ownerRow: boolean}} Sections to render.
 */
export function getAccountSections( {
	currentUser,
	connectionOwner,
	canConnect,
	isOwnerErrorShown,
	isProtectedOwnerPending,
} ) {
	const isOwnerConnectionBroken = Boolean( connectionOwner?.isConnectionBroken );
	// A broken owner viewing the card is covered by the prompt or the banner, not by a row.
	const showsOwnerRow =
		Boolean( connectionOwner ) && ! currentUser?.isOwner && ! connectionOwner.isCurrentUser;

	return {
		// The owner banner already says who must reconnect and offers the CTA.
		connectPrompt:
			! currentUser && canConnect && ! ( isOwnerConnectionBroken && isOwnerErrorShown ),
		unconfirmedOwnerRow: showsOwnerRow && isProtectedOwnerPending,
		ownerRow: showsOwnerRow && ! isProtectedOwnerPending,
	};
}
