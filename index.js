if(process.env.NODE_ENV!='production'){
	const dotenv = require('dotenv');
	const result  = dotenv.config();

	if(result.error){
		throw result.error;
	}
}

/*
The primary task of this file is to continously look for new message in Amazon SQS,
generate the pdf stream of newly issued certificate & email it as attachment.
*/

const pdfController = require('./controllers/pdfController');
const emailController = require('./controllers/emailController');

// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region
AWS.config.update({region: 'REGION'});

// Create an SQS service object
const sqs = new AWS.SQS({apiVersion: '2012-11-05'});

var queueURL = process.env.AWS_SQS_QUEUE_URL;

var params = {
 AttributeNames: [
    "SentTimestamp"
 ],
 MaxNumberOfMessages: 1,
 MessageAttributeNames: [
    "All"
 ],
 QueueUrl: queueURL,
 //VisibilityTimeout: 20,
 //WaitTimeSeconds: 0
};

async function processMessage(){
  while(true){
	try{
		console.time('poll');
		const data = await sqs.receiveMessage(params).promise();
		console.timeEnd('poll');
		if(data.Messages){
			const msg=JSON.parse(data.Messages[0].Body);
			const certificate = {};
			certificate.name=msg.name;
			certificate.email=msg.email;
			certificate.id=msg.id;
			certificate.purpose=msg.purpose;
			certificate.organization=msg.organization;
			certificate.details=msg.details;
			certificate.start=msg.start;
			certificate.end=msg.end;
			certificate.issuedOn=msg.issuedOn;

			console.log(data.Messages[0].MessageAttributes.Type);
			
		    console.time('stream');
			const pdfCertificateStream=await pdfController.generatePdfStream(certificate);
			console.timeEnd('stream');
			console.time('email');
			const emailInfo = await emailController.emailCertificate(pdfCertificateStream,certificate);
			console.log(emailInfo.messageId);
			console.timeEnd('email');

			const deleteParams = {
			QueueUrl: queueURL,
			ReceiptHandle: data.Messages[0].ReceiptHandle
			};
			sqs.deleteMessage(deleteParams, function(err, data) {
				if (err) {
					console.log("Delete Error", err);
				} else {
					console.log("Message Deleted", data);
				}
			});
		}
	}
	catch(err){
		console.log(err);
	}
  }
}

processMessage()
.catch(err=>{
	console.log(err);
	process.exit(1);
})