/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getParticipantLabelClass } from './utils';

function convertTimeCodeToSeconds( timeCode ) {
	const timeParts = timeCode.split( ':' );

	return timeParts.reduce(
		( seconds, timePart, index ) => seconds + Math.pow( 60, index ) * parseInt( timePart ),
		0
	);
}

export default function save( { attributes } ) {
	const { content, participant, showTimestamp, timestamp } = attributes;
	const baseClassName = 'wp-block-jetpack-dialogue';

	return (
		<div className={ baseClassName }>
			<div className={ `${ baseClassName }__meta` }>
				<div className={ getParticipantLabelClass( baseClassName, participant ) }>
					{ participant.label }
				</div>
				{ showTimestamp && (
					<div className={ `${ baseClassName }__timestamp` }>
						<a
							className={ `${ baseClassName }__timestamp_link` }
							href="#"
							data-timestamp={ convertTimeCodeToSeconds( timestamp ) }
						>
							{ timestamp }
						</a>
					</div>
				) }
			</div>
			<RichText.Content className={ `${ baseClassName }__content` } tagName="p" value={ content } />
		</div>
	);
}
