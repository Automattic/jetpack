/**
 * Internal dependencies
 */
import Layout from '../components/layout';

const Page = ( { children } ) => {
	return (
		<Layout className="jp-forms__landing" showFooter>
			{ children }
		</Layout>
	);
};

export default Page;
