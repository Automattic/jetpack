/**
 * Internal dependencies
 */
import type { TemplateVars } from './copy-dom-template';

/**
 * Generates a TemplatedString var for an external link (with target and rel
 * attributes appropriate set).
 *
 * @param {string} href        for the link to use
 * @param {string} templateKey template key to use for this link. Default: 'link'
 * @return {TemplateVars} Template var which can be sent to TemplatedString.
 */
export default function externalLinkTemplateVar(
	href: string,
	templateKey = 'link'
): TemplateVars {
	return {
		[ templateKey ]: [
			'a',
			{
				href,
				target: '_blank',
				rel: 'noopener noreferrer',
			},
		],
	};
}
