interface SendMessageParams {
  to: string       // "905321234567"
  message: string
  phoneId: string  // Meta phone ID
  token: string    // Meta API token
}

export async function sendWhatsAppMessage({
  to,
  message,
  phoneId,
  token,
}: SendMessageParams) {
  const url = `https://graph.facebook.com/v19.0/${phoneId}/messages`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    console.error('WhatsApp gönderme hatası:', error)
    throw new Error('WhatsApp mesajı gönderilemedi')
  }

  return response.json()
}

// Hatırlatma mesajı gönder
export async function sendReminderMessage({
  to,
  patientName,
  businessName,
  date,
  time,
  service,
  phoneId,
  token,
}: {
  to: string
  patientName: string
  businessName: string
  date: string
  time: string
  service: string
  phoneId: string
  token: string
}) {
  const name = patientName || 'Sayın Hastamız'
  const message = `Merhaba ${name} 👋

*${businessName}* olarak yarınki randevunuzu hatırlatmak istedik.

📅 Tarih: ${date}
🕐 Saat: ${time}
🦷 Hizmet: ${service}

Randevunuzu iptal etmek veya ertelemek isterseniz bu mesajı yanıtlayabilirsiniz.

Görüşmek üzere! 😊`

  return sendWhatsAppMessage({ to, message, phoneId, token })
}
