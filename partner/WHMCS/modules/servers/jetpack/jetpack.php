<?php

use WHMCS\Database\Capsule;

if (!defined("WHMCS")) {
    die("This file cannot be accessed directly");
}


/**
 * A WHMCS module for use by Jetpack hosting partners to provision Jetpack plans.
 * The module provides functionality for partner hosts to be able to save their
 * client id and secret to request an access token for provisioning plans.
 *
 * Plans available for provisioning include free, personal, premium and professional
 *
 * A host has options to either provision(Create == WHMCS equivalent functional term)
 * or Cancel(Terminate == WHMCS equivalent functional term) from the WHMCS client area.
 *
 * Host setup for custom fields is currently required in order to use the module.
 *
 */

/**
 * Jetpack Meta Data for WHMCS module. This is what is shown specifically when the host
 * is setting up the module.
 *
 * @return array
 */
function jetpack_MetaData()
{
    return [
        'DisplayName' => 'Jetpack by Automattic',
        'Description' => 'Use this module to provision Jetpack plans with your Jetpack hosting partner account',
        'APIVersion' => '1.1',
        'RequiresServer' => false,
    ];
}


/**
 * Basic configuration options required for a partner to get a Jetpack plan provisioned. Currently a partner
 * client id and secret are the only host partner options needed to get an access token to provision a Jetpack plan
 * @return array
 */
function jetpack_ConfigOptions()
{
    return [
        'Jetpack Partner Client ID' => [
            'Type' => 'text',
            'Size' => '256',
        ],
        'Jetpack Partner Client Secret' => [
            'Type' => 'text',
            'Size' => '256',
        ]
    ];
}


/**
 * Equivalent to /provision. Create a Jetpack plan using
 * a Jetpack Hosting partner account. WHMCS expects the string "success"
 * to be returned if the process is completed successfully otherwise
 * a string can be returned which will be logged as part of the error.
 *
 * Pre Provisioning Steps:
 *  Module requirements are validated and will return an error string
 *  if the module was not setup correctly. An error string will also be
 *  returned in the event that a request to provision a new plan returns a
 *  4xx or 5xx error.
 *
 *  An Access token will also be retrieved before trying to provision a plan.
 * 	If the access_token_details array does not contain the access token string it will
 *  contain errors about what went wrong with getting the access token which should be
 *  returned to the partner host
 *
 * If the response from provisioning does not contain "success" in the message
 * consider the provisioning to be incomplete and get a useful error from the response
 *
 * @param array WHMCS $params
 * @return string Either 'success' or an error with what went wrong when provisioning
 */
function jetpack_CreateAccount(array $params)
{

    $module_errors = validate_required_fields($params);
    if ($module_errors !== true) {
        return $module_errors;
    }

    $access_token_details = get_access_token($params);
    if (isset($access_token_details['access_token'])) {
        $access_token = $access_token_details['access_token'];
    } else {
        return $access_token_details['errors'];
    }

    $provisioning_url = "https://public-api.wordpress.com/rest/v1.3/jpphp/provision";
    $stripped_url = preg_replace("(^https?://)", "", $params['customfields']['Site URL']);
    $stripped_url = rtrim($stripped_url, '/');

    $request_data = [
        'plan' => strtolower($params['customfields']['Plan']),
        'siteurl' => $stripped_url,
        'local_user' => $params['customfields']['Local User'],
        'force_register' => true,
    ];

    $response = make_api_request($provisioning_url, $access_token, $request_data);
    if (isset($response->success) && $response->success === true) {
        if ($response->next_url) {
            save_provisioning_details($response->next_url, $params);
        } else {
            save_provisioning_details($response->next_url, $params, true);
        }
        return 'success';
    } else {
        $errors = get_provisioning_errors_from_response($response);
        return $errors;
    }
}

/**
 * Equivalent to partner/cancel. Cancel a Jetpack plan using using a Jetpack Hosting partner account. This has
 * the same prerequiste steps as jetpack_createAccount and will return an error string if the module has not been
 * setup correctly or there was a failure getting an access token.
 *
 * The url scheme for the site being cancelled is not necessary when making this request and is stripped along
 * with trailing slashes
 *
 * If the response json does not contain "success" return error strings based on the response properties
 *
 * @param array WHMCS $params
 * @return string Either 'success' or an error with what went wrong when provisioning
 */
