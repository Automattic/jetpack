/**
 * A navigation row: leading icon, title + description, trailing chevron.
 * Renders a link when `href` is given, a button otherwise.
 */

import { Icon } from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';
import { Text } from '@wordpress/ui';

import './style.scss';

/**
 * Navigation row component.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.icon          - Icon from the WordPress icons package.
 * @param {string}   props.title         - Row title.
 * @param {string}   [props.description] - Row description.
 * @param {string}   [props.href]        - Link target; renders an anchor when set.
 * @param {Function} [props.onClick]     - Click handler; renders a button when no href.
 * @param {string}   [props.tone]        - Icon and chevron treatment. Defaults to the
 *                                       colours the MCP rows already use; 'neutral'
 *                                       takes the design system token.
 * @return {object} Component markup.
 */
export default function NavRow( { icon, title, description, href, onClick, tone } ) {
	// Only the element and its props differ between the two forms: an anchor
	// when there is a destination, a button when there is a handler.
	const Tag = href ? 'a' : 'button';
	const tagProps = href ? { href } : { onClick, type: 'button' };
	const className = tone
		? `jetpack-ai-nav-row jetpack-ai-nav-row--${ tone }`
		: 'jetpack-ai-nav-row';

	return (
		<Tag className={ className } { ...tagProps }>
			<span className="jetpack-ai-nav-row__icon">
				<Icon icon={ icon } size={ 24 } />
			</span>
			<span className="jetpack-ai-nav-row__text">
				<Text render={ <p /> } variant="heading-lg" className="jetpack-ai-nav-row__title">
					{ title }
				</Text>
				{ description && (
					<Text render={ <p /> } variant="body-md" className="jetpack-ai-nav-row__description">
						{ description }
					</Text>
				) }
			</span>
			<span className="jetpack-ai-nav-row__chevron">
				<Icon icon={ chevronRight } size={ 24 } />
			</span>
		</Tag>
	);
}
