'use strict';
const {exec} = require('child_process');

function getFaceFeatures(imagePath) {
    return new Promise((resolve, reject) => {
        const pythonProcess = exec(`docker exec openface /bin/bash -c "cd /svapi/backend/server && python ./features_getter.py --img ${imagePath}"`);

        pythonProcess.stdout.on('data', (data) => {
            let features = data
                .replace(']', '')
                .replace('[', '')
                .split('\n')
                .join(' ')
                .split(' ')
                .filter(elem => elem !== ']' && elem !== '[' && elem !== ' ' && elem !== '')
                .map(elem => Number.parseFloat(elem));
            return resolve(features);
        });

        pythonProcess.stderr.on('data', function (data) {
            reject(data.toString('utf8'));
        });
    });
}

module.exports = {
    getFaceFeatures
};
