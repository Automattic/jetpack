export const getBlockStyles = ( { width } ) => {
	const style = { width };
	// Adjust width to consider the gap space defined by the Payment buttons container.
	if ( width?.includes( '%' ) ) {
		style.width = `calc( ${ width } - var( --jetpack-payment-buttons-gap, 0 ) * ${
			( 100 - width.replace( '%', '' ) ) / 100
		} )`;
	}
	return style;
};
