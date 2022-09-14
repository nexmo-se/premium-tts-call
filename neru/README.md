#premium-tts

Deploy the demo on NeRu.

## Prerequisites 
- [NeRu CLI](https://vonage-neru.herokuapp.com/neru/guides/cli)
- Configure Vonage application
   - if you use an existing application, run `neru app configure --app-id [appid]` and run `neru app generate-keys` 
   - Or create a new application, run `neru app create --name "your app name"`

## Installation
1. Copy `neru.yml.sample` to `neru.yml` and add {your-neru-project-name} and {your-application-id}
2. Run `npm install`

## Build
Pack static files:
   ```sh
   cd .. # go to your project's root directory
   npm run build && cp -R ./api ./build ./neru/
   cd ./neru # go back to .neru
   ```

## Neru Deploy 
1. Run `neru secrets create --name API_SECRET --value {your_API_SECRET}`
2. Run `neru deploy`
3. Open URL: **instance host address 2**


## Neru Debug 
1. Copy `debug.debug.sample` to `.env.debug` and add {your_API_SECRET}
2. Run `source .env.debug && neru debug`
3. Open URL: **Application Host 2**
