const nodemailer = require('nodemailer');
const Mailgen = require('mailgen');

const sendMail = async (username,email,key) => {

    let config = {
        service : 'gmail',
        auth : {
            user: 'eng18cs0025.akhileshsbhat@gmail.com',
            pass: 'juwznrbxfdyzjsad'
        }
    }

    let transporter = nodemailer.createTransport(config);

    let MailGenerator = new Mailgen({
        theme: "default",
        product : {
            name: "Prodapt",
            link : 'https://www.prodapt.com/'
        }
    })

    let response = {
        body: {
            name : `${username}`,
            intro: `You have successfully signed-in. Here's your private key: ${key}`,
            outro: "You need your private key to do operations. So keep your private key safely."
        }
    }

    let mail = MailGenerator.generate(response)

    let message = {
        from : config.auth.user,
        to : email,
        subject: "Registration Successful!",
        html: mail
    }

    transporter.sendMail(message).then(() => {
        console.log("Email sent successfully")
    }).catch(error => {
        console.log(`Error: ${error}`)
    })


}

module.exports = sendMail;