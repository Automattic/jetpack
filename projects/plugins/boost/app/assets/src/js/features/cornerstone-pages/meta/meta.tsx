import { Button, getRedirectUrl, Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useMemo, useState } from 'react';
import styles from './meta.module.scss';
import {
	useCustomCornerstonePages,
	useCornerstonePagesProperties,
} from '../lib/stores/cornerstone-pages';
import { createInterpolateElement } from '@wordpress/element';
import { recordBoostEvent } from '$lib/utils/analytics';
import getSupportLink from '$lib/utils/get-support-link';
import { useRegenerationReason } from '$features/critical-css/lib/stores/suggest-regenerate';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import { isSameSiteUrl } from '$lib/utils/is-same-site-url';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';
import { useNotices } from '$features/notice/context';
import { useLcpState } from '$features/lcp/lib/stores/lcp-state';
import { ExternalLink } from '@wordpress/components';
import type { FC, ReactNode } from 'react';
import { isCriticalCssEnabled } from '$features/critical-css/lib/is-critical-css-enabled';
import { useModulesState } from '$features/module/lib/stores';

export const MetaError = () => (
	<Notice
		level="warning"
		title={ __( 'Failed to load', 'jetpack-boost' ) }
		hideCloseButton={ true }
	>
		<p>
			{ createInterpolateElement(
				__(
					'Refresh the page and try again. If the issue persists, please <link>contact support</link>.',
					'jetpack-boost'
				),
				{
					link: (
						<ExternalLink
							href={ getSupportLink() }
							onClick={ () => {
								recordBoostEvent( 'cornerstone_pages_properties_failed', {} );
							} }
						/>
					),
				}
			) }
		</p>
	</Notice>
);

const CornerstonePagesContent = () => {
	const cornerstonePagesProperties = useCornerstonePagesProperties()!;
	const [ cornerstonePages, setCornerstonePages ] = useCustomCornerstonePages();
	const regenerateAction = useRegenerateCriticalCssAction();
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );
	const [ { refetch: refetchRegenerationReason } ] = useRegenerationReason();
	const [ lcpState ] = useLcpState( { enabled: false } );
	const { setNotice } = useNotices();
	const listInputRows = isPremium ? 10 : 5;
	const [ { data: modulesState } ] = useModulesState();

	const updateCornerstonePages = ( newValue: string ) => {
		// If the user deletes all the URLs, we should set the list to an empty array.
		const newItems = newValue
			? newValue
					.split( '\n' )
					.map( line => line.trim() )
					.filter( Boolean )
			: [];

		setCornerstonePages( newItems, () => {
			setNotice( {
				id: 'cornerstone-pages-save',
				type: 'success',
				message: __( 'Cornerstone pages saved', 'jetpack-boost' ),
			} );

			if ( isCriticalCssEnabled( modulesState ) ) {
				refetchRegenerationReason();
				if ( isPremium ) {
					regenerateAction.mutate();
				}
			}

			// If the CS Pages were updated, the LCP state should be set to pending if it was enabled. This will trigger the LCP Module to listen until the LCP is optimized.
			lcpState.refetch();
		} );
	};

	return (
		<div className={ styles.section }>
			<p className={ styles.description }>
				<strong>{ __( 'Homepage:', 'jetpack-boost' ) }</strong>
			</p>
			<PredefinedList items={ cornerstonePagesProperties.predefined_pages } />
			<p className={ styles.description }>
				<strong>{ __( 'Custom:', 'jetpack-boost' ) }</strong>
			</p>
			<List
				items={ cornerstonePages.join( '\n' ) }
				setItems={ updateCornerstonePages }
				maxItems={ cornerstonePagesProperties.max_pages }
				defaultValue={ cornerstonePagesProperties.default_pages.join( '\n' ) }
				inputRows={ listInputRows }
				description={
					<>
						{ createInterpolateElement(
							sprintf(
								/* translators: %s is the site URL. */
								__(
									'Add one URL per line. Only URLs starting with <b>%s</b> will be included. Relative URLs are automatically expanded.',
									'jetpack-boost'
								),
								Jetpack_Boost.site.url
							),
							{
								b: <b />,
							}
						) }
					</>
				}
			/>
		</div>
	);
};

