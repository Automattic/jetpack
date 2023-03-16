import './style.scss';

export default () => {
	return (
		<div className="flip">
			<div className="flip__inner">
				<div className="ticket">
					<div className="ticket__header">
						<svg
							width="116"
							height="32"
							viewBox="0 0 116 32"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<g clip-path="url(#clip0_20_190)">
								<path
									d="M15.7609 32C24.4654 32 31.5217 24.8366 31.5217 16C31.5217 7.16344 24.4654 0 15.7609 0C7.05638 0 0 7.16344 0 16C0 24.8366 7.05638 32 15.7609 32Z"
									fill="black"
								/>
								<path
									fill-rule="evenodd"
									clip-rule="evenodd"
									d="M15.1004 3.17557V18.6565H7.25003L15.1004 3.17557ZM16.6945 28.8244V13.313H24.5749L16.6945 28.8244Z"
									fill="white"
								/>
								<path
									d="M40.6706 26.5649C40.2197 25.8626 39.7989 25.1603 39.3781 24.4886C41.6025 23.1145 42.354 22.0153 42.354 19.9389V7.93894H39.7388V5.64886H45.2998V19.3283C45.2998 22.8092 44.3079 24.7634 40.6706 26.5649Z"
									fill="black"
								/>
								<path
									d="M63.9668 18.3817C63.9668 19.542 64.7784 19.6641 65.3195 19.6641C65.8606 19.6641 66.6421 19.4809 67.2433 19.2977V21.4351C66.4017 21.7099 65.5299 21.9237 64.3275 21.9237C62.8847 21.9237 61.2013 21.3741 61.2013 18.8092V12.5191H59.6683V10.3512H61.2013V7.14505H63.9668V10.3512H67.4537V12.5191H63.9668V18.3817Z"
									fill="black"
								/>
								<path
									d="M69.7383 27.6336V10.3206H72.3835V11.3588C73.4356 10.5344 74.6079 10.0153 76.0508 10.0153C78.5457 10.0153 80.5297 11.7863 80.5297 15.6031C80.5297 19.3893 78.3654 21.8931 74.7883 21.8931C73.9166 21.8931 73.2252 21.771 72.5038 21.6183V27.6031H69.7383V27.6336ZM75.3294 12.3359C74.5178 12.3359 73.4957 12.7328 72.5338 13.5878V19.4809C73.135 19.6031 73.7663 19.6947 74.6079 19.6947C76.5618 19.6947 77.674 18.4428 77.674 15.8168C77.674 13.4046 76.8624 12.3359 75.3294 12.3359Z"
									fill="black"
								/>
								<path
									d="M91.4113 21.6489H88.8261V20.397H88.766C87.8642 21.0992 86.752 21.8626 85.0987 21.8626C83.6559 21.8626 82.0928 20.7939 82.0928 18.626C82.0928 15.7252 84.5276 15.1756 86.241 14.9313L88.6758 14.5954V14.2595C88.6758 12.7328 88.0746 12.2443 86.6618 12.2443C85.9705 12.2443 84.3472 12.458 83.0246 13.0076L82.7841 10.7481C83.9865 10.3206 85.6398 10.0153 87.0225 10.0153C89.7279 10.0153 91.4714 11.1145 91.4714 14.3817V21.6489H91.4113ZM88.6458 16.3664L86.3612 16.7328C85.6699 16.8244 84.9484 17.2519 84.9484 18.2901C84.9484 19.2061 85.4594 19.7252 86.2109 19.7252C87.0225 19.7252 87.8943 19.2366 88.6458 18.687V16.3664Z"
									fill="black"
								/>
								<path
									d="M102.834 21.2824C101.692 21.6794 100.67 21.9237 99.377 21.9237C95.2288 21.9237 93.5755 19.5115 93.5755 16C93.5755 12.3054 95.8601 10.0153 99.5574 10.0153C100.94 10.0153 101.782 10.2595 102.714 10.5649V12.9466C101.902 12.6412 100.73 12.3054 99.5874 12.3054C97.9041 12.3054 96.4613 13.2214 96.4613 15.8473C96.4613 18.7481 97.9041 19.6336 99.7377 19.6336C100.609 19.6336 101.571 19.4504 102.864 18.9313V21.2824H102.834Z"
									fill="black"
								/>
								<path
									d="M108.064 15.2061C108.305 14.9313 108.485 14.6565 111.972 10.3512H115.579L111.07 15.7252L116 21.6794H112.393L108.094 16.3054V21.6794H105.329V5.64886H108.094V15.2061H108.064Z"
									fill="black"
								/>
								<path
									d="M57.5942 21.2824C56.1513 21.7405 54.9189 21.9237 53.476 21.9237C49.929 21.9237 47.7346 20.1221 47.7346 15.9084C47.7346 12.8244 49.5983 10.0153 53.1754 10.0153C56.7225 10.0153 57.9549 12.5191 57.9549 14.9008C57.9549 15.6947 57.8948 16.1221 57.8647 16.5802H50.7105C50.7707 19.0534 52.1534 19.6336 54.2275 19.6336C55.3698 19.6336 56.3918 19.3588 57.5641 18.9313V21.2824H57.5942ZM55.0692 14.7176C55.0692 13.3435 54.6183 12.1527 53.1454 12.1527C51.7626 12.1527 50.921 13.1603 50.7406 14.7176H55.0692Z"
									fill="black"
								/>
							</g>
							<defs>
								<clipPath id="clip0_20_190">
									<rect width="116" height="32" fill="white" />
								</clipPath>
							</defs>
						</svg>
					</div>

					<div style={ { padding: '0.1rem 0' } }></div>
					<h1 className="ticket__heading" data-text="Golden Ticket">
						Golden Ticket
					</h1>

					<div className="ticket__details">
						<div className="ticket__detail">
							<div>Date</div>
							<div>Feb. 1</div>
						</div>

						<div className="ticket__detail">
							<div>Time</div>
							<div>10 a.m. (sharp)</div>
						</div>

						<div className="ticket__detail">
							<div>Place</div>
							<div>Front gates</div>
						</div>
					</div>

					<div className="ticket__extra">This Golden Ticket Ensures Admittance</div>
				</div>

				<div className="back-ticket">
					<h2 className="back-ticket__heading">
						Greetings to You, the lucky finder of this golden ticket,
					</h2>

					<div className="back-ticket__desc">
						<div style={ { fontSize: '1.1rem', lineHeight: 0.97 } }>
							<p>From Mr. Matt Mullenweg!</p>
							<p>
								You have been awarded a lifetime license of Jetpack Complete, courtesy of the
								developers at Jetpack.
							</p>
							<p>
								With this license, you will have access to all the premium features of Jetpack,
								including automatic backups, malware scanning, and priority support from our team of
								experts.
							</p>
							<p>
								We believe that your commitment to creating a top-notch website deserves to be
								rewarded, and we are thrilled to offer you this gift. We hope that Jetpack Complete
								will continue to serve you well in all your online endeavors.
								<span
									className="signature"
									style={ { float: 'right', margin: '1rem 0 0 1rem' } }
								></span>
							</p>
							<p>
								Thank you for choosing Jetpack as your trusted partner in building and maintaining a
								successful website. We look forward to seeing all the amazing content that you will
								create in the future!
							</p>
							Sincerely,
							<br />
							The Jetpack Team
							<hr />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
