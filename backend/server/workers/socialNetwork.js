"use strict";

function run(socialNetworkModel) {
    console.log('Social network worker running');

    socialNetworkModel.count((err, count) => {
        if (err){
            console.log(err);
        }

        if (count === 0) {
            console.log('Create genders list');
            const genders = require('./../boot/socialNetworks').socialNetworks;
            socialNetworkModel.create(genders, (err) => {
                if (err){
                    console.log(err);
                }
            })
        }
    })
}

module.exports.run = run;
