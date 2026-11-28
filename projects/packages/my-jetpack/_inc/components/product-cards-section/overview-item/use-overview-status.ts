import useProduct from '../../../data/products/use-product';
import { getStatusWithoutAccount } from '../../../utils/status-without-account';

/**
 * The status an Overview item shows for its product.
 *
 * @param {JetpackModuleWithCard} slug - The product slug.
 * @return {ProductStatus | undefined} The status, undefined while the product loads.
 */
const useOverviewStatus = ( slug: JetpackModuleWithCard ) =>
	getStatusWithoutAccount( slug, useProduct( slug ).detail );

export default useOverviewStatus;
