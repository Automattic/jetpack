import { useBlockProps } from '@wordpress/block-editor';
import Slideshow from './slideshow';

export default ( { attributes: { align, autoplay, delay, effect, images } } ) => {
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
