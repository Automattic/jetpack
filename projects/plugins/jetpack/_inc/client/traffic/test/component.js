import restApi from '@automattic/jetpack-api';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, within } from 'test/test-utils';
import { SEO } from '../seo.jsx';

jest.mock( '@automattic/jetpack-api', () => ( {
	fetchSettings: jest.fn().mockResolvedValue( {} ),
	updateSettings: jest.fn().mockResolvedValue( {} ),
} ) );

jest.mock( '@automattic/social-previews', () => ( {
	FacebookLinkPreview: ( { image } ) => <div data-testid="facebook-preview">{ image }</div>,
	GoogleSearchPreview: ( { title } ) => <div data-testid="google-preview">{ title }</div>,
	TwitterLinkPreview: ( { image } ) => <div data-testid="twitter-preview">{ image }</div>,
} ) );

jest.mock( 'components/button', () => {
	return function Button( { children, compact, primary, rna, ...props } ) {
		return <button { ...props }>{ children }</button>;
	};
} );

jest.mock( 'components/foldable-card', () => {
	return function FoldableCard( { children, header } ) {
		return (
			<section aria-label={ header }>
				<div>{ header }</div>
				{ children }
			</section>
		);
	};
} );

jest.mock( 'components/forms', () => ( {
	FormFieldset: ( { children } ) => <fieldset>{ children }</fieldset>,
	FormLabel: ( { children, ...props } ) => <div { ...props }>{ children }</div>,
	FormTextarea: props => <textarea { ...props } />,
} ) );

jest.mock( 'components/module-toggle', () => ( {
	ModuleToggle: ( { children } ) => <div>{ children }</div>,
} ) );

jest.mock( 'components/notice', () => {
	return function SimpleNotice( { children } ) {
		return <div>{ children }</div>;
	};
} );

jest.mock( 'components/settings-card', () => {
	return function SettingsCard( { children, onSubmit } ) {
		return <form onSubmit={ onSubmit }>{ children }</form>;
	};
} );

jest.mock( 'components/settings-group', () => {
	return function SettingsGroup( { children } ) {
		return <div>{ children }</div>;
	};
} );

jest.mock( 'social-logos', () => ( {
	SocialLogo: ( { icon } ) => <span>{ icon }</span>,
} ) );

jest.mock( '../seo/custom-seo-titles.jsx', () => {
	return function CustomSeoTitles() {
		return <div />;
	};
} );

