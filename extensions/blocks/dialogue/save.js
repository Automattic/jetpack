/**
 * External dependencies
 */
import classNames from 'classnames';
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const {
		speaker,
		color,
		backgroundColor,
		timeStamp,
		className,
	} = attributes;

	const baseClassName = 'wp-block-jetpack-dialogue';
	const speakerClasses = classNames( `${ baseClassName }__speaker` );
	const speakerStyles = { color, backgroundColor };

	return (
		<div className={ `${ className } ${ baseClassName }` }>
			<div class={ `${ baseClassName }__meta` }>
				<div className={ speakerClasses } style={ speakerStyles }>{ speaker }</div>
				<div className={ `${ baseClassName }__timestamp` }>
					{ timeStamp }
				</div>
			</div>

			<InnerBlocks.Content />
		</div>
	);
}