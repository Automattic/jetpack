import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, chevronLeft } from '@wordpress/icons';
import './style.scss';

/**
 * SidebarNavigationScreen component - a screen within the sidebar with optional back navigation.
 *
 * @param {object}   props          - Component props.
 * @param {boolean}  props.isRoot   - Whether this is the root screen (no back button).
 * @param {string}   props.title    - Screen title.
 * @param {Element}  props.children - Screen content (navigation items).
 * @param {Function} props.onBack   - Callback when back button is clicked.
 * @return {Element} The navigation screen component.
 */
export default function SidebarNavigationScreen( { isRoot = true, title, children, onBack } ) {
	return (
		<div className="jp-sidebar-navigation-screen">
			{ ! isRoot && (
				<div className="jp-sidebar-navigation-screen__header">
					<Button
						className="jp-sidebar-navigation-screen__back"
						onClick={ onBack }
						icon={ <Icon icon={ chevronLeft } size={ 24 } /> }
						label={ __( 'Back', 'jetpack' ) }
					/>
					{ title && <h2 className="jp-sidebar-navigation-screen__title">{ title }</h2> }
				</div>
			) }
			<div className="jp-sidebar-navigation-screen__content">{ children }</div>
		</div>
	);
}
