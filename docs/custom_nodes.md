Build a programmatic-style node#
This tutorial walks through building a programmatic-style node. Before you begin, make sure this is the node style you need. Refer to Choose your node building approach for more information.

Prerequisites#
You need the following installed on your development machine:

git
Node.js and npm. Minimum version Node 18.17.0. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL here. For Windows users, refer to Microsoft's guide to Install NodeJS on Windows.
You need some understanding of:

JavaScript/TypeScript
REST APIs
git
Expressions in n8n
Build your node#
In this section, you'll clone n8n's node starter repository, and build a node that integrates the SendGrid. You'll create a node that implements one piece of SendGrid functionality: create a contact.

Existing node

n8n has a built-in SendGrid node. To avoid clashing with the existing node, you'll give your version a different name.

Step 1: Set up the project#
n8n provides a starter repository for node development. Using the starter ensures you have all necessary dependencies. It also provides a linter.

Clone the repository and navigate into the directory:

Generate a new repository from the template repository.
Clone your new repository:

git clone https://github.com/<your-organization>/<your-repo-name>.git n8n-nodes-friendgrid
cd n8n-nodes-friendgrid
The starter contains example nodes and credentials. Delete the following directories and files:

nodes/ExampleNode
nodes/HTTPBin
credentials/ExampleCredentials.credentials.ts
credentials/HttpBinApi.credentials.ts
Now create the following directories and files:

nodes/FriendGrid
nodes/FriendGrid/FriendGrid.node.json
nodes/FriendGrid/FriendGrid.node.ts
credentials/FriendGridApi.credentials.ts

These are the key files required for any node. Refer to Node file structure for more information on required files and recommended organization.

Now install the project dependencies:


npm i
Step 2: Add an icon#
Save the SendGrid SVG logo from here as friendGrid.svg in nodes/FriendGrid/.

n8n recommends using an SVG for your node icon, but you can also use PNG. If using PNG, the icon resolution should be 60x60px. Node icons should have a square or near-square aspect ratio.

Don't reference Font Awesome

If you want to use a Font Awesome icon in your node, download and embed the image.

Step 3: Define the node in the base file#
Every node must have a base file. Refer to Node base file for detailed information about base file parameters.

In this example, the file is FriendGrid.node.ts. To keep this tutorial short, you'll place all the node functionality in this one file. When building more complex nodes, you should consider splitting out your functionality into modules. Refer to Node file structure for more information.

Step 3.1: Imports#
Start by adding the import statements:


import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import {
	OptionsWithUri,
} from 'request';
Step 3.2: Create the main class#
The node must export an interface that implements INodeType. This interface must include a description interface, which in turn contains the properties array.

Class names and file names

Make sure the class name and the file name match. For example, given a class FriendGrid, the filename must be FriendGrid.node.ts.


export class FriendGrid implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details will go here
		properties: [
			// Resources and operations will go here
		],
	};
	// The execute method will go here
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
	}
}
Step 3.3: Add node details#
All programmatic nodes need some basic parameters, such as their display name and icon. Add the following to the description:


displayName: 'FriendGrid',
name: 'friendGrid',
icon: 'file:friendGrid.svg',
group: ['transform'],
version: 1,
description: 'Consume SendGrid API',
defaults: {
	name: 'FriendGrid',
},
inputs: ['main'],
outputs: ['main'],
credentials: [
	{
		name: 'friendGridApi',
		required: true,
	},
],
n8n uses some of the properties set in description to render the node in the Editor UI. These properties are displayName, icon, and description.

Step 3.4: Add the resource#
The resource object defines the API resource that the node uses. In this tutorial, you're creating a node to access one of SendGrid's API endpoints: /v3/marketing/contacts. This means you need to define a resource for this endpoint. Update the properties array with the resource object:


{
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	options: [
		{
			name: 'Contact',
			value: 'contact',
		},
	],
	default: 'contact',
	noDataExpression: true,
	required: true,
	description: 'Create a new contact',
},
type controls which UI element n8n displays for the resource, and tells n8n what type of data to expect from the user. options results in n8n adding a dropdown that allows users to choose one option. Refer to Node UI elements for more information.

Step 3.5: Add operations#
The operations object defines what you can do with a resource. It usually relates to REST API verbs (GET, POST, and so on). In this tutorial, there's one operation: create a contact. It has one required field, the email address for the contact the user creates.

Add the following to the properties array, after the resource object:


{
	displayName: 'Operation',
	name: 'operation',
	type: 'options',
	displayOptions: {
		show: {
			resource: [
				'contact',
			],
		},
	},
	options: [
		{
			name: 'Create',
			value: 'create',
			description: 'Create a contact',
			action: 'Create a contact',
		},
	],
	default: 'create',
	noDataExpression: true,
},
{
	displayName: 'Email',
	name: 'email',
	type: 'string',
	required: true,
	displayOptions: {
		show: {
			operation: [
				'create',
			],
			resource: [
				'contact',
			],
		},
	},
	default:'',
	placeholder: 'name@email.com',
	description:'Primary email for the contact',
},
Step 3.6: Add optional fields#
Most APIs, including the SendGrid API that you're using in this example, have optional fields you can use to refine your query.

To avoid overwhelming users, n8n displays these under Additional Fields in the UI.

For this tutorial, you'll add two additional fields, to allow users to enter the contact's first name and last name. Add the following to the properties array:


{
	displayName: 'Additional Fields',
	name: 'additionalFields',
	type: 'collection',
	placeholder: 'Add Field',
	default: {},
	displayOptions: {
		show: {
			resource: [
				'contact',
			],
			operation: [
				'create',
			],
		},
	},
	options: [
		{
			displayName: 'First Name',
			name: 'firstName',
			type: 'string',
			default: '',
		},
		{
			displayName: 'Last Name',
			name: 'lastName',
			type: 'string',
			default: '',
		},
	],
},
Step 4: Add the execute method#
You've set up the node UI and basic information. It's time to map the node UI to API requests, and make the node actually do something.

The execute method runs every time the node runs. In this method, you have access to the input items and to the parameters that the user set in the UI, including the credentials.

Add the following the execute method in the FriendGrid.node.ts:


