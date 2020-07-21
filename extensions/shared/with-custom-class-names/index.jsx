/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';
import { isUpgradable } from '../plan-utils';

export default ( customClassNames ) => ( className, blockName ) => (
	classNames( className, {
		[ customClassNames ]: isUpgradable( blockName ),
	} )
);
