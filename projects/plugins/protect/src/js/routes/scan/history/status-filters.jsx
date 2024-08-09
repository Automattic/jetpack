import { __ } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ButtonGroup from '../../../components/button-group';

/**
 * Status Filters component.
 *
 * @param {object} props - Component props.
 * @param {number} props.numFixed - Number of fixed threats.
 * @param {number} props.numIgnored - Number of ignored threats.
 *
 * @returns {React.ReactNode} StatusFilters component.
 */
export default function StatusFilters( { numFixed, numIgnored } ) {
	const navigate = useNavigate();
	const { filter = 'all' } = useParams();
	const navigateOnClick = useCallback( path => () => navigate( path ), [ navigate ] );

	return (
		<ButtonGroup>
			<ButtonGroup.Button
				variant={ 'all' === filter ? 'primary' : 'secondary' }
				onClick={ navigateOnClick( '/scan/history' ) }
			>
				{ __( 'All', 'jetpack-protect' ) }
			</ButtonGroup.Button>
			<ButtonGroup.Button
				variant={ 'fixed' === filter ? 'primary' : 'secondary' }
				onClick={ navigateOnClick( '/scan/history/fixed' ) }
				disabled={ ! numFixed }
			>
				{ __( 'Fixed', 'jetpack-protect' ) }
			</ButtonGroup.Button>
			<ButtonGroup.Button
				variant={ 'ignored' === filter ? 'primary' : 'secondary' }
				onClick={ navigateOnClick( '/scan/history/ignored' ) }
				disabled={ ! numIgnored }
			>
				{ __( 'Ignored', 'jetpack-protect' ) }
			</ButtonGroup.Button>
		</ButtonGroup>
	);
}
