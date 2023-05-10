<?php
/**
 *
 * Emerald Components Showcase
 *
 * @package Jetpack CRM
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

?>

<style>
	.jpcrm-form-grid {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		overflow: auto;
	}

	.jpcrm-form-label {
		display: block;
		font-weight: 500;
		line-height: 1.4;
		margin-bottom: calc(8px);
		padding: 0px;
	}

	.jpcrm-form-input, .jpcrm-form-select {
		width: 100%;
		max-width: unset !important;
	}

	.jpcrm-form-input-group {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.jpcrm-input-text {
		font-size: 13px;
	}

	.jpcrm-input-select {
		max-width: unset !important;
	}

	@media (min-width: 768px) {
		.jpcrm-form-grid {
			grid-template-columns: 1fr 1fr;
		}

		.jpcrm-form-group-span-2 {
			grid-column: span 2;
		}
	}

	@media (max-width: 767px) {
		.jpcrm-form-grid {
			grid-template-columns: 1fr;
		}

		.jpcrm-empty-form-group {
			display: none;
		}
	}
</style>
<ol>
	<li><a href="#edit-pages">Edit Pages</a></li>
	<li><a href="#listings">Listings</a></li>
</ol>

<h1 id="edit-pages">Edit Pages</h1>

<div>
	<div class="jpcrm-form-grid" id="wptbpMetaBoxMainItem">
		<div class="jpcrm-form-group jpcrm-form-group-span-2">
			<label class="jpcrm-form-label" for="name">Name:</label>
			<div class="zbs-text-input name">
				<input type="text" name="zbsco_name" id="name" class="form-control widetext zbs-dc jpcrm-input-text" placeholder="e.g. NewCo" value="" autocomplete="zbs-1683608329-name">
			</div>
		</div>
		<div class="jpcrm-form-grid" style="padding:0px;grid-template-columns: 1fr;">
			<div class="jpcrm-form-group">
				<label>Main Address</label>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="addr1">Address Line 1:</label>
				<div class="zbs-text-input addr1">
					<input type="text" name="zbsco_addr1" id="addr1" class="form-control widetext zbs-dc" placeholder="" value="" autocomplete="zbs-1683608329-addr1">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="addr2">Address Line 2:</label>
				<div class="zbs-text-input addr2">
					<input type="text" name="zbsco_addr2" id="addr2" class="form-control widetext zbs-dc" placeholder="" value="" autocomplete="zbs-1683608329-addr2">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="city">City:</label>
				<div class="zbs-text-input city">
					<input type="text" name="zbsco_city" id="city" class="form-control widetext zbs-dc" placeholder="e.g. New York" value="" autocomplete="zbs-1683608329-city">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="county">State:</label>
				<div class="zbs-text-input county">
					<input type="text" name="zbsco_county" id="county" class="form-control widetext zbs-dc" placeholder="e.g. Kings County" value="" autocomplete="zbs-1683608329-county">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="postcode">Post Code:</label>
				<div class="zbs-text-input postcode">
					<input type="text" name="zbsco_postcode" id="postcode" class="form-control widetext zbs-dc" placeholder="e.g. 10019" value="" autocomplete="zbs-1683608329-postcode">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="country">Country:</label>
				<select name="zbsco_country" id="country" class="form-control zbs-dc jpcrm-input-select" autocomplete="zbs-1683608329-country">
					<option value="" selected="selected">Select</option>
					<option value="Afghanistan">Afghanistan</option>
					<option value="Aland Islands">Aland Islands</option>
					<option value="Albania">Albania</option>
					<option value="Algeria">Algeria</option>
					<option value="American Samoa">American Samoa</option>
					<option value="Andorra">Andorra</option>
					<option value="Angola">Angola</option>
					<option value="Anguilla">Anguilla</option>
					<option value="Antarctica">Antarctica</option>
					<option value="Antigua and Barbuda">Antigua and Barbuda</option>
					<option value="Argentina">Argentina</option>
					<option value="Armenia">Armenia</option>
					<option value="Aruba">Aruba</option>
					<option value="Australia">Australia</option>
					<option value="Austria">Austria</option>
					<option value="Azerbaijan">Azerbaijan</option>
					<option value="Bahamas">Bahamas</option>
					<option value="Bahrain">Bahrain</option>
					<option value="Bangladesh">Bangladesh</option>
					<option value="Barbados">Barbados</option>
					<option value="Belarus">Belarus</option>
					<option value="Belgium">Belgium</option>
					<option value="Belize">Belize</option>
					<option value="Benin">Benin</option>
					<option value="Bermuda">Bermuda</option>
					<option value="Bhutan">Bhutan</option>
					<option value="Bolivia">Bolivia</option>
					<option value="Bonaire, Saint Eustatius and Saba">Bonaire, Saint Eustatius and Saba</option>
					<option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
					<option value="Botswana">Botswana</option>
					<option value="Bouvet Island">Bouvet Island</option>
					<option value="Brazil">Brazil</option>
					<option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
					<option value="British Virgin Islands">British Virgin Islands</option>
					<option value="Brunei">Brunei</option>
					<option value="Bulgaria">Bulgaria</option>
					<option value="Burkina Faso">Burkina Faso</option>
					<option value="Burundi">Burundi</option>
					<option value="Cambodia">Cambodia</option>
					<option value="Cameroon">Cameroon</option>
					<option value="Canada">Canada</option>
					<option value="Cape Verde">Cape Verde</option>
					<option value="Cayman Islands">Cayman Islands</option>
					<option value="Central African Republic">Central African Republic</option>
					<option value="Chad">Chad</option>
					<option value="Chile">Chile</option>
					<option value="China">China</option>
					<option value="Christmas Island">Christmas Island</option>
					<option value="Cocos Islands">Cocos Islands</option>
					<option value="Colombia">Colombia</option>
					<option value="Comoros">Comoros</option>
					<option value="Cook Islands">Cook Islands</option>
					<option value="Costa Rica">Costa Rica</option>
					<option value="Croatia">Croatia</option>
					<option value="Cuba">Cuba</option>
					<option value="Curacao">Curacao</option>
					<option value="Cyprus">Cyprus</option>
					<option value="Czech Republic">Czech Republic</option>
					<option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
					<option value="Denmark">Denmark</option>
					<option value="Djibouti">Djibouti</option>
					<option value="Dominica">Dominica</option>
					<option value="Dominican Republic">Dominican Republic</option>
					<option value="East Timor">East Timor</option>
					<option value="Ecuador">Ecuador</option>
					<option value="Egypt">Egypt</option>
					<option value="El Salvador">El Salvador</option>
					<option value="Equatorial Guinea">Equatorial Guinea</option>
					<option value="Eritrea">Eritrea</option>
					<option value="Estonia">Estonia</option>
					<option value="Ethiopia">Ethiopia</option>
					<option value="Falkland Islands">Falkland Islands</option>
					<option value="Faroe Islands">Faroe Islands</option>
					<option value="Fiji">Fiji</option>
					<option value="Finland">Finland</option>
					<option value="France">France</option>
					<option value="French Guiana">French Guiana</option>
					<option value="French Polynesia">French Polynesia</option>
					<option value="French Southern Territories">French Southern Territories</option>
					<option value="Gabon">Gabon</option>
					<option value="Gambia">Gambia</option>
					<option value="Georgia">Georgia</option>
					<option value="Germany">Germany</option>
					<option value="Ghana">Ghana</option>
					<option value="Gibraltar">Gibraltar</option>
					<option value="Greece">Greece</option>
					<option value="Greenland">Greenland</option>
					<option value="Grenada">Grenada</option>
					<option value="Guadeloupe">Guadeloupe</option>
					<option value="Guam">Guam</option>
					<option value="Guatemala">Guatemala</option>
					<option value="Guernsey">Guernsey</option>
					<option value="Guinea">Guinea</option>
					<option value="Guinea-Bissau">Guinea-Bissau</option>
					<option value="Guyana">Guyana</option>
					<option value="Haiti">Haiti</option>
					<option value="Heard Island and McDonald Islands">Heard Island and McDonald Islands</option>
					<option value="Honduras">Honduras</option>
					<option value="Hong Kong">Hong Kong</option>
					<option value="Hungary">Hungary</option>
					<option value="Iceland">Iceland</option>
					<option value="India">India</option>
					<option value="Indonesia">Indonesia</option>
					<option value="Iran">Iran</option>
					<option value="Iraq">Iraq</option>
					<option value="Ireland">Ireland</option>
					<option value="Isle of Man">Isle of Man</option>
					<option value="Israel">Israel</option>
					<option value="Italy">Italy</option>
					<option value="Ivory Coast">Ivory Coast</option>
					<option value="Jamaica">Jamaica</option>
					<option value="Japan">Japan</option>
					<option value="Jersey">Jersey</option>
					<option value="Jordan">Jordan</option>
					<option value="Kazakhstan">Kazakhstan</option>
					<option value="Kenya">Kenya</option>
					<option value="Kiribati">Kiribati</option>
					<option value="Kosovo">Kosovo</option>
					<option value="Kuwait">Kuwait</option>
					<option value="Kyrgyzstan">Kyrgyzstan</option>
					<option value="Laos">Laos</option>
					<option value="Latvia">Latvia</option>
					<option value="Lebanon">Lebanon</option>
					<option value="Lesotho">Lesotho</option>
					<option value="Liberia">Liberia</option>
					<option value="Libya">Libya</option>
					<option value="Liechtenstein">Liechtenstein</option>
					<option value="Lithuania">Lithuania</option>
					<option value="Luxembourg">Luxembourg</option>
					<option value="Macao">Macao</option>
					<option value="Macedonia">Macedonia</option>
					<option value="Madagascar">Madagascar</option>
					<option value="Malawi">Malawi</option>
					<option value="Malaysia">Malaysia</option>
					<option value="Maldives">Maldives</option>
					<option value="Mali">Mali</option>
					<option value="Malta">Malta</option>
					<option value="Marshall Islands">Marshall Islands</option>
					<option value="Martinique">Martinique</option>
					<option value="Mauritania">Mauritania</option>
					<option value="Mauritius">Mauritius</option>
					<option value="Mayotte">Mayotte</option>
					<option value="Mexico">Mexico</option>
					<option value="Micronesia">Micronesia</option>
					<option value="Moldova">Moldova</option>
					<option value="Monaco">Monaco</option>
					<option value="Mongolia">Mongolia</option>
					<option value="Montenegro">Montenegro</option>
					<option value="Montserrat">Montserrat</option>
					<option value="Morocco">Morocco</option>
					<option value="Mozambique">Mozambique</option>
					<option value="Myanmar">Myanmar</option>
					<option value="Namibia">Namibia</option>
					<option value="Nauru">Nauru</option>
					<option value="Nepal">Nepal</option>
					<option value="Netherlands">Netherlands</option>
					<option value="New Caledonia">New Caledonia</option>
					<option value="New Zealand">New Zealand</option>
					<option value="Nicaragua">Nicaragua</option>
					<option value="Niger">Niger</option>
					<option value="Nigeria">Nigeria</option>
					<option value="Niue">Niue</option>
					<option value="Norfolk Island">Norfolk Island</option>
					<option value="North Korea">North Korea</option>
					<option value="Northern Mariana Islands">Northern Mariana Islands</option>
					<option value="Norway">Norway</option>
					<option value="Oman">Oman</option>
					<option value="Pakistan">Pakistan</option>
					<option value="Palau">Palau</option>
					<option value="Palestinian Territory">Palestinian Territory</option>
					<option value="Panama">Panama</option>
					<option value="Papua New Guinea">Papua New Guinea</option>
					<option value="Paraguay">Paraguay</option>
					<option value="Peru">Peru</option>
					<option value="Philippines">Philippines</option>
					<option value="Pitcairn">Pitcairn</option>
					<option value="Poland">Poland</option>
					<option value="Portugal">Portugal</option>
					<option value="Puerto Rico">Puerto Rico</option>
					<option value="Qatar">Qatar</option>
					<option value="Republic of the Congo">Republic of the Congo</option>
					<option value="Reunion">Reunion</option>
					<option value="Romania">Romania</option>
					<option value="Russia">Russia</option>
					<option value="Rwanda">Rwanda</option>
					<option value="Saint Barthelemy">Saint Barthelemy</option>
					<option value="Saint Helena">Saint Helena</option>
					<option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
					<option value="Saint Lucia">Saint Lucia</option>
					<option value="Saint Martin">Saint Martin</option>
					<option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
					<option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
					<option value="Samoa">Samoa</option>
					<option value="San Marino">San Marino</option>
					<option value="Sao Tome and Principe">Sao Tome and Principe</option>
					<option value="Saudi Arabia">Saudi Arabia</option>
					<option value="Senegal">Senegal</option>
					<option value="Serbia">Serbia</option>
					<option value="Seychelles">Seychelles</option>
					<option value="Sierra Leone">Sierra Leone</option>
					<option value="Singapore">Singapore</option>
					<option value="Sint Maarten">Sint Maarten</option>
					<option value="Slovakia">Slovakia</option>
					<option value="Slovenia">Slovenia</option>
					<option value="Solomon Islands">Solomon Islands</option>
					<option value="Somalia">Somalia</option>
					<option value="South Africa">South Africa</option>
					<option value="South Georgia and the South Sandwich Islands">South Georgia and the South Sandwich Islands</option>
					<option value="South Korea">South Korea</option>
					<option value="South Sudan">South Sudan</option>
					<option value="Spain">Spain</option>
					<option value="Sri Lanka">Sri Lanka</option>
					<option value="Sudan">Sudan</option>
					<option value="Suriname">Suriname</option>
					<option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
					<option value="Swaziland">Swaziland</option>
					<option value="Sweden">Sweden</option>
					<option value="Switzerland">Switzerland</option>
					<option value="Syria">Syria</option>
					<option value="Taiwan">Taiwan</option>
					<option value="Tajikistan">Tajikistan</option>
					<option value="Tanzania">Tanzania</option>
					<option value="Thailand">Thailand</option>
					<option value="Togo">Togo</option>
					<option value="Tokelau">Tokelau</option>
					<option value="Tonga">Tonga</option>
					<option value="Trinidad and Tobago">Trinidad and Tobago</option>
					<option value="Tunisia">Tunisia</option>
					<option value="Turkey">Turkey</option>
					<option value="Turkmenistan">Turkmenistan</option>
					<option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
					<option value="Tuvalu">Tuvalu</option>
					<option value="U.S. Virgin Islands">U.S. Virgin Islands</option>
					<option value="Uganda">Uganda</option>
					<option value="Ukraine">Ukraine</option>
					<option value="United Arab Emirates">United Arab Emirates</option>
					<option value="United Kingdom">United Kingdom</option>
					<option value="United States">United States</option>
					<option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
					<option value="Uruguay">Uruguay</option>
					<option value="Uzbekistan">Uzbekistan</option>
					<option value="Vanuatu">Vanuatu</option>
					<option value="Vatican">Vatican</option>
					<option value="Venezuela">Venezuela</option>
					<option value="Vietnam">Vietnam</option>
					<option value="Wallis and Futuna">Wallis and Futuna</option>
					<option value="Western Sahara">Western Sahara</option>
					<option value="Yemen">Yemen</option>
					<option value="Zambia">Zambia</option>
					<option value="Zimbabwe">Zimbabwe</option>
				</select>
			</div>
		</div>
		<div class="jpcrm-form-grid" style="padding:0px;grid-template-columns: 1fr;">
			<div class="jpcrm-form-group">
				<label>Second Address</label>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="secaddr1">Address Line 1:</label>
				<div class="zbs-text-input secaddr1">
					<input type="text" name="zbsco_secaddr1" id="secaddr1" class="form-control widetext zbs-dc" placeholder="" value="" autocomplete="zbs-1683608329-secaddr1">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="secaddr2">Address Line 2:</label>
				<div class="zbs-text-input secaddr2">
					<input type="text" name="zbsco_secaddr2" id="secaddr2" class="form-control widetext zbs-dc" placeholder="" value="" autocomplete="zbs-1683608329-secaddr2">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="seccity">City:</label>
				<div class="zbs-text-input seccity">
					<input type="text" name="zbsco_seccity" id="seccity" class="form-control widetext zbs-dc" placeholder="e.g. Los Angeles" value="" autocomplete="zbs-1683608329-seccity">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="seccounty">State:</label>
				<div class="zbs-text-input seccounty">
					<input type="text" name="zbsco_seccounty" id="seccounty" class="form-control widetext zbs-dc" placeholder="e.g. Los Angeles" value="" autocomplete="zbs-1683608329-seccounty">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="secpostcode">Post Code:</label>
				<div class="zbs-text-input secpostcode">
					<input type="text" name="zbsco_secpostcode" id="secpostcode" class="form-control widetext zbs-dc" placeholder="e.g. 90001" value="" autocomplete="zbs-1683608329-secpostcode">
				</div>
			</div>
			<div class="jpcrm-form-group">
				<label class="jpcrm-form-label" for="seccountry">Country:</label>
				<select name="zbsco_seccountry" id="seccountry" class="form-control zbs-dc jpcrm-input-select" autocomplete="zbs-1683608329-seccountry">
					<option value="" selected="selected">Select</option>
					<option value="Afghanistan">Afghanistan</option>
					<option value="Aland Islands">Aland Islands</option>
					<option value="Albania">Albania</option>
					<option value="Algeria">Algeria</option>
					<option value="American Samoa">American Samoa</option>
					<option value="Andorra">Andorra</option>
					<option value="Angola">Angola</option>
					<option value="Anguilla">Anguilla</option>
					<option value="Antarctica">Antarctica</option>
					<option value="Antigua and Barbuda">Antigua and Barbuda</option>
					<option value="Argentina">Argentina</option>
					<option value="Armenia">Armenia</option>
					<option value="Aruba">Aruba</option>
					<option value="Australia">Australia</option>
					<option value="Austria">Austria</option>
					<option value="Azerbaijan">Azerbaijan</option>
					<option value="Bahamas">Bahamas</option>
					<option value="Bahrain">Bahrain</option>
					<option value="Bangladesh">Bangladesh</option>
					<option value="Barbados">Barbados</option>
					<option value="Belarus">Belarus</option>
					<option value="Belgium">Belgium</option>
					<option value="Belize">Belize</option>
					<option value="Benin">Benin</option>
					<option value="Bermuda">Bermuda</option>
					<option value="Bhutan">Bhutan</option>
					<option value="Bolivia">Bolivia</option>
					<option value="Bonaire, Saint Eustatius and Saba">Bonaire, Saint Eustatius and Saba</option>
					<option value="Bosnia and Herzegovina">Bosnia and Herzegovina</option>
					<option value="Botswana">Botswana</option>
					<option value="Bouvet Island">Bouvet Island</option>
					<option value="Brazil">Brazil</option>
					<option value="British Indian Ocean Territory">British Indian Ocean Territory</option>
					<option value="British Virgin Islands">British Virgin Islands</option>
					<option value="Brunei">Brunei</option>
					<option value="Bulgaria">Bulgaria</option>
					<option value="Burkina Faso">Burkina Faso</option>
					<option value="Burundi">Burundi</option>
					<option value="Cambodia">Cambodia</option>
					<option value="Cameroon">Cameroon</option>
					<option value="Canada">Canada</option>
					<option value="Cape Verde">Cape Verde</option>
					<option value="Cayman Islands">Cayman Islands</option>
					<option value="Central African Republic">Central African Republic</option>
					<option value="Chad">Chad</option>
					<option value="Chile">Chile</option>
					<option value="China">China</option>
					<option value="Christmas Island">Christmas Island</option>
					<option value="Cocos Islands">Cocos Islands</option>
					<option value="Colombia">Colombia</option>
					<option value="Comoros">Comoros</option>
					<option value="Cook Islands">Cook Islands</option>
					<option value="Costa Rica">Costa Rica</option>
					<option value="Croatia">Croatia</option>
					<option value="Cuba">Cuba</option>
					<option value="Curacao">Curacao</option>
					<option value="Cyprus">Cyprus</option>
					<option value="Czech Republic">Czech Republic</option>
					<option value="Democratic Republic of the Congo">Democratic Republic of the Congo</option>
					<option value="Denmark">Denmark</option>
					<option value="Djibouti">Djibouti</option>
					<option value="Dominica">Dominica</option>
					<option value="Dominican Republic">Dominican Republic</option>
					<option value="East Timor">East Timor</option>
					<option value="Ecuador">Ecuador</option>
					<option value="Egypt">Egypt</option>
					<option value="El Salvador">El Salvador</option>
					<option value="Equatorial Guinea">Equatorial Guinea</option>
					<option value="Eritrea">Eritrea</option>
					<option value="Estonia">Estonia</option>
					<option value="Ethiopia">Ethiopia</option>
					<option value="Falkland Islands">Falkland Islands</option>
					<option value="Faroe Islands">Faroe Islands</option>
					<option value="Fiji">Fiji</option>
					<option value="Finland">Finland</option>
					<option value="France">France</option>
					<option value="French Guiana">French Guiana</option>
					<option value="French Polynesia">French Polynesia</option>
					<option value="French Southern Territories">French Southern Territories</option>
					<option value="Gabon">Gabon</option>
					<option value="Gambia">Gambia</option>
					<option value="Georgia">Georgia</option>
					<option value="Germany">Germany</option>
					<option value="Ghana">Ghana</option>
					<option value="Gibraltar">Gibraltar</option>
					<option value="Greece">Greece</option>
					<option value="Greenland">Greenland</option>
					<option value="Grenada">Grenada</option>
					<option value="Guadeloupe">Guadeloupe</option>
					<option value="Guam">Guam</option>
					<option value="Guatemala">Guatemala</option>
					<option value="Guernsey">Guernsey</option>
					<option value="Guinea">Guinea</option>
					<option value="Guinea-Bissau">Guinea-Bissau</option>
					<option value="Guyana">Guyana</option>
					<option value="Haiti">Haiti</option>
					<option value="Heard Island and McDonald Islands">Heard Island and McDonald Islands</option>
					<option value="Honduras">Honduras</option>
					<option value="Hong Kong">Hong Kong</option>
					<option value="Hungary">Hungary</option>
					<option value="Iceland">Iceland</option>
					<option value="India">India</option>
					<option value="Indonesia">Indonesia</option>
					<option value="Iran">Iran</option>
					<option value="Iraq">Iraq</option>
					<option value="Ireland">Ireland</option>
					<option value="Isle of Man">Isle of Man</option>
					<option value="Israel">Israel</option>
					<option value="Italy">Italy</option>
					<option value="Ivory Coast">Ivory Coast</option>
					<option value="Jamaica">Jamaica</option>
					<option value="Japan">Japan</option>
					<option value="Jersey">Jersey</option>
					<option value="Jordan">Jordan</option>
					<option value="Kazakhstan">Kazakhstan</option>
					<option value="Kenya">Kenya</option>
					<option value="Kiribati">Kiribati</option>
					<option value="Kosovo">Kosovo</option>
					<option value="Kuwait">Kuwait</option>
					<option value="Kyrgyzstan">Kyrgyzstan</option>
					<option value="Laos">Laos</option>
					<option value="Latvia">Latvia</option>
					<option value="Lebanon">Lebanon</option>
					<option value="Lesotho">Lesotho</option>
					<option value="Liberia">Liberia</option>
					<option value="Libya">Libya</option>
					<option value="Liechtenstein">Liechtenstein</option>
					<option value="Lithuania">Lithuania</option>
					<option value="Luxembourg">Luxembourg</option>
					<option value="Macao">Macao</option>
					<option value="Macedonia">Macedonia</option>
					<option value="Madagascar">Madagascar</option>
					<option value="Malawi">Malawi</option>
					<option value="Malaysia">Malaysia</option>
					<option value="Maldives">Maldives</option>
					<option value="Mali">Mali</option>
					<option value="Malta">Malta</option>
					<option value="Marshall Islands">Marshall Islands</option>
					<option value="Martinique">Martinique</option>
					<option value="Mauritania">Mauritania</option>
					<option value="Mauritius">Mauritius</option>
					<option value="Mayotte">Mayotte</option>
					<option value="Mexico">Mexico</option>
					<option value="Micronesia">Micronesia</option>
					<option value="Moldova">Moldova</option>
					<option value="Monaco">Monaco</option>
					<option value="Mongolia">Mongolia</option>
					<option value="Montenegro">Montenegro</option>
					<option value="Montserrat">Montserrat</option>
					<option value="Morocco">Morocco</option>
					<option value="Mozambique">Mozambique</option>
					<option value="Myanmar">Myanmar</option>
					<option value="Namibia">Namibia</option>
					<option value="Nauru">Nauru</option>
					<option value="Nepal">Nepal</option>
					<option value="Netherlands">Netherlands</option>
					<option value="New Caledonia">New Caledonia</option>
					<option value="New Zealand">New Zealand</option>
					<option value="Nicaragua">Nicaragua</option>
					<option value="Niger">Niger</option>
					<option value="Nigeria">Nigeria</option>
					<option value="Niue">Niue</option>
					<option value="Norfolk Island">Norfolk Island</option>
					<option value="North Korea">North Korea</option>
					<option value="Northern Mariana Islands">Northern Mariana Islands</option>
					<option value="Norway">Norway</option>
					<option value="Oman">Oman</option>
					<option value="Pakistan">Pakistan</option>
					<option value="Palau">Palau</option>
					<option value="Palestinian Territory">Palestinian Territory</option>
					<option value="Panama">Panama</option>
					<option value="Papua New Guinea">Papua New Guinea</option>
					<option value="Paraguay">Paraguay</option>
					<option value="Peru">Peru</option>
					<option value="Philippines">Philippines</option>
					<option value="Pitcairn">Pitcairn</option>
					<option value="Poland">Poland</option>
					<option value="Portugal">Portugal</option>
					<option value="Puerto Rico">Puerto Rico</option>
					<option value="Qatar">Qatar</option>
					<option value="Republic of the Congo">Republic of the Congo</option>
					<option value="Reunion">Reunion</option>
					<option value="Romania">Romania</option>
					<option value="Russia">Russia</option>
					<option value="Rwanda">Rwanda</option>
					<option value="Saint Barthelemy">Saint Barthelemy</option>
					<option value="Saint Helena">Saint Helena</option>
					<option value="Saint Kitts and Nevis">Saint Kitts and Nevis</option>
					<option value="Saint Lucia">Saint Lucia</option>
					<option value="Saint Martin">Saint Martin</option>
					<option value="Saint Pierre and Miquelon">Saint Pierre and Miquelon</option>
					<option value="Saint Vincent and the Grenadines">Saint Vincent and the Grenadines</option>
					<option value="Samoa">Samoa</option>
					<option value="San Marino">San Marino</option>
					<option value="Sao Tome and Principe">Sao Tome and Principe</option>
					<option value="Saudi Arabia">Saudi Arabia</option>
					<option value="Senegal">Senegal</option>
					<option value="Serbia">Serbia</option>
					<option value="Seychelles">Seychelles</option>
					<option value="Sierra Leone">Sierra Leone</option>
					<option value="Singapore">Singapore</option>
					<option value="Sint Maarten">Sint Maarten</option>
					<option value="Slovakia">Slovakia</option>
					<option value="Slovenia">Slovenia</option>
					<option value="Solomon Islands">Solomon Islands</option>
					<option value="Somalia">Somalia</option>
					<option value="South Africa">South Africa</option>
					<option value="South Georgia and the South Sandwich Islands">South Georgia and the South Sandwich Islands</option>
					<option value="South Korea">South Korea</option>
					<option value="South Sudan">South Sudan</option>
					<option value="Spain">Spain</option>
					<option value="Sri Lanka">Sri Lanka</option>
					<option value="Sudan">Sudan</option>
					<option value="Suriname">Suriname</option>
					<option value="Svalbard and Jan Mayen">Svalbard and Jan Mayen</option>
					<option value="Swaziland">Swaziland</option>
					<option value="Sweden">Sweden</option>
					<option value="Switzerland">Switzerland</option>
					<option value="Syria">Syria</option>
					<option value="Taiwan">Taiwan</option>
					<option value="Tajikistan">Tajikistan</option>
					<option value="Tanzania">Tanzania</option>
					<option value="Thailand">Thailand</option>
					<option value="Togo">Togo</option>
					<option value="Tokelau">Tokelau</option>
					<option value="Tonga">Tonga</option>
					<option value="Trinidad and Tobago">Trinidad and Tobago</option>
					<option value="Tunisia">Tunisia</option>
					<option value="Turkey">Turkey</option>
					<option value="Turkmenistan">Turkmenistan</option>
					<option value="Turks and Caicos Islands">Turks and Caicos Islands</option>
					<option value="Tuvalu">Tuvalu</option>
					<option value="U.S. Virgin Islands">U.S. Virgin Islands</option>
					<option value="Uganda">Uganda</option>
					<option value="Ukraine">Ukraine</option>
					<option value="United Arab Emirates">United Arab Emirates</option>
					<option value="United Kingdom">United Kingdom</option>
					<option value="United States">United States</option>
					<option value="United States Minor Outlying Islands">United States Minor Outlying Islands</option>
					<option value="Uruguay">Uruguay</option>
					<option value="Uzbekistan">Uzbekistan</option>
					<option value="Vanuatu">Vanuatu</option>
					<option value="Vatican">Vatican</option>
					<option value="Venezuela">Venezuela</option>
					<option value="Vietnam">Vietnam</option>
					<option value="Wallis and Futuna">Wallis and Futuna</option>
					<option value="Western Sahara">Western Sahara</option>
					<option value="Yemen">Yemen</option>
					<option value="Zambia">Zambia</option>
					<option value="Zimbabwe">Zimbabwe</option>
				</select>
			</div>
		</div>
		<div class="jpcrm-form-group jpcrm-form-group-span-2">&nbsp;</div>
		<div class="jpcrm-form-group">
			<label class="jpcrm-form-label" for="maintel">Main Telephone:</label>
			<input type="text" name="zbsco_maintel" id="maintel" class="form-control zbs-tel zbs-dc" placeholder="e.g. 877 2733049" value="" autocomplete="zbs-1683608329-maintel">
		</div>
		<div class="jpcrm-form-group">
			<label class="jpcrm-form-label" for="sectel">Secondary Telephone:</label>
			<input type="text" name="zbsco_sectel" id="sectel" class="form-control zbs-tel zbs-dc" placeholder="e.g. 877 2733049" value="" autocomplete="zbs-1683608329-sectel">
		</div>
		<div class="jpcrm-form-group">
			<label class="jpcrm-form-label" for="email">Main Email Address:</label>
			<div class="email">
				<input type="text" name="zbsco_email" id="email" class="form-control zbs-email zbs-dc" placeholder="e.g. hello@company.com" value="" autocomplete="zbs-1683608329-email">
			</div>
		</div>
	</div>
</div>

<h1 id="listings">Listings</h1>




