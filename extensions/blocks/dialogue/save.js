/**
 * External dependencies
 */
import classNames from 'classnames';
import { InnerBlocks } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { speaker, speakerSlug, content, showTimeStamp, timeStamp } = attributes;

	const className = 'wp-block-jetpack-dialogue';

	const speakerClasses = classNames(
		`${ className }__speaker`,
		{
			[ `is-${ speakerSlug }-speaker` ]: !! speakerSlug,
			[ 'is-custom-speaker' ]: ! speakerSlug,
		}
	);

	return (
		<div>
			<div class={ `${ className }__meta` }>
				<div class={ `${ className }__speaker-container` }>
					<div className={ speakerClasses }>{ speaker }</div>
					{ showTimeStamp && (
						<div className={ `${ className }__timestamp` }>
							{ timeStamp }
						</div>
					) }
				</div>
			</div>

			<InnerBlocks.Content />
		</div>
	);
}