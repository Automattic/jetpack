import { DataSyncProvider } from '@automattic/jetpack-react-data-sync-client';
import { useEffect, useState } from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { type Props, useMetaQuery, useConfig } from '$lib/stores/minify';

const MetaComponent = ( { inputLabel, buttonText, placeholder, datasyncKey }: Props ) => {
	const config = useConfig();
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
		<div className="jb-critical-css__meta">
			{ isEditing ? (
				<div className="manage-excludes">
					<label htmlFor={ htmlId }>{ inputLabel }</label>
					<input
						type="text"
						value={ inputValue }
						placeholder={ placeholder }
						id={ htmlId }
						onChange={ e => setInputValue( e.target.value ) }
					/>
					<div className="buttons-container">
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
					<div className="summary">
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

					<button
						type="button"
						className="jb-collapsible-meta__edit-button components-button is-link"
						onClick={ () => setIsEditing( true ) }
					>
						<img
							className="edit-icon"
							src={ `${ config.plugin_dir_url }/app/assets/static/images/pencil.svg` }
							alt={ __( 'Edit', 'jetpack-boost' ) }
						/>
						{ buttonText }
					</button>
				</>
			) }
		</div>
	);
};

export default function ( props: Props ) {
	return (
		<DataSyncProvider>
			<MetaComponent { ...props } />
		</DataSyncProvider>
	);
}