// Handle data coming from previous nodes
const items = this.getInputData();
let responseData;
const returnData = [];
const resource = this.getNodeParameter('resource', 0) as string;
const operation = this.getNodeParameter('operation', 0) as string;

// For each item, make an API call to create a contact
for (let i = 0; i < items.length; i++) {
	if (resource === 'contact') {
		if (operation === 'create') {
			// Get email input
			const email = this.getNodeParameter('email', i) as string;
			// Get additional fields input
			const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
			const data: IDataObject = {
				email,
			};

			Object.assign(data, additionalFields);

			// Make HTTP request according to https://sendgrid.com/docs/api-reference/
			const options: OptionsWithUri = {
				headers: {
					'Accept': 'application/json',
				},
				method: 'PUT',
				body: {
					contacts: [
						data,
					],
				},
				uri: `https://api.sendgrid.com/v3/marketing/contacts`,
				json: true,
			};
			responseData = await this.helpers.requestWithAuthentication.call(this, 'friendGridApi', options);
			returnData.push(responseData);
		}
	}
}
// Map data to n8n data structure
return [this.helpers.returnJsonArray(returnData)];
Note the following lines of this code:


const items = this.getInputData();
... 
for (let i = 0; i < items.length; i++) {
	...
	const email = this.getNodeParameter('email', i) as string;
	...
}
Users can provide data in two ways:

Entered directly in the node fields
By mapping data from earlier nodes in the workflow
getInputData(), and the subsequent loop, allows the node to handle situations where data comes from a previous node. This includes supporting multiple inputs. This means that if, for example, the previous node outputs contact information for five people, your FriendGrid node can create five contacts.

Step 5: Set up authentication#
The SendGrid API requires users to authenticate with an API key.

Add the following to FriendGridApi.credentials.ts


import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FriendGridApi implements ICredentialType {
	name = 'friendGridApi';
	displayName = 'FriendGrid API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.sendgrid.com/v3',
			url: '/marketing/contacts',
		},
	};
}
For more information about credentials files and options, refer to Credentials file.

Step 6: Add node metadata#
Metadata about your node goes in the JSON file at the root of your node. n8n refers to this as the codex file. In this example, the file is FriendGrid.node.json.

Add the following code to the JSON file:


{
	"node": "n8n-nodes-base.FriendGrid",
	"nodeVersion": "1.0",
	"codexVersion": "1.0",
	"categories": [
		"Miscellaneous"
	],
	"resources": {
		"credentialDocumentation": [
			{
				"url": ""
			}
		],
		"primaryDocumentation": [
			{
				"url": ""
			}
		]
	}
}
For more information on these parameters, refer to Node codex files.

Step 7: Update the npm package details#
Your npm package details are in the package.json at the root of the project. It's essential to include the n8n object with links to the credentials and base node file. Update this file to include the following information:


{
	// All node names must start with "n8n-nodes-"
	"name": "n8n-nodes-friendgrid",
	"version": "0.1.0",
	"description": "n8n node to create contacts in SendGrid",
	"keywords": [
		// This keyword is required for community nodes
		"n8n-community-node-package"
	],
	"license": "MIT",
	"homepage": "https://n8n.io",
	"author": {
		"name": "Test",
		"email": "test@example.com"
	},
	"repository": {
		"type": "git",
		// Change the git remote to your own repository
		// Add the new URL here
		"url": "git+<your-repo-url>"
	},
	"main": "index.js",
	"scripts": {
		// don't change
	},
	"files": [
		"dist"
	],
	// Link the credentials and node
	"n8n": {
		"n8nNodesApiVersion": 1,
		"credentials": [
			"dist/credentials/FriendGridApi.credentials.js"
		],
		"nodes": [
			"dist/nodes/FriendGrid/FriendGrid.node.js"
		]
	},
	"devDependencies": {
		// don't change
	},
	"peerDependencies": {
		// don't change
	}
}
You need to update the package.json to include your own information, such as your name and repository URL. For more information on npm package.json files, refer to npm's package.json documentation.

Test your node#
You can test your node as you build it by running it in a local n8n instance.

Install n8n using npm:

npm install n8n -g
When you are ready to test your node, publish it locally:

# In your node directory
npm run build
npm link
Install the node into your local n8n instance:


# In the nodes directory within your n8n installation
# node-package-name is the name from the package.json
npm link <node-package-name>
Check your directory

Make sure you run npm link <node-name> in the nodes directory within your n8n installation. This can be:

~/.n8n/custom/
~/.n8n/<your-custom-name>: if your n8n installation set a different name using N8N_CUSTOM_EXTENSIONS.
Start n8n:


n8n start
Open n8n in your browser. You should see your nodes when you search for them in the nodes panel.

Node names

Make sure you search using the node name, not the package name. For example, if your npm package name is n8n-nodes-weather-nodes, and the package contains nodes named rain, sun, snow, you should search for rain, not weather-nodes.

Troubleshooting#
There's no custom directory in ~/.n8n local installation.
You have to create custom directory manually and run npm init


# In ~/.n8n directory run
mkdir custom 
cd custom 
npm init
Next steps#
Deploy your node.
View an example of a programmatic node: n8n's Mattermost node. This is an example of a more complex programmatic node structure.
Learn about node versioning.
Make sure you understand key concepts: item linking and data structures.

Node user interface elements#
n8n provides a set of predefined UI components (based on a JSON file) that allows users to input all sorts of data types. The following UI elements are available in n8n.

String#
Basic configuration:


