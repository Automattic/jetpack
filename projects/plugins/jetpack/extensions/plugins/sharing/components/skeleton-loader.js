import { LoadingPlaceholder, ThemeProvider } from '@automattic/jetpack-components';
import { Placeholder, Flex, FlexItem } from '@wordpress/components';

function SharingSkeletonLoader() {
	return (
		<ThemeProvider>
			<Placeholder>
				<Flex gap={ 2 } direction="column" style={ { flexBasis: '100%', padding: '0 1em' } }>
					<FlexItem>
						<LoadingPlaceholder width="100%" height={ 30 } />
					</FlexItem>
					<FlexItem>
						<LoadingPlaceholder width="100%" height={ 90 } />
					</FlexItem>
					<FlexItem>
						<LoadingPlaceholder width="100%" height={ 30 } />
					</FlexItem>
				</Flex>
			</Placeholder>
		</ThemeProvider>
	);
}
export default SharingSkeletonLoader;
