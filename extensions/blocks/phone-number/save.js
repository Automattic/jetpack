/**
 * Internal dependencies
 */

export default function save( { attributes } ) {
	const linkUrl = `tel:${ attributes.phoneNumber }`;
	return (
		<div>
			<span>{ attributes.label }</span>
			<a href={ linkUrl }>{ attributes.phoneNumber }</a>
		</div>
	);
}
