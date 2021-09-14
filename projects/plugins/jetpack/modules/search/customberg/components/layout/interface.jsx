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
 * @returns {Element} component instance
 */
export default function Interface( props ) {
	const { enabledSidebarName, enableSidebar, disableSidebar } = props;
	const isSidebarEnabled = !! enabledSidebarName;

	return (
		<div className="interface-interface-skeleton">
			<div className="interface-interface-skeleton__editor">
				<div
					className="interface-interface-skeleton__header"
					role="region"
					/* translators: accessibility text for the widgets screen top bar landmark region. */
					aria-label={ __( 'Jetpack Search customization top bar', 'jetpack' ) }
					tabIndex="-1"
				>
					<Header isSidebarEnabled={ isSidebarEnabled } enableSidebar={ enableSidebar } />
				</div>
				<div className="interface-interface-skeleton__body">
					<div
						className="interface-interface-skeleton__content"
						role="region"
						/* translators: accessibility text for the widgets screen content landmark region. */
						aria-label={ __( 'Jetpack Search customization preview', 'jetpack' ) }
						tabIndex="-1"
					>
						<AppWrapper />
					</div>
					{ !! isSidebarEnabled && (
						<div
							className="interface-interface-skeleton__sidebar"
							role="region"
							/* translators: accessibility text for the widgets screen settings landmark region. */
							aria-label={ __( 'Jetpack Search customization settings', 'jetpack' ) }
							tabIndex="-1"
						>
							<Sidebar
								disableSidebar={ disableSidebar }
								enableSidebar={ enableSidebar }
								enabledSidebarName={ enabledSidebarName }
								isSidebarEnabled={ isSidebarEnabled }
							/>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}
