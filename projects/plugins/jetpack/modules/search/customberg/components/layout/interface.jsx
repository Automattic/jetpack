/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import AppWrapper from '../app-wrapper';
import Header from '../header';
import Sidebar from '../sidebar';
import './styles.scss';

/**
 * Wraps the InterfaceSkeleton component with necessary parameters.
 *
 * @param {object} props - component properties.
 * @returns {Element} component instance
 */
export default function Interface( props ) {
	const { enabledSidebarName, enableSidebar, disableSidebar } = props;

	return (
		<div className="interface-interface-skeleton">
			<div className="interface-interface-skeleton__editor">
				<div
					/* translators: accessibility text for the widgets screen top bar landmark region. */
					aria-label={ __( 'Jetpack Search customization top bar', 'jetpack' ) }
					className="interface-interface-skeleton__header"
					role="region"
					tabIndex="-1"
				>
					<Header enableSidebar={ enableSidebar } />
				</div>
				<div className="interface-interface-skeleton__body">
					<div
						/* translators: accessibility text for the widgets screen content landmark region. */
						aria-label={ __( 'Jetpack Search customization preview', 'jetpack' ) }
						className="interface-interface-skeleton__content"
						role="region"
						tabIndex="-1"
					>
						<AppWrapper />
					</div>
					{ /* Ensure sidebar is enabled before rendering. */ }
					{ !! enabledSidebarName && (
						<div
							/* translators: accessibility text for the widgets screen settings landmark region. */
							aria-label={ __( 'Jetpack Search customization settings', 'jetpack' ) }
							className="interface-interface-skeleton__sidebar"
							role="region"
							tabIndex="-1"
						>
							<Sidebar
								disableSidebar={ disableSidebar }
								enabledSidebarName={ enabledSidebarName }
								enableSidebar={ enableSidebar }
							/>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}
