# Phasing Demo

![platforms](https://img.shields.io/badge/platform-windows%20%7C%20osx%20%7C%20linux-lightgray.svg)
[![node.js](https://img.shields.io/badge/node.js-16.17-blue.svg)](https://nodejs.org)
[![npm](https://img.shields.io/badge/npm-8.15-blue.svg)](https://www.npmjs.com/)
[![license](https://img.shields.io/:license-mit-green.svg)](https://opensource.org/licenses/MIT)

[![Model Derivative](https://img.shields.io/badge/Model%20Derivative-v2-green.svg)](https://aps.autodesk.com/en/docs/model-derivative/v2/overview/)
[![Viewer](https://img.shields.io/badge/Viewer-v7-green.svg)](https://aps.autodesk.com/en/docs/viewer/v7/developers_guide/overview/)

Proof-of-concept showing how [Autodesk Platform Services](https://aps.autodesk.com) can be used to build phasing/4D application.

![thumbnail](./thumbnail.png)

Live demo: https://aps-phasing-poc.autodesk.io

## Development

### Prerequisites

- [APS Credentials](https://forge.autodesk.com/en/docs/oauth/v2/tutorials/create-app)
- [Node.js](https://nodejs.org) (we recommend the Long Term Support version)
- Terminal (for example, [Windows Command Prompt](https://en.wikipedia.org/wiki/Cmd.exe)
or [macOS Terminal](https://support.apple.com/guide/terminal/welcome/mac))

### Setup & Run

- Clone the repository
- Install dependencies: `npm install`
- Setup environment variables:
  - `APS_CLIENT_ID` - your APS application client ID
  - `APS_CLIENT_SECRET` - your APS application client secret
- Specify your sample model in [./public/main.js](./public/main.js):
  - set `DESIGN_URN` to the URN of your model translated by the Model Derivative service
  - set `DESIGN_GUID` to the GUID of the specific view of the model you want to load into the viewer
  - set `ACTIVITY_PROPERTY` to the name of a property that's available on your design elements; the value of this property will be used to link the element to a specific activity/phase in the CSV file below
- Modify your sample activity/phase data in [./public/phasing.csv](./public/phasing.csv); each row should include the following 6 values:
  - Name of the activity (used to link this phase to individual design elements); note that there may be multiple rows with the same activity name
  - start date of the activity (in the form of `MM/DD/YY`)
  - duration of the activity (number of days)
  - end date of the activity (in the form of `MM/DD/YY`)
  - type of activity (`Construct` for construction, `Demo` for demolition, or `Temp` for temporary structures); design elements will be color-coded based on this value
  - activity description
- Run the server: `npm start`

> When using [Visual Studio Code](https://code.visualstudio.com),
you can specify the env. variables listed above in a _.env_ file in this
folder, and run & debug the application directly from the editor.

## Troubleshooting

Submit your question via [APS Support Form](https://aps.autodesk.com/en/support/get-help).

## License

This sample is licensed under the terms of the [MIT License](http://opensource.org/licenses/MIT).
Please see the [LICENSE](LICENSE) file for more details.

## Authors

Petr Broz ([@ipetrbroz](https://twitter.com/ipetrbroz)), Developer Advocate
