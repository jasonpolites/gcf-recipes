/*!
 * Copyright 2014 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var path = require('path');
var ffmpeg = require('fluent-ffmpeg');
var gcloud = require('gcloud');
var os = require('os');
var Promise = require('bluebird');

var self = {
    extractFrames: function(context, data) {

        // The function expects two arguments, the file to process (from the local file system) 
        // and the GCS bucket into which we will save thumbnails
        var localFile = data['file'];
        var remoteBucket = data['bucket'];

        // HACK:  This is just so we can run the same code locally and remotely
        var binaryFlavor = (os.type() === 'Darwin') ? 'mac' : 'linux'

        var binPath = path.resolve(__dirname, binaryFlavor);

        var ffmpegPath = path.resolve(binPath, 'ffmpeg');
        var ffprobePath = path.resolve(binPath, 'ffprobe');

        console.log('Using ffmpeg in ' + ffmpegPath)

        var filePath = path.resolve(__dirname, data['file']);
        console.log('Extracting frames from ' + filePath)

        var outputPath = path.resolve('/tmp', 'output');
        console.log('Writing output files to ' + outputPath);

        var proc = ffmpeg(filePath);

        // We need to make sure we tell fluent-ffmpeg where to find the binaries
        proc.setFfmpegPath(ffmpegPath);
        proc.setFfprobePath(ffprobePath);

        // Will be populated in the callback
        var files = null;

        var command = proc
            // setup event handlers
            .on('filenames', function(filenames) {
                files = filenames;
            })
            .on('end', function() {
                // Thumbnails extracted to local disk, now upload to GCS

                var gcs = gcloud.storage();
                var bucket = gcs.bucket(remoteBucket);
                var promises = [];

                for (var i = 0; i < files.length; ++i) {
                    var filePath = path.resolve(outputPath, files[i]);
                    console.log('Uploading file ' + filePath);
                    promises.push(uploadFile(bucket, filePath));
                }

                // Save to GCS (Promises FTW!)
                Promise.all(promises).then(function(posts) {
                    context.success('Files uploaded');
                }).catch(function(reason) {
                    context.failure(reason);
                });
            })
            .on('error', function(err) {
                console.log('an error happened: ' + err.message);
                context.failure(err);
            })
            // take 2 screenshots at predefined timemarks and size
            .takeScreenshots({
                count: 2,
                timemarks: ['00:00:02.000', '6'],
                size: '320x200'
            }, outputPath);

    }
};

// Turn gcloud-node into a promise-friendly version, cause that's how we roll
var uploadFile = function(bucket, path) {
    return new Promise(function(resolve, reject) {
        bucket.upload(path, function(err, file) {
            if (err) {
                reject(err);
            } else {
                resolve(file);
            }
        });
    });
}

module.exports = self;