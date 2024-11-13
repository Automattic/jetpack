import { Button, Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './meta.module.scss';
import {
	useCornerstonePages,
	useCornerstonePagesProperties,
} from '../lib/stores/cornerstone-pages';
import { createInterpolateElement } from '@wordpress/element';
import { recordBoostEvent } from '$lib/utils/analytics';
import getSupportLink from '$lib/utils/get-support-link';
import { useRegenerationReason } from '$features/critical-css/lib/stores/suggest-regenerate';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { useNavigate } from 'react-router-dom';
import { useRegenerateCriticalCssAction } from '$features/critical-css/lib/stores/critical-css-state';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ cornerstonePages, setCornerstonePages ] = useCornerstonePages();
	const cornerstonePagesProperties = useCornerstonePagesProperties();
	const [ { refetch: refetchRegenerationReason } ] = useRegenerationReason();
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );
	const navigate = useNavigate();
	const regenerateAction = useRegenerateCriticalCssAction();

	const toggleExpanded = ( newValue: boolean ) => {
		recordBoostEvent( 'cornerstone_pages_show_options_toggle', {
			status: newValue ? 'open' : 'close',
		} );
		setIsExpanded( newValue );
	};

	const updateCornerstonePages = ( newValue: string ) => {
		const newItems = newValue.split( '\n' ).map( line => line.trim() );

		setCornerstonePages( newItems, () => {
			refetchRegenerationReason();
			if ( isPremium ) {
				regenerateAction.mutate();
			}
		} );
	};

	let content = null;

	if ( cornerstonePagesProperties !== undefined ) {
		content = (
			<List
				items={ cornerstonePages.join( '\n' ) }
				setItems={ updateCornerstonePages }
				maxItems={ cornerstonePagesProperties.max_pages }
				defaultValue={ cornerstonePagesProperties.default_pages.join( '\n' ) }
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
						{ ! isPremium && (
							<>
								<br />
								<br />
								<b>
									{ createInterpolateElement(
										sprintf(
											/* translators: %d is the number of cornerstone pages. */
											__(
												'Premium users can add up to %d cornerstone pages. <link>Upgrade now</link>.',
												'jetpack-boost'
											),
											cornerstonePagesProperties.max_pages_premium
										),
										{
											link: (
												// eslint-disable-next-line jsx-a11y/anchor-has-content
												<a
													href="#/upgrade"
													onClick={ () => {
														recordBoostEvent( 'cornerstone_pages_upgrade_link_clicked', {} );
														navigate( '/upgrade' );
													} }
												/>
											),
										}
									) }
								</b>
							</>
						) }
					</>
				}
			/>
		);
	} else {
		content = (
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
								// eslint-disable-next-line jsx-a11y/anchor-has-content
								<a
									href={ getSupportLink() }
									target="_blank"
									rel="noopener noreferrer"
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
	}

	return (
		<div className={ styles.wrapper } data-testid="cornerstone-pages-meta">
			<div className={ styles.head }>
				<div className={ styles.summary }>
					{ cornerstonePagesProperties &&
						sprintf(
							/* translators: %1$d is the number of cornerstone pages added, %2$d is the maximum number allowed */
							__( '%1$d / %2$d added', 'jetpack-boost' ),
							cornerstonePages.length,
							cornerstonePagesProperties.max_pages
						) }
				</div>
				<div className={ styles.actions }>
					<Button
						variant="link"
						size="small"
						weight="regular"
						iconSize={ 16 }
						icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
						onClick={ () => toggleExpanded( ! isExpanded ) }
					>
						{ __( 'Show Options', 'jetpack-boost' ) }
					</Button>
				</div>
			</div>
			{ isExpanded && <div className={ styles.body }>{ content }</div> }
		</div>
	);
};

type ListProps = {
	items: string;
	setItems: ( newValue: string ) => void;
	maxItems: number;
	description: React.ReactNode | null;
	defaultValue?: string;
};

const List: React.FC< ListProps > = ( {
	items,
	setItems,
	maxItems,
	description,
	defaultValue,
} ) => {
	const [ inputValue, setInputValue ] = useState( items );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ inputInvalid, setInputInvalid ] = useState( false );
	const [ validationError, setValidationError ] = useState< Error | null >( null );

	const inputRows = Math.min( maxItems, 10 );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		try {
			const isValid = validateItems( value );
			setInputInvalid( ! isValid );
			setValidationError( null );
		} catch ( e ) {
			setInputInvalid( true );
			setValidationError( e as Error );
		}
	};

	const validateItems = ( value: string ) => {
		const lines = value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line.trim() !== '' );

		if ( lines.length === 0 ) {
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

		for ( const line of lines ) {
			let url: URL | undefined;
			try {
				url = new URL( line );
			} catch ( e ) {
				// If the URL is invalid, they have provided a relative URL, which we will allow.
			}
			if (
				url &&
				! ( url.origin + url.pathname ).replace( /\/$/, '' ).startsWith(
					Jetpack_Boost.site.url.replace( /\/$/, '' )
				)
			) {
				throw new Error(
					/* translators: %s is the URL that didn't match the site URL */
					sprintf( __( 'The URL seems to be a different site: %s', 'jetpack-boost' ), line )
				);
			}
		}

		return true;
	};

	useEffect( () => {
		setInputValue( items );
	}, [ items ] );

	function save() {
		setItems( inputValue );
		recordBoostEvent( 'cornerstone_pages_save', {
			list_length: inputValue.split( '\n' ).length,
		} );
	}

	function loadDefaultValue() {
		setInputValue( defaultValue || '' );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
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
				{ __( 'Load Default', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Meta;
