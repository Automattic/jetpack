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

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ foundationPages, setFoundationPages ] = useFoundationPages();
	const foundationPagesProperties = useFoundationPagesProperties();

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		setFoundationPages( newPatterns );
	};

	let content = null;

	if ( foundationPagesProperties !== undefined ) {
		content = (
			<BypassPatterns
				patterns={ foundationPages.join( '\n' ) }
				setPatterns={ updatePatterns }
				maxPatterns={ foundationPagesProperties.max_pages }
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

type BypassPatternsProps = {
	patterns: string;
	setPatterns: ( newValue: string ) => void;
	maxPatterns: number;
};

const BypassPatterns: React.FC< BypassPatternsProps > = ( {
	patterns,
	setPatterns,
	maxPatterns,
} ) => {
	const [ inputValue, setInputValue ] = useState( patterns );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ inputInvalid, setInputInvalid ] = useState( false );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		setInputInvalid( ! validatePatterns( value ) );
	};

	const validatePatterns = ( value: string ) => {
		const lines = value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line.trim() !== '' );

		// There should always be at least one foundation page.
		if ( lines.length === 0 ) {
			return false;
		}

		// Check if the number of patterns exceeds maxPatterns
		if ( lines.length > maxPatterns ) {
			return false;
		}

		return true;
	};

	useEffect( () => {
		setInputValue( patterns );
	}, [ patterns ] );

	function save() {
		setPatterns( inputValue );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-foundation-pages"
			/>
			{ inputInvalid && (
				<p className={ styles.error }>
					{ sprintf(
						/* translators: %d is the maximum number of foundation pages. */
						_n(
							'You can have only %d foundation page.',
							'You can have only %d foundation pages.',
							maxPatterns,
							'jetpack-boost'
						),
						maxPatterns
					) }
				</p>
			) }
			<Button
				disabled={ patterns === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Meta;
