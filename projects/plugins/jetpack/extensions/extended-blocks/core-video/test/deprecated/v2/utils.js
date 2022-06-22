import { filterVideoPressClasses } from '../../../deprecated/v2/utils';

const customClasses = 'example wp-embed-aspect-x-y';
const videoPressClasses = 'wp-block-embed is-type-video is-provider-videopress';
const aspectRatioClasses =
	'wp-embed-aspect-21-9 wp-embed-aspect-18-9 wp-embed-aspect-16-9 wp-embed-aspect-4-3';

describe( 'filterVideoPressClasses', () => {
	test( 'Undefined class strings', () => {
		expect( filterVideoPressClasses( undefined, undefined ) ).toEqual( {
			className: '',
			videoPressClassNames: '',
		} );
	} );

	test( 'Empty class strings', () => {
		expect( filterVideoPressClasses( '', '' ) ).toEqual( {
			className: '',
			videoPressClassNames: '',
		} );
	} );

	test( 'No custom classes and undefined videoPressClassNames', () => {
		expect( filterVideoPressClasses( videoPressClasses, undefined ) ).toEqual( {
			className: '',
			videoPressClassNames: videoPressClasses,
		} );
	} );

	test( 'With aspect ratio classes', () => {
		const classes = `${ videoPressClasses } ${ aspectRatioClasses }`;
		expect( filterVideoPressClasses( classes, undefined ) ).toEqual( {
			className: '',
			videoPressClassNames: classes,
		} );
	} );

	test( 'Retains custom classes', () => {
		const classes = `${ customClasses } ${ videoPressClasses }`;
		expect( filterVideoPressClasses( classes, undefined ) ).toEqual( {
			className: customClasses,
			videoPressClassNames: videoPressClasses,
		} );
	} );

	test( 'Dedupes class lists', () => {
		const classes = `${ customClasses } ${ customClasses } ${ videoPressClasses } ${ videoPressClasses }`;
		expect( filterVideoPressClasses( classes, videoPressClasses ) ).toEqual( {
			className: customClasses,
			videoPressClassNames: videoPressClasses,
		} );
	} );
} );
