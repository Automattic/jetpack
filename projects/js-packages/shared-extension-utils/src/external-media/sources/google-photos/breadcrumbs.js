import { Button } from '@wordpress/components';
import { Fragment, memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { PATH_ROOT } from '../../constants';

/**
 * Breadcrumbs component
 *
 * @param {object}   props         - The component props
 * @param {string}   props.path    - The path of breadcrumbs
 * @param {Function} props.setPath - The function to set the path of breadcrumbs
 * @return {React.ReactElement} - JSX Element
 */
function Breadcrumbs( { path, setPath } ) {
	return (
		<Fragment>
			{ /* eslint-disable-next-line react/jsx-no-bind */ }
			<Button variant="tertiary" onClick={ () => setPath( PATH_ROOT ) }>
				{ __( 'Albums', 'jetpack-shared-extension-utils' ) }
			</Button>
			→ &nbsp; { path.name }
		</Fragment>
	);
}

export default memo( Breadcrumbs );
