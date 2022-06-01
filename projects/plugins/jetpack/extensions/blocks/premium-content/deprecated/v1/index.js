import save from '../../save';

export default {
	isEligible: ( attributes, innerBlocks ) => {
		if ( 'premium-content/logged-out-view' === innerBlocks?.[ 0 ]?.name ) {
			return true;
		}
	},
	migrate: ( attributes, innerBlocks ) => [ attributes, [ innerBlocks[ 1 ], innerBlocks[ 0 ] ] ],
	save,
};
