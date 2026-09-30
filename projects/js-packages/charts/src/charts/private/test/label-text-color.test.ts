import { MIN_LABEL_CONTRAST } from '../../../providers/chart-context/private/palette-generator';
import {
	luminanceContrastRatio,
	mixedLuminance,
} from '../../../providers/chart-context/private/perceptual-color';
import { relativeLuminance } from '../../../utils/color-utils';
import {
	pickLabelTextColor,
	pickLabelTextColorForLuminance,
	resolveLabelRoles,
} from '../label-text-color';
import type { LabelRoles, LabelTextColor } from '../label-text-color';

const DEFAULT_ROLES: LabelRoles = { label: '#1e1e1e', labelInverse: '#f0f0f0' };

const paintedLuminance = ( choice: LabelTextColor, roles: LabelRoles ): number => {
	if ( choice === 'black' ) {
		return 0;
	}
	if ( choice === 'white' ) {
		return 1;
	}
	return relativeLuminance( ( choice === 'label' ? roles.label : roles.labelInverse ) as string );
};

describe( 'resolveLabelRoles', () => {
	const resolverFor =
		( label: string | null, labelInverse: string | null ) =>
		( value: string ): string | null =>
			value.includes( '--a8c-charts-color-label-inverse' ) ? labelInverse : label;

	it( 'resolves opaque roles to lowercase hex', () => {
		expect( resolveLabelRoles( resolverFor( '#1E1E1E', 'rgb(240, 240, 240)' ) ) ).toEqual( {
			label: '#1e1e1e',
			labelInverse: '#f0f0f0',
		} );
	} );

	it( 'marks a role with alpha as see-through', () => {
		expect( resolveLabelRoles( resolverFor( 'rgba(0, 0, 0, 0.5)', '#f0f0f0' ) ).label ).toBe(
			'see-through'
		);
	} );

	it( 'returns null for a role it cannot read', () => {
		expect( resolveLabelRoles( resolverFor( null, 'rgb(0 0 0 / 50%)' ) ) ).toEqual( {
			label: null,
			labelInverse: null,
		} );
	} );
} );

describe( 'pickLabelTextColorForLuminance', () => {
	it( 'keeps the default role before the roles are read', () => {
		expect( pickLabelTextColorForLuminance( 0.2, null, 'label' ) ).toBe( 'label' );
		expect( pickLabelTextColorForLuminance( 0.2, null, 'label-inverse' ) ).toBe( 'label-inverse' );
	} );

	it( 'keeps the default role when either role is unreadable', () => {
		expect(
			pickLabelTextColorForLuminance( 0.2, { label: null, labelInverse: '#f0f0f0' }, 'label' )
		).toBe( 'label' );
	} );

	it( 'uses the only visible role when the other is see-through', () => {
		const clearLabel: LabelRoles = { label: 'see-through', labelInverse: '#f0f0f0' };
		const clearInverse: LabelRoles = { label: '#1e1e1e', labelInverse: 'see-through' };

		expect( pickLabelTextColorForLuminance( 0.9, clearLabel, 'label' ) ).toBe( 'label-inverse' );
		expect( pickLabelTextColorForLuminance( 0.01, clearInverse, 'label-inverse' ) ).toBe( 'label' );
	} );

	it( 'picks the role that contrasts more when it reaches AA', () => {
		expect( pickLabelTextColorForLuminance( 0.9, DEFAULT_ROLES, 'label-inverse' ) ).toBe( 'label' );
		expect( pickLabelTextColorForLuminance( 0.02, DEFAULT_ROLES, 'label' ) ).toBe(
			'label-inverse'
		);
	} );

	it( 'falls back to black or white when neither role reaches AA', () => {
		expect( pickLabelTextColorForLuminance( 0.2, DEFAULT_ROLES, 'label' ) ).toBe( 'black' );
		expect( pickLabelTextColorForLuminance( 0.16, DEFAULT_ROLES, 'label' ) ).toBe( 'white' );
	} );

	it( 'never falls back when both roles are the same color', () => {
		const pinned: LabelRoles = { label: '#767676', labelInverse: '#767676' };

		expect( pickLabelTextColorForLuminance( 0.2, pinned, 'label' ) ).toBe( 'label' );
		expect( pickLabelTextColorForLuminance( 0.2, pinned, 'label-inverse' ) ).toBe(
			'label-inverse'
		);
	} );

	describe.each( [
		[ 'white', '#ffffff' ],
		[ 'dark', '#1e1e1e' ],
	] )( 'across a heatmap scale on a %s background', ( _name, background ) => {
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
				const fill = mixedLuminance( primary, background, 0.15 + 0.85 * ( step / 200 ) );
				const choice = pickLabelTextColorForLuminance( fill, DEFAULT_ROLES, 'label' );

				expect(
					luminanceContrastRatio( fill, paintedLuminance( choice, DEFAULT_ROLES ) )
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
