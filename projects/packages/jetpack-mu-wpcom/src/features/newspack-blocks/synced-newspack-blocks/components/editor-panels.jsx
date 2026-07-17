/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { BaseControl, CheckboxControl, PanelBody, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const CheckboxesGroup = ( { options, values, onChange, defaultRequiredSlug = null } ) => {
	if ( ! Array.isArray( options ) ) {
		return <Spinner />;
	}
	return options.map( ( { name, slug } ) => {
		const isDefault = defaultRequiredSlug && slug === defaultRequiredSlug;
		const otherOptionsSelected = defaultRequiredSlug && values.some( value => value !== defaultRequiredSlug );
		const isDisabled = isDefault && ! otherOptionsSelected;

		return (
			<CheckboxControl
				label={ name }
				checked={ values.indexOf( slug ) > -1 }
				disabled={ isDisabled }
				onChange={ value => {
					const cleanOptions = [ ...new Set( values ) ];
					if ( value && cleanOptions.indexOf( slug ) === -1 ) {
						cleanOptions.push( slug );
					} else if ( ! value && cleanOptions.indexOf( slug ) > -1 ) {
						cleanOptions.splice( cleanOptions.indexOf( slug ), 1 );
					}
					// If no options would be selected, force the default required one
					if ( defaultRequiredSlug && cleanOptions.length === 0 ) {
						cleanOptions.push( defaultRequiredSlug );
					}
					onChange( cleanOptions );
				} }
				key={ slug }
			/>
		);
	} );
};

export const PostTypesPanel = ( { attributes, setAttributes } ) => {
	const { availablePostTypes } = useSelect( select => {
		const { getPostTypes } = select( 'core' );
		const listingsLabel = __( 'Listings', 'jetpack-mu-wpcom' );
		return {
			availablePostTypes: getPostTypes( { per_page: -1 } )
				?.filter( ( { supports: { newspack_blocks: newspackBlocks } } ) => newspackBlocks )
				?.map( postType => {
					// Disambiguate the "Listings" post types.
					if (
						postType.slug.indexOf( 'newspack_lst' ) === 0 &&
						postType.slug !== 'newspack_lst_generic' &&
						postType.name.indexOf( listingsLabel ) === -1
					) {
						postType.name = `${ postType.name } ${ listingsLabel }`;
					}
					return postType;
				} ),
		};
	} );

	return (
		<PanelBody title={ __( 'Post Types', 'jetpack-mu-wpcom' ) } initialOpen={ false }>
			<CheckboxesGroup
				options={ availablePostTypes }
				values={ attributes.postType }
				onChange={ postType => setAttributes( { postType } ) }
				defaultRequiredSlug="post"
			/>
		</PanelBody>
	);
};

export const PostStatusesPanel = ( { attributes, setAttributes } ) => {
	return (
		<PanelBody title={ __( 'Additional Post Statuses', 'jetpack-mu-wpcom' ) } initialOpen={ false }>
			<BaseControl help={ __( 'Selection here has effect only for editors, regular users will only see published posts.', 'jetpack-mu-wpcom' ) } />
			<CheckboxesGroup
				values={ attributes.includedPostStatuses }
				options={ [
					{ name: 'Draft', slug: 'draft' },
					{ name: 'Scheduled', slug: 'future' },
				] }
				onChange={ includedPostStatuses => setAttributes( { includedPostStatuses } ) }
			/>
		</PanelBody>
	);
};
