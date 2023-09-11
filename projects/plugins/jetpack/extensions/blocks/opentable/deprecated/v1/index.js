import { defaultAttributes } from '../../attributes';

export default {
	attributes: defaultAttributes,
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
