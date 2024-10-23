import { Button, Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './meta.module.scss';
import { useFoundationPages, useFoundationPagesProperties } from '../lib/stores/foundation-pages';
import { createInterpolateElement } from '@wordpress/element';
import { recordBoostEvent } from '$lib/utils/analytics';
import getSupportLink from '$lib/utils/get-support-link';
import { useRegenerationReason } from '$features/critical-css/lib/stores/suggest-regenerate';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ foundationPages, setFoundationPages ] = useFoundationPages();
	const foundationPagesProperties = useFoundationPagesProperties();
	const [ { refetch: refetchRegenerationReason } ] = useRegenerationReason();

	const updateFoundationPages = ( newValue: string ) => {
		const newItems = newValue.split( '\n' ).map( line => line.trim() );

		setFoundationPages( newItems, () => {
			refetchRegenerationReason();
		} );
	};

	let content = null;

	if ( foundationPagesProperties !== undefined ) {
		content = (
			<List
				items={ foundationPages.join( '\n' ) }
				setItems={ updateFoundationPages }
				maxItems={ foundationPagesProperties.max_pages }
				description={ createInterpolateElement(
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
										recordBoostEvent( 'foundation_pages_properties_failed', {} );
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
		<div className={ styles.wrapper } data-testid="foundation-pages-meta">
			<div className={ styles.head }>
				<div className={ styles.summary }>
					{ foundationPagesProperties &&
						sprintf(
							/* translators: %1$d is the number of foundation pages added, %2$d is the maximum number allowed */
							__( '%1$d / %2$d added', 'jetpack-boost' ),
							foundationPages.length,
							foundationPagesProperties.max_pages
						) }
				</div>
				<div className={ styles.actions }>
					<Button
						variant="link"
						size="small"
						weight="regular"
						iconSize={ 16 }
						icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
						onClick={ () => setIsExpanded( ! isExpanded ) }
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
};

const List: React.FC< ListProps > = ( { items, setItems, maxItems, description } ) => {
	const [ inputValue, setInputValue ] = useState( items );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ inputInvalid, setInputInvalid ] = useState( false );

	const inputRows = Math.min( maxItems, 10 );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		setInputInvalid( ! validateItems( value ) );
	};

	const validateItems = ( value: string ) => {
		const lines = value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line.trim() !== '' );

		// Check if the number of items exceeds maxItems
		if ( lines.length > maxItems ) {
			return false;
		}

		return true;
	};

	useEffect( () => {
		setInputValue( items );
	}, [ items ] );

	function save() {
		setItems( inputValue );
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
				id="jb-foundation-pages"
			/>
			{ inputInvalid && (
				<p className={ styles.error }>
					{ sprintf(
						/* translators: %d is the maximum number of foundation page URLs. */
						_n(
							'You can add only %d foundation page URL.',
							'You can add up to %d foundation page URLs.',
							maxItems,
							'jetpack-boost'
						),
						maxItems
					) }
				</p>
			) }
			{ description && <div className={ styles.description }>{ description }</div> }
			<Button
				disabled={ items === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Meta;
