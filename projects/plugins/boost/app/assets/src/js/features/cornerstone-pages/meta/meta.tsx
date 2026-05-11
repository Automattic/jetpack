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
import { Button, getRedirectUrl } from '@automattic/jetpack-components';
import { Tooltip } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Notice, Link } from '@wordpress/ui';
import type { FC, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
	useCornerstonePagesProperties,
	useCustomCornerstonePages,
} from '../lib/stores/cornerstone-pages';
import styles from './meta.module.scss';

export const MetaError = () => (
	<Notice.Root intent="warning">
		<Notice.Title>{ __( 'Failed to load', 'jetpack-boost' ) }</Notice.Title>
		<Notice.Description>
			<p>
				{ createInterpolateElement(
					__(
						'Refresh the page and try again. If the issue persists, please <link>contact support</link>.',
						'jetpack-boost'
					),
					{
						link: (
							<Link
								openInNewTab
								href={ getSupportLink() }
								onClick={ () => {
									recordBoostEvent( 'cornerstone_pages_properties_failed', {} );
								} }
							/>
						),
					}
				) }
			</p>
		</Notice.Description>
	</Notice.Root>
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
							<Link
								openInNewTab
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

	// Calculate derived state once
	const defaultsAvailability = useMemo( () => {
		const hasDefaults = defaultPages.length > 0;
		const missingDefaults = defaultPages.filter( p => ! currentPages.includes( p ) );
		const availableSlots = Math.max( 0, maxPages - currentPages.length );
		const hasAllDefaults = missingDefaults.length === 0;

		return {
			hasDefaults,
			missingDefaults,
			availableSlots,
			hasAllDefaults,
		};
	}, [ defaultPages, currentPages, maxPages ] );

	const getTooltipMessage = ( missingDefaults: string[], availableSlots: number ) => {
		const pagesToLoad = Math.min( missingDefaults.length, availableSlots );
		const willTruncate = pagesToLoad < missingDefaults.length;

		return willTruncate
			? sprintf(
					/* translators: %1$d is pages that will be included, %2$d is total available pages */
					__( 'Include %1$d of %2$d default pages (plan limit).', 'jetpack-boost' ),
					pagesToLoad,
					missingDefaults.length
			  )
			: sprintf(
					/* translators: %d is the number of pages that will be included */
					_n(
						'Include %d default page from compatible plugins.',
						'Include %d default pages from compatible plugins.',
						pagesToLoad,
						'jetpack-boost'
					),
					pagesToLoad
			  );
	};

	const loadDefaultValue = () => {
		// Use pre-calculated values
		const { missingDefaults, availableSlots } = defaultsAvailability;
		const toAppend = missingDefaults.slice( 0, availableSlots );
		const newPages = [ ...currentPages, ...toAppend ];

		// Update the input value with the combined list
		onValueChange( newPages.join( '\n' ) );

		// Show appropriate feedback
		if ( toAppend.length < missingDefaults.length ) {
			setNotice( {
				id: 'cornerstone-load-defaults',
				type: 'error',
				message: sprintf(
					/* translators: %1$d is pages included, %2$d is total available pages */
					__( 'Included %1$d of %2$d default pages (plan limit reached).', 'jetpack-boost' ),
					toAppend.length,
					missingDefaults.length
				),
			} );
		} else {
			setNotice( {
				id: 'cornerstone-load-defaults',
				type: 'success',
				message: sprintf(
					/* translators: %d is the number of pages included */
					_n(
						'Included %d default page.',
						'Included %d default pages.',
						toAppend.length,
						'jetpack-boost'
					),
					toAppend.length
				),
			} );
		}

		recordBoostEvent( 'cornerstone_pages_load_default', {
			loaded_count: toAppend.length,
			available_count: missingDefaults.length,
			was_truncated: toAppend.length < missingDefaults.length ? 'true' : 'false',
		} );
	};

	// Simplified button state logic using pre-calculated values
	const getButtonState = () => {
		const { hasDefaults, missingDefaults, availableSlots, hasAllDefaults } = defaultsAvailability;

		if ( ! hasDefaults ) {
			return {
				disabled: true,
				title: __( 'No default pages available. Add pages manually.', 'jetpack-boost' ),
			};
		}

		if ( hasAllDefaults ) {
			return {
				disabled: true,
				title: __( 'Default pages are already included.', 'jetpack-boost' ),
			};
		}

		// Handle case where user has reached plan limit
		if ( availableSlots === 0 ) {
			return {
				disabled: true,
				title: __( 'Cannot include defaults. Plan limit reached.', 'jetpack-boost' ),
			};
		}

		return {
			disabled: false,
			title: getTooltipMessage( missingDefaults, availableSlots ),
		};
	};

	const buttonState = getButtonState();

	return (
		<Tooltip text={ buttonState.title } delay={ 0 }>
			<div>
				<Button
					disabled={ buttonState.disabled }
					onClick={ loadDefaultValue }
					className={ className }
					variant="link"
				>
					{ __( 'Include default pages', 'jetpack-boost' ) }
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

			// Only consider it homepage if it has no query parameters
			const resolvedPath = getResolvedPath( pathname, siteUrl );
			if ( resolvedPath === siteUrl.pathname && ! url?.search ) {
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
				<Button disabled={ items === inputValue || inputInvalid } onClick={ save }>
					{ __( 'Save', 'jetpack-boost' ) }
				</Button>
				<LoadDefaultsButton
					defaultValue={ defaultValue }
					inputValue={ inputValue }
					maxPages={ maxItems }
					onValueChange={ handleValueChange }
				/>
			</div>
		</div>
	);
};

export default Meta;
