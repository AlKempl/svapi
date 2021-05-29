'use strict';
const loopback = require('loopback');
const fs = require('fs');
const boot = require('loopback-boot');
const multer = require('multer');
const path = require('path');
const {getFaceFeatures} = require('./featuresGetter');
const {makeFilterQuery, findPersonByFaceFeatures} = require('./utils');
const _ = require('lodash');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({storage: storage});

const app = module.exports = loopback();

function makeError(status, message) {
    const e = new Error(message);
    e.status = status || 500;
    return e;
}

app.start = function () {
    // start the web server
    return app.listen(function () {
        app.emit('started');
        const baseUrl = app.get('url').replace(/\/$/, '');
        console.log('Web server listening at: %s', baseUrl);
        if (app.get('loopback-component-explorer')) {
            const explorerPath = app.get('loopback-component-explorer').mountPath;
            console.log('Browse your REST API at %s%s', baseUrl, explorerPath);
        }
    });
};

app.post('/api/findUser', upload.single('photo'), async (req, res, next) => {
    if (!req.file)
        return next(makeError(415, 'No photo attached'));

    let filter = {};
    if (req.body.filter) {
        try {
            filter = JSON.parse(req.body.filter);
        } catch (e) {
            return next(makeError(500, e));
        }
    }

    let faceFeatures;
    const inputImagePath = path.join('/svapi', 'backend', 'uploads', req.file.originalname);

    try {
        faceFeatures = await getFaceFeatures(inputImagePath);
    } catch (e) {
        console.log(e);
        return next(makeError(400, 'Unable to find a face'));
    }

    try {
        const people = await app.models['person'].getListByFilter(filter, faceFeatures);
        const resultProfiles = _.uniqBy(await findPersonByFaceFeatures(people), 'idDomain');
        /*app.models['history'].create({
            search_photo: new Buffer.from(fs.readFileSync(path.join('uploads', req.file.originalname)))
                .toString('base64'),
            filter,
            ids_faces: resultProfiles.map(result => result.faceId)
        });*/
        res.json(resultProfiles);
    } catch (e) {
        return next(makeError(400, e.message));
    }
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500).send({
        error: {
            status: err.status,
            message: err.message,
        },
    });
});

boot(app, __dirname, function (err) {
    if (err) throw err;

    // start the server if `$ node server.js`
    if (require.main === module)
        app.start();
});
