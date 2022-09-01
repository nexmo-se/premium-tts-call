#premium-tts

Deploy the demo on NeRu.

## Prerequisites 
1. Copy `neru.yml.sample` to `neru.yml` and add {your-neru-project-name} and {your-application-id}
2. Copy `debug.debug.sample` to `.env.debug` and add {your_API_API_SECRET}
3. `neru secrets create --name API_API_SECRET --value {your_API_API_SECRET}`
4. `npm install`
5. Run `neru deploy` and take note of the `instance host address` for {your-neru-deploy-url}
   Or run `source .env.debug && neru debug` and take note of `Application Host` for {your-neru-debug-url} 
6. Build static files
```
cd ..

# for Neru Debug 
PUBLIC_URL={your-neru-debug-url} npm run build && cp -R ./api ./build ./neru/

# or for Neru Deploy
PUBLIC_URL={your-neru-deploy-url} npm run build && cp -R ./api ./build ./neru/

```

### Neru Debug 
```
source .env.debug && neru debug
```

### Neru Deploy
```
neru deploy
```
