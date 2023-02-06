import { pinType } from '../../utils';

export default {
	attributes: {
		url: {
			type: 'string',
		},
	},
	supports: {
		align: false,
		html: false,
	},
	save: ( { attributes, className } ) => {
		const { url } = attributes;

		const type = pinType( url );

		if ( ! type ) {
			return null;
		}

		return (
			<div className={ className }>
				<a data-pin-do={ pinType( url ) } href={ url } />
			</div>
		);
	},
};
