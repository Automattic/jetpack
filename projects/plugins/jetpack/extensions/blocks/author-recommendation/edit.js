import { useBlockProps } from '@wordpress/block-editor';
import { CheckboxControl, Flex, FlexBlock, FlexItem } from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
// import { __ } from '@wordpress/i18n';
import './editor.scss';
// import icon from './icon';
import data from './mock_data.json';

function AuthorRecommendationEdit( {
	// className,
	// noticeUI,
	attributes,
	setAttributes,
	isSelected,
} ) {
	const [ subscriptions, setSubscriptions ] = useState( [] );
	const [ selectedSubscriptions, setSelectedSubscriptions ] = useState( [] );
	const { recommendations } = attributes;

	useEffect( () => {
		setSelectedSubscriptions( recommendations.map( ( { ID } ) => ID ) );
		setSubscriptions( data );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		setAttributes( {
			recommendations: subscriptions.filter( subscription =>
				selectedSubscriptions.includes( subscription.ID )
			),
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ selectedSubscriptions ] );

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
		<div { ...useBlockProps() }>
			<Flex gap={ 2 } justify="space-between" direction="column">
				{ subscriptions.map( subscription => {
					const isSubscriptionSelected = selectedSubscriptions.includes( subscription.ID );

					return (
						<FlexItem
							key={ subscription.ID }
							style={ {
								padding: '10px',
								display: ! isSubscriptionSelected && ! isSelected ? 'none' : '',
							} }
						>
							<Flex gap={ 4 } justify="space-between">
								<FlexItem>
									{ /* TODO add placeholder image */ }
									{ subscription.site_icon && (
										<img src={ subscription.site_icon } alt={ subscription.name } />
									) }
								</FlexItem>
								<FlexBlock>{ subscription.name }</FlexBlock>
								<FlexItem>
									{ isSelected && (
										<CheckboxControl
											checked={ isSubscriptionSelected }
											onChange={ () => handleChecked( subscription.ID ) }
										/>
									) }
								</FlexItem>
							</Flex>
						</FlexItem>
					);
				} ) }
			</Flex>

			{ /*
				TODO bring back placeholder
				<Placeholder
				label={ __( 'Author-recommendation', 'jetpack' ) }
				instructions={ __( 'Instructions go here.', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				{ __( 'User input goes here?', 'jetpack' ) }
			</Placeholder> */ }
		</div>
	);
}

export default AuthorRecommendationEdit;
