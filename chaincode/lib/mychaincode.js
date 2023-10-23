'use strict';

const stringify = require('json-stringify-deterministic');
const sortKeysRecursive = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');


class Mychaincode extends Contract {

    // registration
    async registerUser(ctx, username, empid, firstName, middleName, lastName, email, mobile, password, key) {
        const exists = await this.AssetExists(ctx, username);
        if (exists) {
            throw new Error(`The asset ${username} already exists`);
        }
        const userDetails = {
            username,
            empid,
            firstName,
            middleName,
            lastName,
            email,
            mobile,
            password,
            key
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState(username, Buffer.from(stringify(sortKeysRecursive(userDetails))));
        return JSON.stringify(userDetails);
    }

    // ReadAsset returns the asset stored in the world state with given id.
    async getUser(ctx, username) {
        const userDetailJSON = await ctx.stub.getState(username); // get the asset from chaincode state
        if (!userDetailJSON || userDetailJSON.length === 0) {
            throw new Error(`The user with id : ${username} does not exist`);
        }
        // return JSON.stringify(userDetailJSON);
        return userDetailJSON.toString();
    }


    async storeInventory(ctx, assetList) {
        //console.log(typeof(assetList)); //string

        let arrayAsset = JSON.parse(assetList);
        //console.log(typeof(arrayAsset)); //object

        for(let asset of arrayAsset){
            let key = asset.Serialnumber;
            //console.log(typeof(key)); //string
            
            // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
            await ctx.stub.putState("Inv" + key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        return JSON.stringify({status:"Inventory data stored successfully"});
        //return JSON.stringify(assetList);
    }

    async storeNetwork(ctx, assetList) { //string

        let arrayAsset = JSON.parse(assetList); //object
        

        for(let asset of arrayAsset){
            let key = asset.Serialnumber; //string
            
            await ctx.stub.putState("Net" + key, Buffer.from(stringify(sortKeysRecursive(asset))));
        }
        return JSON.stringify({status:"Network data stored successfully"});
    }

    async getIms(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange("Inv", "Inv" + "~");
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }



    async getNms(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange("Net", "Net" + "~");
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // AssetExists returns true when asset with given ID exists in world state.
    async AssetExists(ctx, Serialnumber) {
        const assetJSON = await ctx.stub.getState(Serialnumber);
        return assetJSON && assetJSON.length > 0;
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async updateImsById(ctx, OLT_NE_ID, OLT, type, PON, Serialnumber, Zone, Site) {
        const exists = await this.AssetExists(ctx, Serialnumber);
        if (!exists) {
            throw new Error(`The asset ${Serialnumber} does not exist`);
        }
        // overwriting original asset with new asset
        const updatedInvDetail = {
            OLT_NE_ID: OLT_NE_ID,
            OLT: OLT,
            type: type,
            PON: PON,
            Serialnumber: Serialnumber,
            Zone: Zone,
            Site: Site,
        };
        // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
        await ctx.stub.putState("Inv" + Serialnumber, Buffer.from(stringify(sortKeysRecursive(updatedInvDetail))));
        return JSON.stringify(updatedInvDetail);
    }


    async getAll(ctx) {
        const allResults = [];
        const iterator = await ctx.stub.getStateByRange("", "");
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

}

module.exports = Mychaincode;