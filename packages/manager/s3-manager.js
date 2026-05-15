const AWS = require("aws-sdk");

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region: process.env.AWS_REGION,
});

// console.log("ACCESS KEY:", process.env.AWS_ACCESS_KEY);
// console.log("SECRET KEY:", process.env.AWS_SECRET_KEY);

const s3 = new AWS.S3({ apiVersion: "2006-03-01" }); 

module.exports = { s3 };