{
	displayName: Name, // The value the user sees in the UI
	name: name, // The name used to reference the element UI within the code
	type: string,
	required: true, // Whether the field is required or not
	default: 'n8n',
	description: 'The name of the user',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
String

String field for inputting passwords:


{
	displayName: 'Password',
	name: 'password',
	type: 'string',
	required: true,
	typeOptions: {
		password: true,
	},
	default: '',
	description: `User's password`,
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Password

String field with more than one row:


{
	displayName: 'Description',
	name: 'description',
	type: 'string',
	required: true,
	typeOptions: {
		rows: 4,
	},
	default: '',
	description: 'Description',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Multiple rows

Support drag and drop for data keys#
Users can drag and drop data values to map them to fields. Dragging and dropping creates an expression to load the data value. n8n supports this automatically.

You need to add an extra configuration option to support dragging and dropping data keys:

requiresDataPath: 'single': for fields that require a single string.
requiresDataPath: 'multiple': for fields that can accept a comma-separated list of string.
The Compare Datasets node code has examples.

Number#
Number field with decimal points:


{
	displayName: 'Amount',
	name: 'amount',
	type: 'number',
	required: true,
	typeOptions: {
		maxValue: 10,
		minValue: 0,
		numberPrecision: 2,
	},
	default: 10.00,
	description: 'Your current amount',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Decimal

Collection#
Use the collection type when you need to display optional fields.


{
	displayName: 'Filters',
	name: 'filters',
	type: 'collection',
	placeholder: 'Add Field',
	default: {},
	options: [
		{
			displayName: 'Type',
			name: 'type',
			type: 'options',
			options: [
				{
					name: 'Automated',
					value: 'automated',
				},
				{
					name: 'Past',
					value: 'past',
				},
				{
					name: 'Upcoming',
					value: 'upcoming',
				},
			],
			default: '',
		},
	],
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Collection

DateTime#
The dateTime type provides a date picker.


{
	displayName: 'Modified Since',
	name: 'modified_since',
	type: 'dateTime',
	default: '',
	description: 'The date and time when the file was last modified',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
DateTime

Boolean#
The boolean type adds a toggle for entering true or false.


{
	displayName: 'Wait for Image',
	name: 'waitForImage',
	type: 'boolean',
	default: true, // Initial state of the toggle
	description: 'Whether to wait for the image or not',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Boolean

Color#
The color type provides a color selector.


{
	displayName: 'Background Color',
	name: 'backgroundColor',
	type: 'color',
	default: '', // Initially selected color
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Color

Options#
The options type adds an options list. Users can select a single value.


{
	displayName: 'Resource',
	name: 'resource',
	type: 'options',
	options: [
		{
			name: 'Image',
			value: 'image',
		},
		{
			name: 'Template',
			value: 'template',
		},
	],
	default: 'image', // The initially selected option
	description: 'Resource to consume',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Options

Multi-options#
The multiOptions type adds an options list. Users can select more than one value.


{
	displayName: 'Events',
	name: 'events',
	type: 'multiOptions',
	options: [
		{
			name: 'Plan Created',
			value: 'planCreated',
		},
		{
			name: 'Plan Deleted',
			value: 'planDeleted',
		},
	],
	default: [], // Initially selected options
	description: 'The events to be monitored',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Multi-options

Filter#
Use this component to evaluate, match, or filter incoming data.

This is the code from n8n's own If node. It shows a filter component working with a collection component where users can configure the filter's behavior.


{
	displayName: 'Conditions',
	name: 'conditions',
	placeholder: 'Add Condition',
	type: 'filter',
	default: {},
	typeOptions: {
		filter: {
			// Use the user options (below) to determine filter behavior
			caseSensitive: '={{!$parameter.options.ignoreCase}}',
			typeValidation: '={{$parameter.options.looseTypeValidation ? "loose" : "strict"}}',
		},
	},
},
{
displayName: 'Options',
name: 'options',
type: 'collection',
placeholder: 'Add option',
default: {},
options: [
	{
		displayName: 'Ignore Case',
		description: 'Whether to ignore letter case when evaluating conditions',
		name: 'ignoreCase',
		type: 'boolean',
		default: true,
	},
	{
		displayName: 'Less Strict Type Validation',
		description: 'Whether to try casting value types based on the selected operator',
		name: 'looseTypeValidation',
		type: 'boolean',
		default: true,
	},
],
},
Filter

Assignment collection (drag and drop)#
Use the drag and drop component when you want users to pre-fill name and value parameters with a single drag interaction.


{
	displayName: 'Fields to Set',
	name: 'assignments',
	type: 'assignmentCollection',
	default: {},
},
You can see an example in n8n's Edit Fields (Set) node:

A gif showing the drag and drop action, as well as changing a field to fixed

Fixed collection#
Use the fixedCollection type to group fields that are semantically related.


{
	displayName: 'Metadata',
	name: 'metadataUi',
	placeholder: 'Add Metadata',
	type: 'fixedCollection',
	default: '',
	typeOptions: {
		multipleValues: true,
	},
	description: '',
	options: [
		{
			name: 'metadataValues',
			displayName: 'Metadata',
			values: [
				{
					displayName: 'Name',
					name: 'name',
					type: 'string',
					default: 'Name of the metadata key to add.',
				},
				{
					displayName: 'Value',
					name: 'value',
					type: 'string',
					default: '',
					description: 'Value to set for the metadata key.',
				},
			],
		},
	],
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
Fixed collection

Resource locator#
Resource locator

The resource locator element helps users find a specific resource in an external service, such as a card or label in Trello.

The following options are available:

ID
URL
List: allows users to select or search from a prepopulated list. This option requires more coding, as you must populate the list, and handle searching if you choose to support it.
You can choose which types to include.

Example:


{
	displayName: 'Card',
	name: 'cardID',
	type: 'resourceLocator',
	default: '',
	description: 'Get a card',
	modes: [
		{
			displayName: 'ID',
			name: 'id',
			type: 'string',
			hint: 'Enter an ID',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^[0-9]',
						errorMessage: 'The ID must start with a number',
					},
				},
			],
			placeholder: '12example',
			// How to use the ID in API call
			url: '=http://api-base-url.com/?id={{$value}}',
		},
		{
			displayName: 'URL',
			name: 'url',
			type: 'string',
			hint: 'Enter a URL',
			validation: [
				{
					type: 'regex',
					properties: {
						regex: '^http',
						errorMessage: 'Invalid URL',
					},
				},
			],
			placeholder: 'https://example.com/card/12example/',
			// How to get the ID from the URL
			extractValue: {
				type: 'regex',
				regex: 'example.com/card/([0-9]*.*)/',
			},
		},
		{
			displayName: 'List',
			name: 'list',
			type: 'list',
			typeOptions: {
				// You must always provide a search method
				// Write this method within the methods object in your base file
				// The method must populate the list, and handle searching if searchable: true
				searchListMethod: 'searchMethod',
				// If you want users to be able to search the list
				searchable: true,
				// Set to true if you want to force users to search
				// When true, users can't browse the list
				// Or false if users can browse a list
				searchFilterRequired: true,
			},
		},
	],
	displayOptions: {
		// the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			],
		},
	},
},
Refer to the following for live examples:

Refer to CardDescription.ts and Trello.node.ts in n8n's Trello node for an example of a list with search that includes searchFilterRequired: true.
Refer to GoogleDrive.node.ts for an example where users can browse the list or search.
Resource mapper#
If your node performs insert, update, or upsert operations, you need to send data from the node in a format supported by the service you're integrating with. A common pattern is to use a Set node before the node that sends data, to convert the data to match the schema of the service you're connecting to. The resource mapper UI component provides a way to get data into the required format directly within the node, rather than using a Set node. The resource mapper component can also validate input data against the schema provided in the node, and cast input data into the expected type.

Mapping and matching

Mapping is the process of setting the input data to use as values when updating row(s). Matching is the process of using column names to identify the row(s) to update.


{
	displayName: 'Columns',
	name: 'columns', // The name used to reference the element UI within the code
	type: 'resourceMapper', // The UI element type
	default: {
		// mappingMode can be defined in the component (mappingMode: 'defineBelow')
		// or you can attempt automatic mapping (mappingMode: 'autoMapInputData')
		mappingMode: 'defineBelow',
		// Important: always set default value to null
		value: null,
	},
	required: true,
	// See "Resource mapper type options interface" below for the full typeOptions specification
	typeOptions: {
		resourceMapper: {
			resourceMapperMethod: 'getMappingColumns',
			mode: 'update',
			fieldWords: {
				singular: 'column',
				plural: 'columns',
			},
			addAllFields: true, 
			multiKeyMatch: true,
			supportAutoMap: true,
			matchingFieldsLabels: {
				title: 'Custom matching columns title',
				description: 'Help text for custom matching columns',
				hint: 'Below-field hint for custom matching columns',
			},
		},
	},
},
Refer to the Postgres node (version 2) for a live example using a database schema.

Refer to the Google Sheets node (version 2) for a live example using a schema-less service.

Resource mapper type options interface#
The typeOptions section must implement the following interface:


export interface ResourceMapperTypeOptions {
	// The name of the method where you fetch the schema
	// Refer to the Resource mapper method section for more detail
	resourceMapperMethod: string;
	// Choose the mode for your operation
	// Supported modes: add, update, upsert
	mode: 'add' | 'update' | 'upsert';
	// Specify labels for fields in the UI
	fieldWords?: { singular: string; plural: string };
	// Whether n8n should display a UI input for every field when node first added to workflow
	// Default is true
	addAllFields?: boolean;
	// Specify a message to show if no fields are fetched from the service 
	// (the call is successful but the response is empty)
	noFieldsError?: string;
	// Whether to support multi-key column matching
	// multiKeyMatch is for update and upsert only
	// Default is false
	// If true, the node displays a multi-select dropdown for the matching column selector
	multiKeyMatch?: boolean;
	// Whether to support automatic mapping
	// If false, n8n hides the mapping mode selector field and sets mappingMode to defineBelow
	supportAutoMap?: boolean;
	// Custom labels for the matching columns selector
	matchingFieldsLabels?: {
		title?: string;
		description?: string;
		hint?: string;
	};
}
Resource mapper method#
This method contains your node-specific logic for fetching the data schema. Every node must implement its own logic for fetching the schema, and setting up each UI field according to the schema.

It must return a value that implements the ResourceMapperFields interface:


interface ResourceMapperField {
	// Field ID as in the service
	id: string;
	// Field label
	displayName: string;
	// Whether n8n should pre-select the field as a matching field
	// A matching field is a column used to identify the rows to modify
	defaultMatch: boolean;
	// Whether the field can be used as a matching field
	canBeUsedToMatch?: boolean;
	// Whether the field is required by the schema
	required: boolean;
	// Whether to display the field in the UI
	// If false, can't be used for matching or mapping
	display: boolean;
	// The data type for the field
	// These correspond to UI element types
	// Supported types: string, number, dateTime, boolean, time, array, object, options
	type?: FieldType;
	// Added at runtime if the field is removed from mapping by the user
	removed?: boolean;
	// Specify options for enumerated types
	options?: INodePropertyOptions[];
}
Refer to the Postgres resource mapping method and Google Sheets resource mapping method for live examples.

JSON#

{
	displayName: 'Content (JSON)',
	name: 'content',
	type: 'json',
	default: '',
	description: '',
	displayOptions: { // the resources and operations to display this element with
		show: {
			resource: [
				// comma-separated list of resource names
			],
			operation: [
				// comma-separated list of operation names
			]
		}
	},
}
JSON

HTML#
The HTML editor allows users to create HTML templates in their workflows. The editor supports standard HTML, CSS in <style> tags, and expressions wrapped in {{}}. Users can add <script> tags to pull in additional JavaScript. n8n doesn't run this JavaScript during workflow execution.


{
	displayName: 'HTML Template', // The value the user sees in the UI
	name: 'html', // The name used to reference the element UI within the code
	type: 'string',
	typeOptions: {
		editor: 'htmlEditor',
	},
	default: placeholder, // Loads n8n's placeholder HTML template
	noDataExpression: true, // Prevent using an expression for the field
	description: 'HTML template to render',
},
Refer to Html.node.ts for a live example.

Notice#
Display a yellow box with a hint or extra info. Refer to Node UI design for guidance on writing good hints and info text.


{
  displayName: 'Your text here',
  name: 'notice',
  type: 'notice',
  default: '',
},
Notice
Hints#
There are two types of hints: parameter hints and node hints:

Parameter hints are small lines of text below a user input field.
Node hints are a more powerful and flexible option than Notice. Use them to display longer hints, in the input panel, output panel, or node details view.
Add a parameter hint#
Add the hint parameter to a UI element:


{
	displayName: 'URL',
	name: 'url',
	type: 'string',
	hint: 'Enter a URL',
	...
}
Add a node hint#
Define the node's hints in the hints property within the node description:


description: INodeTypeDescription = {
	...
	hints: [
		{
			// The hint message. You can use HTML.
			message: "This node has many input items. Consider enabling <b>Execute Once</b> in the node\'s settings.",
			// Choose from: info, warning, danger. The default is 'info'.
			// Changes the color. info (grey), warning (yellow), danger (red)
			type: 'info',
			// Choose from: inputPane, outputPane, ndv. By default n8n displays the hint in both the input and output panels.
			location: 'outputPane',
			// Choose from: always, beforeExecution, afterExecution. The default is 'always'
			whenToDisplay: 'beforeExecution',
			// Optional. An expression. If it resolves to true, n8n displays the message. Defaults to true.
			displayCondition: '={{ $parameter["operation"] === "select" && $input.all().length > 1 }}'
		}
	]
	...
}
Add a dynamic hint to a programmatic-style node#
In programmatic-style nodes you can create a dynamic message that includes information from the node execution. As it relies on the node output data, you can't display this type of hint until after execution.


if (operation === 'select' && items.length > 1 && !node.executeOnce) {
    // Expects two parameters: NodeExecutionData and an array of hints
	return new NodeExecutionOutput(
		[returnData],
		[
			{
				message: `This node ran ${items.length} times, once for each input item. To run for the first item only, enable <b>Execute once</b> in the node settings.`,
				location: 'outputPane',
			},
		],
	);
}
return [returnData];
For a live example of a dynamic hint in a programmatic-style node, view the Split Out node code.


Code standards#
Following defined code standards when building your node makes your code more readable and maintainable, and helps avoid errors. This document provides guidance on good code practices for node building. It focuses on code details. For UI standards and UX guidance, refer to Node UI design.

Use the linter#
The n8n node linter provides automatic checking for many of the node-building standards. You should ensure your node passes the linter's checks before publishing it. Refer to the n8n node linter documentation for more information.

Use the starter#
The n8n node starter project includes a recommended setup, dependencies (including the linter), and examples to help you get started. Begin new projects with the starter.

Write in TypeScript#
All n8n code is TypeScript. Writing your nodes in TypeScript can speed up development and reduce bugs.

Detailed guidelines for writing a node#
These guidelines apply to any node you build.

Resources and operations#
If your node can perform several operations, call the parameter that sets the operation Operation. If your node can do these operations on more than one resource, create a Resource parameter. The following code sample shows a basic resource and operations setup:


export const ExampleNode implements INodeType {
    description: {
        displayName: 'Example Node',
        ...
        properties: [
            {
                displayName: 'Resource',
                name: 'resource',
                type: 'options',
                options: [
                    {
                        name: 'Resource One',
                        value: 'resourceOne'
                    },
                    {
                        name: 'Resource Two',
                        value: 'resourceTwo'
                    }
                ],
                default: 'resourceOne'
            },
            {
                displayName: 'Operation',
                name: 'operation',
                type: 'options',
                // Only show these operations for Resource One
                displayOptions: {
                    show: {
                        resource: [
                            'resourceOne'
                        ]
                    }
                },
                options: [
                    {
                        name: 'Create',
                        value: 'create',
                        description: 'Create an instance of Resource One'
                    }
                ]
            }
        ]
    }
}
Reuse internal parameter names#
All resource and operation fields in an n8n node have two settings: a display name, set using the name parameter, and an internal name, set using the value parameter. Reusing the internal name for fields allows n8n to preserve user-entered data if a user switches operations.

For example: you're building a node with a resource named 'Order'. This resource has several operations, including Get, Edit, and Delete. Each of these operations uses an order ID to perform the operation on the specified order. You need to display an ID field for the user. This field has a display label, and an internal name. By using the same internal name (set in value) for the operation ID field on each resource, a user can enter the ID with the Get operation selected, and not lose it if they switch to Edit.

When reusing the internal name, you must ensure that only one field is visible to the user at a time. You can control this using displayOptions.

Detailed guidelines for writing a programmatic-style node#
These guidelines apply when building nodes using the programmatic node-building style. They aren't relevant when using the declarative style. For more information on different node-building styles, refer to Choose your node building approach.

Don't change incoming data#
Never change the incoming data a node receives (data accessible with this.getInputData()) as all nodes share it. If you need to add, change, or delete data, clone the incoming data and return the new data. If you don't do this, sibling nodes that execute after the current one will operate on the altered data and process incorrect data.

It's not necessary to always clone all the data. For example, if a node changes the binary data but not the JSON data, you can create a new item that reuses the reference to the JSON item.

Use the built in request library#
Some third-party services have their own libraries on npm, which make it easier to create an integration. The problem with these packages is that you add another dependency (plus all the dependencies of the dependencies). This adds more and more code, which has to be loaded, can introduce security vulnerabilities, bugs, and so on. Instead, use the built-in module:


// If no auth needed
const response = await this.helpers.httpRequest(options);

// If auth needed
const response = await this.helpers.httpRequestWithAuthentication.call(
	this, 
	'credentialTypeName', // For example: pipedriveApi
	options,
);
This uses the npm package Axios.

Refer to HTTP helpers for more information, and for migration instructions for the removed this.helpers.request.


Node file structure#
Following best practices and standards in your node structure makes your node easier to maintain. It's helpful if other people need to work with the code.

The file and directory structure of your node depends on:

Your node's complexity.
Whether you use node versioning.
How many nodes you include in the npm package.
Required files and directories#
Your node must include:

A package.json file at the root of the project. This is required for any npm module.
A nodes directory, containing the code for your node:
This directory must contain the base file, in the format <node-name>.node.ts. For example, MyNode.node.ts.
n8n recommends including a codex file, containing metadata for your node. The codex filename must match the node base filename. For example, given a node base file named MyNode.node.ts, the codex name is MyNode.node.json.
The nodes directory can contain other files and subdirectories, including directories for versions, and node code split across more than one file to create a modular structure.
A credentials directory, containing your credentials code. This code lives in a single credentials file. The filename format is <node-name>.credentials.ts. For example, MyNode.credentials.ts.
Modular structure#
You can choose whether to place all your node's functionality in one file, or split it out into a base file and other modules, which the base file then imports. Unless your node is very simple, it's a best practice to split it out.

A basic pattern is to separate out operations. Refer to the HttpBin starter node for an example of this.

For more complex nodes, n8n recommends a directory structure. Refer to the Airtable node or Microsoft Outlook node as examples.

actions: a directory containing sub-directories that represent resources.
Each sub-directory should contain two types of files:
An index file with resource description (named either <resourceName>.resource.ts or index.ts)
Files for operations <operationName>.operation.ts. These files should have two exports: description of the operation and an execute function.
methods: an optional directory dynamic parameters' functions.
transport: a directory containing the communication implementation.
Versioning#
If your node has more than one version, and you're using full versioning, this makes the file structure more complex. You need a directory for each version, along with a base file that sets the default version. Refer to Node versioning for more information on working with versions, including types of versioning.

Decide how many nodes to include in a package#
There are two possible setups when building a node:

One node in one npm package.
More than one node in a single npm package.
n8n supports both approaches. If you include more than one node, each node should have its own directory in the nodes directory.

A best-practice example for programmatic nodes#
n8n's built-in Airtable node implements a modular structure and versioning, following recommended patterns.

Community node verification guidelines#
Do you want n8n to verify your node?

Consider following these guidelines while building your node if you want to submit it for verification by n8n. Any user with verified community nodes enabled can discover and install verified nodes from n8n's nodes panel.

Package source verification#
Verify that your npm package repository URL matches the expected GitHub (or other platform) repository.
Confirm that the package author / maintainer matches between npm and the repository.
Confirm that the git link in npm works and that the repository is public.
Make sure your package has proper documentation (README, usage examples, etc.).
Make sure your package license is MIT.
No external dependencies#
Ensure that your package does not include any external dependencies to keep it lightweight and easy to maintain.
Proper documentation#
Provide clear documentation, whether it’s a README on GitHub or links to relevant API documentation.
Include usage instructions, example workflows, and any necessary authentication details.
No access to environment variables or file system#
The code must not interact with environment variables or attempt to read/write files.
Pass all necessary data through node parameters.
Follow n8n best practices#
Maintain a clear and consistent coding style.
Use TypeScript and follow n8n's node development guidelines.
Ensure proper error handling and validation.
Make sure the linter passes (in other words, make sure running npx @n8n/scan-community-package n8n-nodes-PACKAGE passes).
Use English language only#
Both the node interface and all documentation must be in English only.
This includes parameter names, descriptions, help text, error messages and README content.
Node file structure#
Following best practices and standards in your node structure makes your node easier to maintain. It's helpful if other people need to work with the code.

The file and directory structure of your node depends on:

Your node's complexity.
Whether you use node versioning.
How many nodes you include in the npm package.
Required files and directories#
Your node must include:

A package.json file at the root of the project. This is required for any npm module.
A nodes directory, containing the code for your node:
This directory must contain the base file, in the format <node-name>.node.ts. For example, MyNode.node.ts.
n8n recommends including a codex file, containing metadata for your node. The codex filename must match the node base filename. For example, given a node base file named MyNode.node.ts, the codex name is MyNode.node.json.
The nodes directory can contain other files and subdirectories, including directories for versions, and node code split across more than one file to create a modular structure.
A credentials directory, containing your credentials code. This code lives in a single credentials file. The filename format is <node-name>.credentials.ts. For example, MyNode.credentials.ts.
Modular structure#
You can choose whether to place all your node's functionality in one file, or split it out into a base file and other modules, which the base file then imports. Unless your node is very simple, it's a best practice to split it out.

A basic pattern is to separate out operations. Refer to the HttpBin starter node for an example of this.

For more complex nodes, n8n recommends a directory structure. Refer to the Airtable node or Microsoft Outlook node as examples.

actions: a directory containing sub-directories that represent resources.
Each sub-directory should contain two types of files:
An index file with resource description (named either <resourceName>.resource.ts or index.ts)
Files for operations <operationName>.operation.ts. These files should have two exports: description of the operation and an execute function.
methods: an optional directory dynamic parameters' functions.
transport: a directory containing the communication implementation.
Versioning#
If your node has more than one version, and you're using full versioning, this makes the file structure more complex. You need a directory for each version, along with a base file that sets the default version. Refer to Node versioning for more information on working with versions, including types of versioning.

Decide how many nodes to include in a package#
There are two possible setups when building a node:

One node in one npm package.
More than one node in a single npm package.
n8n supports both approaches. If you include more than one node, each node should have its own directory in the nodes directory.

A best-practice example for programmatic nodes#
n8n's built-in Airtable node implements a modular structure and versioning, following recommended patterns.

Programmatic-style parameters#
These are the parameters available for node base file of programmatic-style nodes.

This document gives short code snippets to help understand the code structure and concepts. For a full walk-through of building a node, including real-world code examples, refer to Build a programmatic-style node.

Programmatic-style nodes also use the execute() method. Refer to Programmatic-style execute method for more information.

Refer to Standard parameters for parameters available to all nodes.

defaultVersion#
Number | Optional

Use defaultVersion when using the full versioning approach.

n8n support two methods of node versioning. Refer to Node versioning for more information.

methods and loadOptions#
Object | Optional

Contains the loadOptions method for programmatic-style nodes. You can use this method to query the service to get user-specific settings (such as getting a user's email labels from Gmail), then return them and render them in the GUI so the user can include them in subsequent queries.

For example, n8n's Gmail node uses loadOptions to get all email labels:


	methods = {
		loadOptions: {
			// Get all the labels and display them
			async getLabels(
				this: ILoadOptionsFunctions,
			): Promise<INodePropertyOptions[]> {
				const returnData: INodePropertyOptions[] = [];
				const labels = await googleApiRequestAllItems.call(
					this,
					'labels',
					'GET',
					'/gmail/v1/users/me/labels',
				);
				for (const label of labels) {
					const labelName = label.name;
					const labelId = label.id;
					returnData.push({
						name: labelName,
						value: labelId,
					});
				}
				return returnData;
			},
		},
	};
version#
Number or Array | Optional

Use version when using the light versioning approach.

If you have one version of your node, this can be a number. If you want to support multiple versions, turn this into an array, containing numbers for each node version.

n8n support two methods of node versioning. Programmatic-style nodes can use either. Refer to Node versioning for more information.

Programmatic-style execute() method#
The main difference between the declarative and programmatic styles is how they handle incoming data and build API requests. The programmatic style requires an execute() method, which reads incoming data and parameters, then builds a request. The declarative style handles requests using the routing key in the operations object.

The execute() method creates and returns an instance of INodeExecutionData.

Paired items

You must include input and output item pairing information in the data you return. For more information, refer to Paired items.

Structure of the node base file#
The node base file follows this basic structure:

Add import statements.
Create a class for the node.
Within the node class, create a description object, which defines the node.
A programmatic-style node also has an execute() method, which reads incoming data and parameters, then builds a request. The declarative style handles this using the routing key in the properties object, within descriptions.

Outline structure for a declarative-style node#
This code snippet gives an outline of the node structure.


import { INodeType, INodeTypeDescription } from 'n8n-workflow';

export class ExampleNode implements INodeType {
	description: INodeTypeDescription = {
		// Basic node details here
		properties: [
			// Resources and operations here
		]
	};
}
Refer to Standard parameters for information on parameters available to all node types. Refer to Declarative-style parameters for the parameters available for declarative-style nodes.
Outline structure for a programmatic-style node#
This code snippet gives an outline of the node structure.


import { IExecuteFunctions } from 'n8n-core';
import { INodeExecutionData, INodeType, INodeTypeDescription } from 'n8n-workflow';

export class ExampleNode implements INodeType {
	description: INodeTypeDescription = {
    // Basic node details here
    properties: [
      // Resources and operations here
    ]
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    // Process data and return
  }
};
Refer to Standard parameters for information on parameters available to all node types. Refer to Programmatic-style parameters and Programmatic-style execute method for more information on working with programmatic-style nodes.

Standard parameters#
These are the standard parameters for the node base file. They're the same for all node types.

displayName#
String | Required

This is the name users see in the n8n GUI.

name#
String | Required

The internal name of the object. Used to reference it from other places in the node.

icon#
String or Object | Required

Specifies an icon for a particular node. n8n recommends uploading your own image file.

You can provide the icon file name as a string, or as an object to handle different icons for light and dark modes. If the icon works in both light and dark modes, use a string that starts with file:, indicating the path to the icon file. For example:


icon: 'file:exampleNodeIcon.svg'
To provide different icons for light and dark modes, use an object with light and dark properties. For example:

icon: { 
  light: 'file:exampleNodeIcon.svg', 
  dark: 'file:exampleNodeIcon.dark.svg' 
}
n8n recommends using an SVG for your node icon, but you can also use PNG. If using PNG, the icon resolution should be 60x60px. Node icons should have a square or near-square aspect ratio.

Don't reference Font Awesome

If you want to use a Font Awesome icon in your node, download and embed the image.

group#
Array of strings | Required

Tells n8n how the node behaves when the workflow runs. Options are:

trigger: node waits for a trigger.
schedule: node waits for a timer to expire.
input, output, transform: these currently have no effect.
An empty array, []. Use this as the default option if you don't need trigger or schedule.
description#
String | Required

A short description of the node. n8n uses this in the GUI.

defaults#
Object | Required

Contains essential brand and name settings.

The object can include:

name: String. Used as the node name on the canvas if the displayName is too long.
color: String. Hex color code. Provide the brand color of the integration for use in n8n.
forceInputNodeExecution#
Boolean | Optional

When building a multi-input node, you can choose to force all preceding nodes on all branches to execute before the node runs. The default is false (requiring only one input branch to run).

inputs#
Array of strings | Required

Names the input connectors. Controls the number of connectors the node has on the input side. If you need only one connector, use input: ['main'].

outputs#
Array of strings | Required

Names the output connectors. Controls the number of connectors the node has on the output side. If you need only one connector, use output: ['main'].

requiredInputs#
Integer or Array | Optional

Used for multi-input nodes. Specify inputs by number that must have data (their branches must run) before the node can execute.

credentials#
Array of objects | Required

This parameter tells n8n the credential options. Each object defines an authentication type.

The object must include:

name: the credential name. Must match the name property in the credential file. For example, name: 'asanaApi' in Asana.node.ts links to name = 'asanaApi' in AsanaApi.credential.ts.
required: Boolean. Specify whether authentication is required to use this node.
requestDefaults#
Object | Required

Set up the basic information for the API calls the node makes.

This object must include:

baseURL: The API base URL.
You can also add:

headers: an object describing the API call headers, such as content type.
url: string. Appended to the baseURL. You can usually leave this out. It's more common to provide this in the operations.
properties#
Array of objects | Required

This contains the resource and operations objects that define node behaviors, as well as objects to set up mandatory and optional fields that can receive user input.

Resource objects#
A resource object includes the following parameters:

displayName: String. This should always be Resource.
name: String. This should always be resource.
type: String. Tells n8n which UI element to use, and what input type to expect. For example, options results in n8n adding a dropdown that allows users to choose one option. Refer to Node UI elements for more information.
noDataExpression: Boolean. Prevents using an expression for the parameter. Must always be true for resource.
Operations objects#
The operations object defines the available operations on a resource.

displayName: String. This should always be Options.
name: String. This should always be option.
type: String. Tells n8n which UI element to use, and what input type to expect. For example, dateTime results in n8n adding a date picker. Refer to Node UI elements for more information.
noDataExpression: Boolean. Prevents using an expression for the parameter. Must always be true for operation.
options: Array of objects. Each objects describes an operation's behavior, such as its routing, the REST verb it uses, and so on. An options object includes:
name. String.
value. String.
action: String. This parameter combines the resource and operation. You should always include it, as n8n will use it in future versions. For example, given a resource called "Card" and an operation "Get all", your action is "Get all cards".
description: String.
routing: Object containing request details.
Additional fields objects#
These objects define optional parameters. n8n displays them under Additional Fields in the GUI. Users can choose which parameters to set.

The objects must include:


displayName: 'Additional Fields',
name: 'additionalFields',
// The UI element type
type: ''
placeholder: 'Add Field',
default: {},
displayOptions: {
  // Set which resources and operations this field is available for
  show: {
    resource: [
      // Resource names
    ],
    operation: [
      // Operation names
    ]
  },
}
For more information about UI element types, refer to UI elements.


Credentials file#
The credentials file defines the authorization methods for the node. The settings in this file affect what n8n displays in the Credentials modal, and must reflect the authentication requirements of the service you're connecting to.

In the credentials file, you can use all the n8n UI elements. n8n encrypts the data that's stored using credentials using an encryption key.

Structure of the credentials file#
The credentials file follows this basic structure:

Import statements
Create a class for the credentials
Within the class, define the properties that control authentication for the node.
Outline structure#

import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class ExampleNode implements ICredentialType {
	name = 'exampleNodeApi';
	displayName = 'Example Node API';
	documentationUrl = '';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
    		// Can be body, header, qs or auth
			qs: {
        		// Use the value from `apiKey` above
				'api_key': '={{$credentials.apiKey}}'
			}

		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.domain}}',
			url: '/bearer',
		},
	};
}
Parameters#
name#
String. The internal name of the object. Used to reference it from other places in the node.

displayName#
String. The name n8n uses in the GUI.

documentationUrl#
String. URL to your credentials documentation.

properties#
Each object contains:

displayName: the name n8n uses in the GUI.
name: the internal name of the object. Used to reference it from other places in the node.
type: the data type expected, such as string.
default: the URL that n8n should use to test credentials.
authenticate#
authenticate: Object. Contains objects that tell n8n how to inject the authentication data as part of the API request.
type#
String. If you're using an authentication method that sends data in the header, body, or query string, set this to 'generic'.

properties#
Object. Defines the authentication methods. Options are:

body: Object. Sends authentication data in the request body. Can contain nested objects.


authenticate: IAuthenticateGeneric = {
	type: 'generic',
	properties: {
		body: {
			username: '={{$credentials.username}}',
			password: '={{$credentials.password}}',
		},
	},
};
header: Object. Send authentication data in the request header.


authenticate: IAuthenticateGeneric = {
	type: 'generic',
	properties: {
		header: {
			Authorization: '=Bearer {{$credentials.authToken}}',
		},
	},
};
qs: Object. Stands for "query string." Send authentication data in the request query string.


authenticate: IAuthenticateGeneric = {
	type: 'generic',
	properties: {
		qs: {
			token: '={{$credentials.token}}',
		},
	},
};
auth: Object. Used for Basic Auth. Requires username and password as the key names.


authenticate: IAuthenticateGeneric = {
	type: 'generic',
	properties: {
		auth: {
			username: '={{$credentials.username}}',
			password: '={{$credentials.password}}',
		},
	},
};
test#
Provide a request object containing a URL and authentication type that n8n can use to test the credential.


test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials?.domain}}',
			url: '/bearer',
		},
	};

