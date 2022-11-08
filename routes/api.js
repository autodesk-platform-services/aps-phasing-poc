const express = require('express');
const { AuthenticationClient } = require('forge-server-utils');

const { APS_CLIENT_ID, APS_CLIENT_SECRET } = process.env;

let authClient = new AuthenticationClient(APS_CLIENT_ID, APS_CLIENT_SECRET);
let router = express.Router();

// GET /api/auth/token - provides an access token to be used by the Viewer
router.get('/api/auth/token', async (req, res) => {
    try {
        res.json(await authClient.authenticate(['viewables:read']));
    } catch(err) {
        console.error(err);
        res.status(500).send(err.message);
    }
});

module.exports = router;
