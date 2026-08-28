/**
 * A navigation row: leading icon, title + description, trailing chevron.
 * Renders a link when `href` is given, a button otherwise.
 */

import { Icon, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
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
 * @param {Function} [props.onClick]     - Click handler; without an href the row is a button.
 * @param {boolean}  [props.external]    - Open `href` in a new tab and announce that.
 * @param {string}   [props.tone]        - Icon and chevron treatment. Defaults to the
 *                                       colours the MCP rows already use; 'neutral'
 *                                       takes the design system token.
 * @return {object} Component markup.
 */
export default function NavRow( { icon, title, description, href, onClick, external, tone } ) {
	// Only the element and its props differ between the two forms: an anchor
	// when there is a destination, a button otherwise.
	const Tag = href ? 'a' : 'button';
	const tagProps = href
		? { href, onClick, ...( external && { target: '_blank', rel: 'noopener noreferrer' } ) }
		: { onClick, type: 'button' };
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
			{ href && external && (
				<VisuallyHidden>{ __( '(opens in a new tab)', 'jetpack' ) }</VisuallyHidden>
			) }
		</Tag>
	);
}
