import { LoadingPlaceholder } from '@automattic/jetpack-components';
import { Placeholder, Flex, FlexBlock, FlexItem } from '@wordpress/components';

function SubscriptionSkeletonLoader() {
	return (
		<Placeholder>
			<Flex gap={ 2 } direction="column" style={ { width: '100%' } }>
				<Flex gap={ 4 }>
					<FlexItem>
						<LoadingPlaceholder width={ 30 } height={ 30 } />
					</FlexItem>
					<FlexBlock>
						<LoadingPlaceholder width="90%" height={ 30 } />
					</FlexBlock>
				</Flex>
				<Flex style={ { marginTop: 12 } }>
					<FlexBlock>
						<LoadingPlaceholder height={ 30 } width="60%" />
					</FlexBlock>
				</Flex>
				<Flex style={ { marginTop: 12 } }>
					<FlexBlock>
						<LoadingPlaceholder width={ 150 } height={ 50 } />
					</FlexBlock>
				</Flex>
				<Flex style={ { marginTop: 18 } }>
					<FlexBlock>
						<LoadingPlaceholder width="90%" height={ 16 } />
					</FlexBlock>
				</Flex>
			</Flex>
		</Placeholder>
	);
}
export default SubscriptionSkeletonLoader;
