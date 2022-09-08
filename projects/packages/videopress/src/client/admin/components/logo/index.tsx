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
			fillRule="evenodd"
			clipRule="evenodd"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 330 42"
			width={ 330 }
		>
			<Path
				d="M171.913 25.3466C172.659 23.0786 173.462 20.7898 174.321 18.4804L178.282 7.79276H180.908L172.985 28.5777H170.764L162.841 7.79276H165.467L169.428 18.4804C170.298 20.7898 171.106 23.0786 171.851 25.3466H171.913Z"
				fill={ color }
			/>
			<Path
				d="M183.553 28.5777V13.8201H185.961V28.5777H183.553ZM183.491 10.387V7.69956H186.023V10.387H183.491Z"
				fill={ color }
			/>
			<Path
				d="M191.977 21.3542C191.977 22.2034 192.07 22.975 192.257 23.6689C192.453 24.3524 192.733 24.9375 193.095 25.4242C193.458 25.9006 193.903 26.2683 194.431 26.5272C194.959 26.7861 195.565 26.9155 196.249 26.9155C196.756 26.9155 197.217 26.8482 197.631 26.7136C198.046 26.579 198.413 26.4081 198.734 26.201C199.066 25.9938 199.345 25.7763 199.573 25.5485C199.811 25.3103 199.998 25.0928 200.132 24.8961V17.1755C199.635 16.668 199.061 16.2642 198.408 15.9638C197.756 15.6531 197.051 15.4978 196.295 15.4978C195.84 15.4978 195.358 15.5858 194.851 15.7619C194.354 15.9276 193.888 16.2331 193.453 16.6784C193.028 17.1237 192.676 17.7244 192.396 18.4804C192.117 19.226 191.977 20.184 191.977 21.3542ZM189.46 21.3853C189.46 20.36 189.559 19.4539 189.755 18.6668C189.963 17.8694 190.232 17.1755 190.563 16.5852C190.895 15.9949 191.283 15.503 191.728 15.1094C192.174 14.7055 192.635 14.3793 193.111 14.1308C193.587 13.8822 194.069 13.7062 194.556 13.6026C195.053 13.4887 195.519 13.4317 195.954 13.4317C196.855 13.4317 197.637 13.5819 198.299 13.8822C198.962 14.1826 199.558 14.6227 200.086 15.2026H200.132V6.08398H202.54V28.5777H200.723L200.226 26.9311H200.163C199.977 27.1693 199.76 27.4126 199.511 27.6612C199.262 27.8994 198.967 28.1169 198.626 28.3136C198.294 28.5104 197.906 28.6657 197.461 28.7797C197.026 28.9039 196.518 28.9661 195.938 28.9661C195.13 28.9661 194.338 28.8314 193.561 28.5622C192.785 28.2826 192.091 27.8424 191.48 27.2418C190.879 26.6307 190.392 25.8488 190.02 24.8961C189.647 23.9329 189.46 22.7627 189.46 21.3853Z"
				fill={ color }
			/>
			<Path
				d="M212.673 15.4978C212.124 15.4978 211.611 15.6065 211.135 15.824C210.669 16.0415 210.26 16.3366 209.908 16.7095C209.556 17.0823 209.271 17.5224 209.053 18.0299C208.836 18.527 208.701 19.0603 208.65 19.6299H216.106C216.106 19.05 216.028 18.5115 215.873 18.0144C215.728 17.5069 215.511 17.0668 215.221 16.6939C214.931 16.3211 214.573 16.0311 214.149 15.824C213.724 15.6065 213.232 15.4978 212.673 15.4978ZM213.993 26.8689C214.791 26.8689 215.516 26.8068 216.168 26.6825C216.831 26.5479 217.489 26.3615 218.141 26.1233V28.1272C217.613 28.3861 216.96 28.5881 216.184 28.733C215.407 28.8884 214.573 28.9661 213.683 28.9661C212.626 28.9661 211.632 28.8314 210.7 28.5622C209.778 28.2929 208.971 27.8579 208.277 27.2573C207.583 26.6566 207.034 25.8747 206.63 24.9116C206.237 23.9381 206.04 22.7679 206.04 21.4008C206.04 20.0545 206.226 18.8895 206.599 17.9056C206.972 16.9114 207.469 16.0829 208.09 15.4201C208.712 14.7573 209.426 14.2602 210.234 13.9288C211.042 13.5974 211.886 13.4317 212.766 13.4317C213.595 13.4317 214.366 13.5715 215.081 13.8512C215.806 14.1204 216.432 14.5502 216.96 15.1405C217.489 15.7308 217.903 16.492 218.203 17.4241C218.514 18.3561 218.669 19.4746 218.669 20.7795C218.669 20.9037 218.669 21.0125 218.669 21.1057C218.669 21.1885 218.664 21.3853 218.654 21.696H208.525C208.525 22.6384 208.665 23.441 208.945 24.1038C209.235 24.7563 209.623 25.2896 210.11 25.7039C210.607 26.1077 211.187 26.4029 211.85 26.5893C212.512 26.7757 213.227 26.8689 213.993 26.8689Z"
				fill={ color }
			/>
			<Path
				d="M232.903 21.2144C232.903 20.3031 232.789 19.4953 232.561 18.7911C232.344 18.0765 232.033 17.4758 231.629 16.9891C231.236 16.492 230.764 16.1192 230.216 15.8706C229.667 15.6117 229.066 15.4823 228.414 15.4823C227.761 15.4823 227.161 15.6117 226.612 15.8706C226.063 16.1192 225.586 16.492 225.182 16.9891C224.789 17.4758 224.478 18.0765 224.25 18.7911C224.033 19.4953 223.924 20.3031 223.924 21.2144C223.924 22.1154 224.033 22.9232 224.25 23.6378C224.478 24.342 224.794 24.9375 225.198 25.4242C225.602 25.911 226.078 26.2838 226.627 26.5427C227.176 26.7913 227.777 26.9155 228.429 26.9155C229.082 26.9155 229.677 26.7913 230.216 26.5427C230.764 26.2838 231.236 25.911 231.629 25.4242C232.033 24.9375 232.344 24.342 232.561 23.6378C232.789 22.9232 232.903 22.1154 232.903 21.2144ZM235.42 21.2144C235.42 22.3743 235.254 23.4307 234.923 24.3834C234.591 25.3362 234.12 26.1544 233.509 26.8379C232.908 27.511 232.178 28.034 231.319 28.4068C230.459 28.7797 229.496 28.9661 228.429 28.9661C227.331 28.9661 226.348 28.7797 225.478 28.4068C224.618 28.034 223.883 27.511 223.272 26.8379C222.671 26.1544 222.21 25.3362 221.889 24.3834C221.568 23.4307 221.408 22.3743 221.408 21.2144C221.408 20.0442 221.573 18.9827 221.905 18.0299C222.236 17.0771 222.702 16.259 223.303 15.5755C223.914 14.892 224.649 14.3638 225.509 13.991C226.379 13.6181 227.347 13.4317 228.414 13.4317C229.501 13.4317 230.48 13.6181 231.35 13.991C232.22 14.3638 232.955 14.892 233.555 15.5755C234.156 16.259 234.617 17.0771 234.938 18.0299C235.259 18.9827 235.42 20.0442 235.42 21.2144Z"
				fill={ color }
			/>
			<Path
				d="M241.591 28.5777H239.059V7.79276H244.822C245.682 7.79276 246.474 7.84454 247.199 7.94811C247.934 8.05167 248.607 8.21219 249.218 8.42967C250.461 8.87499 251.404 9.54296 252.046 10.4336C252.688 11.3139 253.009 12.4013 253.009 13.6958C253.009 14.7521 252.797 15.6842 252.372 16.492C251.958 17.2894 251.352 17.9574 250.554 18.4959C249.757 19.0344 248.783 19.4435 247.634 19.7231C246.495 19.9924 245.2 20.127 243.75 20.127C243.056 20.127 242.337 20.096 241.591 20.0338V28.5777ZM241.591 17.7192C241.933 17.7606 242.29 17.7917 242.663 17.8124C243.036 17.8331 243.388 17.8435 243.719 17.8435C244.91 17.8435 245.925 17.7503 246.764 17.5639C247.603 17.3774 248.286 17.1082 248.815 16.7561C249.343 16.3936 249.726 15.9586 249.964 15.4512C250.202 14.9334 250.321 14.3483 250.321 13.6958C250.321 12.888 250.125 12.2252 249.731 11.7074C249.348 11.1896 248.799 10.7961 248.084 10.5268C247.639 10.3611 247.126 10.2472 246.547 10.1851C245.967 10.1126 245.293 10.0763 244.527 10.0763H241.591V17.7192Z"
				fill={ color }
			/>
			<Path
				d="M264.031 15.7774H263.845C263.275 15.7774 262.716 15.8292 262.167 15.9328C261.618 16.0363 261.101 16.1968 260.614 16.4143C260.137 16.6214 259.702 16.8804 259.309 17.191C258.926 17.5017 258.605 17.8694 258.346 18.294V28.5777H255.938V13.8201H257.802L258.268 16.1658H258.315C258.553 15.7826 258.843 15.4253 259.185 15.0939C259.537 14.7625 259.93 14.4725 260.365 14.224C260.8 13.9754 261.277 13.7838 261.794 13.6492C262.312 13.5042 262.856 13.4317 263.426 13.4317C263.529 13.4317 263.633 13.4369 263.736 13.4473C263.85 13.4473 263.949 13.4524 264.031 13.4628V15.7774Z"
				fill={ color }
			/>
			<Path
				d="M271.896 15.4978C271.347 15.4978 270.835 15.6065 270.358 15.824C269.892 16.0415 269.483 16.3366 269.131 16.7095C268.779 17.0823 268.494 17.5224 268.277 18.0299C268.059 18.527 267.924 19.0603 267.873 19.6299H275.329C275.329 19.05 275.252 18.5115 275.096 18.0144C274.951 17.5069 274.734 17.0668 274.444 16.6939C274.154 16.3211 273.796 16.0311 273.372 15.824C272.947 15.6065 272.455 15.4978 271.896 15.4978ZM273.216 26.8689C274.014 26.8689 274.739 26.8068 275.391 26.6825C276.054 26.5479 276.712 26.3615 277.364 26.1233V28.1272C276.836 28.3861 276.184 28.5881 275.407 28.733C274.63 28.8884 273.796 28.9661 272.906 28.9661C271.849 28.9661 270.855 28.8314 269.923 28.5622C269.002 28.2929 268.194 27.8579 267.5 27.2573C266.806 26.6566 266.257 25.8747 265.853 24.9116C265.46 23.9381 265.263 22.7679 265.263 21.4008C265.263 20.0545 265.449 18.8895 265.822 17.9056C266.195 16.9114 266.692 16.0829 267.313 15.4201C267.935 14.7573 268.649 14.2602 269.457 13.9288C270.265 13.5974 271.109 13.4317 271.989 13.4317C272.818 13.4317 273.589 13.5715 274.304 13.8512C275.029 14.1204 275.655 14.5502 276.184 15.1405C276.712 15.7308 277.126 16.492 277.426 17.4241C277.737 18.3561 277.892 19.4746 277.892 20.7795C277.892 20.9037 277.892 21.0125 277.892 21.1057C277.892 21.1885 277.887 21.3853 277.877 21.696H267.748C267.748 22.6384 267.888 23.441 268.168 24.1038C268.458 24.7563 268.846 25.2896 269.333 25.7039C269.83 26.1077 270.41 26.4029 271.073 26.5893C271.736 26.7757 272.45 26.8689 273.216 26.8689Z"
				fill={ color }
			/>
			<Path
				d="M283.039 17.7503C283.039 18.1542 283.127 18.4856 283.303 18.7445C283.479 19.0034 283.712 19.2157 284.002 19.3814C284.302 19.5367 284.644 19.6662 285.027 19.7697C285.42 19.8733 285.824 19.9665 286.239 20.0494C286.808 20.1736 287.347 20.3134 287.854 20.4688C288.362 20.6138 288.828 20.8364 289.252 21.1368C289.687 21.4371 290.034 21.8462 290.293 22.364C290.562 22.8714 290.697 23.5342 290.697 24.3524C290.697 25.098 290.552 25.7608 290.262 26.3408C289.972 26.9104 289.563 27.3919 289.035 27.7855C288.507 28.1686 287.875 28.4586 287.14 28.6554C286.404 28.8625 285.597 28.9661 284.716 28.9661C284.178 28.9661 283.686 28.935 283.241 28.8729C282.806 28.8211 282.417 28.7486 282.075 28.6554C281.744 28.5725 281.459 28.4845 281.221 28.3913C280.983 28.2981 280.786 28.2101 280.631 28.1272V26.1077C281.252 26.3563 281.868 26.5531 282.479 26.6981C283.09 26.843 283.763 26.9155 284.499 26.9155C285.079 26.9155 285.602 26.8638 286.068 26.7602C286.534 26.6566 286.932 26.5065 287.264 26.3097C287.606 26.1026 287.865 25.8488 288.041 25.5485C288.227 25.2378 288.32 24.8805 288.32 24.4766C288.32 24.0624 288.237 23.7206 288.072 23.4514C287.906 23.1821 287.683 22.9595 287.404 22.7834C287.124 22.6073 286.798 22.4624 286.425 22.3484C286.063 22.2345 285.679 22.131 285.275 22.0378C284.747 21.9238 284.209 21.7892 283.66 21.6339C283.121 21.4785 282.629 21.261 282.184 20.9814C281.739 20.7018 281.376 20.3238 281.097 19.8474C280.827 19.3607 280.693 18.7393 280.693 17.9833C280.693 17.2066 280.833 16.5334 281.112 15.9638C281.392 15.3942 281.77 14.923 282.246 14.5502C282.723 14.1774 283.277 13.8978 283.908 13.7113C284.54 13.5249 285.208 13.4317 285.912 13.4317C286.731 13.4317 287.487 13.5094 288.18 13.6647C288.885 13.8201 289.522 14.0169 290.091 14.255V16.3056C289.47 16.0674 288.838 15.8758 288.196 15.7308C287.564 15.5755 286.912 15.4926 286.239 15.4823C285.669 15.4823 285.182 15.5392 284.778 15.6531C284.375 15.7671 284.043 15.9276 283.784 16.1347C283.525 16.3315 283.334 16.5697 283.209 16.8493C283.096 17.1185 283.039 17.4189 283.039 17.7503Z"
				fill={ color }
			/>
			<Path
				d="M295.424 17.7503C295.424 18.1542 295.512 18.4856 295.688 18.7445C295.864 19.0034 296.097 19.2157 296.387 19.3814C296.687 19.5367 297.029 19.6662 297.412 19.7697C297.806 19.8733 298.21 19.9665 298.624 20.0494C299.193 20.1736 299.732 20.3134 300.239 20.4688C300.747 20.6138 301.213 20.8364 301.637 21.1368C302.072 21.4371 302.419 21.8462 302.678 22.364C302.948 22.8714 303.082 23.5342 303.082 24.3524C303.082 25.098 302.937 25.7608 302.647 26.3408C302.357 26.9104 301.948 27.3919 301.42 27.7855C300.892 28.1686 300.26 28.4586 299.525 28.6554C298.79 28.8625 297.982 28.9661 297.101 28.9661C296.563 28.9661 296.071 28.935 295.626 28.8729C295.191 28.8211 294.802 28.7486 294.461 28.6554C294.129 28.5725 293.844 28.4845 293.606 28.3913C293.368 28.2981 293.171 28.2101 293.016 28.1272V26.1077C293.637 26.3563 294.254 26.5531 294.865 26.6981C295.476 26.843 296.149 26.9155 296.884 26.9155C297.464 26.9155 297.987 26.8638 298.453 26.7602C298.919 26.6566 299.318 26.5065 299.649 26.3097C299.991 26.1026 300.25 25.8488 300.426 25.5485C300.612 25.2378 300.705 24.8805 300.705 24.4766C300.705 24.0624 300.623 23.7206 300.457 23.4514C300.291 23.1821 300.069 22.9595 299.789 22.7834C299.509 22.6073 299.183 22.4624 298.81 22.3484C298.448 22.2345 298.065 22.131 297.661 22.0378C297.133 21.9238 296.594 21.7892 296.045 21.6339C295.507 21.4785 295.015 21.261 294.569 20.9814C294.124 20.7018 293.762 20.3238 293.482 19.8474C293.213 19.3607 293.078 18.7393 293.078 17.9833C293.078 17.2066 293.218 16.5334 293.498 15.9638C293.777 15.3942 294.155 14.923 294.632 14.5502C295.108 14.1774 295.662 13.8978 296.294 13.7113C296.925 13.5249 297.593 13.4317 298.298 13.4317C299.116 13.4317 299.872 13.5094 300.566 13.6647C301.27 13.8201 301.907 14.0169 302.476 14.255V16.3056C301.855 16.0674 301.223 15.8758 300.581 15.7308C299.949 15.5755 299.297 15.4926 298.624 15.4823C298.054 15.4823 297.568 15.5392 297.164 15.6531C296.76 15.7671 296.428 15.9276 296.169 16.1347C295.911 16.3315 295.719 16.5697 295.595 16.8493C295.481 17.1185 295.424 17.4189 295.424 17.7503Z"
				fill={ color }
			/>
			<Path
				d="M21.0008 42C32.5991 42 42.0016 32.5975 42.0016 20.9992C42.0016 9.4009 32.5991 0 21.0008 0C9.40245 0 0 9.40245 0 21.0008C0 32.5991 9.40245 42 21.0008 42Z"
				fill={ iconColor }
			/>
			<Path d="M22.0427 17.4736V37.8321L32.5431 17.4736H22.0427Z" fill="white" />
			<Path d="M19.9185 24.4876V4.16797L9.4585 24.4876H19.9185Z" fill="white" />
			<Path
				d="M54.2236 34.8666C53.6218 33.9444 53.0619 33.0237 52.5005 32.142C55.4662 30.338 56.4677 28.8964 56.4677 26.1702V10.4196H52.981V7.41504H60.396V25.3693C60.396 29.9383 59.0741 32.5028 54.2236 34.8666Z"
				fill={ color }
			/>
			<Path
				d="M85.2847 24.1265C85.2847 25.649 86.3671 25.8092 87.0887 25.8092C87.8103 25.8092 88.8522 25.5681 89.6531 25.3286V28.1341C88.5303 28.4949 87.3686 28.7749 85.7652 28.7749C83.8415 28.7749 81.5974 28.0533 81.5974 24.6864V16.4301H79.554V13.5841H81.5974V9.37744H85.2847V13.5857H89.933V16.4316H85.2847V24.1265Z"
				fill={ color }
			/>
			<Path
				d="M92.9795 36.2692V13.5453H96.5066V14.9076C97.9093 13.8252 99.4723 13.144 101.396 13.144C104.722 13.144 107.368 15.469 107.368 20.4781C107.368 25.4484 104.483 28.7344 99.7133 28.7344C98.5516 28.7344 97.6294 28.5743 96.6668 28.3737V36.2287H92.9795V36.2692ZM100.433 16.1906C99.351 16.1906 97.9886 16.7116 96.7056 17.8344V25.5697C97.5065 25.7299 98.3494 25.8496 99.4707 25.8496C102.076 25.8496 103.559 24.2058 103.559 20.7596C103.559 17.5933 102.477 16.1906 100.433 16.1906Z"
				fill={ color }
			/>
			<Path
				d="M121.874 28.4145H118.428V26.7707H118.347C117.145 27.6929 115.661 28.6944 113.458 28.6944C111.534 28.6944 109.45 27.2917 109.45 24.4457C109.45 20.6387 112.696 19.9171 114.98 19.5968L118.226 19.1567V18.7166C118.226 16.712 117.425 16.0712 115.54 16.0712C114.618 16.0712 112.455 16.3512 110.691 17.0728L110.371 14.1071C111.974 13.5457 114.178 13.146 116.022 13.146C119.629 13.146 121.954 14.5892 121.954 18.8767V28.4145H121.874ZM118.187 21.4816L115.141 21.9622C114.218 22.0819 113.257 22.6433 113.257 24.0056C113.257 25.2078 113.938 25.8889 114.94 25.8889C116.022 25.8889 117.184 25.2482 118.185 24.5266V21.4816H118.187Z"
				fill={ color }
			/>
			<Path
				d="M137.104 27.9339C135.581 28.4549 134.219 28.7753 132.494 28.7753C126.964 28.7753 124.759 25.609 124.759 21.0011C124.759 16.1521 127.806 13.146 132.734 13.146C134.577 13.146 135.7 13.4664 136.942 13.8676V16.9934C135.86 16.5922 134.297 16.1521 132.774 16.1521C130.53 16.1521 128.606 17.3542 128.606 20.8005C128.606 24.6075 130.53 25.7707 132.975 25.7707C134.137 25.7707 135.42 25.5297 137.143 24.8485V27.9339H137.104Z"
				fill={ color }
			/>
			<Path
				d="M144.077 19.9589C144.398 19.5981 144.639 19.2373 149.287 13.5859H154.096L148.083 20.6401L154.655 28.4547H149.847L144.116 21.4005V28.4547H140.43V7.41504H144.118V19.9589H144.077Z"
				fill={ color }
			/>
			<Path
				d="M76.7873 27.9335C74.8636 28.5354 73.2198 28.7749 71.2961 28.7749C66.5668 28.7749 63.6416 26.411 63.6416 20.8794C63.6416 16.8313 66.1267 13.144 70.8948 13.144C75.6241 13.144 77.2678 16.4301 77.2678 19.5559C77.2678 20.5979 77.187 21.1593 77.1481 21.7596H67.6103C67.6912 25.0052 69.5341 25.7672 72.2991 25.7672C73.8216 25.7672 75.1839 25.4064 76.7484 24.845V27.9304H76.7873V27.9335ZM73.422 19.3164C73.422 17.5125 72.8201 15.9495 70.8575 15.9495C69.0147 15.9495 67.8918 17.2714 67.6508 19.3164H73.422Z"
				fill={ color }
			/>
		</SVG>
	);
}