describe( 'Traffic - SEO', () => {
	const defaultSocialImageOption = 'jetpack_social_open_graph_settings';
	const representativeImage = 'https://example.com/site-social-image.jpg';
	const getSeoModule = () => ( {
		module: 'seo-tools',
		name: 'SEO Tools',
	} );

	const getInitialState = ( settings = {} ) => ( {
		jetpack: {
			connection: {
				user: {
					currentUser: {
						isConnected: true,
					},
				},
			},
			initialState: {
				adminUrl: 'https://example.com/wp-admin/',
				currentIp: '127.0.0.1',
				getModules: {
					'seo-tools': {
						options: {
							ai_seo_enhancer_enabled: {
								current_value: false,
							},
						},
					},
				},
				siteData: {
					representativeImage,
				},
				stats: {
					roles: {},
				},
				userData: {
					currentUser: {
						permissions: {
							manage_modules: true,
						},
						wpcomUser: {
							email: 'admin@example.com',
						},
					},
				},
			},
			pluginsData: {
				items: {},
				requests: {
					isFetchingPluginsData: false,
				},
			},
			settings: {
				items: {
					advanced_seo_front_page_description: 'A homepage description.',
					advanced_seo_title_formats: {},
					'canonical-urls': true,
					'seo-tools': true,
					[ defaultSocialImageOption ]: {
						default_image_id: 0,
					},
					...settings,
				},
				requests: {
					fetchingSettingsList: false,
					settingsSent: {},
					updatedSettings: {},
				},
			},
		},
	} );

	const setupSeo = ( settings = {} ) => {
		const initialState = getInitialState( settings );

		render(
			<SEO
				// eslint-disable-next-line react/jsx-no-bind -- The settings component expects getModule as a function prop.
				getModule={ getSeoModule }
				hasSeoEnhancer={ false }
				seoEnhancerAvailable={ false }
				siteData={ {
					URL: 'https://example.com',
					description: 'Example site description',
					name: 'Example Site',
				} }
				siteIcon=""
				siteRepresentativeImage={ representativeImage }
				state={ initialState }
			/>,
			{ initialState }
		);

		return screen.getByRole( 'region', {
			name: 'Expand to choose a default social image and preview.',
		} );
	};

	const mockMediaFrame = attachment => {
		let selectHandler;
		const frame = {
			on: jest.fn( ( event, handler ) => {
				if ( event === 'select' ) {
					selectHandler = handler;
				}
			} ),
			open: jest.fn( () => selectHandler() ),
			state: jest.fn( () => ( {
				get: jest.fn( () => ( {
					first: jest.fn( () => ( {
						toJSON: jest.fn( () => attachment ),
					} ) ),
				} ) ),
			} ) ),
		};

		window.wp = {
			media: jest.fn( () => frame ),
		};

		return frame;
	};

	beforeEach( () => {
		jest.clearAllMocks();
		restApi.fetchSettings.mockResolvedValue( {} );
		restApi.updateSettings.mockResolvedValue( {} );
		window.wp = {
			media: jest.fn(),
		};
	} );

	afterEach( () => {
		delete window.wp;
	} );

	it( 'renders and removes a configured default social image', async () => {
		const user = userEvent.setup();
		const socialImageSection = setupSeo( {
			[ defaultSocialImageOption ]: {
				default_image_id: 123,
			},
		} );

		expect(
			within( socialImageSection ).getByText( 'Recommended size is 1200x630px and < 600 KB.' )
		).toBeInTheDocument();
		expect(
			within( socialImageSection ).getByRole( 'button', { name: 'Replace image' } )
		).toBeEnabled();
		expect(
			within( socialImageSection ).getByAltText( 'Default social image preview' )
		).toHaveAttribute( 'src', representativeImage );
		expect( within( socialImageSection ).getByTestId( 'facebook-preview' ) ).toHaveTextContent(
			representativeImage
		);

		await user.click(
			within( socialImageSection ).getByRole( 'button', { name: 'Remove image' } )
		);

		await waitFor( () =>
			expect(
				within( socialImageSection ).queryByAltText( 'Default social image preview' )
			).not.toBeInTheDocument()
		);
		expect(
			within( socialImageSection ).getByRole( 'button', { name: 'Select image' } )
		).toBeEnabled();

		await user.click(
			within( socialImageSection ).getByRole( 'button', { name: 'Save settings' } )
		);

		await waitFor( () =>
			expect( restApi.updateSettings ).toHaveBeenCalledWith( {
				[ defaultSocialImageOption ]: {
					default_image_id: 0,
				},
			} )
		);
	} );

	it( 'selects a default social image from the media library and saves it', async () => {
		const user = userEvent.setup();
		const selectedImageUrl = 'https://example.com/uploads/social-large.jpg';
		const frame = mockMediaFrame( {
			id: '456',
			sizes: {
				large: {
					url: selectedImageUrl,
				},
			},
			url: 'https://example.com/uploads/social-full.jpg',
		} );
		const socialImageSection = setupSeo();

		await user.click(
			within( socialImageSection ).getByRole( 'button', { name: 'Select image' } )
		);

		expect( window.wp.media ).toHaveBeenCalledWith( {
			title: 'Select default social image',
			button: {
				text: 'Use this image',
			},
			library: {
				type: 'image',
			},
			multiple: false,
		} );
		expect( frame.open ).toHaveBeenCalled();

		await waitFor( () =>
			expect(
				within( socialImageSection ).getByAltText( 'Default social image preview' )
			).toHaveAttribute( 'src', selectedImageUrl )
		);
		expect(
			within( socialImageSection ).getByRole( 'button', { name: 'Replace image' } )
		).toBeEnabled();
		expect( within( socialImageSection ).getByTestId( 'twitter-preview' ) ).toHaveTextContent(
			selectedImageUrl
		);

		await user.click(
			within( socialImageSection ).getByRole( 'button', { name: 'Save settings' } )
		);

		await waitFor( () =>
			expect( restApi.updateSettings ).toHaveBeenCalledWith( {
				[ defaultSocialImageOption ]: {
					default_image_id: 456,
				},
			} )
		);
	} );
} );
