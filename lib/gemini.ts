import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GenerateParams {
  tenant: any
  patient: any
  conversationHistory: { role: string; content: string }[]
  userMessage: string
}

export async function generateAIResponse({
  tenant,
  patient,
  conversationHistory,
  userMessage,
}: GenerateParams): Promise<string> {

  const systemPrompt = buildSystemPrompt(tenant, patient)

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    })

    // Konuşma geçmişini Gemini formatına çevir
    const history = conversationHistory.slice(-10).map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(userMessage)
    return result.response.text()

  } catch (error) {
    console.error('Gemini hatası:', error)
    return 'Şu an teknik bir sorun yaşıyoruz. Lütfen birkaç dakika sonra tekrar deneyin.'
  }
}

function buildSystemPrompt(tenant: any, patient: any): string {
  const patientName = patient.name ? `Hastanın adı: ${patient.name}` : 'Henüz hasta adı bilinmiyor'

  const hours = tenant.working_hours
  const hoursText = Object.entries(hours)
    .map(([day, times]: [string, any]) => {
      const dayTr: Record<string, string> = {
        monday: 'Pazartesi', tuesday: 'Salı', wednesday: 'Çarşamba',
        thursday: 'Perşembe', friday: 'Cuma', saturday: 'Cumartesi', sunday: 'Pazar'
      }
      if (!times) return `${dayTr[day]}: Kapalı`
      return `${dayTr[day]}: ${times.open} - ${times.close}`
    })
    .join('\n')

  const services = Array.isArray(tenant.services)
    ? tenant.services.join(', ')
    : tenant.services

  return `
Sen ${tenant.business_name} kliniğinin WhatsApp asistanısın.

${tenant.ai_prompt}

HAKKINDA BİLGİ:
- Klinik adı: ${tenant.business_name}
- Sunulan hizmetler: ${services}
- ${patientName}

ÇALIŞMA SAATLERİ:
${hoursText}

KURALLAR:
1. Türkçe konuş, nazik ve profesyonel ol
2. Randevu almak isteyenlere tarih ve saat sor
3. Çalışma saatleri dışına randevu verme
4. Bilmediğin sorularda "kliniği arayabilirsiniz" de
5. Yanıtlarını kısa tut (maksimum 3-4 cümle)
6. Randevu onayladığında şu formatta yaz:
   RANDEVU_ONAYI: [tarih] [saat] [hizmet]

Şu an Türkiye saatiyle ${new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}.
`.trim()
}
