export default function Save( { attributes } ) {
	const { url } = attributes;
	return <a href={ url }>{ url }</a>;
}
