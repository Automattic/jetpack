import { Button } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './meta.module.scss';
import { useFoundationPages } from '../lib/stores/foundation-pages';

const Meta = () => {
	const [ foundationPages, setFoundationPages ] = useFoundationPages();

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		setFoundationPages( newPatterns );
	};

	return (
		<div className={ styles.wrapper } data-testid="foundation-pages-meta">
			<div className={ styles.body }>
				<BypassPatterns
					patterns={ foundationPages.join( '\n' ) }
					setPatterns={ updatePatterns }
					maxPatterns={ 1 }
				/>
			</div>
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
			<Button
				disabled={ patterns === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
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
		</div>
	);
};

export default Meta;
