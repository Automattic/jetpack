import { useBlockProps } from '@wordpress/block-editor';
import classNames from 'classnames';

export default function save( { attributes } ) {
	const blockProps = useBlockProps.save();

	const { url } = attributes;
	if ( ! url || url === '' ) {
		return;
	}
	return (
		<a
			{ ...blockProps }
			className={ classNames( blockProps.className, 'jetpack-podcast-player__direct-link' ) }
			href={ url }
		>
			{ url }
		</a>
	);
}
