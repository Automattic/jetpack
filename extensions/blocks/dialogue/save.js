/**
 * External dependencies
 */
import classNames from 'classnames';

export default function save( { attributes } ) {
	const { label, labelSlug, content, showTimeStamp, timeStamp } = attributes;

	const className = 'wp-block-jetpack-dialogue';

	const labelClasses = classNames(
		`${ className }__label`,
		{
			[ `is-${ labelSlug }-label` ]: !! labelSlug,
			[ 'is-custom-label' ]: ! labelSlug,
		}
	);

	return (
		<div>
			<div class={ `${ className }__meta` }>
				<div class={ `${ className }__label-container` }>
					<div className={ labelClasses }>{ label }</div>
					{ showTimeStamp && (
						<div className={ `${ className }__timestamp` }>
							{ timeStamp }
						</div>
					) }
				</div>
			</div>

			<p>{ content }</p>
		</div>
	);
}