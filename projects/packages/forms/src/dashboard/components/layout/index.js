import { JetpackFooter } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { children, className, showFooter } ) => {
	const { connectedPlugins, connectionStatus } = getScriptData()?.connection ?? {};
	const useInternalLinks =
		// Some admin pages require the site to be connected (e.g. Privacy)
		connectionStatus?.isActive &&
		// Admin pages are part of the Jetpack plugin and require it to be installed
		connectedPlugins?.some( ( { slug } ) => 'jetpack' === slug );

	return (
		<div className={ clsx( 'jp-forms__layout', className ) }>
			<div className="jp-forms__logo-wrapper">
				<JetpackFormsLogo />
			</div>
			{ children }
			{ showFooter && (
				<JetpackFooter
					className="jp-forms__layout-footer"
					moduleName={ __( 'Jetpack Forms', 'jetpack-forms' ) }
					useInternalLinks={ useInternalLinks }
				/>
			) }
		</div>
	);
};

export default Layout;
