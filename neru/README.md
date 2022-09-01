#premium-tts

Deploy the demo on NeRu.

## Preparation 
1. Create a NeRu Project: `neru init`, take note of your NeRu url;
2. Configure your project: update `neru.yml` with your Vonage application ID;
3. Install dependencies: `npm install`, and  
```
cd ..
// for Neru Debug 
PUBLIC_URL={your-neru-debug-url} npm run build && cp -R ./api ./build ./neru/
// or for Neru Deploy
PUBLIC_URL={your-neru-deploy-url} npm run build && cp -R ./api ./build ./neru/

```


### Neru Debug 
Copy debug.debug.sample to .env.debug and add your API_API_SECRET.

Run Neru Debug:
```
source .env.debug && neru debug
```

### Neru Deploy
```
neru secrets create --name API_API_SECRET --value {your-API_API_SECRET}

neru deploy
```