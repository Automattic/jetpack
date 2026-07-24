import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import clsx from 'clsx';

const save = ( { attributes } ) => {
	const { isAlternating } = attributes;

	const className = clsx( 'wp-block-jetpack-timeline', {
		'is-alternating': isAlternating,
	} );

	const blockProps = useBlockProps.save( { className } );

	const dataProps =
		typeof isAlternating === 'boolean' ? { 'data-is-alternating': isAlternating } : null;

	return (
		<ul { ...blockProps } { ...dataProps }>
			<InnerBlocks.Content />
		</ul>
	);
};

export default save;
