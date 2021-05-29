const snWorker = require('../workers/socialNetwork');

module.exports = function (app) {
    app.on('boot_complete', () => {
        const snModel = 'social_network';
        if (app.models.hasOwnProperty(snModel)) {
            snWorker.run(app.models[snModel]);
        }
    });
};
