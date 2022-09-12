/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
/**
 * Internal dependencies
 */
import { useCallback, useState } from 'react';
import filterIcon from '../../../components/icons/filter-icon';
import styles from './style.module.scss';

export const FilterButton = ( props: { onToggle?: ( isActive ) => void } ): JSX.Element => {
	const [ isActive, setIsActive ] = useState( false );
	const onClickHandler = useCallback( () => {
		setIsActive( v => ! v );
		props?.onToggle( isActive );
	}, [ props?.onToggle ] );

	return (
		<Button
			variant={ isActive ? 'primary' : 'secondary' }
			className={ classnames( styles[ 'filter-button' ], {
				[ styles[ 'is-active' ] ]: isActive,
			} ) }
			icon={ filterIcon }
			weight="regular"
			onClick={ onClickHandler }
		>
			{ __( 'Filters', 'jetpack-videopress-pkg' ) }
		</Button>
	);
};
