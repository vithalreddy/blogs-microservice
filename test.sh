#!/bin/bash

cd ./blog-apis
npm install
npm test

cd "../comment-apis"
npm install
npm test
