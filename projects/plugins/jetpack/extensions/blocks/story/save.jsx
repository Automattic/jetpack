import { useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

export default () => {
	const blockProps = useBlockProps.save();

	return <div { ...blockProps } className={ clsx( 'wp-story', blockProps.className ) }></div>;
};
