const config = require('../config.json');

const migrateCheckList = {};

function isMigrateComplete() {
    for (const key in migrateCheckList) {
        if (!migrateCheckList.hasOwnProperty(key)) continue;
        if (!migrateCheckList[key]) return false;
    }
    return true;
}

module.exports = function(app) {
    const models = Object.keys(app.models)
        .filter(function(value) {
            return app.models[value].shared && app.models[value].dataSource.name != 'loopback-component-storage';
        });

    models.forEach(function(value) {
        migrateCheckList[value] = !config.overwriteScheme && !config.updateScheme;
    });

    if (!app.dataSources.db.connected) {
        app.dataSources.db.once('connected', function() {
            updateDB(app, models);
        });
    } else {
        updateDB(app, models);
    }
};

function updateDB(app, models) {
    if (config.updateScheme) {
        app.dataSources.db.isActual(models, function (err, actual) {
            models.forEach(function (model) {
                if (!actual) {
                    app.dataSources.db.autoupdate(models, function (err, result) {
                        console.log(err);
                        if (err) throw err;
                        console.log('Model "' + model + '" has been updated');
                        migrateCheckList[model] = true;
                        if (isMigrateComplete()) {
                            app.emit('boot_complete');
                        }
                    });
                } else {
                    migrateCheckList[model] = true;
                    if (isMigrateComplete()) {
                        app.emit('boot_complete');
                    }
                }
            });
        });
    } else if (config.overwriteScheme) {
        models.forEach(function(model) {
            app.dataSources.db.automigrate(model, function(err) {
                if(err) throw err;
                console.log('Model "' + model + '" has been overwritten');
                migrateCheckList[model] = true;
                if(isMigrateComplete()) {
                    if(config.loadSampleData) loadSampleData(app, models);
                    app.emit('boot_complete');
                }
            });
        });
    } else {
        if(config.loadSampleData) loadSampleData(app, models);
        app.emit('boot_complete');
    }
}
