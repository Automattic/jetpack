/**
 * Editable playhead timecode for the timeline toolbar.
 *
 * Displays the live `formatTimecode` position while idle; typing starts a
 * draft that seeks on Enter (or blur) when it parses as a timecode, and
 * reverts on Escape. Mirrors the preview player's transport field so the two
 * read and behave identically.
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState } from 'react';
import { parseTimecode } from '../parse-timecode';
import { formatTimecode } from '../state/time-utils';
import type { ReactElement } from 'react';

type Props = {
	/** Live playhead position in master-timeline ms. */
	valueMs: number;
	/** Called with the parsed position in ms. */
	onSeek: ( ms: number ) => void;
};

/**
 * The timeline's editable timecode box.
 *
 * @param props         - Component props.
 * @param props.valueMs - Live playhead position in ms.
 * @param props.onSeek  - Called with the parsed position in ms.
 * @return The input element.
 */
export default function TimecodeBox( { valueMs, onSeek }: Props ): ReactElement {
	const [ draft, setDraft ] = useState< string | null >( null );
	// Enter/Escape blur the field after already handling the draft; this flag
	// stops the blur handler from committing a second time (or committing a
	// draft Escape just discarded — state updates haven't flushed yet).
	const skipBlurCommitRef = useRef( false );

	const commit = () => {
		if ( draft !== null ) {
			const parsed = parseTimecode( draft );
			if ( parsed !== null ) {
				onSeek( parsed );
			}
		}
		setDraft( null );
	};

	return (
		<input
			className="vp-chapters-timeline__timecode"
			type="text"
			aria-label={ __( 'Playhead time', 'jetpack-videopress-pkg' ) }
			value={ draft ?? formatTimecode( valueMs ) }
			onChange={ event => setDraft( event.target.value ) }
			onBlur={ () => {
				if ( skipBlurCommitRef.current ) {
					skipBlurCommitRef.current = false;
					return;
				}
				commit();
			} }
			onKeyDown={ event => {
				if ( event.key === 'Enter' ) {
					commit();
					skipBlurCommitRef.current = true;
					event.currentTarget.blur();
				} else if ( event.key === 'Escape' ) {
					// Consuming Escape must mark the event handled: modal hosts
					// (the chapter manager) close on any unhandled Escape, and
					// "cancel this timecode edit" must not double as "close the
					// modal" — same contract the caption manager's inner
					// controls follow.
					event.preventDefault();
					setDraft( null );
					skipBlurCommitRef.current = true;
					event.currentTarget.blur();
				}
			} }
		/>
	);
}
