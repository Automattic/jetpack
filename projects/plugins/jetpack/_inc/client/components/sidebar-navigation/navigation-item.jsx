import { Icon, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback } from 'react';
import './style.scss';

/**
 * SidebarNavigationItem component - a single navigation link or drilldown trigger.
 *
 * @param {object}   props             - Component props.
 * @param {string}   props.id          - Unique identifier.
 * @param {Element}  props.icon        - Icon to display.
 * @param {string}   props.label       - Text label.
 * @param {string}   props.to          - Hash route to navigate to.
 * @param {boolean}  props.isDrilldown - Whether this triggers a drilldown.
 * @param {Function} props.onClick     - Click handler.
 * @param {boolean}  props.isActive    - Whether this item is currently active.
 * @param {string}   props.className   - Additional CSS classes.
 * @return {Element} The navigation item component.
 */
export default function SidebarNavigationItem( {
	id,
	icon,
	label,
	to,
	isDrilldown = false,
	onClick,
	isActive = false,
	className,
} ) {
	const handleClick = useCallback(
		e => {
			if ( isDrilldown && onClick ) {
				e.preventDefault();
				onClick( id );
			} else if ( to ) {
				window.location.hash = to;
			}
		},
		[ id, isDrilldown, onClick, to ]
	);

	return (
		<button
			type="button"
			className={ clsx( 'jp-sidebar-navigation-item', className, {
				'is-active': isActive,
				'is-drilldown': isDrilldown,
			} ) }
			onClick={ handleClick }
		>
			<span className="jp-sidebar-navigation-item__content">
				{ icon && (
					<span className="jp-sidebar-navigation-item__icon">
						<Icon icon={ icon } size={ 24 } />
					</span>
				) }
				<span className="jp-sidebar-navigation-item__label">{ label }</span>
				{ isDrilldown && (
					<span className="jp-sidebar-navigation-item__chevron">
						<Icon icon={ chevronRight } size={ 24 } />
					</span>
				) }
			</span>
		</button>
	);
}
