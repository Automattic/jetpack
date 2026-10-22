/**
 * Which account sections the Connectors card renders for a viewer.
 *
 * Pure, so the card's render conditions can be tested without a DOM.
 *
 * @see connectors-card.js ExpandedDetails()
 */

/**
 * Decide which account rows and prompts to render, so no viewer sees the same account twice.
 *
 * @param {object}      state                         - Card state.
 * @param {object|null} state.viewer                  - The viewer's linked account, or null.
 * @param {object|null} state.owner                   - The connection owner, or null.
 * @param {boolean}     state.ownerIsViewer           - Whether the viewer is the connection owner.
 * @param {boolean}     state.canConnect              - Whether the card offers a connect action.
 * @param {boolean}     state.isErrorBannerShown      - Whether the connection error banner is showing.
 * @param {boolean}     state.isProtectedOwnerPending - Whether a protected owner is unconfirmed.
 * @return {{connectPrompt: boolean, unconfirmedOwnerRow: boolean, ownerRow: boolean}} Sections to render.
 */
export function getAccountSections( {
	viewer,
	owner,
	ownerIsViewer,
	canConnect,
	isErrorBannerShown,
	isProtectedOwnerPending,
} ) {
	const isOwnerConnectionBroken = Boolean( owner?.isConnectionBroken );
	// A broken owner viewing the card is covered by the prompt or the banner, not by a row.
	const showsOwnerRow = Boolean( owner ) && ! ownerIsViewer;

	// A broken owner is still the owner of record, so pending protected-owner state can't unconfirm them.
	const isOwnerUnconfirmed = isProtectedOwnerPending && ! isOwnerConnectionBroken;

	return {
		// Connecting would take a broken owner's slot, so the banner decides who acts, as in My Jetpack.
		connectPrompt: ! viewer && canConnect && ! ( isOwnerConnectionBroken && isErrorBannerShown ),
		unconfirmedOwnerRow: showsOwnerRow && isOwnerUnconfirmed,
		ownerRow: showsOwnerRow && ! isOwnerUnconfirmed,
	};
}
