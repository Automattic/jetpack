/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';

import './style.scss';

export const BlockNudge = ( { autosaveAndRedirect, buttonLabel, href, icon, subtitle, title } ) => (
	<Warning
		actions={
			// Use href to determine whether or not to display the Upgrade button.
			href && [
				<Button
					href={ href } // Only for server-side rendering, since onClick doesn't work there.
					onClick={ autosaveAndRedirect }
					target="_top"
					isDefault
				>
					{ buttonLabel }
				</Button>,
			]
		}
		className="jetpack-block-nudge"
	>
		<span className="jetpack-block-nudge__info">
			{ icon }
			<span className="jetpack-block-nudge__text-container">
				<span className="jetpack-block-nudge__title">{ title }</span>
				<span className="jetpack-block-nudge__message">{ subtitle }</span>
			</span>
		</span>
	</Warning>
);

export default compose( [
	withDispatch( ( dispatch, { blockName, href, onClick } ) => ( {
		autosaveAndRedirect: async event => {
			event.preventDefault(); // Don't follow the href before autosaving
			onClick( blockName );
			await dispatch( 'core/editor' ).autosave();
			// Using window.top to escape from the editor iframe on WordPress.com
			window.top.location.href = href;
		},
	} ) ),
] )( BlockNudge );
