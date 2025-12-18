import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { RenderLineGlyphProps } from '../../line-chart';

export const DefaultGlyph = < Datum extends object >( props: RenderLineGlyphProps< Datum > ) => {
	const { theme } = useContext( DataContext ) || {};
	const position = props.position || 'start';

	return (
		<circle
			cx={ props.x }
			cy={ props.y }
			r={ props.size }
			fill={ props.color }
			stroke={ theme?.backgroundColor }
			strokeWidth={ 1.5 }
			paintOrder="fill"
			data-testid={ `${ position }-glyph-${ props.index }` }
			{ ...props.glyphStyle }
		/>
	);
};
