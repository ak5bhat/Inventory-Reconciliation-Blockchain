//-----------------------------------------------DEFAULT IMPORTS
const http = require('http');
const fs = require('fs');
const path = require('path');
//-----------------------------------------------INSTALLED IMPORTS
const express = require('express'); 
const bodyParser = require('body-parser'); 
const cors = require('cors');
const {Gateway, Wallets} = require('fabric-network');
//-----------------------------------------------RELATIVE IMPO
const walletHelper = require('./lib/wallet');
const {uploadFileMiddleware,readXlsx} = require('./controller/upload');

//-----------------------------------------------CONNECTION PROFILE
const connectionProfilePath = path.join(__dirname,'connection-profiles','connection-org1.json');
const connectionProfileJson = fs.readFileSync(connectionProfilePath);
const connectionProfileObject = JSON.parse(connectionProfileJson);
//-----------------------------------------------DEFINE WALLETPATH,CONTRACTNAME,CHANNELNAME 
const walletPath = path.join(__dirname,'wallet');
const contractName = 'mychaincode'; //provide contract name here
const channelName = 'mychannel'; //provide channel name here


global.__basedir = __dirname;

//-----------------------------------------------EXPRESS INITIALIZE
const app = express();
//-----------------------------------------------JSON PARSER
app.use(bodyParser.json());
//-----------------------------------------------CORS
app.use(cors()); 
//-----------------------------------------------REGISTER INFRASTRUCTURE PROVIDERS
app.post('/register',async (req,res)=>{
    const username = req.body.username;
    const empid = req.body.empid;
    const firstName = req.body.firstName;
    const middleName = req.body.middleName;
    const lastName = req.body.lastName;
    const email = req.body.email;
    const mobile = req.body.mobile;
    const password = req.body.password;
    // console.log(username,empid, firstName, middleName, lastName, email,mobile, password);
    try{
        const key = await walletHelper.registerUser(username,email);
        //console.log(key)
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:username,discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
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
        console.log(userDetails)
        await contract.submitTransaction('registerUser',username,empid, firstName, middleName, lastName, email,mobile, password, key);
        res.send({
            status : 'success',
            error: null,
            message: null
        })
    }catch(err){
        res.send({
            status : 'failure',
            error  : err.name,
            message : err.message
        });
    }
})

app.post('/login',async (req,res)=>{
    try{
        const username = req.body.username;
        const password = req.body.password;
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:username,discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        let result = await contract.evaluateTransaction('getUser',username);
        result = JSON.parse(result.toString());
        // console.log(result);
        if(result.password != password){
            res.send({
                status : 'failure',
                error : 'Incorrect password',
                message : 'Incorrect password'
            })
        }
        else{
            res.send({
                status : 'success',
                payload : result,
                error : null,
                message : null
            })
        }
    }
    catch(err){
        res.send({
            status : 'failure',
            error : err.name,
            message : err.message
        })
    }
})

// app.post('/verify-Token',async (req,res)=>{
//     try{
//         const token = req.body.token;
//         const wallet = await Wallets.newFileSystemWallet(walletPath);
//         const gateway = new Gateway();
//         await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
//         const network = await gateway.getNetwork(channelName);
//         const contract = await network.getContract(contractName);
//         let result = await contract.evaluateTransaction('getUser',user);
//         result = JSON.parse(result.toString());
//         console.log(result);
//         if(result.key != token){
//             res.send({
//                 status : 'failure',
//                 error : 'Incorrect private key',
//                 message : 'incorrect private key'
//             })
//         }
//         else{
//             res.send({
//                 status : 'success',
//                 payload : result,
//                 error : null,
//                 message : null
//             })
//         }
//     }
//     catch(err){
//         res.send({
//             status : 'failure',
//             error : err.name,
//             message : err.message
//         })
//     }
// })

app.post('/upload-ims',async (req,res)=>{
    try{
        await uploadFileMiddleware(req, res);
        //write a function to change the file to csv and add each row as a single entry to the database
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
          }
        else{
            console.log("Uploaded the file successfully:", req.file.originalname);
        }

        const assetList = await readXlsx(req.file.originalname);
        //console.log(assetList);
        //await convert(req.file.originalname);
        //await insertData('KPN.xlsx');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        //await insertData('KPN.xlsx');
        
        //for loop
    
        // for (let i = 0; i < assetList.length; i++) {
        //     let object = assetList[i];
        //     console.log(object);
        //     let objectJSON = JSON.stringify(object);
        //     console.log(JSON.stringify(object.Serialnumber));
        //     console.log(objectJSON);
        // }
        const result = await contract.submitTransaction('storeInventory',JSON.stringify(assetList));
        res.send(JSON.parse(result.toString()));
    }
    catch(err){
        res.send({
            status: "failure",
            error: err.name,
            message: err.message
        })
    }
})

app.post('/upload-nms',async (req,res)=>{
    try{
        await uploadFileMiddleware(req, res);
        //write a function to change the file to csv and add each row as a single entry to the database
        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
          }
        else{
            console.log("Uploaded the file successfully:", req.file.originalname);
        }

        const assetList = await readXlsx(req.file.originalname);
        //console.log(assetList);
        //await convert(req.file.originalname);
        //await insertData('KPN.xlsx');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        
        const result = await contract.submitTransaction('storeNetwork',JSON.stringify(assetList));
        res.send(JSON.parse(result.toString()));
    }
    catch(err){
        res.send({
            status: "failure",
            error: err.name,
            message: err.message
        })
    }
})

app.get('/imsData',async (req,res)=>{
    try{
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        const result = await contract.evaluateTransaction('getIms');
        res.send(JSON.parse(result.toString()));
    }
    catch(err){
        res.send({
            status: "failure",
            error: err.name,
            message: err.message
        })
    }

})

app.put('/imsData/:Serialnumber',async (req,res)=>{
    try{
        const OLT_NE_ID = req.body.OLT_NE_ID;
        const OLT = req.body.OLT;
        const type = req.body.type;
        const PON = req.body.PON;
        const Serialnumber = req.body.Serialnumber;
        const Zone = req.body.Zone;
        const Site = req.body.Site;
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        const result = await contract.submitTransaction('updateImsById',OLT_NE_ID, OLT, type, PON, Serialnumber, Zone, Site);
        res.send(JSON.parse(result.toString()));
    }
    catch(err){
        res.send({
            status: "failure",
            error: err.name,
            message: err.message
        })
    }
})

app.get('/nmsData',async (req,res)=>{
    try{
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const gateway = new Gateway();
        await gateway.connect(connectionProfileObject,{wallet,identity:'admin',discovery:{ enabled:true,asLocalhost:true}});
        const network = await gateway.getNetwork(channelName);
        const contract = await network.getContract(contractName);
        const result = await contract.evaluateTransaction('getNms');
        res.send(JSON.parse(result.toString()));
    }
    catch(err){
        res.send({
            status: "failure",
            error: err.name,
            message: err.message
        })
    }

})




const server = http.createServer(app);
let port = 3000;
server.listen(port, () => {
    console.log(`Running at localhost:${port}`);
});
