/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { BASE_CLASS_NAME, getParticipantLabelClass } from './utils';

/**
 * Convert a time code string into seconds.
 *
 * @param {string} timeCode - like `01:10:59`.
 * @returns {number} Number of seconds.
 */
function convertTimeCodeToSeconds( timeCode ) {
	const timeParts = timeCode.split( ':' );

	return timeParts
		.reverse()
		.reduce(
			( seconds, timePart, index ) => seconds + Math.pow( 60, index ) * parseInt( timePart ),
			0
		);
}

export default function save( { attributes } ) {
	const { content, participant, showTimestamp, timestamp } = attributes;

	return (
		<div>
			<div className={ `${ BASE_CLASS_NAME }__meta` }>
				<div className={ getParticipantLabelClass( BASE_CLASS_NAME, participant ) }>
					{ participant.label }
				</div>
				{ showTimestamp && (
					<div className={ `${ BASE_CLASS_NAME }__timestamp` }>
						<a
							className={ `${ BASE_CLASS_NAME }__timestamp_link` }
							href="#"
							data-timestamp={ convertTimeCodeToSeconds( timestamp ) }
						>
							{ timestamp }
						</a>
					</div>
				) }
			</div>
			<RichText.Content
				className={ `${ BASE_CLASS_NAME }__content` }
				tagName="p"
				value={ content }
			/>
		</div>
	);
}
