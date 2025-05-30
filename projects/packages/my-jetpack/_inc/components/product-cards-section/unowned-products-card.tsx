import { Container, Col } from '@automattic/jetpack-components';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useFilteredProducts from '../../hooks/use-filtered-products';
import LoadingBlock from '../loading-block';
import ProductsTableView from '../products-table-view';
import styles from './style.module.scss';

const UnownedProductsCard = () => {
	const { filteredUnownedProducts, isLoading } = useFilteredProducts();
	const { userIsAdmin } = getMyJetpackWindowInitialState();

	if ( isLoading ) {
		return (
			<Col className={ styles.fullStatsCard }>
				<LoadingBlock width="100%" height="150px" />
			</Col>
		);
	}

	return (
		userIsAdmin &&
		filteredUnownedProducts.length > 0 && (
			<Container
				className={ styles[ 'my-jetpack-products-container' ] }
				horizontalSpacing={ 4 }
				horizontalGap={ 6 }
			>
				<Col>
					<ProductsTableView products={ filteredUnownedProducts } />
				</Col>
			</Container>
		)
	);
};

export default UnownedProductsCard;
