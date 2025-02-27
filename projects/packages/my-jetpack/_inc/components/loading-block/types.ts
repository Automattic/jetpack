type DimensionUnit = 'px' | '%' | 'vw' | 'vh' | 'dvw' | 'dvh' | 'rem' | 'em';

type CSSLength = `${ number }${ DimensionUnit }` | 'auto';

export interface LoadingBlockProps {
	height: CSSLength;
	width: CSSLength;
	spaceBelow?: boolean;
}
