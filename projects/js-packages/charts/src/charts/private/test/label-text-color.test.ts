import { MIN_LABEL_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import {
	luminanceContrastRatio,
	mixRgb,
	rgbLuminance,
} from '../../../providers/chart-context/private/perceptual-color';
import {
	pickLabelTextColor,
	pickLabelTextColorForFill,
	resolveLabelRoles,
} from '../label-text-color';
import type { Rgb } from '../../../providers/chart-context/private/perceptual-color';
import type { LabelRoles, LabelTextColor, ResolvedRole } from '../label-text-color';

const rgbOf = ( hex: string ): Rgb =>
	[ 1, 3, 5 ].map( start => parseInt( hex.slice( start, start + 2 ), 16 ) ) as unknown as Rgb;

const color = ( hex: string, alpha = 1 ): ResolvedRole => ( {
	kind: 'color',
	rgb: rgbOf( hex ),
	alpha,
} );

const unreadable = ( raw: string | null ): ResolvedRole => ( { kind: 'unreadable', raw } );

const DEFAULT_ROLES: LabelRoles = { label: color( '#1e1e1e' ), labelInverse: color( '#f0f0f0' ) };

const WHITE = rgbOf( '#ffffff' );
const MID_BLUE = rgbOf( '#3858e9' );

describe( 'resolveLabelRoles', () => {
	const resolverFor =
		( label: string | null, labelInverse: string | null ) =>
		( value: string ): string | null =>
			value.includes( '--a8c-charts-color-label-inverse' ) ? labelInverse : label;

	it( 'resolves opaque roles in any syntax d3 reads', () => {
		expect( resolveLabelRoles( resolverFor( '#1E1E1E', 'rgb(240, 240, 240)' ) ) ).toEqual(
			DEFAULT_ROLES
		);
	} );

	it( "keeps a role's alpha", () => {
		expect( resolveLabelRoles( resolverFor( 'rgba(30, 30, 30, 0.87)', '#f0f0f0' ) ).label ).toEqual(
			color( '#1e1e1e', 0.87 )
		);
	} );

	it( 'reads transparent as a role with no alpha', () => {
		expect( resolveLabelRoles( resolverFor( 'transparent', '#f0f0f0' ) ).label ).toEqual(
			color( '#000000', 0 )
		);
	} );

	it( 'keeps the raw value of a role it cannot read', () => {
		expect( resolveLabelRoles( resolverFor( null, 'oklch(98% 0 0)' ) ) ).toEqual( {
			label: unreadable( null ),
			labelInverse: unreadable( 'oklch(98% 0 0)' ),
		} );
	} );
} );

describe( 'pickLabelTextColorForFill', () => {
	it( 'keeps the default role before the roles are read', () => {
		expect( pickLabelTextColorForFill( MID_BLUE, null, 'label' ) ).toBe( 'label' );
		expect( pickLabelTextColorForFill( MID_BLUE, null, 'label-inverse' ) ).toBe( 'label-inverse' );
	} );

	it( 'picks the role that contrasts more when it reaches AA', () => {
		expect( pickLabelTextColorForFill( WHITE, DEFAULT_ROLES, 'label-inverse' ) ).toBe( 'label' );
		expect( pickLabelTextColorForFill( MID_BLUE, DEFAULT_ROLES, 'label' ) ).toBe( 'label-inverse' );
	} );

	it( 'falls back to black or white when neither role reaches AA', () => {
		expect( pickLabelTextColorForFill( rgbOf( '#516dec' ), DEFAULT_ROLES, 'label' ) ).toBe(
			'black'
		);
		expect( pickLabelTextColorForFill( rgbOf( '#4663ea' ), DEFAULT_ROLES, 'label' ) ).toBe(
			'white'
		);
	} );

	it( 'measures a translucent role as it paints over the fill', () => {
		const translucentLabel: LabelRoles = {
			label: color( '#1e1e1e', 0.87 ),
			labelInverse: color( '#f0f0f0' ),
		};

		expect( pickLabelTextColorForFill( WHITE, translucentLabel, 'label-inverse' ) ).toBe( 'label' );
		expect( pickLabelTextColorForFill( MID_BLUE, translucentLabel, 'label' ) ).toBe(
			'label-inverse'
		);
	} );

	it( 'never picks a fully transparent role', () => {
		const clearLabel: LabelRoles = {
			label: color( '#000000', 0 ),
			labelInverse: color( '#f0f0f0' ),
		};

		expect( pickLabelTextColorForFill( WHITE, clearLabel, 'label' ) ).toBe( 'black' );
	} );

	it( 'treats two different translucent roles as two colors', () => {
		const translucent: LabelRoles = {
			label: color( '#000000', 0.87 ),
			labelInverse: color( '#ffffff', 0.9 ),
		};

		expect( pickLabelTextColorForFill( MID_BLUE, translucent, 'label' ) ).toBe( 'label-inverse' );
	} );

	it( 'uses a readable role when the other cannot be read, else black or white', () => {
		const unreadableInverse: LabelRoles = {
			label: color( '#1e1e1e' ),
			labelInverse: unreadable( 'rgb(255 255 255)' ),
		};

		expect( pickLabelTextColorForFill( WHITE, unreadableInverse, 'label-inverse' ) ).toBe(
			'label'
		);
		expect( pickLabelTextColorForFill( MID_BLUE, unreadableInverse, 'label' ) ).toBe( 'white' );
	} );

	it.each( [
		[ 'readable', color( '#767676' ) ],
		[ 'unreadable', unreadable( 'oklch(55% 0 0)' ) ],
	] )( 'never falls back when both roles are the same %s color', ( _name, role ) => {
		const pinned: LabelRoles = { label: role, labelInverse: { ...role } };

		expect( pickLabelTextColorForFill( rgbOf( '#516dec' ), pinned, 'label' ) ).toBe( 'label' );
		expect( pickLabelTextColorForFill( rgbOf( '#516dec' ), pinned, 'label-inverse' ) ).toBe(
			'label-inverse'
		);
	} );

	describe.each( [
		[ 'white', '#ffffff' ],
		[ 'dark', '#1e1e1e' ],
	] )( 'across a heatmap scale on a %s background', ( _name, background ) => {
		const painted: Record< LabelTextColor, number > = {
			label: rgbLuminance( rgbOf( '#1e1e1e' ) ),
			'label-inverse': rgbLuminance( rgbOf( '#f0f0f0' ) ),
			black: 0,
			white: 1,
		};
		// The Storybook custom accent, then the wp-admin scheme colors.
		const primaries = [
			'#4a19ab',
			'#2271b1',
			'#007cba',
			'#3858e9',
			'#437aa8',
			'#916745',
			'#646c3e',
			'#cf4339',
			'#567958',
			'#ad631e',
		];

		it.each( primaries )( 'reaches AA on every intensity of %s', primary => {
			for ( let step = 0; step <= 200; step++ ) {
				const fill = mixRgb( primary, background, 0.15 + 0.85 * ( step / 200 ) );
				const choice = pickLabelTextColorForFill( fill, DEFAULT_ROLES, 'label' );

				expect(
					luminanceContrastRatio( rgbLuminance( fill ), painted[ choice ] )
				).toBeGreaterThanOrEqual( MIN_LABEL_CONTRAST );
			}
		} );
	} );
} );

describe( 'pickLabelTextColor', () => {
	it( 'reads the fill from any color syntax', () => {
		expect( pickLabelTextColor( 'rgb(255, 255, 255)', DEFAULT_ROLES, 'label-inverse' ) ).toBe(
			'label'
		);
	} );

	it( 'keeps the default role for a fill it cannot read', () => {
		expect( pickLabelTextColor( 'var(--not-set)', DEFAULT_ROLES, 'label-inverse' ) ).toBe(
			'label-inverse'
		);
	} );
} );
