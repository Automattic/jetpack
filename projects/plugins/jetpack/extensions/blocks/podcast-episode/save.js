import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default function save( { attributes } ) {
	const { mediaUrl, title } = attributes;
	if ( ! mediaUrl ) {
		return null;
	}

	const blockProps = useBlockProps.save();
	return (
		<a
			{ ...blockProps }
			className={ clsx( blockProps.className, 'jetpack-podcast-episode__direct-link' ) }
			href={ mediaUrl }
		>
			{ title || mediaUrl }
		</a>
	);
}
