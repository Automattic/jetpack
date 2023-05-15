import { BlockIcon, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	CheckboxControl,
	Flex,
	FlexBlock,
	FlexItem,
	Icon,
	Notice,
	PanelBody,
	Placeholder,
	Spinner,
	ToggleControl,
} from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';
import useSubscriptions from './use-subscriptions';

export function AuthorRecommendationEdit( { className, attributes, setAttributes, isSelected } ) {
	const [ selectedSubscriptions, setSelectedSubscriptions ] = useState( [] );
	const { recommendations, remove_user_blogs } = attributes;
	const { isLoading, errorMessage, subscriptions } = useSubscriptions( { remove_user_blogs } );

	useEffect( () => {
		setSelectedSubscriptions( recommendations.map( ( { blog_id } ) => blog_id ) );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
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
			<Placeholder
				label={ __( 'Author Recommendation', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				instructions={ __(
					'Recommend sites to your users. Select the sites you want to recommend from the list below.',
					'jetpack'
				) }
			/>

			{ isLoading && (
				<FlexBlock style={ { padding: '10px', textAlign: 'center' } }>
					<Spinner />
				</FlexBlock>
			) }

			{ errorMessage && (
				<Notice status="error" isDismissible={ false }>
					<p>{ errorMessage }</p>
				</Notice>
			) }

			{ ! isLoading && ! subscriptions.length && (
				<Notice status="info" isDismissible={ false }>
					<p>
						{ __(
							'No subscriptions to display. You need to follow some sites in order to see results here.',
							'jetpack'
						) }
					</p>
				</Notice>
			) }

			{ ! isLoading && (
				<Flex gap={ 2 } justify="space-between" direction="column">
					{ subscriptions.map( subscription => {
						const isSubscriptionSelected = selectedSubscriptions.includes( subscription.blog_id );

						return (
							<FlexItem key={ subscription.blog_id } style={ { padding: '10px' } }>
								<Flex gap={ 4 } justify="space-between">
									<FlexItem style={ { maxHeight: 36, minWidth: 36 } }>
										{ ! subscription.site_icon && (
											<Icon icon="admin-site" className="icon" size={ 36 } />
										) }
										{ subscription.site_icon && (
											<img
												className="icon"
												src={ subscription.site_icon }
												alt={ subscription.name }
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
			) }

			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Hide user blogs', 'jetpack' ) }
						checked={ !! remove_user_blogs }
						onChange={ () => setAttributes( { remove_user_blogs: ! remove_user_blogs } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</div>
	);
}

export default AuthorRecommendationEdit;