function jetpack_TerminateAccount(array $params)
{
    $module_errors = validate_required_fields($params);
    if ($module_errors !== true) {
        return $module_errors;
    }

    $access_token_details = get_access_token($params);
    if (isset($access_token_details['access_token'])) {
        $access_token = $access_token_details['access_token'];
    } else {
        return $access_token_details['errors'];
    }

    $stripped_url = preg_replace("(^https?://)", "", $params['customfields']['Site URL']);
    $clean_url = rtrim($stripped_url, '/');
    $clean_url = str_replace('/', '::', $clean_url);


    $request_url = 'https://public-api.wordpress.com/rest/v1.3/jpphp/' . $clean_url . '/partner-cancel';
    $response = make_api_request($request_url, $access_token);

    if (isset($response->success) && $response->success === true) {
        return 'success';
    } elseif ($response->success === false) {
        return 'JETPACK MODULE: Unable to cancel this Jetpack plan as it has likely already been cancelled';
    } else {
        $errors = get_cancellation_errors_from_response($response);
        return $errors;
    }

}

/**
 * Get a Jetpack partner access token using the client_id and client secret
 * stored when the product was created in the WHMCS product settings. If the
 * response does not explicitly contain an access token provisioning or cancellation
 * cannot be attempted so return an error string.
 *
 *
 * @param array $params WHMCS params
 * @return array An array that contains a set property of either the access token
 * or errors that happened while trying to get an access token.
 */
function get_access_token($params)
{

    $oauth_url = "https://public-api.wordpress.com/oauth2/token";

    $credentials = [
        'client_id' => $params['configoption1'],
        'client_secret' => $params['configoption2'],
        'grant_type' => 'client_credentials',
        'scope' => 'jetpack-partner'
    ];

    $response = make_api_request($oauth_url, null, $credentials);
    $access_token_response = [
        'access_token' => null,
        'errors' => null
    ];
    if (isset($response->access_token)) {
        $access_token_response['access_token'] = $response->access_token;
        return $access_token_response;
    } else {
        $errors = get_authentication_errors_from_response($response);
        $access_token_response['errors'] = $errors;
        return $access_token_response;
    }
}


/**
 * Make an API request for authenticating and provisioning or cancelling a Jetpack plan or getting an access token.
 * Include the http status in the response.
 *
 * @param string $url where to make the request to
 * @param string $auth access token to make a provisioning or cancellation request
 * @param array $data form data for the api request
 * @return mixed json_decoded response
 * @throws Exception On a curl error or an empty body an Exception will be thrown.
 */
function make_api_request($url, $auth = null, $data = null)
{

    if (isset($auth)) {
        $auth = "Authorization: Bearer " . $auth;
    }

    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_HTTPHEADER => [$auth],
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => "",
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_POSTFIELDS => $data,
        CURLOPT_CUSTOMREQUEST => "POST"
    ]);

    $response = curl_exec($curl);
    $http_code = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    if (curl_error($curl)) {
        throw new Exception('Unable to connect: ' . curl_errno($curl) . ' - ' . curl_error($curl));
    } elseif (empty($response)) {
        throw new Exception('Empty response');
    }


    $decoded_response = json_decode($response);
    $decoded_response->http_status = $http_code;
    curl_close($curl);

    return $decoded_response;
}

/**
 * Save the next_url for Jetpack activation/setup to the order for the client. If a next url is not set or is empty
 * and the pending param is true save a message letting the user know a plan is pending and will
 * be available once the domain the plan is being provisioned for resolves
 *
 * @param string $url The next url for activating the Jetpack plan
 * @param array $params WHMCS params
 * @param bool $pending If the plan is pending domain resolution.
 */
function save_provisioning_details($url, $params, $pending = false)
{
    $jetpack_next_url_field = Capsule::table('tblcustomfields')
        ->where(['fieldname' => 'jetpack_provisioning_details', 'type' => 'product'])->first();

    $details = '';
    if ($url) {
        $details = 'URL to Activate Jetpack: ' . $url;
    } elseif ($pending) {
        $details = 'The domain did not appear to resolve when provisioning was attempted however a Jetpack plan is 
        waiting for ' . $params['customfields']['Site URL'] . '. Once DNS resolves please connect the site via 
        the Jetpack Banner in the sites dashboard';
    }
    Capsule::table('tblcustomfieldsvalues')->where(['fieldid' => $jetpack_next_url_field->id])->update([
        'relid' => $params['model']['orderId'], 'value' => $details]);
}

