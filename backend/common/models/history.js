'use strict';
const _ = require('lodash');

module.exports = function (History) {
    History.getHistory = async function () {
        return (await History.find({include: {faces: 'person'}}))
            .map(item => {
                const itemObj = item.toObject();
                return {
                    searchPhoto: itemObj.search_photo,
                    date: itemObj.date,
                    results: itemObj.faces.map(face => {
                        return {
                            photo: face.photo_url,
                            person: {
                                firstname: face.person.first_name,
                                lastname: face.person.last_name,
                                age: face.person.age,
                                idDomain: face.person.id_domain
                            }
                        }
                    }),
                    filter: itemObj.filter
                }
            });
    };

    History.remoteMethod(
        'getHistory',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });
};
