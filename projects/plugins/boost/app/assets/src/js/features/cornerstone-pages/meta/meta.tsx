import { isCriticalCssEnabled } from '$features/critical-css/lib/is-critical-css-enabled';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';
import { useRegenerationReason } from '$features/critical-css/lib/stores/suggest-regenerate';
import { useLcpState } from '$features/lcp/lib/stores/lcp-state';
import { useModulesState } from '$features/module/lib/stores';
import { useNotices } from '$features/notice/context';
import InterstitialModalCTA from '$features/upgrade-cta/interstitial-modal-cta';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import getSupportLink from '$lib/utils/get-support-link';
import { isSameSiteUrl } from '$lib/utils/is-same-site-url';
import { Button, getRedirectUrl, Notice } from '@automattic/jetpack-components';
import { ExternalLink, Tooltip } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import type { FC, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
	useCornerstonePagesProperties,
	useCustomCornerstonePages,
} from '../lib/stores/cornerstone-pages';
import styles from './meta.module.scss';

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
					.filter( Boolean ) // Filter empty lines for better UX
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

type LoadDefaultsButtonProps = {
	defaultValue: string;
	inputValue: string;
	maxPages: number;
	onValueChange: ( value: string ) => void;
	className?: string;
};

const LoadDefaultsButton: FC< LoadDefaultsButtonProps > = ( {
	defaultValue,
	inputValue,
	maxPages,
	onValueChange,
	className,
} ) => {
	const { setNotice } = useNotices();

	const parsePages = ( value: string ) =>
		value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( Boolean );

	const defaultPages = useMemo( () => parsePages( defaultValue ), [ defaultValue ] );
	const currentPages = useMemo( () => parsePages( inputValue ), [ inputValue ] );

	const loadDefaultValue = () => {
		// Handle clearing case first - when no defaults available but has existing pages
		if ( defaultPages.length === 0 && currentPages.length > 0 ) {
			onValueChange( '' );
			setNotice( {
				id: 'cornerstone-load-defaults',
				type: 'success',
				message: __( 'Custom pages cleared.', 'jetpack-boost' ),
			} );
			recordBoostEvent( 'cornerstone_pages_clear_custom', {
				cleared_count: currentPages.length,
			} );
			return;
		}

		// Calculate available slots and pages to load
		const availableSlots = maxPages - currentPages.length;
		const pagesToLoad = defaultPages.slice( 0, availableSlots );

		// Load the pages
		onValueChange( pagesToLoad.join( '\n' ) );

		// Show appropriate feedback
		if ( pagesToLoad.length < defaultPages.length ) {
			setNotice( {
				id: 'cornerstone-load-defaults',
				type: 'error',
				message: sprintf(
					/* translators: %1$d is pages loaded, %2$d is total available pages */
					__( 'Loaded %1$d of %2$d default pages (plan limit reached).', 'jetpack-boost' ),
					pagesToLoad.length,
					defaultPages.length
				),
			} );
		} else {
			setNotice( {
				id: 'cornerstone-load-defaults',
				type: 'success',
				message: sprintf(
					/* translators: %d is the number of pages loaded */
					_n(
						'Loaded %d default page.',
						'Loaded %d default pages.',
						pagesToLoad.length,
						'jetpack-boost'
					),
					pagesToLoad.length
				),
			} );
		}

		recordBoostEvent( 'cornerstone_pages_load_default', {
			loaded_count: pagesToLoad.length,
			available_count: defaultPages.length,
			was_truncated: pagesToLoad.length < defaultPages.length ? 'true' : 'false',
		} );
	};

	// Button state logic - just calculate it directly, it's cheap
	const getButtonState = () => {
		const hasDefaults = defaultPages.length > 0;
		const hasCurrentPages = currentPages.length > 0;

		if ( ! hasDefaults ) {
			return hasCurrentPages
				? {
						disabled: false,
						title: __( 'Clear custom pages (no default pages available).', 'jetpack-boost' ),
				  }
				: {
						disabled: true,
						title: __(
							'No default pages found. No compatible plugins with viable pages detected.',
							'jetpack-boost'
						),
				  };
		}

		if ( inputValue === defaultValue ) {
			return { disabled: true, title: __( 'Default pages are already loaded.', 'jetpack-boost' ) };
		}

		if ( currentPages.length >= maxPages ) {
			return {
				disabled: true,
				title: sprintf(
					/* translators: %d is the maximum number of pages allowed */
					__(
						'Cannot load defaults. You have reached your plan limit of %d pages.',
						'jetpack-boost'
					),
					maxPages
				),
			};
		}

		const pagesToLoad = Math.min( defaultPages.length, maxPages - currentPages.length );
		const willTruncate = pagesToLoad < defaultPages.length;

		const tooltip = willTruncate
			? sprintf(
					/* translators: %1$d is pages that will be loaded, %2$d is total available pages */
					__( 'Will load %1$d of %2$d default pages (plan limit).', 'jetpack-boost' ),
					pagesToLoad,
					defaultPages.length
			  )
			: sprintf(
					/* translators: %d is the number of pages that will be loaded */
					_n(
						'Load %d default page from compatible plugins.',
						'Load %d default pages from compatible plugins.',
						defaultPages.length,
						'jetpack-boost'
					),
					defaultPages.length
			  );

		return { disabled: false, title: tooltip };
	};

	const buttonState = getButtonState();

	return (
		<Tooltip text={ buttonState.title }>
			<div>
				<Button
					disabled={ buttonState.disabled }
					onClick={ loadDefaultValue }
					className={ className }
					variant="link"
				>
					{ __( 'Load default pages', 'jetpack-boost' ) }
				</Button>
			</div>
		</Tooltip>
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

	const maxPages = maxItems || 0;

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		try {
			validateItems( value );
			setValidationError( null );
		} catch ( e ) {
			setValidationError( e as Error );
		}
	};

	// Helper function to resolve paths for multisite homepage detection
	const getResolvedPath = ( pathname: string, siteUrl: URL ): string => {
		// For multisite subdirectory installations, "/" should resolve to the site's base path
		if ( pathname === '/' ) {
			return siteUrl.pathname;
		}
		return pathname;
	};

	const validateItems = ( value: string ) => {
		const lines = value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( Boolean );

		// Allow empty input - user can clear all cornerstone pages
		if ( lines.length === 0 ) {
			return true;
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

		for ( const line of lines ) {
			let url: URL | undefined;
			let pathname: string | undefined;

			try {
				url = new URL( line );
				pathname = url.pathname;
			} catch {
				// If the URL is invalid, they have provided a relative URL, which we will allow.
				pathname = line;
			}

			if ( url && ! isSameSiteUrl( url, siteUrl ) ) {
				throw new Error(
					/* translators: %s is the URL that didn't match the site URL */
					sprintf( __( 'The URL seems to be a different site: %s', 'jetpack-boost' ), line )
				);
			}

			// Fixed multisite homepage detection
			const resolvedPath = getResolvedPath( pathname, siteUrl );
			if ( resolvedPath === siteUrl.pathname ) {
				throw new Error(
					__(
						'The homepage does not need to be added to the list, as it is automatically included.',
						'jetpack-boost'
					)
				);
			}
		}

		return true;
	};

	function save() {
		setItems( inputValue );
		const pageCount = inputValue
			.split( '\n' )
			.map( line => line.trim() )
			.filter( Boolean ).length;
		recordBoostEvent( 'cornerstone_pages_save', {
			list_length: pageCount,
		} );
	}

	const handleValueChange = ( newValue: string ) => {
		validateInputValue( newValue );
	};

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
			<div className={ styles.buttonGroup }>
				<Button
					disabled={ items === inputValue || inputInvalid }
					onClick={ save }
					className={ styles.button }
				>
					{ __( 'Save', 'jetpack-boost' ) }
				</Button>
				<LoadDefaultsButton
					defaultValue={ defaultValue }
					inputValue={ inputValue }
					maxPages={ maxPages }
					onValueChange={ handleValueChange }
					className={ styles.button }
				/>
			</div>
		</div>
	);
};

export default Meta;
