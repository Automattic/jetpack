import mapHealthCheckErrors from '../map-health-check-errors';

// mapHealthCheckErrors turns the health-check endpoint's failure response into
// the store's ConnectionErrorMap shape. It must be LOSSLESS — every failed
// check surfaces, whatever its code — so the consumer never silently drops an
// error the backend reported.
describe( 'mapHealthCheckErrors', () => {
	// The mapper is only ever handed a failure body (the thunk handles the
	// healthy path separately), but it should still no-op on empty/malformed input.
	it( 'returns an empty map for a missing/empty response body', () => {
		expect( mapHealthCheckErrors( undefined ) ).toEqual( {} );
		expect( mapHealthCheckErrors( null ) ).toEqual( {} );
		expect( mapHealthCheckErrors( {} ) ).toEqual( {} );
	} );

	it( 'maps a single failed check, keyed by its code', () => {
		const body = {
			code: 'failed_test__connection_token_health',
			message: 'The site token used to authenticate with WordPress.com could not be validated.',
			data: { resolution: 'Reconnect now :https://example.com/reconnect' },
		};

		const map = mapHealthCheckErrors( body );

		expect( map ).toEqual( {
			failed_test__connection_token_health: {
				0: {
					error_code: 'failed_test__connection_token_health',
					error_message:
						'The site token used to authenticate with WordPress.com could not be validated.',
					error_type: 'connection_health',
					error_data: {
						action_label: 'Reconnect now',
						action_url: 'https://example.com/reconnect',
					},
				},
			},
		} );
	} );

	it( 'maps the primary error plus every additional_errors entry (lossless)', () => {
		const body = {
			code: 'failed_test__outbound_https',
			message: 'Your server did not successfully connect to WordPress.com using HTTPS.',
			data: { resolution: '' },
			additional_errors: [
				{
					code: 'failed_test__identity_crisis',
					message: 'A URL mismatch was detected.',
					data: { resolution: 'Please contact Jetpack support. :https://example.com/support' },
				},
				{
					code: 'failed_test__xml_parser_available',
					message: 'PHP XML manipulation libraries are not available.',
					data: {},
				},
			],
		};

		const map = mapHealthCheckErrors( body );

		expect( Object.keys( map ) ).toEqual( [
			'failed_test__outbound_https',
			'failed_test__identity_crisis',
			'failed_test__xml_parser_available',
		] );
		// The primary error is inserted first, so it wins the hook's "first error" pick.
		expect( Object.keys( map )[ 0 ] ).toBe( 'failed_test__outbound_https' );
		expect( map.failed_test__identity_crisis[ 0 ].error_data ).toEqual( {
			action_label: 'Please contact Jetpack support.',
			action_url: 'https://example.com/support',
		} );
		// No resolution → empty action data, but the error still surfaces.
		expect( map.failed_test__xml_parser_available[ 0 ].error_message ).toBe(
			'PHP XML manipulation libraries are not available.'
		);
		expect( map.failed_test__xml_parser_available[ 0 ].error_data ).toEqual( {} );
	} );

	// Acceptance guard: a check code the frontend has never heard of (e.g. one a
	// third-party package registered via `jetpack_connection_tests_loaded`) must
	// still surface. The mapper must not filter to a known allow-list.
	it( 'surfaces an unknown/synthetic check code (no allow-list)', () => {
		const body = {
			code: 'failed_test__some_third_party_check',
			message: 'A custom connection check failed.',
			data: { resolution: 'Fix it :https://example.com/fix' },
		};

		const map = mapHealthCheckErrors( body );

		expect( map.failed_test__some_third_party_check[ 0 ] ).toMatchObject( {
			error_code: 'failed_test__some_third_party_check',
			error_message: 'A custom connection check failed.',
			error_type: 'connection_health',
		} );
	} );

	// A failed check with no message must still surface: the consuming hook gates
	// on `Boolean( error_message )`, so an empty message would silently drop it.
	it( 'falls back to a generic message when a failed check has none', () => {
		expect(
			mapHealthCheckErrors( { code: 'failed_test__no_message', message: '' } )
				.failed_test__no_message[ 0 ].error_message
		).toBe( 'A connection check failed.' );

		expect(
			mapHealthCheckErrors( {
				code: 'failed_test__primary',
				message: 'Primary failed.',
				additional_errors: [ { code: 'failed_test__no_message', data: {} } ],
			} ).failed_test__no_message[ 0 ].error_message
		).toBe( 'A connection check failed.' );
	} );

	it( 'tolerates a resolution with no separator', () => {
		const body = {
			code: 'failed_test__check_if_connected',
			message: 'Your site is not connected to WordPress.com',
			data: { resolution: 'no separator here' },
		};

		expect( mapHealthCheckErrors( body ).failed_test__check_if_connected[ 0 ].error_data ).toEqual(
			{}
		);
	} );

	// The endpoint prefixes every genuine failure with `failed_`. Transport,
	// permission, and routing rejections that `apiFetch` surfaces share the same
	// { code, message, data } shape but are NOT broken-connection states — they
	// must no-op so a consumer keeps its generic error instead of a connection
	// banner.
	it.each( [
		[ 'fetch_error (admin browser offline)', 'fetch_error' ],
		[ '401 permission rejection', 'invalid_user_permission_manage_options' ],
		[ 'rest_no_route on older sites', 'rest_no_route' ],
	] )( 'ignores a non-health rejection: %s', ( _label, code ) => {
		expect( mapHealthCheckErrors( { code, message: 'nope', data: { status: 500 } } ) ).toEqual(
			{}
		);
	} );

	it( 'drops a non-failed_ primary but keeps failed_ additional_errors', () => {
		const map = mapHealthCheckErrors( {
			code: 'fetch_error',
			message: 'You are probably offline.',
			additional_errors: [ { code: 'failed_test__real', message: 'Real failure.' } ],
		} );

		expect( Object.keys( map ) ).toEqual( [ 'failed_test__real' ] );
	} );
} );
