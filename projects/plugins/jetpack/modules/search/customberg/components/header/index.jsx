/**
 * WordPress dependencies
 */
import { Button, VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useViewportMatch } from '@wordpress/compose';
import { Icon, cog } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import SaveButton from './save-button';
import './styles.scss';

/**
 * Component for showing the Gutenberg-style header.
 *
 * @param {object} props - component properties.
 * @param {Function} props.enableSidebar - Enables the sidebar upon invocation.
 * @returns {Element} component instance
 */
function Header( { enableSidebar } ) {
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
				<Button
					aria-label={ __( 'Show settings', 'jetpack' ) }
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
