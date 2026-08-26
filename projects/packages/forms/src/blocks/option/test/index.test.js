import { describe, expect, it } from '@jest/globals';
import optionBlock from '../index.jsx';

/**
 * The editor builds a new sibling option — on Enter-to-split, and on "Insert
 * before/after" — by copying every attribute of the current option EXCEPT the
 * ones declared with `role: 'content'`. An attribute missing that annotation is
 * treated as configuration and is inherited, so dropping a role here does not
 * fail loudly: it silently ships an option that arrives pre-filled with its
 * neighbour's answer.
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
