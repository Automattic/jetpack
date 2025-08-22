/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 */
import { useBlockProps } from '@wordpress/block-editor';

/**
 * The save function outputs the static markup for the rendered formula,
 * with a data-latex attribute for possible front-end enhancement.
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {object} The static markup for the rendered formula.
 */
export default function save( { attributes } ) {
	const { latex = '' } = attributes;
	return (
		<div { ...useBlockProps.save( { className: 'jetpack-latex' } ) } data-latex={ latex }>
			{ /* The actual rendering will take place in view.js using KaTeX */ }
			<span className="jetpack-latex-render" />
		</div>
	);
}
