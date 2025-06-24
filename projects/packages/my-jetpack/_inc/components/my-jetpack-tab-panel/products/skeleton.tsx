import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { Flex, FlexItem } from '@wordpress/components';

const sections = [
	{
		cards: [ 'card-1', 'card-2', 'card-3' ],
	},
	{
		cards: [ 'card-1', 'card-2' ],
	},
];
/**
 * Skeleton component for products section.
 *
 * @return The rendered component.
 */
export function Skeleton() {
	return (
		<Flex gap={ 12 } direction="column">
			{ sections.map( ( section, index ) => (
				<FlexItem key={ index }>
					<Flex gap={ 6 } direction="column">
						<FlexItem style={ { width: '128px', borderRadius: '8px', overflow: 'hidden' } }>
							<LoadingPlaceholder width="100%" height={ 32 } />
						</FlexItem>
						<FlexItem>
							<Flex wrap gap={ 6 }>
								{ section.cards.map( key => (
									<FlexItem
										key={ key }
										style={ {
											flex: '1 1 calc(50% - 1.5rem)',
											borderRadius: '8px',
											overflow: 'hidden',
										} }
									>
										<LoadingPlaceholder width="100%" height={ 160 } />
									</FlexItem>
								) ) }
							</Flex>
						</FlexItem>
						<FlexItem style={ { borderRadius: '8px', overflow: 'hidden' } }>
							<LoadingPlaceholder width="100%" height={ 320 } />
						</FlexItem>
					</Flex>
				</FlexItem>
			) ) }
		</Flex>
	);
}
