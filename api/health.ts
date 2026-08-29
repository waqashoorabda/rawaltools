export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    domain: 'rawaltools.com',
    service: 'Rawal Tools Backend API'
  });
}
