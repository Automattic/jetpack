/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/** Which rule decides where responses go when no recipient is explicitly saved. */
export type AutoRecipientSource = 'post_author' | 'site_admin' | 'embedding_post_author';

/** A fallback recipient and the rule that produced it. */
export type AutoRecipient = {
	address: string;
	source: AutoRecipientSource;
};

type AutoRecipientParams = {
	serverSource?: string;
	serverAddress?: string;
	postAuthorEmail?: string;
	isStandaloneForm?: boolean;
};

/**
 * Resolve the recipient a form falls back to when no address is explicitly saved.
 *
 * Mirrors what Contact_Form resolves at send time so the editor can explain the fallback rather than displaying it as though it were a stored value.
 *
 * @param params                  - Resolution inputs.
 * @param params.serverSource     - Fallback branch PHP reported for this page load.
 * @param params.serverAddress    - Address PHP resolved for that branch.
 * @param params.postAuthorEmail  - Live post author email from the editor store, when known.
 * @param params.isStandaloneForm - Whether the block is being edited in the standalone form post type.
 * @return The fallback address and the rule that produced it.
 */
export function getAutoRecipient( {
	serverSource,
	serverAddress = '',
	postAuthorEmail = '',
	isStandaloneForm = false,
}: AutoRecipientParams ): AutoRecipient {
	// A standalone form has no single destination to predict: at send time the recipient resolves
	// against whichever page embeds the form, which this editor cannot know.
	if ( isStandaloneForm ) {
		return { address: '', source: 'embedding_post_author' };
	}

	if ( serverSource === 'post_author' ) {
		// Prefer the live author so reassigning the post author updates the hint without a reload.
		// PHP's edit_post and blog-membership checks already gated us into this branch.
		return { address: postAuthorEmail || serverAddress, source: 'post_author' };
	}

	return { address: serverAddress, source: 'site_admin' };
}

/**
 * Help text explaining which fallback applies while the recipient field is empty.
 *
 * @param source - The rule that produced the fallback recipient.
 * @return Translated sentence for the field's help text.
 */
export function getAutoRecipientHelpText( source: AutoRecipientSource ): string {
	// Keyed unconditionally rather than branched. Selecting a translated string inside a branch lets
	// the minifier collapse the branches into a single __() call whose msgid is a ternary, which the
	// gettext extractor cannot read — so every __() call here stays unconditional and literal.
	const helpTexts: Record< AutoRecipientSource, string > = {
		post_author: __( 'Leave empty to send responses to the post author.', 'jetpack-forms' ),
		embedding_post_author: __(
			'Leave empty to send responses to the author of the page where this form appears.',
			'jetpack-forms'
		),
		site_admin: __( 'Leave empty to send responses to the site admin email.', 'jetpack-forms' ),
	};

	return helpTexts[ source ] || helpTexts.site_admin;
}