Test a node#
This section contains information about testing your node.

There are two ways to test your node:

Manually, by running it on your own machine within a local n8n instance.
Automatically, using the linter.
You should use both methods before publishing your node.


n8n node linter#
n8n's node linter, eslint-plugin-n8n-nodes-base, statically analyzes ("lints") the source code of n8n nodes and credentials in the official repository and in community packages. The linter detects issues and automatically fixes them to help you follow best practices.

eslint-plugin-n8n-nodes-base contains a collection of rules for node files (*.node.ts), resource description files (*Description.ts), credential files (*.credentials.ts), and the package.json of a community package.

Setup#
If using the n8n node starter: Run npm install in the starter project to install all dependencies. Once the installation finishes, the linter is available to you.

If using VS Code, install the ESLint VS Code extension. For other IDEs, refer to their ESLint integrations.

Don't edit the configuration file

.eslintrc.js contains the configuration for eslint-plugin-n8n-nodes-base. Don't edit this file.

Usage#
You can use the linter in a community package or in the main n8n repository.

Linting#
In a community package, the linter runs automatically after installing dependencies and before publishing the package to npm. In the main n8n repository, the linter runs automatically using GitHub Actions whenever you push to your pull request.

In both cases, VS Code lints in the background as you work on your project. Hover over a detected issue to see a full description of the linting and a link to further information.

