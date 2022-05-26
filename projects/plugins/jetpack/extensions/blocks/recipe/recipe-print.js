const printBtns = document.querySelectorAll(
	'.wp-block-jetpack-recipe-details__detail .wp-block-button__link'
);
const style = document.createElement( 'style' );

printBtns.forEach( btn => {
	btn.addEventListener( 'click', () => {
		style.id = 'jetpack-recipe-block-print-style';

		style.innerHTML = `
      @media print {
        .wp-site-blocks > header,
        .wp-site-blocks > footer,
        .wp-site-blocks > main > *:not(.wp-block-post-content),
        .wp-site-blocks > main > .wp-block-post-content > *:not(.wp-block-jetpack-recipe),
        .wp-block-jetpack-recipe-details__detail--print {
          display: none;
        }
      
        .wp-block-jetpack-recipe-details {
          display: grid;
          gap: 1rem;
          margin-bottom: 6rem;
          margin-top: 1.75rem;
          grid-template-columns: repeat(auto-fit, minmax(100px, 150px));
        }
      
        .wp-block-jetpack-recipe-details__detail {
          font-size: 0.875rem;
          margin-right: 1rem;
          padding-right: 1rem;
          text-align: center;
        }
      
        .wp-block-jetpack-recipe-details__detail:not(:last-child) {
          border-right: 1px solid currentColor;
        }
      
        .wp-block-jetpack-recipe-details__detail p {
          margin: 0;
          text-transform: uppercase;
        }
      
        .wp-block-jetpack-recipe-details__detail p:first-child {
          font-size: 0.75rem;
          color: #555;
        }
      
        .wp-block-jetpack-recipe-step {
          counter-increment: list;
          list-style-type: none;
          position: relative;
          padding-bottom: 1rem;
        }
      
        .wp-block-jetpack-recipe-step::before {
          align-items: center;
          background-color: var(--step-highlight-color);
          border-radius: 50%;
          color: var(--step-text-color);
          content: counter(list);
          display: flex;
          font-size: 0.875rem;
          height: 28px;
          justify-content: center;
          left: -2.5rem;
          line-height: 1;
          position: absolute;
          text-align: center;
          width: 28px;
        }
      
        .wp-block-jetpack-recipe-step p {
          margin: 0;
        }
      }
    `;

		document.head.appendChild( style );

		window.print();
	} );
} );

window.onfocus = () => {
	document.head.removeChild( style );
};
