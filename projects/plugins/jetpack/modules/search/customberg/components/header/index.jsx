/**
 * WordPress dependencies
 */
import { VisuallyHidden } from '@wordpress/components';
import { PinnedItems } from '@wordpress/interface';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';

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
	const isMediumViewport = useViewportMatch( 'medium' );

	return (
		<div className="jp-search-configure-header">
			<div className="jp-search-configure-header__navigable-toolbar-wrapper">
				{ isMediumViewport ? (
					<h1 className="jp-search-configure-header__title">
						{ __( 'Jetpack Search', 'jetpack' ) }
					</h1>
				) : (
					<VisuallyHidden as="h1" className="jp-search-configure-header__title">
						{ __( 'Jetpack Search', 'jetpack' ) }
					</VisuallyHidden>
				) }
			</div>
			<div className="jp-search-configure-header__actions">
				<SaveButton />
				<PinnedItems.Slot scope={ COMPLEMENTARY_AREA_SCOPE } />
			</div>
		</div>
	);
}

export default Header;
