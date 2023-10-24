import { DataSyncProvider, useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useEffect, useState } from 'react';
import { z } from 'zod';
import { __, sprintf } from '@wordpress/i18n';

export const minifyMetaOptions = [ 'minify_js_excludes', 'minify_css_excludes' ] as const;

type MinifyMetaKeys = ( typeof minifyMetaOptions )[ number ];

interface Props {
	datasyncKey: MinifyMetaKeys;
	inputLabel: string;
	buttonText: string;
	placeholder: string;
	value: string[];
}

const useMetaQuery = ( key: MinifyMetaKeys ) => {
	const { useQuery, useMutation } = useDataSync( 'jetpack_boost_ds', key, z.array( z.string() ) );
	const { data } = useQuery();
	const { mutate } = useMutation();

	function updateValues( text: string ) {
		mutate( text.split( ',' ).map( item => item.trim() ) );
	}

	return [ data, updateValues ] as const;
};

const useConfig = () => {
	const { useQuery } = useDataSync(
		'jetpack_boost_ds',
		'config',
		z.object( {
			plugin_dir_url: z.string().url(),
		} )
	);
	const { data } = useQuery();

	return data;
};

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
						{ /* @TODO: Move static assets to /app/assets/static */ }
						{ /* @TODO: Colorize the pencil */ }
						<img
							className="edit-icon"
							src={ `${ config.plugin_dir_url }/app/assets/src/js/svg/pencil.svg` }
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
