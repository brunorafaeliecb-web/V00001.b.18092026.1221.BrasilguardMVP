const { createClient } = require('@supabase/supabase-js');
const jwt = require('jsonwebtoken');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  const { caller, destination } = req.body;

  const token = jwt.sign(
    { attest: 'A', orig: { tn: caller }, iat: Math.floor(Date.now() / 1000) },
    'BGUARD_2026',
    { header: { typ: 'passport', ppt: 'shaken', alg: 'HS256' } }
  );

  try {
    await supabase.from('registros').insert([{
        origem: caller || '552199999999',
        destino: destination || '552188888888',
        token_gerado: token
    }]);
  } catch (e) {
    console.error("Erro no banco:", e.message);
  }

  return res.status(200).json({ identity_token: token });
}
