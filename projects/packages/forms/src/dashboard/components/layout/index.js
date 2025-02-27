import { JetpackFooter } from '@automattic/jetpack-components';
import // __experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
'@wordpress/components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import JetpackFormsLogo from '../logo';

import './style.scss';

// TODO: cleanup. It might not be needed at all..
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
				/>
			) }
		</div>
	);
};

export default Layout;
