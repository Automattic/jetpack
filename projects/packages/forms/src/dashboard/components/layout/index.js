import { JetpackFooter } from '@automattic/jetpack-components';
import { shouldUseInternalLinks } from '@automattic/jetpack-shared-extension-utils';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFormsLogo from '../logo';

import './style.scss';

const Layout = ( { children, className, showFooter } ) => {
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
					useInternalLinks={ shouldUseInternalLinks() }
				/>
			) }
		</div>
	);
};

export default Layout;
