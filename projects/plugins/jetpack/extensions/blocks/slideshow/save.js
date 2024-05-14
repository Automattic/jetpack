import { useBlockProps } from '@wordpress/block-editor';
import Slideshow from './slideshow';

export default ( { attributes: { align, autoplay, className, delay, effect, images } } ) => {
	const blockProps = useBlockProps.save( {
		className: className,
	} );

	return (
		<Slideshow
			align={ align }
			autoplay={ autoplay }
			className={ blockProps.className }
			delay={ delay }
			effect={ effect }
			images={ images }
		/>
	);
};
