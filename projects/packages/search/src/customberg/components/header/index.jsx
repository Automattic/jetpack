/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from 'components/save-button';
import './styles.scss';

/**
 * Component for showing the Gutenberg-style header.
 *
 * @param {object} props - component properties.
 * @param {Function} props.enableSidebar - Enables the sidebar upon invocation.
 * @returns {Element} component instance
 */
function Header( { enableSidebar } ) {
	// translators: Product name 'Jetpack Search' should not be translated
	const title = __( 'Customize Jetpack Search', 'jetpack-search-pkg' );

	return (
		<div className="jp-search-configure-header">
			<div className="jp-search-configure-header__navigable-toolbar-wrapper">
				<h1 className="jp-search-configure-header__title">{ title }</h1>
			</div>
			<div className="jp-search-configure-header__actions">
				<SaveButton />
				<Button
					aria-label={ __( 'Show settings', 'jetpack-search-pkg' ) }
					className="jp-search-configure-header__show-settings-button"
					isSecondary
					onClick={ () => enableSidebar() }
				>
					<Icon icon={ cog } />
				</Button>
			</div>
		</div>
	);
}

export default Header;
