/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';

const TrackError = memo( ( { link, title } ) => (
	<div className="jetpack-podcast-player__track-error">
		{ __( 'Episode unavailable. ', 'jetpack' ) }
		{ link && (
			<span>
				<a href={ link } rel="noopener noreferrer nofollow" target="_blank">
					<span className="jetpack-podcast-player--visually-hidden">
						{ /* Intentional trailing space outside of the translated string. */ }
						{ `${ sprintf(
							/* translators: %s is the title of the track. This text is
							visually hidden from the screen, but available to screen readers. */
							__( '%s:', 'jetpack' ),
							title
						) } ` }
					</span>
					{ __( 'Open in a new tab', 'jetpack' ) }
				</a>
			</span>
		) }
	</div>
) );

export default TrackError;
