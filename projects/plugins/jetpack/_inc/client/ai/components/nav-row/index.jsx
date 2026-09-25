/**
 * A navigation row: leading icon, title + description, trailing chevron.
 * Renders a link when `href` is given, a button otherwise.
 */

import { Icon, VisuallyHidden } from '@wordpress/components';
import { useId } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronRight } from '@wordpress/icons';
import { Text } from '@wordpress/ui';

import './style.scss';

/**
 * Navigation row component.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.icon          - Icon from the WordPress icons package.
 * @param {number}   [props.iconSize]    - Rendered size of the leading icon. Defaults to the
 *                                       24px grid the WordPress icons are drawn on; connector
 *                                       marks pass 28 so their inset artwork reads at the
 *                                       same weight.
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
export default function NavRow( {
	icon,
	iconSize = 24,
	title,
	description,
	href,
	onClick,
	external,
	tone,
} ) {
	// Only the element and its props differ between the two forms: an anchor
	// when there is a destination, a button otherwise.
	const Tag = href ? 'a' : 'button';
	const tagProps = href
		? { href, onClick, ...( external && { target: '_blank', rel: 'noopener noreferrer' } ) }
		: { onClick, type: 'button' };
	const className = tone
		? `jetpack-ai-nav-row jetpack-ai-nav-row--${ tone }`
		: 'jetpack-ai-nav-row';

	const titleId = useId();
	const descriptionId = useId();
	const newTabId = useId();
	// The new-tab warning belongs in the accessible NAME — screen readers often
	// skip descriptions when scanning links — so the name is composed from the
	// title and the warning, and the description stays a description.
	const labelledBy = [ titleId, href && external && newTabId ].filter( Boolean ).join( ' ' );

	return (
		<Tag
			className={ className }
			aria-labelledby={ labelledBy }
			aria-describedby={ description ? descriptionId : undefined }
			{ ...tagProps }
		>
			<span className="jetpack-ai-nav-row__icon">
				<Icon icon={ icon } size={ iconSize } />
			</span>
			<span className="jetpack-ai-nav-row__text">
				<Text
					render={ <p /> }
					id={ titleId }
					variant="heading-lg"
					className="jetpack-ai-nav-row__title"
				>
					{ title }
				</Text>
				{ description && (
					<Text
						render={ <p /> }
						id={ descriptionId }
						variant="body-md"
						className="jetpack-ai-nav-row__description"
					>
						{ description }
					</Text>
				) }
			</span>
			<span className="jetpack-ai-nav-row__chevron">
				<Icon icon={ chevronRight } size={ 24 } />
			</span>
			{ href && external && (
				<VisuallyHidden id={ newTabId }>{ __( '(opens in a new tab)', 'jetpack' ) }</VisuallyHidden>
			) }
		</Tag>
	);
}
