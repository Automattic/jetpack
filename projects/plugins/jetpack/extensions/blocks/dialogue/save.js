/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { getParticipantLabelClass } from './utils';

export default function save( { attributes } ) {
	const { content, participant } = attributes;
	const baseClassName = 'wp-block-jetpack-dialogue';

	return (
		<div className={ baseClassName }>
			<div className={ `${ baseClassName }__meta` }>
				<div className={ getParticipantLabelClass( baseClassName, participant ) }>
					{ participant.label }
				</div>
				<div className={ `${ baseClassName }__timestamp` }></div>
			</div>
			<RichText.Content className={ `${ baseClassName }__content` } tagName="p" value={ content } />
		</div>
	);
}
