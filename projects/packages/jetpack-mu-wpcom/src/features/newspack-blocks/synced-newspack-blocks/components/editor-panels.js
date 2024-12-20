/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Spinner, CheckboxControl, PanelBody, PanelRow } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

const CheckboxesGroup = ( { options, values, onChange } ) => {
	if ( ! Array.isArray( options ) ) {
		return <Spinner />;
	}
	return options.map( ( { name, slug } ) => (
		<PanelRow key={ slug }>
			<CheckboxControl
				label={ name }
				checked={ values.indexOf( slug ) > -1 }
				onChange={ value => {
					const cleanPostType = [ ...new Set( values ) ];
					if ( value && cleanPostType.indexOf( slug ) === -1 ) {
						cleanPostType.push( slug );
					} else if ( ! value && cleanPostType.indexOf( slug ) > -1 ) {
						cleanPostType.splice( cleanPostType.indexOf( slug ), 1 );
					}
					onChange( cleanPostType );
				} }
			/>
		</PanelRow>
	) );
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
		<PanelBody title={ __( 'Post Types', 'jetpack-mu-wpcom' ) }>
			<CheckboxesGroup
				options={ availablePostTypes }
				values={ attributes.postType }
				onChange={ postType => setAttributes( { postType } ) }
			/>
		</PanelBody>
	);
};

export const PostStatusesPanel = ( { attributes, setAttributes } ) => {
	return (
		<PanelBody title={ __( 'Additional Post Statuses', 'jetpack-mu-wpcom' ) }>
			<PanelRow>
				<i>
					{ __(
						'Selection here has effect only for editors, regular users will only see published posts.',
						'jetpack-mu-wpcom'
					) }
				</i>
			</PanelRow>
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
