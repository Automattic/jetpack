import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import * as trackIcons from '../icons/track-icons';

const TrackIcon = memo( ( { isPlaying, isError, className } ) => {
	let hiddenText, name;

	if ( isError ) {
		name = 'error';
		/* translators: This is text to describe the current state. This will go
		before the track title, such as "Error: [The title of the track]". */
		hiddenText = __( 'Error:', 'jetpack' );
	} else if ( isPlaying ) {
		name = 'playing';
		/* translators: Text to describe the current state. This will go before the
		track title, such as "Playing: [The title of the track]". */
		hiddenText = __( 'Playing:', 'jetpack' );
	}

	const icon = trackIcons[ name ];

	if ( ! icon ) {
		// Return empty element - we need it for layout purposes.
		return <span className={ className } />;
	}

	return (
		<span className={ `${ className } ${ className }--${ name }` }>
			{ /* Intentional space left after hiddenText */ }
			<span className="jetpack-podcast-player--visually-hidden">{ `${ hiddenText } ` }</span>
			{ icon }
		</span>
	);
} );

export default TrackIcon;
