import type { TemplateVars } from './copy-dom-template';

/**
 * Generates a TemplatedString var for a link which triggers the given function,
 * preventing the default event along the way.
 *
 * The callback function gets one argument; the name="" argument supplied to the
 * link element.
 *
 * @param {Function} callback    function to call when the link is clicked.
 * @param {string}   templateKey template key to use for this link. Default: 'action'
 * @return {Object} Template var which can be sent to TemplatedString.
 */
export default function actionLinkTemplateVar(
	callback: ( name: string ) => void,
	templateKey = 'action'
): TemplateVars {
	return {
		[ templateKey ]: [
			'a',
			{
				class: 'action',
				onclick: ( event: MouseEvent ) => {
					event.preventDefault();
					callback( ( event.target as Element ).getAttribute( 'name' ) );
				},
				href: '#',
			},
		],
	};
}
