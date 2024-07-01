import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery } from '$lib/stores/minify';
import styles from './minify-meta.module.scss';
import { Button } from '@automattic/jetpack-components';
import Pencil from '$svg/pencil';

const MetaComponent = ( { inputLabel, buttonText, placeholder, datasyncKey }: Props ) => {
	const [ values, updateValues ] = useMetaQuery( datasyncKey );
	const [ inputValue, setInputValue ] = useState( () => values.join( ', ' ) );
	const [ isEditing, setIsEditing ] = useState( false );

	useEffect( () => {
		setInputValue( values.join( ', ' ) );
	}, [ values ] );

	function save() {
		updateValues( inputValue );
		setIsEditing( false );
	}

	const htmlId = `jb-minify-meta-${ datasyncKey }`;

	return (
		<div className={ styles[ 'minify-meta' ] } data-testid={ `meta-${ datasyncKey }` }>
			{ isEditing ? (
				<div className={ styles[ 'manage-excludes' ] }>
					<label htmlFor={ htmlId }>{ inputLabel }</label>
					<input
						type="text"
						value={ inputValue }
						placeholder={ placeholder }
						id={ htmlId }
						onChange={ e => setInputValue( e.target.value ) }
					/>
					<div className={ styles[ 'buttons-container' ] }>
						<button disabled={ values.join( ', ' ) === inputValue } onClick={ save }>
							{ __( 'Save', 'jetpack-boost' ) }
						</button>
						<button onClick={ () => setIsEditing( false ) }>
							{ __( 'Cancel', 'jetpack-boost' ) }
						</button>
					</div>
				</div>
			) : (
				<>
					<div className={ styles.summary }>
						{ values.length > 0 && (
							<div className="successes">
								{ sprintf(
									/* Translators: %s refers to the list of excluded items. */
									__( 'Except: %s', 'jetpack-boost' ),
									values.join( ', ' )
								) }
							</div>
						) }
					</div>

					<Button
						variant="link"
						size="small"
						weight="regular"
						className={ styles[ 'edit-button' ] }
						onClick={ () => setIsEditing( true ) }
						icon={ <Pencil /> }
					>
						{ buttonText }
					</Button>
				</>
			) }
		</div>
	);
};

export default MetaComponent;
