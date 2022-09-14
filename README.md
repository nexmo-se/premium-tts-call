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
1. Copy `env.sample` to `.env` and add your settings
2. Run `npm install`

## Available Scripts
In the project directory, run:

1. `npm run server`
Runs the app's server in the development mode.
Open [http://localhost:3002/api/](http://localhost:3002/api/) to see if it is running

2. `npm start`
Runs the app's frontend in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


### NeRu
Check `./neru/READEME.md`
