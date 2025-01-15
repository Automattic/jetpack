import { PATH_ROOT } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { Fragment, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

function Breadcrumbs( { path, setPath } ) {
	return (
		<Fragment>
			<Button variant="tertiary" onClick={ () => setPath( PATH_ROOT ) }>
				{ __( 'Albums', 'jetpack' ) }
			</Button>
			→ &nbsp; { path.name }
		</Fragment>
	);
}

export default memo( Breadcrumbs );
