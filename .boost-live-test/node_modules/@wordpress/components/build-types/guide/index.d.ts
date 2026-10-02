import type { GuideProps } from './types';
/**
 * `Guide` is a React component that renders a _user guide_ in a modal. The guide consists of several pages which the user can step through one by one. The guide is finished when the modal is closed or when the user clicks _Finish_ on the last page of the guide.
 *
 * ```jsx
 * function MyTutorial() {
 * 	const [ isOpen, setIsOpen ] = useState( true );
 *
 * 	if ( ! isOpen ) {
 * 		return null;
 * 	}
 *
 * 	return (
 * 		<Guide
 * 			onFinish={ () => setIsOpen( false ) }
 * 			pages={ [
 * 				{
 * 					content: <p>Welcome to the ACME Store!</p>,
 * 				},
 * 				{
 * 					image: <img src="https://acmestore.com/add-to-cart.png" />,
 * 					content: (
 * 						<p>
 * 							Click <i>Add to Cart</i> to buy a product.
 * 						</p>
 * 					),
 * 				},
 * 			] }
 * 		/>
 * 	);
 * }
 * ```
 */
declare function Guide({ children, className, contentLabel, finishButtonText, nextButtonText, previousButtonText, onFinish, pages, }: GuideProps): import("react").JSX.Element | null;
export default Guide;
//# sourceMappingURL=index.d.ts.map