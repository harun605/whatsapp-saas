import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// =============================================
// KLİNİK (TENANT) İŞLEMLERİ
// =============================================

// WhatsApp numarasına göre kliniği bul
// (Webhook geldiğinde hangi müşteri olduğunu anlamak için)
export async function getTenantByWhatsappNumber(number: string) {
  const { data } = await supabase
    .from('tenants')
    .select('*')
    .eq('whatsapp_number', number)
    .eq('bot_active', true)
    .single()
  return data
}

// Klinik bilgilerini güncelle
export async function updateTenant(tenantId: string, updates: any) {
  const { data } = await supabase
    .from('tenants')
    .update(updates)
    .eq('id', tenantId)
    .select()
    .single()
  return data
}


// =============================================
// HASTA İŞLEMLERİ
// =============================================

// Hastayı bul veya yeni oluştur
export async function findOrCreatePatient(tenantId: string, whatsappNumber: string) {
  // Önce bak var mı
  const { data: existing } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('whatsapp_number', whatsappNumber)
    .single()

  if (existing) {
    // Son görülme zamanını güncelle
    await supabase
      .from('patients')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', existing.id)
    return existing
  }

  // Yoksa oluştur
  const { data: newPatient } = await supabase
    .from('patients')
    .insert({ tenant_id: tenantId, whatsapp_number: whatsappNumber })
    .select()
    .single()

  return newPatient
}

// Hasta adını güncelle (bot konuşmada öğrenir)
export async function updatePatientName(patientId: string, name: string) {
  await supabase
    .from('patients')
    .update({ name })
    .eq('id', patientId)
}


// =============================================
// RANDEVU İŞLEMLERİ
// =============================================

// Yeni randevu oluştur
export async function createAppointment(data: {
  tenantId: string
  patientId: string
  service: string
  date: string   // "2024-03-15"
  time: string   // "14:30"
  notes?: string
}) {
  const { data: appointment } = await supabase
    .from('appointments')
    .insert({
      tenant_id: data.tenantId,
      patient_id: data.patientId,
      service: data.service,
      appointment_date: data.date,
      appointment_time: data.time,
      notes: data.notes,
      status: 'confirmed'
    })
    .select()
    .single()
  return appointment
}

// Belirli gün ve saatte boş slot var mı?
export async function checkAvailability(tenantId: string, date: string, time: string) {
  const { data } = await supabase
    .from('appointments')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('appointment_date', date)
    .eq('appointment_time', time)
    .eq('status', 'confirmed')

  return data?.length === 0 // boşsa true
}

// Kliniğin yaklaşan randevuları
export async function getUpcomingAppointments(tenantId: string, days = 7) {
  const today = new Date().toISOString().split('T')[0]
  const future = new Date(Date.now() + days * 86400000).toISOString().split('T')[0]

  const { data } = await supabase
    .from('appointments')
    .select('*, patients(name, whatsapp_number)')
    .eq('tenant_id', tenantId)
    .eq('status', 'confirmed')
    .gte('appointment_date', today)
    .lte('appointment_date', future)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  return data || []
}

// Hatırlatma gönderilmesi gereken randevuları bul
export async function getAppointmentsNeedingReminder() {
  const now = new Date()

  // 24 saat sonrası
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const tomorrowDate = tomorrow.toISOString().split('T')[0]
  const tomorrowHour = tomorrow.toTimeString().slice(0, 5)

  const { data } = await supabase
    .from('appointments')
    .select('*, patients(name, whatsapp_number), tenants(whatsapp_token, whatsapp_phone_id, business_name)')
    .eq('status', 'confirmed')
    .eq('reminder_24h_sent', false)
    .eq('appointment_date', tomorrowDate)
    .lte('appointment_time', tomorrowHour)

  return data || []
}


// =============================================
// KONUŞMA İŞLEMLERİ
// =============================================

// Aktif konuşmayı getir (yoksa oluştur)
export async function getOrCreateConversation(tenantId: string, patientId: string) {
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()

  // Son 30 dakikada aktif konuşma var mı?
  const { data: existing } = await supabase
    .from('conversations')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .eq('is_active', true)
    .gte('last_message_at', thirtyMinutesAgo)
    .single()

  if (existing) return existing

  // Yeni konuşma başlat
  const { data: newConv } = await supabase
    .from('conversations')
    .insert({
      tenant_id: tenantId,
      patient_id: patientId,
      messages: []
    })
    .select()
    .single()

  return newConv
}

// Konuşmaya mesaj ekle
export async function addMessageToConversation(
  conversationId: string,
  role: 'user' | 'assistant',
  content: string
) {
  // Mevcut mesajları al
  const { data: conv } = await supabase
    .from('conversations')
    .select('messages')
    .eq('id', conversationId)
    .single()

  const messages = (conv?.messages as any[]) || []
  messages.push({ role, content })

  // Güncelle
  await supabase
    .from('conversations')
    .update({
      messages,
      last_message_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  return messages
}
