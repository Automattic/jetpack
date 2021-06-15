/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Fragment, memo } from '@wordpress/element';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PATH_ROOT } from '../../constants';

function Breadcrumbs( { path, setPath } ) {
	return (
		<Fragment>
			<Button isTertiary onClick={ () => setPath( PATH_ROOT ) }>
				{ __( 'Albums', 'jetpack' ) }
			</Button>
			→ &nbsp; { path.name }
		</Fragment>
	);
}

export default memo( Breadcrumbs );
