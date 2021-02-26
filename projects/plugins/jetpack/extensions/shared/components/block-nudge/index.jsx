/**
 * Internal dependencies
 */
import classNames from 'classnames';

/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

import './style.scss';

export const BlockNudge = ( {
	autosaveAndRedirect,
	buttonLabel,
	href,
	icon,
	subtitle,
	title,
	className,
} ) => (
	<Warning
		actions={
			// Use href to determine whether or not to display the Upgrade button.
			href && [
				<Button
					href={ href } // Only for server-side rendering, since onClick doesn't work there.
					onClick={ autosaveAndRedirect }
					target="_top"
					isSecondary
					isLarge
				>
					{ buttonLabel }
				</Button>,
			]
		}
		className={ classNames( className, 'jetpack-block-nudge wp-block' ) }
	>
		<span className="jetpack-block-nudge__info">
			{ icon }
			<span className="jetpack-block-nudge__text-container">
				<span className="jetpack-block-nudge__title">{ title }</span>
				{ subtitle && <span className="jetpack-block-nudge__message">{ subtitle }</span> }
			</span>
		</span>
	</Warning>
);

export default compose( [
	withDispatch( ( dispatch, { blockName, href, onClick } ) => ( {
		autosaveAndRedirect: async event => {
			event.preventDefault(); // Don't follow the href before autosaving
			onClick( blockName );
			await dispatch( 'core/editor' ).savePost();
			// Using window.top to escape from the editor iframe on WordPress.com
			window.top.location.href = href;
		},
	} ) ),
] )( BlockNudge );
