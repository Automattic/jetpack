import metadata from '../../block.json';

export default {
	attributes: metadata.attributes,
	supports: {
		align: true,
		html: false,
	},
	save: ( { attributes: { rid } } ) => (
		<>
			{ rid.map( restaurantId => (
				<a href={ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }>
					{ `https://www.opentable.com/restref/client/?rid=${ restaurantId }` }
				</a>
			) ) }
		</>
	),
};
