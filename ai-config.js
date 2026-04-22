// Configuración de la IA de DECA Coop de Barranquitas
// IMPORTANTE: En producción, la API Key debe estar en el servidor, NO en el cliente

const AI_CONFIG = {
  // API Key de OpenAI (deshabilitada - se usa ChatGPT directo)
  apiKey: '', // Dejado vacío intencionalmente
  
  // ID del GPT personalizado de DECA Coop de Barranquitas
  gptId: 'g-69846cf9e5488191a673f07dedddb4f9',
  
  // Modelo a usar
  model: 'gpt-4o',
  
  // URL de la API
  apiUrl: 'https://api.openai.com/v1/chat/completions',
  
  // Función para obtener los productos (se ejecuta cuando se necesita el prompt)
  getProducts: function() {
    // Intentar obtener candies del ámbito global si está disponible
    if (typeof candies !== 'undefined' && Array.isArray(candies)) {
      return candies;
    }
    // Intentar desde localStorage
    try {
      const stored = localStorage.getItem('deca_products');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {}
    return [];
  },
  
  // Configuración del sistema (personalidad de la IA)
  getSystemPrompt: function() {
    const products = this.getProducts();
    const productsJson = products.length > 0 ? JSON.stringify(products, null, 2) : 'No hay productos disponibles';
    
    return `Eres la IA de DECA Coop de Barranquitas, un asistente virtual amigable y útil para la tienda de dulces de la Escuela Superior Vocacional Pablo Colón Berdecia.

Tu personalidad:
- Amigable, entusiasta y juvenil
- Usas emojis de forma natural 🍬🍫🍭
- Hablas en español de Puerto Rico
- Eres experto en dulces, snacks y bebidas

Tus funciones:
- Ayudar a encontrar productos
- Dar recomendaciones personalizadas
- Informar sobre precios y ofertas
- Responder preguntas sobre la tienda
- Ser divertido y crear una experiencia agradable

Productos disponibles en la tienda:
${productsJson}

Siempre sé breve, claro y útil. Si no sabes algo, sé honesto pero mantén el tono positivo.`;
  },
  
  // Configuración de la conversación
  maxTokens: 500,
  temperature: 0.7,
  
  // Historial de conversación (se guarda en memoria)
  conversationHistory: []
};

// Función para verificar si la API Key está configurada
function isAPIConfigured() {
  return AI_CONFIG.apiKey && AI_CONFIG.apiKey !== 'TU_API_KEY_AQUI';
}

// Función para obtener el system prompt actualizado con productos
function getSystemPrompt() {
  return AI_CONFIG.getSystemPrompt();
}

