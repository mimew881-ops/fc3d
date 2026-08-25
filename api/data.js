import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const [config, results] = await Promise.all([
        redis.get('fc3d_config'),
        redis.get('fc3d_results')
      ]);
      res.status(200).json({
        config: config || null,
        results: results || null
      });
    } catch (error) {
      res.status(200).json({
        config: null,
        results: null,
        error: error && error.message ? error.message : String(error)
      });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body || {};
      if (body.config) {
        await redis.set('fc3d_config', body.config);
      }
      if (body.results) {
        await redis.set('fc3d_results', body.results);
      }
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: 'save failed' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
