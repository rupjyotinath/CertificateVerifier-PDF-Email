const ejs = require('ejs');
const pdf = require('html-pdf');
const path = require('path');


// Make Promise support
const pdfCreateStreamPromise= (html,options)=>{
    return new Promise((resolve,reject)=>{
        pdf.create(html,options).toStream((err,stream)=>{
            if(err) reject(err);
            resolve(stream);
        })
    })
}


// Return the pdf stream 
const generatePdfStream = async (certificate)=>{
    try{
        const html=await ejs.renderFile(path.join(__dirname,'../views/certificate/internship-certificate.ejs'),{certificate:certificate});
        const options = {"base": "file:///D:/PersonalProjects/CertificateVerifier-PDF-Email/views/certificate/"};
        
        const pdfStream = await pdfCreateStreamPromise(html,options);
        return pdfStream;
    }
    catch(err){
        console.log(err);
        throw new Error('PDF stream failed');
    }
    
}

module.exports={
	generatePdfStream
}