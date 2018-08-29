# WHMCS Jetpack Module

This module is intended to assist Jetpack Hosting partners in managing Jetpack plans for their users. The module options are available specifically when a host creates a product that their user can add to a cart and purchase. The module currently does not allow for managing/provisioning plans outside the scope of a product being purchased by a client and managed using WHMCS options for client products. 

Once purchased the Jetpack plan can be provisioned based on one of the 4 available options in WHMCS when creating a new product that involves a module for provisioning(3 Automatic provisioning options and the option to not provision under Module Settings when creating a product). 

The module also allows for hosts to manually manage the plan from the Clients area in WHMCS when needed once the client has placed the order for the product. The product will be listed in the Clients area of WHMCS under the Products/Services tab for the specific client. Module functions include both automatic provisioning on checkout as well as manual provisioning and plan cancellation from the WHMCS Clients management. 

### Getting Started:
This documentation includes information for managing the WHMCS module. For documentation on the Jetpack Hosting Partners Program please refer to the [Jetpack Hosting Partner Docs](https://github.com/Automattic/jetpack/tree/master/docs/partners). If you’d like to become a Jetpack Hosting Partner please take a look at the [Jetpack Hosting Partner Information Page](https://jetpack.com/for/hosts/) for more information and to get started. In order to use the module a valid WHMCS license as well as a Jetpack Hosting Partner account are required. To get started with WHMCS please visit https://www.whmcs.com/. 

### Installation/Setup:
To install the module upload the ```/jetpack``` folder to the ```/modules/servers``` directory of your WHMCS installation. A server is not required for the module to function so the module will not be listed in the WHMCS Servers under the Setup tab for Products/Servers. Once uploaded to WHMCS the module is ready for use when making a new product in WHMCS. To setup a new product go to the Setup tab and locate Products/Services. You will first need to create a product group after which you can select the Create Product option and add a new product for Jetpack provisioning.

### Usage:
To use the module create a new product in one of your existing product groups. As part of the product creation process in the Module Settings tab select the “Jetpack by Automattic” module to get started. You will need to have an established Jetpack Hosting Partner account and your client_id and client_secret will be requested in order to create the product and use the module so have these handy when creating the new product. 

When setting up the module 4 custom fields will need to be added in order for the module to work correctly. These fields are verified whenever the module is utilized to create an account. The first 3 fields are required in order to provision a Jetpack plan. They can optionally be shown on the order form to allow your users to include these when checking out and assist with easier provisioning. This is the “Show on Order Form” option when creating custom fields within WHMCS. The last field is used to store details on the response from a provisioning attempt and should not be shown on the order form. When a user is provisioning a new plan this will typically be a URL that they will need to connect the plan you have provisioned for them to their https://wordpress.com account and get started with their Jetpack plan. Please use the field names exactly as shown below as these will be validated when the module is used for provisioning. The fields required are as follows:


| Field Name | Field Type | Required | Show on Order Form | Value |
| ------ | ------ | ------ | ------ | ------
| Site URL | Text Box | Yes | Optional | User input field
| Local User | Text Box | Yes | Optional | User input field
| Plan | Drop Down | Yes | Optional | (Free,Personal,Premium,Professional)
| jetpack_provisioning_details | Text Area | Yes | No | **Not a user field(Leave Blank)**

**Please Note:** 
- WHMCS requires that you first save each field by selecting the save changes box at the bottom of the page in order to add the next field.
- If the Site URL, Local User and Plan type are not show on the order form the module cannot be used to provision a Jetpack plan at checkout so please select the "Do not automatically setup this product" in that scenario.

As part of the the product creation for WHMCS you may use any of the 4 options under Module Settings for setting up the product. The modules Create functionality will automatically be called an account provisioned if any of the first 3 options are selected.  

In the Clients Tab of WHMCS admin under Products/Services the module currently provides functionality for Create and Terminate for Jetpack plans. If you do not setup the product to be automatically provisioned on checkout you will be able perform either of these actions for your users. 

### Additional Information/Troubleshooting:
- The jetpack_provisioning_details field will either contain a URL that a user can use to complete the setup for a provisioned jetpack plan or a message indicating that a plan is waiting. The plan will be waiting in the event that the domain that was supplied for provisioning does not resolve likely because it was also just purchased.

- The module will relay issues that are preventing it from functioning properly that are due to incorrect set up of the product whenever manual provisioning is attempted. Examples of these include an incorrectly entered required field or a missing hosting partner information like the client id or secret. 

- Most errors that occur when a user is checking out will be logged in the WHMCS Activity Log and prefixed with 'JETPACK MODULE' to allow for easy searching of these logs.

- Other uncommon errors typically associated with failures in the API request process for provisioning or terminating a plan will require that Module logging be enabled in the Logs section of the Utilities tab for WHMCS. The module provisioning failure should still be logged in the Activity Log however to indicate the failure but will not include the request/response details. Please disable module logging once the error is captured.
