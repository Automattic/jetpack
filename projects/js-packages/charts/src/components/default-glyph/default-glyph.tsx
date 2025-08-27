import { DataContext } from '@visx/xychart';
import { useContext } from 'react';
import type { RenderLineStartGlyphProps } from '../line-chart/line-chart';

export const DefaultGlyph = < Datum extends object >(
	props: RenderLineStartGlyphProps< Datum >
) => {
	const { theme } = useContext( DataContext ) || {};

	return (
		<circle
			cx={ props.x }
			cy={ props.y }
			r={ props.size }
			fill={ props.color }
			stroke={ theme?.backgroundColor }
			strokeWidth={ 1.5 }
			paintOrder="fill"
			data-testid={ `start-glyph-${ props.index }` }
			{ ...props.glyphStyle }
		/>
	);
};
