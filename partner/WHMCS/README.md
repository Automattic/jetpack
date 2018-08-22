# WHMCS Jetpack Module

This module is intended to assist Jetpack Hosting partners in managing Jetpack plans for their users. The module allows a host to create a product from the WHMCS admin that can used to provision a Jetpack plan at checkout and manage the plan from the Clients area in WHMCS when needed. Module functions include both automatic provisioning on checkout as well as manual provisioning and plan cancellation from the WHMCS Clients management. 

### Getting Started:
This documentation includes information for managing the WHMCS module. For documentation on the Jetpack Hosting Partners Program please refer to the [Jetpack Hosting Partner Docs][jetpack partner docs]. If you’d like to become a Jetpack Hosting Partner please visit https://jetpack.com/for/hosts/ for more information and to get started. In order to use the module a valid WHMCS license as well as a Jetpack Hosting Partner account are required. To get started with WHMCS please visit https://www.whmcs.com/. 

### Installation/Setup:
To install the module upload the ```/jetpack``` folder to the ```/modules/servers``` directory of your WHMCS installation. A server is not required for the module to function so the module will not be listed in the WHMCS Servers under the Setup tab for Products/Servers. Once uploaded to WHMCS the module is ready for use and can be set up when making a new product in WHMCS.

### Usage:
To use the module create a new product in one of your existing product groups. As part of the product creation process in the Module Settings tab select the “Jetpack by Automattic” module to get started. You will need to have an established Jetpack Hosting Partner account and your client_id and client_secret will be requested in order to create the product and use the module so have these handy when creating the new product. 

When setting up the module 4 custom fields will need to be added in order for the module to work correctly. These fields are verified whenever the module is utilized to create an account. The first 3 fields are required in order to provision a Jetpack plan. They can optionally be shown on the order form to allow your users to include these when checking out and assist with easier provisioning. This is the “Show on Order Form” option when creating custom fields within WHMCS. The last field is used to store details on the response from a provisioning attempt and should not be shown on the order form. When a user is provisioning a new plan this will typically be a URL that they will need to connect the plan you have provisioned for them to their https://wordpress.com account and get started with their Jetpack plan. Please use the field names exactly as shown below as these will be validated when the module is used for provisioning. The fields required are as follows:


| Field Name | Field Type | Required | Show on Order Form |
| ------ | ------ | ------ | ------ |
| Site URL | Text Box | Yes | Optional |
| Local User | Text Box | Yes | Optional |
| Plan | Drop Down | Yes | Optional |
| jetpack_provisioning_details | Text Area | No | No |

As part of the the product creation for WHMCS you may use any of the 4 options under Module Settings for setting up the product. In the Clients Tab of WHMCS admin under Products/Services the module currently provides functionality for Create and Terminate for Jetpack plans. If you do not setup the product to be automatically provisioned on checkout you will be able perform either of these actions for your users. 


[//]: # 
[jetpack partner docs]: <https://github.com/Automattic/jetpack/tree/master/docs/partners>
