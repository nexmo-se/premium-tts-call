# premium-tts-call

The demo supports making TTS calls with Voice API and Client SDK.

## Prerequisites
1. create a Vonage account via the Dashboard.
2. create a Vonage application
    - enable voice capabilities
    - set ANSWER URL: POST $APP_BASEURL/api/webhooks/answer 
    - set EVENT URL: POST $APP_BASEURL/api/webhooks/event 
3. buy a Vonage number and link it to the application you just created


## Available Scripts

In the project directory, you can run:

### `npm run server`
Runs the app's server in the development mode.

### `npm start`
Runs the app's frontend in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.


### NeRu
Check`./neru/READEME.md`