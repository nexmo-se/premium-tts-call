# premium-tts-call

The demo supports making TTS calls with Voice API and Client SDK.

## Prerequisites
1. a Vonage account
2. a Vonage application
    - enable voice capabilities
    - set ANSWER URL: POST $APP_BASEURL/api/webhooks/answer 
    - set EVENT URL: POST $APP_BASEURL/api/webhooks/event 
3. a Vonage number and link it to the Vonage application

## Installation
1. Go to `./frontend` and `./server`, copy `env.sample` to `.env` and add your settings
2. Run `npm install` in `./frontend` and `./server` separately  

## Available Scripts

1. In the `./server` directory, run: `npm start`
Open [server](http://localhost:3002/api/) to see if it is running

2. In the `./frontend` directory, run:  `npm start`
Open [frontend](http://localhost:3000) to view it in your browser.


### NeRu
Check `./neru/READEME.md`
