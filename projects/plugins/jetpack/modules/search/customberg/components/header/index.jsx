/**
 * WordPress dependencies
 */
import { PinnedItems } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { COMPLEMENTARY_AREA_SCOPE } from '../../lib/constants';
import SaveButton from './save-button';
import './styles.scss';

/**
 * Component for showing the Gutenberg-style header.
 *
 * @returns {Element} component instance
 */
function Header() {
	// translators: Product name 'Jetpack Search' should not be translated
	const title = __( 'Customize Jetpack Search', 'jetpack' );

	return (
		<div className="jp-search-configure-header">
			<div className="jp-search-configure-header__navigable-toolbar-wrapper">
				<h1 className="jp-search-configure-header__title">{ title }</h1>
			</div>
			<div className="jp-search-configure-header__actions">
				<SaveButton />
				<PinnedItems.Slot scope={ COMPLEMENTARY_AREA_SCOPE } />
			</div>
		</div>
	);
}

export default Header;
