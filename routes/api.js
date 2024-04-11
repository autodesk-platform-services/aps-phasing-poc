const express = require('express');
const { SdkManagerBuilder } = require('@aps_sdk/autodesk-sdkmanager');
const { AuthenticationClient, Scopes } = require('@aps_sdk/authentication');
const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;

const sdkManager = SdkManagerBuilder.create().build();
const authenticationClient = new AuthenticationClient(sdkManager);

let _credentials = null;
async function getAccessToken() {
    if (!_credentials || _credentials.expires_at < Date.now()) {
        _credentials = await authenticationClient.getTwoLeggedToken(APS_CLIENT_ID, APS_CLIENT_SECRET, [Scopes.ViewablesRead]);
        _credentials.expires_at = Date.now() + _credentials.expires_in * 1000;
    }
    return _credentials;
}

let router = express.Router();

// GET /api/auth/token - provides an access token to be used by the Viewer
router.get('/api/auth/token', async (req, res) => {
    try {
        const credentials = await getAccessToken();
        res.json(credentials);
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
