#premium-tts

Deploy the demo on NeRu.


### Preparation 
```
cd ..
PUBLIC_URL={your-neru-debug-url} npm run build && cp -R ./api ./build ./neru/
// or
PUBLIC_URL={your-neru-deploy-url} npm run build && cp -R ./api ./build ./neru/
```

### Installation
```
npm install
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