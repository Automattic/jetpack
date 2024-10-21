import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
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
				<BypassPatterns patterns={ foundationPages.join( '\n' ) } setPatterns={ updatePatterns } />
			</div>
		</div>
	);
};

type BypassPatternsProps = {
	patterns: string;
	setPatterns: ( newValue: string ) => void;
};

const BypassPatterns: React.FC< BypassPatternsProps > = ( { patterns, setPatterns } ) => {
	const [ inputValue, setInputValue ] = useState( patterns );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
	};

	useEffect( () => {
		setInputValue( patterns );
	}, [ patterns ] );

	function save() {
		setPatterns( inputValue );
	}

	return (
		<div className={ styles.section }>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-foundation-pages"
			/>
			<Button disabled={ patterns === inputValue } onClick={ save } className={ styles.button }>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default Meta;
