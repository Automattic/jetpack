/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 */
import { useBlockProps } from '@wordpress/block-editor';
import type { BlockSaveProps } from '@wordpress/blocks';

interface BlockAttributes {
	latex: string;
	editing: boolean;
}

/**
 * The save function outputs the static markup for the rendered formula,
 * with a data-latex attribute for possible front-end enhancement.
 * @param root0
 * @param root0.attributes
 */
export default function save( { attributes }: BlockSaveProps< BlockAttributes > ) {
	const { latex = '' } = attributes;
	return (
		<div { ...useBlockProps.save( { className: 'jetpack-latex-formula' } ) } data-latex={ latex }>
			{ /* The actual rendering will take place in view.js using KaTeX */ }
			<span className="jetpack-latex-formula-render" />
		</div>
	);
}