You can also run the linter manually:

Run npm run lint to lint and view detected issues in your console.
Run npm run lintfix to lint and automatically fix issues. The linter fixes violations of rules marked as automatically fixable.
Both commands can run in the root directory of your community package, or in /packages/nodes-base/ in the main repository.

Exceptions#
Instead of fixing a rule violation, you can also make an exception for it, so the linter doesn't flag it.

To make a lint exception from VS Code: hover over the issue and click on Quick fix (or cmd+. in macOS) and select Disable {rule} for this line. Only disable rules for a line where you have good reason to. If you think the linter is incorrectly reporting an issue, please report it in the linter repository.

To add a lint exception to a single file, add a code comment. In particular, TSLint rules may not show up in VS Code and may need to be turned off using code comments. Refer to the TSLint documentation for more guidance.

Run your node locally#
You can test your node as you build it by running it in a local n8n instance.

Install n8n using npm:

npm install n8n -g
When you are ready to test your node, publish it locally:

# In your node directory
npm run build
npm link
Install the node into your local n8n instance:


# In the nodes directory within your n8n installation
# node-package-name is the name from the package.json
npm link <node-package-name>
Check your directory

Make sure you run npm link <node-name> in the nodes directory within your n8n installation. This can be:

~/.n8n/custom/
~/.n8n/<your-custom-name>: if your n8n installation set a different name using N8N_CUSTOM_EXTENSIONS.
Start n8n:


n8n start
Open n8n in your browser. You should see your nodes when you search for them in the nodes panel.

Node names

Make sure you search using the node name, not the package name. For example, if your npm package name is n8n-nodes-weather-nodes, and the package contains nodes named rain, sun, snow, you should search for rain, not weather-nodes.

Troubleshooting#
There's no custom directory in ~/.n8n local installation.
You have to create custom directory manually and run npm init


# In ~/.n8n directory run
mkdir custom 
cd custom 
npm init

