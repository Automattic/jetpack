/**
 * Convert hex color to rgba with specified opacity
 * This is genuinely reusable across chart components
 * @param hex   - The hex color string (e.g., '#ff0000')
 * @param alpha - The opacity value between 0 and 1
 * @return The rgba color string (e.g., 'rgba(255, 0, 0, 0.5)')
 */
export const hexToRgba = ( hex: string, alpha: number ): string => {
	const r = parseInt( hex.slice( 1, 3 ), 16 );
	const g = parseInt( hex.slice( 3, 5 ), 16 );
	const b = parseInt( hex.slice( 5, 7 ), 16 );
	return `rgba(${ r }, ${ g }, ${ b }, ${ alpha })`;
};
