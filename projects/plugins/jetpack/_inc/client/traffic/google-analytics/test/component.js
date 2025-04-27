import userEvent from '@testing-library/user-event';
import React from 'react';
import { updateSettings } from 'state/settings';
import { render, screen } from 'test/test-utils';
import { GoogleAnalytics } from '../../google-analytics';

jest.mock( 'state/settings', () => {
	const actual = jest.requireActual( 'state/settings' );
	return {
		...actual,
		fetchSettings: jest.fn().mockReturnValue( () => Promise.resolve() ),
		updateSettings: jest.fn().mockReturnValue( () => Promise.resolve() ),
	};
} );

describe( 'Google Analytics', () => {
	const defaultProps = {
		active: true,
		isUnavailableInOfflineMode: () => false,
	};

	const initialState = {
		jetpack: {
			initialState: {
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
					},
				},
				siteData: {
					isWoASite: true,
				},
			},
			connection: {
				status: {
					siteConnected: {
						offlineMode: {
							isActive: false,
						},
					},
				},
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			modules: {},
			settings: {
				items: {
					jetpack_wga: {
						is_active: true,
						code: 'G-123',
						anonymize_ip: true,
					},
				},
				requests: {
					fetchingSettingsList: false,
					settingsSent: {},
					updatedSettings: {},
				},
			},
			dashboard: {
				requests: {
					fetchingVaultPressData: false,
					checkingAkismetKey: false,
				},
			},
			siteData: {
				data: {
					site: {
						features: {
							active: [ 'google-analytics' ],
						},
					},
				},
				requests: {},
			},
		},
	};

	const renderCard = () => {
		render( <GoogleAnalytics { ...defaultProps } />, {
			initialState,
		} );
		return {
			enableCheckbox: screen.getByRole( 'checkbox', { name: /Enable Google Analytics/ } ),
			measurementIdInput: screen.getByRole( 'textbox', { name: /Measurement ID/ } ),
			anonymizeIpCheckbox: screen.getByRole( 'checkbox', { name: /Anonymize IP addresses/ } ),
		};
	};

	it( 'renders existing fields', () => {
		const { enableCheckbox, measurementIdInput, anonymizeIpCheckbox } = renderCard();

		expect( enableCheckbox ).toBeChecked();
		expect( measurementIdInput ).toHaveValue( 'G-123' );
		expect( anonymizeIpCheckbox ).toBeChecked();
	} );

	describe( 'when the form is updated', () => {
		it( 'submits the form with the updated values', async () => {
			const { measurementIdInput, anonymizeIpCheckbox } = renderCard();

			const user = userEvent.setup();

			await user.clear( measurementIdInput );
			await user.type( measurementIdInput, 'G-456' );
			await user.click( anonymizeIpCheckbox );

			await user.click( screen.getByRole( 'button', { name: /Save settings/ } ) );

			expect( updateSettings ).toHaveBeenCalledWith(
				{
					jetpack_wga: {
						is_active: true,
						code: 'G-456',
						anonymize_ip: false,
					},
				},
				{}
			);
		} );
	} );
} );
