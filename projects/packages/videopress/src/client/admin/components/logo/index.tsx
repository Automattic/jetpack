import { Path, SVG } from '@wordpress/components';
import React from 'react';

type HEXColorType = `#${ string }`;

type LogoProps = {
	iconColor?: HEXColorType;
	color?: HEXColorType;
};

/**
 * VideoPress Logo component
 *
 * @param {object} props                 - Component props
 * @param {HEXColorType} props.color     - Text color.
 * @param {HEXColorType} props.iconColor - Icon color
 * @returns {React.ReactElement}   Component template
 */
export default function Logo( {
	iconColor = '#069E08',
	color = '#000',
}: LogoProps ): React.ReactElement {
	return (
		<SVG
			width="289"
			height="40"
			viewBox="0 0 289 40"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<Path
				d="M163.727 24.1395C164.437 21.9795 165.201 19.7998 166.02 17.6003L169.793 7.42161H172.293L164.748 27.2168H162.632L155.087 7.42161H157.587L161.36 17.6003C162.188 19.7998 162.958 21.9795 163.668 24.1395H163.727Z"
				fill={ color }
			/>
			<Path
				d="M174.812 27.2168V13.1619H177.105V27.2168H174.812ZM174.753 9.89231V7.33284H177.165V9.89231H174.753Z"
				fill={ color }
			/>
			<Path
				d="M182.835 20.3373C182.835 21.1461 182.924 21.8809 183.101 22.5417C183.289 23.1927 183.555 23.7499 183.9 24.2135C184.246 24.6672 184.67 25.0173 185.173 25.2639C185.676 25.5105 186.253 25.6338 186.904 25.6338C187.387 25.6338 187.826 25.5697 188.22 25.4414C188.615 25.3132 188.965 25.1505 189.271 24.9532C189.586 24.756 189.853 24.5488 190.07 24.3318C190.297 24.105 190.474 23.8979 190.602 23.7105V16.3576C190.129 15.8743 189.581 15.4896 188.96 15.2036C188.339 14.9077 187.668 14.7597 186.948 14.7597C186.514 14.7597 186.055 14.8436 185.572 15.0112C185.099 15.1691 184.655 15.46 184.241 15.8841C183.836 16.3082 183.501 16.8803 183.235 17.6003C182.968 18.3104 182.835 19.2228 182.835 20.3373ZM180.438 20.3669C180.438 19.3904 180.532 18.5274 180.719 17.7778C180.917 17.0184 181.173 16.3576 181.489 15.7954C181.804 15.2332 182.174 14.7647 182.598 14.3899C183.022 14.0052 183.461 13.6945 183.915 13.4578C184.369 13.2211 184.827 13.0534 185.291 12.9548C185.764 12.8463 186.208 12.7921 186.623 12.7921C187.481 12.7921 188.225 12.9351 188.856 13.2211C189.488 13.5071 190.055 13.9263 190.558 14.4786H190.602V5.7942H192.895V27.2168H191.164L190.691 25.6486H190.632C190.454 25.8754 190.247 26.1072 190.01 26.3439C189.774 26.5708 189.493 26.7779 189.167 26.9653C188.852 27.1527 188.482 27.3006 188.058 27.4091C187.643 27.5275 187.16 27.5867 186.608 27.5867C185.838 27.5867 185.084 27.4584 184.344 27.202C183.604 26.9357 182.944 26.5165 182.362 25.9445C181.79 25.3625 181.326 24.6179 180.971 23.7105C180.616 22.7932 180.438 21.6787 180.438 20.3669Z"
				fill={ color }
			/>
			<Path
				d="M202.546 14.7597C202.023 14.7597 201.535 14.8633 201.081 15.0704C200.637 15.2775 200.248 15.5586 199.912 15.9137C199.577 16.2688 199.306 16.688 199.099 17.1713C198.891 17.6447 198.763 18.1526 198.714 18.6951H205.815C205.815 18.1428 205.741 17.6299 205.593 17.1565C205.455 16.6732 205.248 16.254 204.972 15.8989C204.696 15.5439 204.356 15.2677 203.951 15.0704C203.547 14.8633 203.078 14.7597 202.546 14.7597ZM203.803 25.5894C204.563 25.5894 205.253 25.5302 205.874 25.4119C206.506 25.2836 207.132 25.1061 207.753 24.8792V26.7878C207.25 27.0343 206.629 27.2267 205.889 27.3647C205.149 27.5127 204.356 27.5867 203.507 27.5867C202.501 27.5867 201.554 27.4584 200.667 27.202C199.789 26.9456 199.02 26.5313 198.359 25.9593C197.698 25.3872 197.175 24.6425 196.791 23.7253C196.416 22.7981 196.228 21.6836 196.228 20.3817C196.228 19.0995 196.406 17.9899 196.761 17.0529C197.116 16.106 197.589 15.317 198.181 14.6858C198.773 14.0545 199.454 13.5811 200.223 13.2655C200.992 12.9499 201.796 12.7921 202.634 12.7921C203.423 12.7921 204.158 12.9252 204.839 13.1915C205.529 13.4479 206.126 13.8573 206.629 14.4195C207.132 14.9817 207.526 15.7066 207.813 16.5943C208.108 17.4819 208.256 18.5472 208.256 19.7899C208.256 19.9083 208.256 20.0118 208.256 20.1006C208.256 20.1795 208.251 20.3669 208.242 20.6628H198.595C198.595 21.5603 198.729 22.3247 198.995 22.9559C199.271 23.5773 199.641 24.0853 200.105 24.4798C200.578 24.8645 201.13 25.1456 201.762 25.3231C202.393 25.5006 203.073 25.5894 203.803 25.5894Z"
				fill={ color }
			/>
			<Path
				d="M221.812 20.2042C221.812 19.3362 221.704 18.5669 221.487 17.8962C221.28 17.2156 220.984 16.6436 220.599 16.18C220.224 15.7066 219.776 15.3515 219.253 15.1148C218.73 14.8682 218.158 14.7449 217.537 14.7449C216.915 14.7449 216.343 14.8682 215.821 15.1148C215.298 15.3515 214.844 15.7066 214.459 16.18C214.085 16.6436 213.789 17.2156 213.572 17.8962C213.365 18.5669 213.261 19.3362 213.261 20.2042C213.261 21.0622 213.365 21.8316 213.572 22.5121C213.789 23.1828 214.09 23.7499 214.474 24.2135C214.859 24.6771 215.313 25.0321 215.835 25.2787C216.358 25.5154 216.93 25.6338 217.552 25.6338C218.173 25.6338 218.74 25.5154 219.253 25.2787C219.776 25.0321 220.224 24.6771 220.599 24.2135C220.984 23.7499 221.28 23.1828 221.487 22.5121C221.704 21.8316 221.812 21.0622 221.812 20.2042ZM224.209 20.2042C224.209 21.3088 224.051 22.3148 223.736 23.2223C223.42 24.1297 222.971 24.9088 222.389 25.5598C221.817 26.2009 221.122 26.699 220.303 27.0541C219.485 27.4091 218.567 27.5867 217.552 27.5867C216.506 27.5867 215.569 27.4091 214.741 27.0541C213.922 26.699 213.222 26.2009 212.64 25.5598C212.068 24.9088 211.629 24.1297 211.323 23.2223C211.017 22.3148 210.864 21.3088 210.864 20.2042C210.864 19.0896 211.022 18.0787 211.338 17.1713C211.653 16.2639 212.097 15.4847 212.669 14.8337C213.251 14.1827 213.952 13.6797 214.77 13.3247C215.599 12.9696 216.521 12.7921 217.537 12.7921C218.572 12.7921 219.504 12.9696 220.333 13.3247C221.161 13.6797 221.862 14.1827 222.434 14.8337C223.006 15.4847 223.445 16.2639 223.75 17.1713C224.056 18.0787 224.209 19.0896 224.209 20.2042Z"
				fill={ color }
			/>
			<Path
				d="M230.087 27.2168H227.675V7.42161H233.164C233.983 7.42161 234.737 7.47093 235.428 7.56956C236.128 7.66819 236.769 7.82107 237.351 8.02819C238.534 8.4523 239.432 9.08847 240.043 9.93669C240.655 10.7751 240.961 11.8107 240.961 13.0436C240.961 14.0496 240.759 14.9373 240.354 15.7066C239.96 16.466 239.383 17.1022 238.623 17.6151C237.864 18.128 236.937 18.5176 235.842 18.7839C234.757 19.0403 233.524 19.1685 232.143 19.1685C231.482 19.1685 230.797 19.1389 230.087 19.0798V27.2168ZM230.087 16.8754C230.412 16.9148 230.752 16.9444 231.108 16.9641C231.463 16.9839 231.798 16.9937 232.114 16.9937C233.248 16.9937 234.214 16.905 235.013 16.7274C235.812 16.5499 236.463 16.2934 236.966 15.9581C237.469 15.6129 237.834 15.1986 238.061 14.7154C238.288 14.2222 238.401 13.6649 238.401 13.0436C238.401 12.2742 238.214 11.643 237.839 11.1499C237.474 10.6567 236.951 10.2819 236.271 10.0255C235.847 9.86765 235.359 9.75916 234.806 9.69998C234.254 9.63094 233.613 9.59642 232.883 9.59642H230.087V16.8754Z"
				fill={ color }
			/>
			<Path
				d="M251.458 15.026H251.281C250.738 15.026 250.206 15.0754 249.683 15.174C249.16 15.2726 248.667 15.4255 248.204 15.6326C247.75 15.8299 247.336 16.0765 246.961 16.3723C246.596 16.6682 246.29 17.0184 246.044 17.4228V27.2168H243.75V13.1619H245.526L245.97 15.3959H246.014C246.241 15.031 246.517 14.6907 246.842 14.3751C247.178 14.0595 247.553 13.7833 247.967 13.5466C248.381 13.3099 248.835 13.1274 249.328 12.9992C249.821 12.8611 250.339 12.7921 250.881 12.7921C250.98 12.7921 251.079 12.797 251.177 12.8068C251.286 12.8068 251.379 12.8118 251.458 12.8216V15.026Z"
				fill={ color }
			/>
			<Path
				d="M258.949 14.7597C258.426 14.7597 257.938 14.8633 257.484 15.0704C257.04 15.2775 256.651 15.5586 256.315 15.9137C255.98 16.2688 255.709 16.688 255.501 17.1713C255.294 17.6447 255.166 18.1526 255.117 18.6951H262.218C262.218 18.1428 262.144 17.6299 261.996 17.1565C261.858 16.6732 261.651 16.254 261.375 15.8989C261.099 15.5439 260.758 15.2677 260.354 15.0704C259.95 14.8633 259.481 14.7597 258.949 14.7597ZM260.206 25.5894C260.966 25.5894 261.656 25.5302 262.277 25.4119C262.909 25.2836 263.535 25.1061 264.156 24.8792V26.7878C263.653 27.0343 263.032 27.2267 262.292 27.3647C261.552 27.5127 260.758 27.5867 259.91 27.5867C258.904 27.5867 257.957 27.4584 257.07 27.202C256.192 26.9456 255.423 26.5313 254.762 25.9593C254.101 25.3872 253.578 24.6425 253.194 23.7253C252.819 22.7981 252.631 21.6836 252.631 20.3817C252.631 19.0995 252.809 17.9899 253.164 17.0529C253.519 16.106 253.992 15.317 254.584 14.6858C255.176 14.0545 255.857 13.5811 256.626 13.2655C257.395 12.9499 258.199 12.7921 259.037 12.7921C259.826 12.7921 260.561 12.9252 261.242 13.1915C261.932 13.4479 262.529 13.8573 263.032 14.4195C263.535 14.9817 263.929 15.7066 264.215 16.5943C264.511 17.4819 264.659 18.5472 264.659 19.7899C264.659 19.9083 264.659 20.0118 264.659 20.1006C264.659 20.1795 264.654 20.3669 264.645 20.6628H254.998C254.998 21.5603 255.132 22.3247 255.398 22.9559C255.674 23.5773 256.044 24.0853 256.508 24.4798C256.981 24.8645 257.533 25.1456 258.164 25.3231C258.796 25.5006 259.476 25.5894 260.206 25.5894Z"
				fill={ color }
			/>
			<Path
				d="M269.56 16.905C269.56 17.2896 269.644 17.6052 269.812 17.8518C269.98 18.0984 270.202 18.3006 270.478 18.4584C270.764 18.6063 271.089 18.7296 271.454 18.8283C271.829 18.9269 272.214 19.0157 272.608 19.0946C273.151 19.2129 273.664 19.3461 274.147 19.494C274.63 19.6321 275.074 19.8441 275.478 20.1302C275.893 20.4162 276.223 20.8058 276.47 21.299C276.726 21.7822 276.854 22.4135 276.854 23.1927C276.854 23.9028 276.716 24.534 276.44 25.0864C276.164 25.6288 275.774 26.0875 275.271 26.4623C274.768 26.8272 274.167 27.1034 273.466 27.2908C272.766 27.488 271.997 27.5867 271.158 27.5867C270.645 27.5867 270.177 27.5571 269.753 27.4979C269.339 27.4486 268.969 27.3795 268.643 27.2908C268.328 27.2119 268.056 27.128 267.83 27.0393C267.603 26.9505 267.415 26.8667 267.267 26.7878V24.8645C267.859 25.1012 268.446 25.2886 269.028 25.4266C269.61 25.5647 270.251 25.6338 270.951 25.6338C271.504 25.6338 272.002 25.5845 272.445 25.4858C272.889 25.3872 273.269 25.2442 273.585 25.0568C273.91 24.8595 274.157 24.6179 274.324 24.3318C274.502 24.036 274.591 23.6957 274.591 23.311C274.591 22.9165 274.512 22.591 274.354 22.3346C274.196 22.0781 273.984 21.8661 273.718 21.6984C273.451 21.5307 273.141 21.3927 272.786 21.2842C272.441 21.1757 272.076 21.077 271.691 20.9883C271.188 20.8798 270.675 20.7516 270.152 20.6036C269.639 20.4557 269.171 20.2485 268.747 19.9822C268.323 19.7159 267.977 19.3559 267.711 18.9022C267.455 18.4387 267.326 17.8469 267.326 17.1269C267.326 16.3871 267.46 15.746 267.726 15.2036C267.992 14.6611 268.352 14.2123 268.806 13.8573C269.26 13.5022 269.787 13.2359 270.389 13.0584C270.991 12.8808 271.627 12.7921 272.297 12.7921C273.077 12.7921 273.797 12.866 274.458 13.014C275.128 13.1619 275.735 13.3493 276.277 13.5762V15.5291C275.685 15.3022 275.084 15.1197 274.472 14.9817C273.871 14.8337 273.249 14.7548 272.608 14.7449C272.066 14.7449 271.602 14.7992 271.217 14.9077C270.833 15.0162 270.517 15.1691 270.271 15.3663C270.024 15.5537 269.842 15.7806 269.723 16.0469C269.615 16.3033 269.56 16.5893 269.56 16.905Z"
				fill={ color }
			/>
			<Path
				d="M281.356 16.905C281.356 17.2896 281.44 17.6052 281.607 17.8518C281.775 18.0984 281.997 18.3006 282.273 18.4584C282.559 18.6063 282.885 18.7296 283.25 18.8283C283.624 18.9269 284.009 19.0157 284.404 19.0946C284.946 19.2129 285.459 19.3461 285.942 19.494C286.426 19.6321 286.869 19.8441 287.274 20.1302C287.688 20.4162 288.018 20.8058 288.265 21.299C288.521 21.7822 288.65 22.4135 288.65 23.1927C288.65 23.9028 288.512 24.534 288.235 25.0864C287.959 25.6288 287.57 26.0875 287.067 26.4623C286.564 26.8272 285.962 27.1034 285.262 27.2908C284.561 27.488 283.792 27.5867 282.954 27.5867C282.441 27.5867 281.972 27.5571 281.548 27.4979C281.134 27.4486 280.764 27.3795 280.439 27.2908C280.123 27.2119 279.852 27.128 279.625 27.0393C279.398 26.9505 279.211 26.8667 279.063 26.7878V24.8645C279.655 25.1012 280.241 25.2886 280.823 25.4266C281.405 25.5647 282.046 25.6338 282.747 25.6338C283.299 25.6338 283.797 25.5845 284.241 25.4858C284.685 25.3872 285.064 25.2442 285.38 25.0568C285.706 24.8595 285.952 24.6179 286.12 24.3318C286.297 24.036 286.386 23.6957 286.386 23.311C286.386 22.9165 286.307 22.591 286.149 22.3346C285.992 22.0781 285.78 21.8661 285.513 21.6984C285.247 21.5307 284.936 21.3927 284.581 21.2842C284.236 21.1757 283.871 21.077 283.486 20.9883C282.983 20.8798 282.47 20.7516 281.948 20.6036C281.435 20.4557 280.966 20.2485 280.542 19.9822C280.118 19.7159 279.773 19.3559 279.507 18.9022C279.25 18.4387 279.122 17.8469 279.122 17.1269C279.122 16.3871 279.255 15.746 279.521 15.2036C279.788 14.6611 280.148 14.2123 280.601 13.8573C281.055 13.5022 281.583 13.2359 282.184 13.0584C282.786 12.8808 283.422 12.7921 284.093 12.7921C284.872 12.7921 285.592 12.866 286.253 13.014C286.924 13.1619 287.53 13.3493 288.073 13.5762V15.5291C287.481 15.3022 286.879 15.1197 286.268 14.9817C285.666 14.8337 285.045 14.7548 284.404 14.7449C283.861 14.7449 283.398 14.7992 283.013 14.9077C282.628 15.0162 282.313 15.1691 282.066 15.3663C281.82 15.5537 281.637 15.7806 281.519 16.0469C281.41 16.3033 281.356 16.5893 281.356 16.905Z"
				fill={ color }
			/>
			<Path
				d="M20.0007 40C31.0468 40 40.0015 31.0453 40.0015 19.9993C40.0015 8.95323 31.0468 0 20.0007 0C8.95472 0 0 8.95471 0 20.0007C0 31.0468 8.95472 40 20.0007 40Z"
				fill={ iconColor }
			/>
			<Path d="M20.9932 16.6416V36.0307L30.9935 16.6416H20.9932V16.6416Z" fill="white" />
			<Path d="M18.9697 23.3213V3.96924L9.00781 23.3213H18.9697Z" fill="white" />
			<Path
				d="M51.6411 33.2061C51.0679 32.3278 50.5347 31.451 50 30.6112C52.8245 28.8931 53.7783 27.5202 53.7783 24.9238V9.92325H50.4577V7.06177H57.5195V24.161C57.5195 28.5125 56.2606 30.9548 51.6411 33.2061Z"
				fill={ color }
			/>
			<Path
				d="M81.2225 22.9776C81.2225 24.4276 82.2533 24.5802 82.9406 24.5802C83.6278 24.5802 84.6201 24.3506 85.3829 24.1225V26.7944C84.3135 27.138 83.2072 27.4046 81.6802 27.4046C79.848 27.4046 77.7108 26.7174 77.7108 23.5108V15.6477H75.7646V12.9373H77.7108V8.93091H81.2225V12.9388H85.6495V15.6492H81.2225V22.9776Z"
				fill={ color }
			/>
			<Path
				d="M88.5518 34.542V12.9002H91.9109V14.1976C93.2468 13.1668 94.7353 12.5181 96.5675 12.5181C99.7355 12.5181 102.255 14.7323 102.255 19.5029C102.255 24.2365 99.5074 27.3661 94.9649 27.3661C93.8585 27.3661 92.9802 27.2135 92.0634 27.0225V34.5035H88.5518V34.542V34.542ZM95.6507 15.4195C94.6198 15.4195 93.3224 15.9157 92.1005 16.9851V24.352C92.8632 24.5046 93.666 24.6186 94.7339 24.6186C97.2147 24.6186 98.6277 23.0531 98.6277 19.771C98.6277 16.7555 97.5968 15.4195 95.6507 15.4195Z"
				fill={ color }
			/>
			<Path
				d="M116.07 27.0609H112.788V25.4954H112.711C111.566 26.3737 110.153 27.3275 108.054 27.3275C106.222 27.3275 104.237 25.9916 104.237 23.2812C104.237 19.6555 107.328 18.9682 109.504 18.6631L112.595 18.244V17.8248C112.595 15.9157 111.832 15.3055 110.037 15.3055C109.159 15.3055 107.099 15.5721 105.419 16.2593L105.114 13.4348C106.641 12.9002 108.74 12.5195 110.496 12.5195C113.931 12.5195 116.145 13.894 116.145 17.9774V27.0609H116.07V27.0609ZM112.558 20.4582L109.657 20.9159C108.778 21.0299 107.863 21.5646 107.863 22.862C107.863 24.0069 108.512 24.6556 109.466 24.6556C110.496 24.6556 111.603 24.0454 112.557 23.3582V20.4582H112.558Z"
				fill={ color }
			/>
			<Path
				d="M130.574 26.6034C129.124 27.0995 127.827 27.4046 126.184 27.4046C120.918 27.4046 118.817 24.3891 118.817 20.0006C118.817 15.3826 121.719 12.5196 126.412 12.5196C128.168 12.5196 129.237 12.8247 130.42 13.2068V16.1838C129.389 15.8017 127.901 15.3826 126.451 15.3826C124.314 15.3826 122.482 16.5275 122.482 19.8096C122.482 23.4353 124.314 24.5432 126.642 24.5432C127.748 24.5432 128.97 24.3136 130.611 23.6649V26.6034H130.574Z"
				fill={ color }
			/>
			<Path
				d="M137.216 19.0083C137.521 18.6647 137.751 18.3211 142.178 12.9388H146.758L141.032 19.657L147.291 27.0995H142.711L137.253 20.3813V27.0995H133.743V7.06177H137.255V19.0083H137.216Z"
				fill={ color }
			/>
			<Path
				d="M73.1301 26.6033C71.298 27.1765 69.7324 27.4046 67.9003 27.4046C63.3963 27.4046 60.6104 25.1533 60.6104 19.8851C60.6104 16.0298 62.9771 12.5181 67.5182 12.5181C72.0222 12.5181 73.5877 15.6477 73.5877 18.6247C73.5877 19.617 73.5107 20.1517 73.4737 20.7234H64.3901C64.4671 23.8144 66.2222 24.5402 68.8556 24.5402C70.3056 24.5402 71.6031 24.1966 73.093 23.6619V26.6004H73.1301V26.6033ZM69.925 18.3966C69.925 16.6785 69.3518 15.19 67.4826 15.19C65.7275 15.19 64.6582 16.4489 64.4286 18.3966H69.925V18.3966Z"
				fill={ color }
			/>
		</SVG>
	);
}
