/**
 * External dependencies
 */
import classNames from 'classnames';
/**
 * WordPress dependencies
 */

export default function save( {
	attributes,
} ) {
	const { label, slug, content, className } = attributes;

	const changelogClass = classNames(
		'wp-block-changelog',
		className
	);

	const labelClasses = classNames(
		`${ className }__label`,
		{
			[ `is-${ slug }-label` ]: !! slug,
			[ 'is-custom-label' ]: ! slug,
		}
	);

	return (
		<div className={ changelogClass }>
			<span className={ labelClasses }>{ label }</span>
			<p>{ content }</p>
		</div>
	);
}
