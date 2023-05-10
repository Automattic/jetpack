import { BlockIcon, useBlockProps } from '@wordpress/block-editor';
import {
	CheckboxControl,
	Flex,
	FlexBlock,
	FlexItem,
	Placeholder,
	Icon,
} from '@wordpress/components';
import { useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';
import data from './mock_data.json';

function AuthorRecommendationEdit( {
	className,
	noticeUI,
	attributes,
	setAttributes,
	isSelected,
} ) {
	const [ subscriptions, setSubscriptions ] = useState( [] );
	const [ selectedSubscriptions, setSelectedSubscriptions ] = useState( [] );
	const { recommendations } = attributes;

	useEffect( () => {
		setSelectedSubscriptions( recommendations.map( ( { ID } ) => ID ) );

		// TODO fetch the sites the user is subscribed to
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
		<div { ...useBlockProps() } className={ className }>
			{ ! selectedSubscriptions.length && (
				<Placeholder
					label={ __( 'Author-recommendation', 'jetpack' ) }
					icon={ <BlockIcon icon={ icon } /> }
					instructions={ __(
						'Recommend sites to your users. Select the sites you want to recommend from the list below.',
						'jetpack'
					) }
					notices={ noticeUI }
				/>
			) }

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
											onChange={ () => handleChecked( subscription.ID ) }
										/>
									) }
								</FlexItem>
							</Flex>
						</FlexItem>
					);
				} ) }
			</Flex>
		</div>
	);
}

export default AuthorRecommendationEdit;
