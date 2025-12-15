/**
 * Simple deploy script for AWS S3 and CloudFront
 * 
 * Prerequisites:
 * - Node.js installed
 * - AWS CLI configured with appropriate credentials
 * - AWS SDK for JavaScript installed: npm install aws-sdk
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const config = require('./deploy-config.json');

// Function to execute shell commands
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command}`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        return reject(error);
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      console.log(`stdout: ${stdout}`);
      resolve(stdout);
    });
  });
}

// Main deploy function
async function deploy() {
  try {
    console.log('Starting deployment to AWS S3...');
    
    // Check if AWS CLI is installed
    try {
      await executeCommand('aws --version');
    } catch (error) {
      console.error('AWS CLI is not installed or not in PATH. Please install it first.');
      return;
    }
    
    // Sync files to S3
    console.log(`Uploading files to S3 bucket: ${config.bucketName}`);
    await executeCommand(`aws s3 sync . s3://${config.bucketName} --exclude "README.md" --exclude "deploy.js" --exclude "deploy-config.json" --exclude "node_modules/*" --region ${config.region}`);
    
    // Create CloudFront invalidation if distributionId is provided
    if (config.cloudfront && config.cloudfront.distributionId) {
      console.log('Creating CloudFront invalidation...');
      // The paths parameter needs specific formatting for AWS CLI
      await executeCommand(`aws cloudfront create-invalidation --distribution-id ${config.cloudfront.distributionId} --paths /\* --region ${config.region}`);
    } else {
      console.log('No CloudFront distribution ID provided. Skipping invalidation.');
      console.log('Once you have created a CloudFront distribution, add the distribution ID to deploy-config.json');
    }
    
    console.log('Deployment completed successfully!');
    console.log(`Your website should be available at http://${config.bucketName}.s3-website-${config.region}.amazonaws.com/`);
    console.log('Once CloudFront is set up, it will be available at your custom domain.');
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

// Run the deployment
deploy();
