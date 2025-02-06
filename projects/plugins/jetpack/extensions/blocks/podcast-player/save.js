import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { url } = attributes;
	if ( ! url || url === '' ) {
		return;
	}

	const blockProps = useBlockProps.save();
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
