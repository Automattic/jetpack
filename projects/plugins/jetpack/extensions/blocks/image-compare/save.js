import { RichText } from '@wordpress/block-editor';

const save = ( { attributes, className } ) => {
	const { imageBefore, imageAfter, caption, orientation } = attributes;

	return (
		<figure className={ className }>
			<div className="juxtapose" data-mode={ orientation || 'horizontal' }>
				<img
					id={ imageBefore.id }
					src={ imageBefore.url }
					alt={ imageBefore.alt }
					width={ imageBefore.width }
					height={ imageBefore.height }
					className="image-compare__image-before"
				/>
				<img
					id={ imageAfter.id }
					src={ imageAfter.url }
					alt={ imageAfter.alt }
					width={ imageAfter.width }
					height={ imageAfter.height }
					className="image-compare__image-after"
				/>
			</div>
			{ ! RichText.isEmpty( caption ) && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
};

export default save;
