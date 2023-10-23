const path = require('path');
const fs = require('fs');

const sendMail = require('../controller/mail')

const {Wallets} = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

const connectionProfilePath = path.join(__dirname,'..','connection-profiles','connection-org1.json');
const connectionProfileJson = fs.readFileSync(connectionProfilePath);
const connectionProfileObject = JSON.parse(connectionProfileJson);

const caInfo = connectionProfileObject.certificateAuthorities['ca.org1.example.com'];
const caTLSCACerts = caInfo.tlsCACerts.pem;
const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

const walletPath = path.join(__dirname,'..','wallet'); //path where all ID are stored

//to enroll a admin
const enrollAdmin = async () => {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('admin');
    if(identity){ //check if ADMIN already exist
        console.log('ADMIN ID ALREADY EXISTS IN WALLET');
        return;
    }
    //enroll the admin if not exist
    const enrollment = await ca.enroll({enrollmentID: 'admin', enrollmentSecret: 'adminpw'});
    let x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    await wallet.put('admin',x509Identity);
    console.log("ENROLLED ADMIN SUCCESSFULY");
}
//to register a client user
const registerUser = async (username,email) => {
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get(username);
    if(identity){
        console.log(`USER ID: ${username} ALREADY EXISTS IN WALLET`)
        return;
    }
    let adminIdentity = await wallet.get('admin');
    if(!adminIdentity){
        console.log("ADMIN MUST BE ENROLLED BEFORE REGISTERING USER");
        console.log("ENROLLING ADMIN");
        await enrollAdmin();
        adminIdentity = await wallet.get('admin');
    }
    const provider = await wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');
    const secret = await ca.register({ affiliation: 'org1.department1', enrollmentID: username, role: 'client'}, adminUser);
    const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
    let x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    //console.log(x509Identity);
    await wallet.put(username,x509Identity);
    console.log(`ENROLLED USER SUCCESSFULY: ${username}`);
    const private_key = x509Identity.credentials.privateKey.slice(27,-27).replaceAll("\r\n","").replaceAll("+","");
    // const private_key1 = x509Identity.credentials.privateKey.slice(27,-27)
    //\nMIICeDCCAh6gAwIBAgIUHzCnktBdO8sdQBz7D9zoq8iTjqkwCgYIKoZIzj0EAwIw\ncDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMQ8wDQYDVQQH\nEwZEdXJoYW0xGTAXBgNVBAoTEG9yZzEuZXhhbXBsZS5jb20xHDAaBgNVBAMTE2Nh\nLm9yZzEuZXhhbXBsZS5jb20wHhcNMjMwMzIzMDkyNjAwWhcNMjQwMzIyMTEwNzAw\nWjA+MTAwCwYDVQQLEwRvcmcxMA0GA1UECxMGY2xpZW50MBIGA1UECxMLZGVwYXJ0\nbWVudDExCjAIBgNVBAMTAWEwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAARZj0mx\nqwJ6WWaijd700+evt0bHi3FE8LA9J6Ux5+Ep+cwORCsxtnAJquR7qedzwkhMz6Fe\njC0SDR5UwsVSaNBXo4HHMIHEMA4GA1UdDwEB/wQEAwIHgDAMBgNVHRMBAf8EAjAA\nMB0GA1UdDgQWBBQzd1WwzoG4bAwr0BiKTsEKcMVCPzAfBgNVHSMEGDAWgBSPYGtm\nmziq7h0XcozJFEAkXO+bDTBkBggqAwQFBgcIAQRYeyJhdHRycyI6eyJoZi5BZmZp\nbGlhdGlvbiI6Im9yZzEuZGVwYXJ0bWVudDEiLCJoZi5FbnJvbGxtZW50SUQiOiJh\nIiwiaGYuVHlwZSI6ImNsaWVudCJ9fTAKBggqhkjOPQQDAgNIADBFAiEAxmP0LicV\nDFsp4tXpMUkYPsCbjWvDN6kx4m6M0WsESZwCID49BTlgV7FHBuWOctWk24dasqw+\nDrpTggijpKpQJVQ4\n-----END CERTIFICATE-----\n","privateKey":"-----BEGIN PRIVATE KEY-----\r\nMIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQgnu0N7EUQbLB1mezL\r\n6IDasNKr0Px/pgCG0XABre7dFSuhRANCAARZj0mxqwJ6WWaijd700+evt0bHi3FE\r\n8LA9J6Ux5+Ep+cwORCsxtnAJquR7qedzwkhMz6FejC0SDR5UwsVSaNBX\r\n
    
    
    //send mail
    //await sendMail(username,email,private_key1);
    return private_key;
}

module.exports = {enrollAdmin,registerUser};