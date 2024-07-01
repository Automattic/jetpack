import Slideshow from './slideshow';

export { default as attributes } from './attributes';
export { default as supports } from './supports';

export const save = ( { attributes: { align, autoplay, delay, effect, images }, className } ) => (
	<Slideshow
		align={ align }
		autoplay={ autoplay }
		className={ className }
		delay={ delay }
		effect={ effect }
		images={ images }
	/>
);
