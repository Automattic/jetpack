import externalLinkTemplateVar from './external-link-template-var';
import type { TemplateVars } from './copy-dom-template';

/**
 * Generates a TemplatedString var for a link to contact Jetpack Support.
 *
 * @param {string} templateKey template key to use for this link. Default: 'support'
 * @return {Object} Template var which can be sent to TemplatedString.
 */
export default function supportLinkTemplateVar( templateKey = 'support' ): TemplateVars {
	return externalLinkTemplateVar(
		'https://wordpress.org/support/plugin/jetpack-boost/',
		templateKey
	);
}
