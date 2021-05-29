const constants = require('./constants');
const _ = require('lodash');
const HttpsAgent = require('socks5-https-client/lib/Agent');
const HttpAgent = require('socks5-http-client/lib/Agent');
const rp = require('request-promise');

async function findPersonByFaceFeatures(people) {
    let resultProfiles = [];

    for (const person of people) {
        resultProfiles.push({
            firstname: person.first_name,
            lastname: person.last_name,
            idDomain: person.id_domain,
            city: person.city,
            country: person.country,
            age: person.age,
            photoUrl: person.faces.url_photo,
            confidence: person.distance <= 1 ? ((1 - person.distance) * 100).toFixed(2) : 0
    });
    }

    resultProfiles = await Promise.all(resultProfiles.map(profile => appendProfileWithPhoto(profile)));

    return resultProfiles;
}

async function appendProfileWithPhoto(profile) {
    let imageBase64 = '';
    try {
        imageBase64 = profile.photoUrl ? await downloadPhoto(profile.photoUrl, constants.proxy) : '';
    } catch (e) {
    }

    return {
        ...profile,
        imageBase64
    }
}

function downloadPhoto(imgUrl, proxy, timeout = 10000) {
    const trimmedProxy = proxy.split('//')[1];
    const requestSettingsObject = {
        url: imgUrl,
        encoding: null,
        agentOptions: {
            socksHost: trimmedProxy.split(':')[0],
            socksPort: +trimmedProxy.split(':')[1],
        },
        timeout,
    };

    requestSettingsObject.agentClass = imgUrl.includes('https')
        ? HttpsAgent
        : HttpAgent;

    return rp(requestSettingsObject).then((imageBuffer) =>
        imageBuffer.toString('base64'),
    );
}

module.exports = {
    findPersonByFaceFeatures
};
