export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import {
  getTenantByWhatsappNumber,
  findOrCreatePatient,
  getOrCreateConversation,
  addMessageToConversation,
  createAppointment,
  checkAvailability,
} from '@/lib/supabase'
import { generateAIResponse } from '@/lib/gemini'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

// =============================================
// WEBHOOK DOĞRULAMA (Meta bunu ister)
// =============================================
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === 'gizli123') {
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Unauthorized', { status: 403 })
}

// =============================================
// GELEN MESAJI İŞLE
// =============================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Meta'nın gönderdiği mesaj yapısını aç
    const entry = body.entry?.[0]
    const changes = entry?.changes?.[0]
    const value = changes?.value
    const messages = value?.messages

    // Mesaj yoksa (okundu bildirimi vb.) geç
    if (!messages || messages.length === 0) {
      return NextResponse.json({ status: 'ok' })
    }

    const message = messages[0]
    const fromNumber = message.from
    const toNumber = value.metadata.display_phone_number
    console.log('Gelen numara:', fromNumber)
    console.log('Bot numarası:', toNumber)
    const messageText = message.text?.body

    // Sadece metin mesajlarını işle
    if (!messageText) {
      return NextResponse.json({ status: 'ok' })
    }

    // 1. Bu numaraya sahip kliniği bul
    const tenant = await getTenantByWhatsappNumber(toNumber)
    if (!tenant) {
      console.error('Klinik bulunamadı:', toNumber)
      return NextResponse.json({ status: 'ok' })
    }

    // 2. Hastayı bul veya oluştur
    const patient = await findOrCreatePatient(tenant.id, fromNumber)
    if (!patient) return NextResponse.json({ status: 'ok' })

    // 3. Aktif konuşmayı getir
    const conversation = await getOrCreateConversation(tenant.id, patient.id)
    if (!conversation) return NextResponse.json({ status: 'ok' })

    // 4. Mesajı konuşmaya ekle
    const updatedMessages = await addMessageToConversation(
      conversation.id,
      'user',
      messageText
    )

    // 5. AI'dan yanıt al
    const aiReply = await generateAIResponse({
      tenant,
      patient,
      conversationHistory: updatedMessages,
      userMessage: messageText,
    })

    // 6. AI yanıtını konuşmaya kaydet
    await addMessageToConversation(conversation.id, 'assistant', aiReply)

    // 7. WhatsApp'tan hastaya gönder
    await sendWhatsAppMessage({
      to: fromNumber,
      message: aiReply,
      phoneId: tenant.whatsapp_phone_id,
      token: tenant.whatsapp_token,
    })

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('Webhook hatası:', error)
    // Meta 5xx alırsa tekrar gönderir, 200 dön
    return NextResponse.json({ status: 'ok' })
  }
}
