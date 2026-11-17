import { spawn } from 'child_process';
import fs from 'fs';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--window-size=1280,720',
  '--disable-gpu',
  '--no-sandbox',
  'http://localhost:5173'
]);

setTimeout(async () => {
  try {
    const listRes = await fetch('http://127.0.0.1:9222/json');
    const tabs = await listRes.json();
    const appTab = tabs.find(t => t.url.includes('5173'));
    
    if (appTab && appTab.webSocketDebuggerUrl) {
      const ws = new WebSocket(appTab.webSocketDebuggerUrl);
      ws.onopen = () => {
        ws.send(JSON.stringify({ id: 1, method: 'Page.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
        
        // 1. Launch directly and set camera to platform
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (function() {
                  if (window.useSimStore) {
                    window.useSimStore.getState().launchSimulation('potato');
                    setTimeout(() => {
                      window.useSimStore.getState().setCameraPreset('platform');
                      window.useSimStore.getState().setIsSopPanelOpen(false); // keep panel collapsed to see 3D clearly
                    }, 500);
                  }
                })()
              `
            }
          }));
        }, 1000);

        // 2. Capture resting view
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 10,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 2500);

        // 3. Trigger dip
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 7,
            method: 'Runtime.evaluate',
            params: {
              expression: `
                (function() {
                  if (window.useSimStore) {
                    window.useSimStore.getState().triggerLanceDip();
                  }
                })()
              `
            }
          }));
        }, 3000);

        // 4. Capture dipped view
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 20,
            method: 'Page.captureScreenshot',
            params: { format: 'png' }
          }));
        }, 4500);
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === 10 && msg.result && msg.result.data) {
          fs.writeFileSync('d:\\PROJECT\\TungkuPeleburanLogam\\screenshot_cyy_resting.png', Buffer.from(msg.result.data, 'base64'));
          console.log('RESTING SAVED!');
        } else if (msg.id === 20 && msg.result && msg.result.data) {
          fs.writeFileSync('d:\\PROJECT\\TungkuPeleburanLogam\\screenshot_cyy_dipping.png', Buffer.from(msg.result.data, 'base64'));
          console.log('DIPPING SAVED!');
          chromeProc.kill();
          process.exit(0);
        }
      };

      setTimeout(() => {
        chromeProc.kill();
        process.exit(0);
      }, 7000);
    }
  } catch (err) {
    console.error('Error fetching CDP:', err);
    chromeProc.kill();
    process.exit(1);
  }
}, 1200);