const Meta = () => {
	const cornerstonePagesSupportLink = getRedirectUrl( 'jetpack-boost-cornerstone-pages' );
	const cornerstonePagesProperties = useCornerstonePagesProperties();

	return (
		<div className={ styles.wrapper } data-testid="cornerstone-pages-meta">
			<p>
				{ createInterpolateElement(
					__(
						'List the most important pages of your site. These pages will receive specially tailored optimizations, including targeted critical CSS. The Page Speed scores are based on your homepage, which is automatically included. <b><link>Learn More</link></b>',
						'jetpack-boost'
					),
					{
						link: (
							<ExternalLink
								href={ cornerstonePagesSupportLink }
								onClick={ () => {
									recordBoostEvent( 'clicked_cornerstone_pages_learn_more', {} );
								} }
							/>
						),
						b: <b />,
					}
				) }
			</p>
			<div className={ styles.body }>
				{ cornerstonePagesProperties ? <CornerstonePagesContent /> : <MetaError /> }
			</div>
		</div>
	);
};

type ListProps = {
	items: string;
	setItems: ( newValue: string ) => void;
	maxItems: number;
	description: ReactNode | null;
	defaultValue: string;
	inputRows?: number;
};

export const CornerstonePagesUpgradeCTA = () => {
	const cornerstonePagesProperties = useCornerstonePagesProperties();
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	if ( isPremium || ! cornerstonePagesProperties ) {
		return null;
	}

	return (
		<div className={ styles.wrapper }>
			<InterstitialModalCTA
				identifier="cornerstone-10-pages"
				description={ sprintf(
					/* translators: %d is the number of cornerstone pages. */
					__( 'Premium users can add up to %d cornerstone pages.', 'jetpack-boost' ),
					cornerstonePagesProperties.max_pages_premium
				) }
			/>
		</div>
	);
};

type PredefinedListProps = {
	items: string[];
};

const PredefinedList: FC< PredefinedListProps > = ( { items } ) => {
	return (
		<ul className={ styles[ 'predefined-pages' ] }>
			{ items.map( item => (
				<li key={ item }>{ item }</li>
			) ) }
		</ul>
	);
};

