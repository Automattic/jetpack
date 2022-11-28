import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';

export default {
	attributes: {
		planId: {
			type: 'integer',
		},
		align: {
			type: 'string',
		},
		url: {
			type: 'string',
			default: '#',
		},
		uniqueId: {
			type: 'string',
			default: 'id',
		},
		width: {
			type: 'string',
		},
	},
	supports: {
		html: false,
		__experimentalExposeControlsToChildren: true,
	},
	save: ( { attributes: { width } } ) => {
		const style = { width };
		if ( width?.includes( '%' ) ) {
			style.width = `calc( ${ width } - var( --jetpack-payment-buttons-gap, 0 ) * ${
				( 100 - width.replace( '%', '' ) ) / 100
			} )`;
		}
		const innerBlocksProps = useInnerBlocksProps.save( {
			...useBlockProps.save(),
			style,
		} );
		return <div { ...innerBlocksProps } />;
	},
};
