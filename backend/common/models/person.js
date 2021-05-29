'use strict';
const _ = require('lodash');

function formateStatsData(data) {
    return data.map(item => {
        let resObj = {};
        resObj[item._id] = item.count;
        return resObj
    });
}

function makeFilterQuery(data) {
    let filter = {};

    if (data.firstname) {
        filter.first_name = {
            $regex: new RegExp(data.firstname, 'i')
        }
    }

    if (data.lastname) {
        filter.last_name = {
            $regex: new RegExp(data.lastname, 'i')
        };
    }

    if (data.city) {
        filter.city = {
            $regex: new RegExp(data.city, 'i')
        };
    }

    if (data.country) {
        filter.country = {
            $regex: new RegExp(data.country, 'i')
        }
    }

    if (data.gender) {
        filter.sex = {
            $regex: new RegExp(data.gender, 'i')
        }
    }

    return filter;
}

const computeAgeAggregation = {
    $toInt:
        {
            $divide: [{$subtract: [new Date(), {$dateFromString: {"dateString": "$bdate", "onError": null}}]},
                (365 * 24 * 60 * 60 * 1000)]
        }
};

module.exports = function (Person) {
    Person.calculateAge = function calculateAge(person) {
        if (!person.bdate) {
            return null;
        }
        const diffMs = Date.now() - new Date(person.bdate).getTime();
        const ageDt = new Date(diffMs);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
    };

    Person.getCountriesStatistics = async function () {
        return new Promise((resolve, reject) => {
            Person.getDataSource().connector.connect((err, db) => {
                if (err) {
                    return reject(err);
                }
                const personCollection = db.collection('person');
                return personCollection.aggregate([
                    {$sortByCount: '$country'},
                    {$sort: {country: 1}}
                ])
                    .toArray((err, data) => {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(formateStatsData(data));
                        }

                    });
            });
        });
    };

    Person.getCitiesStatistics = async function () {
        return new Promise((resolve, reject) => {
            Person.getDataSource().connector.connect((err, db) => {
                if (err) {
                    return reject(err);
                }
                const personCollection = db.collection('person');
                return personCollection.aggregate([
                    {$sortByCount: '$city'},
                    {$sort: {country: 1}}
                ])
                    .toArray((err, data) => {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(formateStatsData(data));
                        }
                    });
            });
        });
    };

    Person.getGenderStatistics = async function () {
        return new Promise((resolve, reject) => {
            Person.getDataSource().connector.connect((err, db) => {
                if (err) {
                    return reject(err);
                }
                const personCollection = db.collection('person');
                return personCollection.aggregate([
                    {$sortByCount: '$sex'},
                    {$sort: {country: 1}}
                ])
                    .toArray((err, data) => {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(formateStatsData(data));
                        }

                    });
            });
        });
    };

    Person.getAgeStatistics = async function () {
        return new Promise((resolve, reject) => {
            Person.getDataSource().connector.connect((err, db) => {
                if (err) {
                    return reject(err);
                }
                const personCollection = db.collection('person');

                personCollection.aggregate([{
                    $project: {
                        age: computeAgeAggregation
                    }
                }, {
                    $bucket: {
                        groupBy: "$age",
                        boundaries: [0, 19, 31, 46, 100],
                        default: "Other",
                        output: {
                            "count": {$sum: 1}
                        }
                    }
                }
                ])
                    .toArray((err, data) => {
                        if (err) {
                            return reject(err);
                        } else {
                            let resObj = {"0-18": 0, "19-30": 0, "31-45": 0, "46+": 0};

                            for (const res of data) {
                                if (res._id === 0) {
                                    resObj["0-18"] = res.count
                                }

                                if (res._id === 19) {
                                    resObj["19-30"] = res.count
                                }

                                if (res._id === 31) {
                                    resObj["31-45"] = res.count
                                }

                                if (res._id === 46) {
                                    resObj["46+"] = res.count
                                }
                            }
                            resolve(resObj);
                        }
                    })
            });
        });
    };

    Person.getListByFilter = async function (data, faceFeatures) {
        return new Promise((resolve, reject) => {
            Person.getDataSource().connector.connect(async (err, db) => {
                if (err) {
                    return reject(err);
                }
                const personCollection = db.collection('person');
                let aggregationArray = [
                    {$sort: {id_person: 1}},
                    {
                        $addFields: {
                            age: computeAgeAggregation,
                        }
                    }
                ];

                const formatedFilter = makeFilterQuery(data);
                if (Object.keys(formatedFilter).length) {
                    aggregationArray.push({$match: formatedFilter});
                }

                if (data.age) {
                    aggregationArray.push({
                        $match: {age: {$gte: data.age[0], $lte: data.age[1]}}
                    });
                }

                aggregationArray = [...aggregationArray, {
                    $lookup: {from: "face", localField: "id_person", foreignField: "id_person", as: "faces"}
                },
                    {$unwind: "$faces"},
                    {$match: {"faces.vector_dots_face": {$exists: true, $not: {$size: 0}}}},
                    {
                        $addFields: {
                            'distance': {
                                $let: {
                                    vars: {
                                        pow: {
                                            $reduce: {
                                                input: {$zip: {inputs: [faceFeatures, "$faces.vector_dots_face"]}},
                                                initialValue: 0,
                                                in: {
                                                    $add: [
                                                        "$$value",
                                                        {
                                                            $pow: [
                                                                {$subtract: [{$arrayElemAt: ["$$this", 0]}, {$arrayElemAt: ["$$this", 1]}]}, 2]
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    },
                                    in: "$$pow"
                                }
                            }
                        }
                    },
                    {$match: {"distance": {$lt: 0.5}}},
                    {$sort: {distance: 1}},
                    {
                        $group:
                            {
                                "_id": "$_id",
                                "first_name": {"$first": "$first_name"},
                                "last_name": {"$first": "$last_name"},
                                "id_person": {"$first": "$id_person"},
                                "id_domain": {"$first": "$id_domain"},
                                "faces": {"$first": "$faces"},
                                "city": {"$first": "$city"},
                                "country": {"$first": "$country"},
                                "age": {"$first": "$age"},
                                "distance": {"$first": "$distance"}
                            }
                    },
                    {$sort: {distance: 1}},
                    {$limit: 30}
                ];
                const aggrResult = personCollection.aggregate(aggregationArray);

                return aggrResult
                    .toArray((err, data) => {
                        if (err) {
                            return reject(err);
                        } else {
                            resolve(data);
                        }
                    });
            });
        });
    };

    Person.remoteMethod(
        'getCountriesStatistics',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });

    Person.remoteMethod(
        'getCitiesStatistics',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });

    Person.remoteMethod(
        'getGenderStatistics',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });

    Person.remoteMethod(
        'getAgeStatistics',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });

    Person.remoteMethod(
        'getListByFilter',
        {
            http: {verb: 'get'},
            returns: {arg: 'result', type: 'array'},
        });
};
