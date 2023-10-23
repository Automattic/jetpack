import { useDataSync, useReadonlyDataSync } from '@automattic/jetpack-react-data-sync-client';
import { useState } from 'react';
import { z } from 'zod';
import { __, sprintf } from '@wordpress/i18n';

export const minifyMetaOptions = {
	minify_js_excludes: z.array( z.string() ),
	minify_css_excludes: z.array( z.string() ),
};

type MinifyMetaKeys = keyof typeof minifyMetaOptions;

interface Props {
	datasyncKey: MinifyMetaKeys;
	inputLabel: string;
	buttonText: string;
	placeholder: string;
	value: string[];
}

let nextIdIndex = 0;

const MetaComponent = ( { inputLabel, buttonText, placeholder, datasyncKey }: Props ) => {
	const { data, mutate } = useDataSync(
		'jetpack_boost_ds',
		datasyncKey,
		minifyMetaOptions[ datasyncKey ]
	);
	const { data: config } = useReadonlyDataSync(
		'jetpack_boost_ds',
		'config',
		z.object( {
			plugin_dir_url: z.string().url(),
		} )
	);
	const [ isEditing, setIsEditing ] = useState( false );
	const htmlId = `minify-meta-exclude-list-${ nextIdIndex++ }`;

	const initialValue = data.join( ', ' );
	const [ inputValue, setInputValue ] = useState( () => initialValue );

	function save() {
		mutate( inputValue.trim().split( ', ' ) );
		setIsEditing( false );
	}

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
						<button disabled={ initialValue === inputValue } onClick={ save }>
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
						{ initialValue.length > 0 && (
							<div className="successes">
								{ sprintf(
									/* Translators: %s refers to the list of excluded items. */
									__( 'Except: %s', 'jetpack-boost' ),
									initialValue
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
						{ /* @TODO: i18n */ }
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

export default MetaComponent;
