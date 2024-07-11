import { InnerBlocks } from '@wordpress/block-editor';
import clsx from 'clsx';

const save = ( { attributes } ) => {
	const classes = clsx( {
		'is-left': attributes.alignment === 'left',
		'is-right': attributes.alignment === 'right',
	} );

	const style = {
		backgroundColor: attributes.background,
	};

	const bubbleStyle = {
		borderColor: attributes.background,
	};

	return (
		<li style={ style } className={ classes }>
			<div className="timeline-item">
				<div className="timeline-item__bubble" style={ bubbleStyle } />
				<div className="timeline-item__dot" style={ style } />
				<InnerBlocks.Content />
			</div>
		</li>
	);
};

export default save;
