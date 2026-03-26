import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

  // Keep-alive: ping self every 14 min to prevent Render free tier sleep
  if (process.env.NODE_ENV === 'production') {
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
      try {
        await fetch(`${RENDER_URL}/`);
        console.log('[KeepAlive] ✅ Self-ping successful');
      } catch (err) {
        console.error('[KeepAlive] ❌ Self-ping failed:', (err as Error).message);
      }
    }, 14 * 60 * 1000); // 14 minutes
  }
});
