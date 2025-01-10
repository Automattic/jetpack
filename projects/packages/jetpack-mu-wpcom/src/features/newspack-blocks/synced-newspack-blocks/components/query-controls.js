/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Button, QueryControls as BasicQueryControls, ToggleControl } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies.
 */
import AutocompleteTokenField from './autocomplete-tokenfield';

const getCategoryTitle = category =>
	decodeEntities( category.name ) || __( '(no title)', 'jetpack-mu-wpcom' );

const getTermTitle = term => decodeEntities( term.name ) || __( '(no title)', 'jetpack-mu-wpcom' );

class QueryControls extends Component {
	state = {
		showAdvancedFilters: false,
	};

	fetchPostSuggestions = search => {
		const { postType } = this.props;
		const restUrl = window.newspack_blocks_data.specific_posts_rest_url;
		return apiFetch( {
			url: addQueryArgs( restUrl, {
				search,
				postsToShow: 20,
				_fields: 'id,title',
				type: 'post',
				postType,
			} ),
		} ).then( function ( posts ) {
			const result = posts.map( post => ( {
				value: post.id,
				label: decodeEntities( post.title ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
			return result;
		} );
	};
	fetchSavedPosts = postIDs => {
		const { postType } = this.props;
		const restUrl = window.newspack_blocks_data.posts_rest_url;
		return apiFetch( {
			url: addQueryArgs( restUrl, {
				// These params use the block query parameters (see Newspack_Blocks::build_articles_query).
				postsToShow: 100,
				include: postIDs.join( ',' ),
				_fields: 'id,title',
				postType,
			} ),
		} ).then( function ( posts ) {
			return posts.map( post => ( {
				value: post.id,
				label: decodeEntities( post.title.rendered ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};

	fetchAuthorSuggestions = search => {
		const restUrl = window.newspack_blocks_data.authors_rest_url;
		return apiFetch( {
			url: addQueryArgs( restUrl, {
				search,
				per_page: 20,
				fields: 'id,name',
			} ),
		} ).then( function ( users ) {
			return users.map( user => ( {
				value: user.id,
				label: decodeEntities( user.name ) || __( '(no name)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};
	fetchSavedAuthors = userIDs => {
		const restUrl = window.newspack_blocks_data.authors_rest_url;
		return apiFetch( {
			url: addQueryArgs( restUrl, {
				per_page: 100,
				include: userIDs.join( ',' ),
				fields: 'id,name',
			} ),
		} ).then( function ( users ) {
			return users.map( user => ( {
				value: user.id,
				label: decodeEntities( user.name ) || __( '(no name)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};

	fetchCategorySuggestions = search => {
		return apiFetch( {
			path: addQueryArgs( '/wp/v2/categories', {
				search,
				per_page: 20,
				_fields: 'id,name,parent',
				orderby: 'count',
				order: 'desc',
			} ),
		} ).then( categories =>
			Promise.all(
				categories.map( category => {
					if ( category.parent > 0 ) {
						return apiFetch( {
							path: addQueryArgs( `/wp/v2/categories/${ category.parent }`, {
								_fields: 'name',
							} ),
						} ).then( parentCategory => ( {
							value: category.id,
							label: `${ getCategoryTitle( category ) } – ${ getCategoryTitle( parentCategory ) }`,
						} ) );
					}
					return Promise.resolve( {
						value: category.id,
						label: getCategoryTitle( category ),
					} );
				} )
			)
		);
	};
	fetchSavedCategories = categoryIDs => {
		return apiFetch( {
			path: addQueryArgs( '/wp/v2/categories', {
				per_page: 100,
				_fields: 'id,name',
				include: categoryIDs.join( ',' ),
			} ),
		} ).then( function ( categories ) {
			return categories.map( category => ( {
				value: category.id,
				label: decodeEntities( category.name ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};

	fetchTagSuggestions = search => {
		return apiFetch( {
			path: addQueryArgs( '/wp/v2/tags', {
				search,
				per_page: 20,
				_fields: 'id,name',
				orderby: 'count',
				order: 'desc',
			} ),
		} ).then( function ( tags ) {
			return tags.map( tag => ( {
				value: tag.id,
				label: decodeEntities( tag.name ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};
	fetchSavedTags = tagIDs => {
		return apiFetch( {
			path: addQueryArgs( '/wp/v2/tags', {
				per_page: 100,
				_fields: 'id,name',
				include: tagIDs.join( ',' ),
			} ),
		} ).then( function ( tags ) {
			return tags.map( tag => ( {
				value: tag.id,
				label: decodeEntities( tag.name ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};

	fetchCustomTaxonomiesSuggestions = ( taxSlug, search ) => {
		return apiFetch( {
			path: addQueryArgs( `/wp/v2/${ taxSlug }`, {
				search,
				per_page: 20,
				_fields: 'id,name,parent',
				orderby: 'count',
				order: 'desc',
			} ),
		} ).then( terms =>
			Promise.all(
				terms.map( term => {
					if ( term.parent > 0 ) {
						return apiFetch( {
							path: addQueryArgs( `/wp/v2/${ taxSlug }/${ term.parent }`, {
								_fields: 'name',
							} ),
						} ).then( parentTerm => ( {
							value: term.id,
							label: `${ getTermTitle( term ) } – ${ getTermTitle( parentTerm ) }`,
						} ) );
					}
					return Promise.resolve( {
						value: term.id,
						label: getTermTitle( term ),
					} );
				} )
			)
		);
	};
	fetchSavedCustomTaxonomies = ( taxSlug, termIDs ) => {
		return apiFetch( {
			path: addQueryArgs( `/wp/v2/${ taxSlug }`, {
				per_page: 100,
				_fields: 'id,name',
				include: termIDs.join( ',' ),
			} ),
		} ).then( function ( terms ) {
			return terms.map( term => ( {
				value: term.id,
				label: decodeEntities( term.name ) || __( '(no title)', 'jetpack-mu-wpcom' ),
			} ) );
		} );
	};

	render = () => {
		const {
			specificMode,
			onSpecificModeChange,
			specificPosts,
			onSpecificPostsChange,
			authors,
			onAuthorsChange,
			categories,
			onCategoriesChange,
			includeSubcategories,
			onIncludeSubcategoriesChange,
			tags,
			onTagsChange,
			customTaxonomies,
			onCustomTaxonomiesChange,
			tagExclusions,
			onTagExclusionsChange,
			categoryExclusions,
			onCategoryExclusionsChange,
			customTaxonomyExclusions,
			onCustomTaxonomyExclusionsChange,
			enableSpecific,
		} = this.props;
		const { showAdvancedFilters } = this.state;

		const registeredCustomTaxonomies = window.newspack_blocks_data?.custom_taxonomies;

		const customTaxonomiesPrepareChange = ( taxArr, taxHandler, taxSlug, value ) => {
			let newValue = taxArr.filter( tax => tax.slug !== taxSlug );
			newValue = [ ...newValue, { slug: taxSlug, terms: value } ];
			taxHandler( newValue );
		};

		const getTermsOfCustomTaxonomy = ( taxArr, taxSlug ) => {
			const tax = taxArr.find( taxObj => taxObj.slug === taxSlug );
			return tax ? tax.terms : [];
		};

		return (<>
            { enableSpecific && (
                <ToggleControl
                    checked={ specificMode }
                    onChange={ onSpecificModeChange }
                    label={ __( 'Choose Specific Posts', 'jetpack-mu-wpcom' ) }
                />
            ) }
            { specificMode ? (
                <AutocompleteTokenField
                    tokens={ specificPosts || [] }
                    onChange={ onSpecificPostsChange }
                    fetchSuggestions={ this.fetchPostSuggestions }
                    fetchSavedInfo={ this.fetchSavedPosts }
                    label={ __( 'Posts', 'jetpack-mu-wpcom' ) }
                    help={ __(
                        'Begin typing post title, click autocomplete result to select.',
                        'jetpack-mu-wpcom'
                    ) }
                />
            ) : (
                <>
                    <BasicQueryControls { ...this.props } />
                    { onAuthorsChange && (
                        <AutocompleteTokenField
                            tokens={ authors || [] }
                            onChange={ onAuthorsChange }
                            fetchSuggestions={ this.fetchAuthorSuggestions }
                            fetchSavedInfo={ this.fetchSavedAuthors }
                            label={ __( 'Authors', 'jetpack-mu-wpcom' ) }
                        />
                    ) }
                    { onCategoriesChange && (
                        <AutocompleteTokenField
                            tokens={ categories || [] }
                            onChange={ onCategoriesChange }
                            fetchSuggestions={ this.fetchCategorySuggestions }
                            fetchSavedInfo={ this.fetchSavedCategories }
                            label={ __( 'Categories', 'jetpack-mu-wpcom' ) }
                        />
                    ) }
                    { onIncludeSubcategoriesChange && (
                        <ToggleControl
                            checked={ includeSubcategories }
                            onChange={ onIncludeSubcategoriesChange }
                            label={ __( 'Include subcategories ', 'jetpack-mu-wpcom' ) }
                        />
                    ) }
                    { onTagsChange && (
                        <AutocompleteTokenField
                            tokens={ tags || [] }
                            onChange={ onTagsChange }
                            fetchSuggestions={ this.fetchTagSuggestions }
                            fetchSavedInfo={ this.fetchSavedTags }
                            label={ __( 'Tags', 'jetpack-mu-wpcom' ) }
                        />
                    ) }
                    { onCustomTaxonomiesChange &&
                        registeredCustomTaxonomies.map( ( tax, index ) => (
                            <AutocompleteTokenField
                                key={ index }
                                tokens={ getTermsOfCustomTaxonomy( customTaxonomies, tax.slug ) }
                                onChange={ value => {
                                    customTaxonomiesPrepareChange(
                                        customTaxonomies,
                                        onCustomTaxonomiesChange,
                                        tax.slug,
                                        value
                                    );
                                } }
                                fetchSuggestions={ search =>
                                    this.fetchCustomTaxonomiesSuggestions( tax.slug, search )
                                }
                                fetchSavedInfo={ termIds => this.fetchSavedCustomTaxonomies( tax.slug, termIds ) }
                                label={ tax.label }
                            />
                        ) ) }
                    { onTagExclusionsChange && (
                        <p>
                            <Button
                                isLink
                                onClick={ () => this.setState( { showAdvancedFilters: ! showAdvancedFilters } ) }
                            >
                                { showAdvancedFilters
                                    ? __( 'Hide Advanced Filters', 'jetpack-mu-wpcom' )
                                    : __('Show Advanced Filters', 'jetpack-mu-wpcom', 0) }
                            </Button>
                        </p>
                    ) }
                    { showAdvancedFilters && (
                        <>
                            { onTagExclusionsChange && (
                                <AutocompleteTokenField
                                    tokens={ tagExclusions || [] }
                                    onChange={ onTagExclusionsChange }
                                    fetchSuggestions={ this.fetchTagSuggestions }
                                    fetchSavedInfo={ this.fetchSavedTags }
                                    label={ __( 'Excluded Tags', 'jetpack-mu-wpcom' ) }
                                />
                            ) }
                            { onCategoryExclusionsChange && (
                                <AutocompleteTokenField
                                    tokens={ categoryExclusions || [] }
                                    onChange={ onCategoryExclusionsChange }
                                    fetchSuggestions={ this.fetchCategorySuggestions }
                                    fetchSavedInfo={ this.fetchSavedCategories }
                                    label={ __( 'Excluded Categories', 'jetpack-mu-wpcom' ) }
                                />
                            ) }
                            { registeredCustomTaxonomies &&
                                onCustomTaxonomyExclusionsChange &&
                                registeredCustomTaxonomies.map( ( { label, slug } ) => (
                                    <AutocompleteTokenField
                                        fetchSavedInfo={ termIds => this.fetchSavedCustomTaxonomies( slug, termIds ) }
                                        fetchSuggestions={ search =>
                                            this.fetchCustomTaxonomiesSuggestions( slug, search )
                                        }
                                        key={ `${ slug }-exclusions-selector` }
                                        label={ sprintf(
                                            // translators: %s is the custom taxonomy label.
                                            __( 'Excluded %s', 'jetpack-mu-wpcom' ),
                                            label
                                        ) }
                                        onChange={ value =>
                                            customTaxonomiesPrepareChange(
                                                customTaxonomyExclusions,
                                                onCustomTaxonomyExclusionsChange,
                                                slug,
                                                value
                                            )
                                        }
                                        tokens={ getTermsOfCustomTaxonomy( customTaxonomyExclusions, slug ) }
                                    />
                                ) ) }
                        </>
                    ) }
                </>
            ) }
        </>);
	};
}

QueryControls.defaultProps = {
	enableSpecific: true,
	specificPosts: [],
	authors: [],
	categories: [],
	tags: [],
	customTaxonomies: [],
	tagExclusions: [],
	customTaxonomyExclusions: [],
};

export default QueryControls;
