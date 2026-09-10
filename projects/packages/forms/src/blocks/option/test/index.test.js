import { describe, expect, it } from '@jest/globals';
import optionBlock from '../index.jsx';

/**
 * Dropping a role here fails silently — the new sibling option just arrives
 * pre-filled from its neighbour.
 *
 * @see https://github.com/WordPress/gutenberg/blob/trunk/packages/block-editor/src/store/actions.js `getSiblingBlockAttributes`
 */
describe( 'jetpack/option attribute roles', () => {
	const { attributes } = optionBlock.settings;

	it.each( [ 'label', 'isOther', 'otherPlaceholder' ] )(
		'marks `%s` as content so a new sibling option does not inherit it',
		name => {
			expect( attributes[ name ].role ).toBe( 'content' );
		}
	);

	it.each( [ 'placeholder', 'hideInput', 'isStandalone' ] )(
		'leaves `%s` unmarked so a new sibling option does inherit it',
		name => {
			expect( attributes[ name ].role ).toBeUndefined();
		}
	);
} );
