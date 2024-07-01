import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();

	const { url } = attributes;
	if ( ! url || url === '' ) {
		return;
	}
	return (
		<a
			{ ...blockProps }
			className={ clsx( blockProps.className, 'jetpack-podcast-player__direct-link' ) }
			href={ url }
		>
			{ url }
		</a>
	);
}
