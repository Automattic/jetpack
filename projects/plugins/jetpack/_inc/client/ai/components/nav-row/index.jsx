/**
 * A navigation row: leading icon, title + description, trailing chevron.
 * Renders a link when `href` is given, a button otherwise.
 */

import {
	Icon,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { chevronRight } from '@wordpress/icons';

import './style.scss';

/**
 * Shared row content: icon, text block, chevron.
 *
 * @param {object} props               - Component props.
 * @param {object} props.icon          - Icon from the WordPress icons package.
 * @param {string} props.title         - Row title.
 * @param {string} [props.description] - Row description.
 * @return {object} Component markup.
 */
function RowContent( { icon, title, description } ) {
	return (
		<>
			<span className="jetpack-ai-nav-row__icon">
				<Icon icon={ icon } size={ 24 } />
			</span>
			<span className="jetpack-ai-nav-row__text">
				<Text as="p" className="jetpack-ai-nav-row__title" weight={ 600 }>
					{ title }
				</Text>
				{ description && (
					<Text as="p" className="jetpack-ai-nav-row__description" variant="muted">
						{ description }
					</Text>
				) }
			</span>
			<span className="jetpack-ai-nav-row__chevron">
				<Icon icon={ chevronRight } size={ 24 } />
			</span>
		</>
	);
}

/**
 * Navigation row component.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.icon          - Icon from the WordPress icons package.
 * @param {string}   props.title         - Row title.
 * @param {string}   [props.description] - Row description.
 * @param {string}   [props.href]        - Link target; renders an anchor when set.
 * @param {Function} [props.onClick]     - Click handler; renders a button when no href.
 * @return {object} Component markup.
 */
export default function NavRow( { icon, title, description, href, onClick } ) {
	if ( href ) {
		return (
			<a className="jetpack-ai-nav-row" href={ href }>
				<RowContent icon={ icon } title={ title } description={ description } />
			</a>
		);
	}
	return (
		<button className="jetpack-ai-nav-row" onClick={ onClick } type="button">
			<RowContent icon={ icon } title={ title } description={ description } />
		</button>
	);
}
