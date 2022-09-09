import { getRedirectUrl } from '@automattic/jetpack-components';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { SettingsCard } from '../index';

describe( 'SettingsCard', () => {
	const testProps = {
		module: 'comments',
		hideButton: false,
		getModule: () => ( {
			name: 'Comments',
			learn_more_button: getRedirectUrl( 'jetpack-support-protect' ),
		} ),
		isSavingAnyOption: () => false,
		isDirty: () => true,
		header: '',
		support: '',
		sitePlan: {
			product_slug: 'jetpack_free',
		},
		userCanManageModules: true,
		getModuleOverride: () => {
			return false;
		},
	};

	const Child = () => <p data-testid="Child">Child</p>;

	const allCardsNonAdminCantAccess = [
			'widget-visibility',
			'contact-form',
			'sitemaps',
			'latex',
			'carousel',
			'tiled-gallery',
			'custom-content-types',
			'verification-tools',
			'markdown',
			'infinite-scroll',
			'gravatar-hovercards',
			'custom-css',
			'sharedaddy',
			'widgets',
			'shortcodes',
			'related-posts',
			'videopress',
			'monitor',
			'sso',
			'vaultpress',
			'google-analytics',
			'seo-tools',
			'stats',
			'wordads',
			'manage',
			'likes',
			'shortlinks',
			'notes',
			'subscriptions',
			'protect',
			'enhanced-distribution',
			'comments',
			'json-api',
			'photon',
		],
		allCardsForNonAdmin = [ 'post-by-email' ];

	it( 'renders a heading', () => {
		render(
			<SettingsCard { ...testProps }>
				<Child />
			</SettingsCard>
		);
		// eslint-disable-next-line testing-library/no-node-access
		expect( screen.getByText( 'Comments' ).closest( '.dops-section-header' ) ).toBeInTheDocument();
	} );

	it( "when not saving and has settings to save, it's enabled", () => {
		render(
			<SettingsCard { ...testProps }>
				<Child />
			</SettingsCard>
		);
		expect( screen.getByRole( 'button' ) ).toBeEnabled();
	} );

	describe( 'When a custom header or support URL are passed', () => {
		const currentTestProps = {
			...testProps,
			header: 'A custom header',
			support: getRedirectUrl( 'jetpack' ),
		};

		it( 'the header has priority over module.name', () => {
			render(
				<SettingsCard { ...currentTestProps }>
					<Child />
				</SettingsCard>
			);
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				screen.getByText( 'A custom header' ).closest( '.dops-section-header' )
			).toBeInTheDocument();
			expect(
				// eslint-disable-next-line testing-library/no-node-access
				screen.queryByText( 'Comments' )?.closest( '.dops-section-header' ) || null
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'When save is disabled', () => {
		const currentTestProps = {
			...testProps,
			saveDisabled: true,
		};

		it( "when saving, it's disabled", () => {
			render(
				<SettingsCard { ...currentTestProps }>
					<Child />
				</SettingsCard>
			);
			expect( screen.getByRole( 'button' ) ).toBeDisabled();
		} );

		it( 'when saving, button label is updated to Saving…', () => {
			render(
				<SettingsCard { ...currentTestProps }>
					<Child />
				</SettingsCard>
			);
			expect( screen.getByRole( 'button' ) ).toHaveTextContent( 'Saving…' );
		} );
	} );

	describe( "If the support attribute and module doesn't have a support link", () => {
		const currentTestProps = {
			...testProps,
			saveDisabled: false,
			support: '',
			getModule: () => ( {
				name: 'Comments',
				learn_more_button: '',
			} ),
		};

		// @todo I see nothing that would add a "support icon" in the first place. Was that a removed feature?
		it( 'the support icon is not rendered', () => {
			render(
				<SettingsCard { ...currentTestProps }>
					<Child />
				</SettingsCard>
			);
			// eslint-disable-next-line jest-dom/prefer-in-document -- No, we really want to assert there's exactly 1.
			expect( screen.getAllByRole( 'button' ) ).toHaveLength( 1 );
		} );
	} );

	describe( 'When save button is clicked', () => {
		const onSave = jest.fn( e => e.preventDefault() );

		const currentTestProps = {
			...testProps,
			onSubmit: onSave,
		};

		it( 'onSubmit is called', async () => {
			const user = userEvent.setup();
			render(
				<SettingsCard { ...currentTestProps }>
					<Child />
				</SettingsCard>
			);

			onSave.mockClear();
			const button = screen.getByRole( 'button', { name: 'Save settings' } );
			await user.click( button );
			expect( onSave ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'if save is disabled, do not call onSubmit', async () => {
			const user = userEvent.setup();
			render(
				<SettingsCard { ...currentTestProps } saveDisabled={ true }>
					<Child />
				</SettingsCard>
			);

			onSave.mockClear();

			const button = screen.getByRole( 'button', { name: 'Saving…' } );
			await user.click( button );
			await user.click( button );
			await user.click( button );
			expect( onSave ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'When user is not an admin', () => {
		const currentTestProps = {
			...testProps,
			userCanManageModules: false,
		};

		it.each( allCardsNonAdminCantAccess )( 'does not render %s', item => {
			render(
				<SettingsCard { ...currentTestProps } module={ item }>
					<Child />
				</SettingsCard>
			);
			expect( screen.queryByTestId( 'Child' ) ).not.toBeInTheDocument();
		} );

		it.each( allCardsForNonAdmin )( 'renders %s', item => {
			render(
				<SettingsCard { ...currentTestProps } module={ item }>
					<Child />
				</SettingsCard>
			);
			expect( screen.getByTestId( 'Child' ) ).toBeInTheDocument();
		} );
	} );
} );