const List: FC< ListProps > = ( {
	items,
	setItems,
	maxItems,
	description,
	defaultValue = '',
	inputRows = 10,
} ) => {
	const [ inputValue, setInputValue ] = useState( items );
	const [ validationError, setValidationError ] = useState< Error | null >( null );
	const inputInvalid = useMemo( () => validationError, [ validationError ] );

	useEffect( () => {
		setInputValue( items );
	}, [ items ] );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		try {
			validateItems( value );
			setValidationError( null );
		} catch ( e ) {
			setValidationError( e as Error );
		}
	};

	// URL Resolution - handles all the complex path logic in one place
	const resolveUrlForSite = ( input: string, siteUrl: URL ): URL => {
		if ( input.startsWith( '/' ) ) {
			// Absolute path - normalize base path for comparison
			const basePath = siteUrl.pathname.replace( /\/$/, '' );

			// Check if input already contains the base path
			const hasBasePath =
				basePath !== '' && ( input === basePath || input.startsWith( basePath + '/' ) );

			if ( hasBasePath ) {
				return new URL( input, siteUrl.origin );
			}

			// Join base path with input, avoiding double slashes
			const joinedPath = basePath + input;
			return new URL( joinedPath, siteUrl.origin );
		}

		// Relative path - ensure base URL has trailing slash for proper joining
		const baseUrl = siteUrl.href.endsWith( '/' ) ? siteUrl.href : siteUrl.href + '/';
		return new URL( input, baseUrl );
	};

	// Backend Normalization - converts URLs back to relative paths for storage
	const normalizeForBackend = ( input: string, siteUrl: URL ): string => {
		// Trim and filter empty strings early
		const trimmed = input.trim();
		if ( ! trimmed ) {
			return '';
		}

		// Handle absolute URLs by extracting the pathname
		let path = trimmed;
		try {
			const url = new URL( trimmed );
			if ( url.origin === siteUrl.origin ) {
				path = url.pathname;
			}
		} catch {
			// Not a valid absolute URL, treat as relative path
		}

		// Normalize base path for comparison (remove trailing slash)
		const basePath = siteUrl.pathname.replace( /\/$/, '' );

		// Strip base path if present
		if ( basePath !== '' && ( path === basePath || path.startsWith( basePath + '/' ) ) ) {
			const remainingPath = path.substring( basePath.length );
			path = remainingPath || '/';
		} else {
			// Ensure path starts with '/' for consistency
			path = path.startsWith( '/' ) ? path : '/' + path;
		}

		// Clean up multiple consecutive slashes
		path = path.replace( /\/+/g, '/' );

		// Normalize trailing slashes for consistent deduplication (except root)
		return path.replace( /\/$/, '' ) || '/';
	};

	// Input Processing - now much simpler
	const processInputLines = ( value: string ): string[] => {
		const siteUrl = new URL( Jetpack_Boost.site.url );

		const lines = value
			.split( '\n' )
			.map( line => normalizeForBackend( line, siteUrl ) )
			.filter( Boolean ); // Remove empty strings after normalization

		// Deduplicate to avoid false "over max" errors
		return Array.from( new Set( lines ) );
	};

	// Validation - now focused only on validation logic
	const validateItems = ( value: string ) => {
		const lines = processInputLines( value );

		if ( value.trim().length > 0 && lines.length === 0 ) {
			throw new Error( __( 'You must add at least one URL.', 'jetpack-boost' ) );
		}

		// Check if the number of items exceeds maxItems
		if ( lines.length > maxItems ) {
			const message = sprintf(
				/* translators: %d is the maximum number of cornerstone page URLs. */
				_n(
					'You can add only %d cornerstone page URL.',
					'You can add up to %d cornerstone page URLs.',
					maxItems,
					'jetpack-boost'
				),
				maxItems
			);
			throw new Error( message );
		}

		const siteUrl = new URL( Jetpack_Boost.site.url );
		const normalizePath = ( p: string ) => p.replace( /\/$/, '' ) || '/';
		const sitePath = normalizePath( siteUrl.pathname );

		for ( const line of lines ) {
			try {
				const url = resolveUrlForSite( line, siteUrl );

				// Check for malformed URLs with double slashes
				if ( url.pathname.includes( '//' ) ) {
					throw new Error(
						/* translators: %s is the URL that is malformed. */
						sprintf( __( 'Invalid URL format: %s', 'jetpack-boost' ), line )
					);
				}

				if ( ! isSameSiteUrl( url, siteUrl ) ) {
					throw new Error(
						/* translators: %s is the URL that didn't match the site URL */
						sprintf( __( 'The URL seems to be a different site: %s', 'jetpack-boost' ), line )
					);
				}

				if ( normalizePath( url.pathname ) === sitePath ) {
					throw new Error(
						__(
							'The homepage does not need to be added to the list, as it is automatically included.',
							'jetpack-boost'
						)
					);
				}
			} catch ( e ) {
				if ( e instanceof Error && e.message.includes( 'Invalid URL' ) ) {
					throw new Error(
						/* translators: %s is the URL that is invalid. */
						sprintf( __( 'Invalid URL: %s', 'jetpack-boost' ), line )
					);
				}
				throw e;
			}
		}

		return true;
	};

	function save() {
		const processedLines = processInputLines( inputValue );

		setItems( processedLines.join( '\n' ) );
		recordBoostEvent( 'cornerstone_pages_save', {
			list_length: processedLines.length,
		} );
	}

	function loadDefaultValue() {
		validateInputValue( defaultValue );
		recordBoostEvent( 'cornerstone_pages_load_default', {} );
	}

	return (
		<div className={ inputInvalid ? styles[ 'has-error' ] : '' }>
			<textarea
				value={ inputValue }
				rows={ inputRows }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-cornerstone-pages"
			/>
			{ inputInvalid && <span className={ styles.error }>{ validationError?.message }</span> }
			{ description && <div className={ styles.description }>{ description }</div> }
			<Button
				disabled={ items === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
			<Button
				disabled={ inputValue === defaultValue }
				onClick={ loadDefaultValue }
				className={ styles.button }
				variant="link"
			>
				{ __( 'Load default pages', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Meta;
