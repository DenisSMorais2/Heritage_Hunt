// ============================================================
// Ligacao ao projecto Supabase do Heritage Hunt.
//
// Estas duas chaves sao PUBLICAS por desenho: qualquer pessoa que
// abra a app as ve. Quem protege os dados nao e a chave, e o RLS
// da base de dados, que so deixa cada explorador ler e escrever
// aquilo que e seu. Nunca ponhas aqui a chave `service_role`.
// ============================================================

window.SUPABASE_CONFIG = {
    url: 'https://bhuclzudvcelmpwpobpr.supabase.co',
    publishableKey: 'sb_publishable_ZKF0is_mROJ74W4IWLhtRQ___tnQtwx'
};
