/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react-hooks';
import useConnect from '../use-connect';
import * as wp from '@wordpress/data';
import sinon from 'sinon';

describe( 'useConnect', () => {
	it( 'returns true', () => {
		const stub = sinon.stub( wp, 'useSelect' );
		stub.returns( { isRegistered: true, isUserConnected: true } );
		const { result } = renderHook( () => useConnect( {} ) );
	} );
} );
