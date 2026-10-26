import { Field, Input, Text, Textarea } from '@wordpress/ui';
import type { Catalog, CatalogItem, FieldDef } from '../types';

type Props = {
	item: CatalogItem;
	config: Record< string, string >;
	catalog: Catalog;
	tokens: string[];
	onChange: ( config: Record< string, string > ) => void;
};

const optionsFor = ( field: FieldDef, catalog: Catalog ) => {
	if ( field.type === 'user' ) {
		return catalog.users;
	}
	return field.type === 'role' ? catalog.roles : field.options;
};

/**
 *
 * @param root0
 * @param root0.item
 * @param root0.config
 * @param root0.catalog
 * @param root0.tokens
 * @param root0.onChange
 */
export function StepFields( { item, config, catalog, tokens, onChange }: Props ) {
	const value = ( name: string, fallback = '' ) => config[ name ] ?? fallback;
	const set = ( name: string, next: string ) => onChange( { ...config, [ name ]: next } );

	const control = ( field: FieldDef ) => {
		const options = optionsFor( field, catalog );
		if ( options ) {
			return (
				<Field.Control
					render={
						<select
							className="jetpack-flow-select"
							value={ value( field.name, field.default ) }
							onChange={ event => set( field.name, event.target.value ) }
						>
							{ field.type === 'user' && <option value="">—</option> }
							{ options.map( option => (
								<option key={ option.value } value={ option.value }>
									{ option.label }
								</option>
							) ) }
						</select>
					}
				/>
			);
		}
		if ( field.type === 'textarea' ) {
			return (
				<Textarea
					rows={ 4 }
					value={ value( field.name, field.default ) }
					onValueChange={ next => set( field.name, next ) }
				/>
			);
		}
		return (
			<Input
				type={ field.type === 'url' ? 'url' : 'text' }
				value={ value( field.name, field.default ) }
				onValueChange={ next => set( field.name, next ) }
			/>
		);
	};

	return (
		<div className="jetpack-flow-fields">
			{ item.fields.map( field => {
				const visible = Object.entries( field.showIf ?? {} ).every(
					( [ key, expected ] ) =>
						( config[ key ] ?? item.fields.find( f => f.name === key )?.default ) === expected
				);
				if ( ! visible ) {
					return null;
				}

				return (
					<Field.Root key={ field.name }>
						<Field.Label>{ field.label }</Field.Label>
						{ control( field ) }
					</Field.Root>
				);
			} ) }
			{ tokens.length > 0 && (
				<Text variant="body-sm" className="jetpack-flow-tokens">
					{ tokens.map( token => `{{${ token }}}` ).join( '  ' ) }
				</Text>
			) }
		</div>
	);
}
