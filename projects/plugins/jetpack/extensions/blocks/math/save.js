/**
 * React hook that is used to mark the block wrapper element.
 * It provides all the necessary props like the class name.
 */
import { useBlockProps } from '@wordpress/block-editor';
import { renderMath } from './utils';

/**
 * The save function outputs the static markup for the rendered formula,
 * with a data-latex attribute for possible front-end enhancement.
 * @param {object} props            - Block props.
 * @param {object} props.attributes - Block attributes.
 * @return {object} The static markup for the rendered formula.
 */
export default function save( { attributes } ) {
	const { source = '' } = attributes;
	const blockProps = useBlockProps.save();
	const { style, ...props } = blockProps;
	const borderRadius = style?.borderRadius;
	return (
		// Copy borderRadius to the parent to avoid overflowing.
		<div { ...props } style={ { borderRadius } }>
			<div
				className="jetpack-math-rendered"
				style={ style }
				// WP KSES will scrutinize this HTML.
				// eslint-disable-next-line react/no-danger
				dangerouslySetInnerHTML={ {
					__html: renderMath( source ),
				} }
			/>
		</div>
	);
}
