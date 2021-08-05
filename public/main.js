/// import * as Autodesk from "@types/forge-viewer";

const DESIGN_URN = 'dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6amFjb2JzNGQtcG9jL0JyaWRnZV9Nb2RlbC5kd2c';
const DESIGN_GUID = '3bb36b05-6fb7-1fd0-3c58-d83a4e8d4042';
const ACTIVITY_PROPERTY = 'Custom 4D Phasing Set - ActivityID';
const PHASING_DATA_URL = '/Bridge_Phasing.csv';

Autodesk.Viewing.Initializer({ getAccessToken }, async function () {
    const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('preview'));
    viewer.start();
    viewer.setTheme('light-theme');
    viewer.addEventListener(Autodesk.Viewing.GEOMETRY_LOADED_EVENT, async function (ev) {
        const activityMap = await getActivityMap(viewer.model, ACTIVITY_PROPERTY);
        const phasingData = await getPhasingData();
        setupTimelineInput(viewer, phasingData, activityMap);
        setupTimelineChart(viewer, phasingData, activityMap);
    });
    Autodesk.Viewing.Document.load(
        'urn:' + DESIGN_URN,
        function onDocumentLoadSuccess(doc) {
            viewer.loadDocumentNode(doc, doc.getRoot().findByGuid(DESIGN_GUID));
        },
        function onDocumentLoadFailure(code, message) {
            alert('Could not load model. See the console for more details.');
            console.error(message);
        }
    );
});

async function getAccessToken(callback) {
    const resp = await fetch('/api/auth/token');
    if (resp.ok) {
        const { access_token, expires_in } = await resp.json();
        callback(access_token, expires_in);
    } else {
        alert('Could not obtain access token. See the console for more details.');
        console.error(await resp.text());
    }
}

async function getPhasingData() {
    const resp = await fetch(PHASING_DATA_URL);
    if (!resp.ok) {
        alert('Could not retrieve phasing data.');
        console.error(await resp.text());
        return;
    }
    const lines = (await resp.text()).split('\n');
    lines.shift(); // Remove the header row
    let result = {
        groups: {},
        startDate: null,
        endDate: null
    };
    for (const line of lines) {
        const tokens = line.trim().split(',');
        const groupName = tokens[0].trim();
        const startDate = new Date(tokens[1]);
        const endDate = new Date(tokens[3]);
        if (!result.startDate || startDate < result.startDate) {
            result.startDate = startDate;
        }
        if (!result.endDate || endDate > result.endDate) {
            result.endDate = endDate;
        }
        result.groups[groupName] = result.groups[groupName] || [];
        result.groups[groupName].push({
            startDate,
            endDate,
            type: tokens[4].trim(),
            description: tokens[5].trim()
        });
    }
    return result;
}

async function getActivityMap(model, propertyName) {
    function userFunction(pdb, attrName) {
        let map = new Map(); // mapping of activityID to list of dbIDs
        pdb.enumObjects(dbid => {
            const res = pdb.getObjectProperties(dbid, [attrName]);
            if (res && res.properties && res.properties.length > 0) {
                const activityId = res.properties[0].displayValue;
                const list = map.has(activityId) ? map.get(activityId) : [];
                list.push(dbid);
                map.set(activityId, list);
            }
        });
        return map;
    }
    return model.getPropertyDb().executeUserFunction(userFunction, propertyName);
}

function setupTimelineInput(viewer, phasingData, activityMap) {
    const days = Math.round((phasingData.endDate.getTime() - phasingData.startDate.getTime()) / (1000 * 60 * 60 * 24));
    const input = document.getElementById('timeline-input');
    const label = document.getElementById('timeline-label');
    input.min = 0;
    input.max = days;
    input.oninput = () => {
        const currentDate = new Date(phasingData.startDate.getTime() + input.value * 24 * 60 * 60 * 1000);
        label.innerText = currentDate.toLocaleDateString();
        // Color, show, and hide objects based on custom rules
        viewer.model.clearThemingColors();
        viewer.showAll();
        const yellow = new THREE.Vector4(1.0, 1.0, 0.0, 0.5);
        const red = new THREE.Vector4(1.0, 0.0, 0.0, 0.5);
        const blue = new THREE.Vector4(0.0, 0.0, 1.0, 0.5);
        for (const [group, activities] of Object.entries(phasingData.groups)) {
            for (const activity of activities) {
                const dbids = activityMap.get(group) || [];
                if (activity.type === 'Construct') {
                    if (currentDate < activity.startDate) {
                        viewer.hide(dbids);
                        break;
                    } else if (currentDate <= activity.endDate) {
                        viewer.show(dbids);
                        for (const dbid of dbids) {
                            viewer.setThemingColor(dbid, yellow);
                        }
                        break;
                    } else {
                        viewer.show(dbids);
                    }
                } else if (activity.type === 'Demo') {
                    if (currentDate < activity.startDate) {
                        viewer.show(dbids);
                        break;
                    } else if (currentDate <= activity.endDate) {
                        viewer.show(dbids);
                        for (const dbid of dbids) {
                            viewer.setThemingColor(dbid, red);
                        }
                        break;
                    } else {
                        viewer.hide(dbids);
                    }
                } else if (activity.type === 'Temp') {
                    if (currentDate < activity.startDate) {
                        viewer.hide(dbids);
                        break;
                    } else if (currentDate <= activity.endDate) {
                        viewer.show(dbids);
                        for (const dbid of dbids) {
                            viewer.setThemingColor(dbid, blue);
                        }
                        break;
                    } else {
                        viewer.show(dbids);
                    }
                }
            }
        }
    };
}

function setupTimelineChart(viewer, phasingData, activityMap) {
    const timelineData = Object.keys(phasingData.groups).map(group => {
        return {
            label: group,
            times: phasingData.groups[group].map(activity => ({
                starting_time: activity.startDate.getTime(),
                ending_time: activity.endDate.getTime()
            }))
        };
    });
    const width = 500;
    const chart = d3.timeline()
        .width(width)
        .stack()
        .margin({ left: 0, right: 0, top: 0, bottom: 0 })
        .tickFormat({
            tickTime: d3.time.months,
            tickInterval: 1,
            tickSize: 4
        })
        .click(function (d, i, datum) {
            viewer.clearThemingColors();
            viewer.isolate(activityMap.get(datum.label));
        });
    d3.select('#timeline').append('svg').attr('width', width).datum(timelineData).call(chart);
}
