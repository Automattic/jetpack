import { useBlockProps } from '@wordpress/block-editor';
import attributes from './attributes';
import Slideshow from './slideshow';
import supports from './supports';

const save = ( { attributes: { align, autoplay, delay, effect, images } } ) => {
	const blockProps = useBlockProps.save();

	return (
		<div { ...blockProps }>
			<Slideshow
				align={ align }
				autoplay={ autoplay }
				delay={ delay }
				effect={ effect }
				images={ images }
			/>
		</div>
	);
};

export default {
	attributes,
	supports,
	save,
};
