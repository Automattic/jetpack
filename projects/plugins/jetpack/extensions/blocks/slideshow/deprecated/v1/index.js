import attributes from './attributes';
import Slideshow from './slideshow';
import supports from './supports';

const save = ( { attributes: { align, autoplay, delay, effect, images }, className } ) => (
	<Slideshow
		align={ align }
		autoplay={ autoplay }
		className={ className }
		delay={ delay }
		effect={ effect }
		images={ images }
	/>
);

export default {
	attributes,
	supports,
	save,
};
