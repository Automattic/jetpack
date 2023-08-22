import { BlockIcon, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	CheckboxControl,
	Flex,
	FlexBlock,
	FlexItem,
	Icon,
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
	SearchControl,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';
import useSubscriptions from './use-subscriptions';

export function BlogRollEdit( { className, attributes, setAttributes, isSelected } ) {
	const [ selectedSubscriptions, setSelectedSubscriptions ] = useState( [] );
	const [ showSubscriptions, setShowSubscriptions ] = useState( false );
	const { recommendations, ignore_user_blogs } = attributes;
	const { isLoading, errorMessage, subscriptions } = useSubscriptions( { ignore_user_blogs } );
	const showPlaceholder = ! selectedSubscriptions.length && ( ! showSubscriptions || ! isSelected );

	useEffect( () => {
		setSelectedSubscriptions( recommendations.map( ( { blog_id } ) => blog_id ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		// Update recommendations when selectedSubscriptions changes
		setAttributes( {
			recommendations: subscriptions.filter( subscription =>
				selectedSubscriptions.includes( subscription.blog_id )
			),
		} );
	}, [ selectedSubscriptions, setAttributes, subscriptions ] );

	const handleChecked = useCallback(
		subscriptionId => {
			if ( selectedSubscriptions.includes( subscriptionId ) ) {
				setSelectedSubscriptions( selectedSubscriptions.filter( id => id !== subscriptionId ) );
			} else {
				setSelectedSubscriptions( [ ...selectedSubscriptions, subscriptionId ] );
			}
		},
		[ selectedSubscriptions ]
	);

	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */

	return (
		<div { ...useBlockProps() } className={ className }>
			{ showPlaceholder && (
				<Placeholder
					label={ __( 'Blogroll', 'jetpack' ) }
					icon={ <BlockIcon icon={ icon } /> }
					instructions={ __(
						'Recommend sites that you like and follow. Select the sites you want to recommend to your visitors.',
						'jetpack'
					) }
				>
					<Button variant="primary" onClick={ () => setShowSubscriptions( true ) }>
						{ __( 'Select Recommendations', 'jetpack' ) }
					</Button>
				</Placeholder>
			) }

			{ errorMessage && (
				<Notice status="error" isDismissible={ false }>
					<p>{ errorMessage }</p>
				</Notice>
			) }

			{ isLoading && (
				<FlexBlock style={ { padding: '10px', textAlign: 'center' } }>
					<Spinner />
				</FlexBlock>
			) }

			{ ! isLoading && ! showPlaceholder && (
				<BlogrollContent
					{ ...{ isLoading, subscriptions, selectedSubscriptions, handleChecked, isSelected } }
				/>
			) }

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Hide user blogs', 'jetpack' ) }
						checked={ !! ignore_user_blogs }
						onChange={ () => setAttributes( { ignore_user_blogs: ! ignore_user_blogs } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

function BlogrollContent( { subscriptions, selectedSubscriptions, handleChecked, isSelected } ) {
	const [ searchQuery, setSearchQuery ] = useState( '' );
	const [ filteredSubscriptions, setFilteredSubscriptions ] = useState( subscriptions );

	useEffect( () => {
		if ( ! isSelected ) {
			setSearchQuery( '' );
			setFilteredSubscriptions( subscriptions );
		}
	}, [ subscriptions, setFilteredSubscriptions, setSearchQuery, isSelected ] );

	const handleSearchInputChange = value => {
		const query = value.toLowerCase();
		const filtered = subscriptions.filter( subscription =>
			subscription.name.toLowerCase().includes( query )
		);
		setFilteredSubscriptions( filtered );
		setSearchQuery( query );
	};

	return (
		<Flex gap={ 2 } justify="space-between" direction="column">
			{ isSelected && (
				<SearchControl
					value={ searchQuery }
					onChange={ handleSearchInputChange }
					placeholder={ __( 'Search subscriptions…', 'jetpack' ) }
				/>
			) }

			{ ! filteredSubscriptions.length && <p>{ __( 'No results found', 'jetpack' ) }</p> }

			{ filteredSubscriptions.map( subscription => {
				const isSubscriptionSelected = selectedSubscriptions.includes( subscription.blog_id );

				return (
					<FlexItem
						key={ subscription.blog_id }
						style={ {
							padding: '10px',
							display: ! isSubscriptionSelected && ! isSelected ? 'none' : '',
						} }
					>
						<Flex gap={ 4 } justify="space-between">
							<FlexItem>
								{ ! subscription.site_icon && (
									<Icon icon="admin-site" className="icon" size={ 36 } />
								) }
								{ subscription.site_icon && (
									<img
										className="icon"
										src={ subscription.site_icon }
										alt={ subscription.name }
										height={ 36 }
										width={ 36 }
									/>
								) }
							</FlexItem>
							<FlexBlock>{ subscription.name }</FlexBlock>
							<FlexItem>
								{ isSelected && (
									<CheckboxControl
										checked={ isSubscriptionSelected }
										onChange={ () => handleChecked( subscription.blog_id ) }
									/>
								) }
							</FlexItem>
						</Flex>
					</FlexItem>
				);
			} ) }
		</Flex>
	);
}

export default BlogRollEdit;