/**
 * Validate that the module was correctly set up when the product was
 * created by the WHMCS user and that the required Fields/Options for
 * being able to provision a Jetpack plan are present. Fields validated are
 *  - Allowed Plans from Plan Custom Field
 *  - Required Custom Fields
 *  - Required Config Options
 *
 * @param array $params WHMCS params
 * @return bool|string An error describing what was not correctly included in the setup of the module or True if
 * everything checks out and provisioning can be attempted.
 */
function validate_required_fields(array $params)
{
    $allowed_plans = ['free', 'personal', 'premium', 'professional'];
    $required_custom_fields = ['Plan', 'Site URL', 'Local User', 'jetpack_provisioning_details'];

    foreach ($required_custom_fields as $field) {
        if (!isset($params['customfields'][$field])) {
            return 'JETPACK MODULE: The module does not appear to be setup correctly. The required custom field '
                . $field . ' was not setup when the product was created.
				Please see the module documentation for more information';
        }
    }

    if (!in_array(strtolower($params['customfields']['Plan']), $allowed_plans)) {
        return 'JETPACK MODULE: The module does not appear to be setup correctly. ' .
            $params['customfields']['Plan'] . ' is not an allowed plan';
    }

    if (!isset($params['configoption1']) || !isset($params['configoption2'])) {
        return'JETPACK MODULE: Your credentials for provisioning are not complete. Please see the module documentation
        for more information';
    }
    return true;
}

/**
 * If we are attempting to get an access token and this fails parse the response
 * http status code if it's set. If it's a 400 and there is an an error_description
 * in the response body return an error message to the user that includes the error_description.
 *
 * Return a general error if no other information is available.
 *
 * @param object $response Response from request for access token
 * @return string an error string describing the issue when requesting an access token
 */
function get_authentication_errors_from_response($response)
{
    $response_message = isset($response->error_description) ? $response->error_description . '. ' :
        'No error was returned. ';
    if ($response->http_status == 400) {
        return 'JETPACK MODULE: There was a problem getting an access token for your Jetpack hosting partner 
            account. This usually means the Client Id or Client Secret provided when setting up the module are invalid.
            The following error was returned trying to get an access token ' . $response_message;
    } elseif ($response->http_status >= 500) {
        return 'JETPACK MODULE: There was an error communicating with the server. Please try again later.';
    }
    return 'JETPACK MODULE: There was an error getting an access token. The following error was returned - '
        . $response_message . ' Please contact us for assistance.';
}

/**
 * If provisioning fails for a Jetpack plan parse the response http status code
 * and response body and return a useful error regarding what went wrong. Include
 * the response message if there is one.
 *
 * If the response is a 400 or 403 and there is no message in the response return
 * a generic error letting the partner know.
 *
 * @param object $response Response from the provisioning request
 * @return string an error string provided to the partner host describing the issue.
 */
function get_provisioning_errors_from_response($response)
{
    $response_message = isset($response->message) ? $response->message . '. ' : 'No error was returned. ';
    if ($response->http_status == 400 || $response->http_status == 403) {
        return 'JETPACK MODULE: The following error was returned trying to provision a plan - ' . $response_message;
    } elseif ($response->http_status >= 500) {
        return 'JETPACK MODULE: There was an error communicating with the server. Please try again later.';
    }
    return 'JETPACK MODULE: There was an error provisioning the Jetpack plan. The following error was returned - '
        . $response_message . ' Please contact us for assistance.';
}


/**
 * If termination fails for a Jetpack plan parse the http status code and response body
 * and return a useful error message.
 *
 * @param object $response Response from the cancellation request
 * @return string error message for a failed plan cancellation describing the issue.
 */
function get_cancellation_errors_from_response($response)
{
    $response_message = isset($response->message) ? $response->message . '. ' : 'No error was returned. ';
    if ($response->http_status == 404) {
        return 'JETPACK MODULE: The http response was a 404 which likely means the site url attempting to be cancelled
        is invalid';
    } elseif ($response->http_status >= 500) {
        return 'JETPACK MODULE: There was an error communicating with the server. Please try again later.';
    }
    return 'JETPACK MODULE: There was an error cancelling the Jetpack plan. The following error was returned  - '
        . $response_message . ' Please contact us for assistance.';
}
