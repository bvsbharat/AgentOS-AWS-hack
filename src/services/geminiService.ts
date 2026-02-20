import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini Service for Image Generation
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
  }

  async generateImage(prompt: string, options: {
    width?: number;
    height?: number;
    style?: 'photorealistic' | 'digital-art' | 'sketch' | '3d-render';
  } = {}): Promise<string | null> {
    try {
      const enhancedPrompt = this.enhancePrompt(prompt, options.style);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE'],
        }
      });

      const response = await result.response;
      
      // Extract image data from response
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Gemini image generation error:', error);
      // Return placeholder for demo
      return this.getPlaceholderImage(prompt);
    }
  }

  async generateSocialMediaImages(productName: string, campaignTheme: string): Promise<{
    heroImage: string | null;
    instagramPost: string | null;
    twitterCard: string | null;
    logoConcept: string | null;
  }> {
    try {
      const [heroImage, instagramPost, twitterCard, logoConcept] = await Promise.all([
        this.generateImage(
          `Hero image for ${productName}: ${campaignTheme}. Modern, eye-catching, professional marketing visual.`,
          { style: 'digital-art', width: 1920, height: 1080 }
        ),
        this.generateImage(
          `Instagram post for ${productName}: ${campaignTheme}. Square format, trendy aesthetic, engaging visual.`,
          { style: 'digital-art', width: 1080, height: 1080 }
        ),
        this.generateImage(
          `Twitter card for ${productName}: ${campaignTheme}. Wide format, attention-grabbing header image.`,
          { style: 'digital-art', width: 1200, height: 600 }
        ),
        this.generateImage(
          `Modern minimalist logo concept for ${productName}. Clean, memorable, scalable design.`,
          { style: '3d-render', width: 1024, height: 1024 }
        )
      ]);

      return { heroImage, instagramPost, twitterCard, logoConcept };
    } catch (error) {
      console.error('Social media image generation error:', error);
      return {
        heroImage: this.getPlaceholderImage('hero'),
        instagramPost: this.getPlaceholderImage('instagram'),
        twitterCard: this.getPlaceholderImage('twitter'),
        logoConcept: this.getPlaceholderImage('logo')
      };
    }
  }

  async generateMarketingVisuals(
    productDescription: string,
    targetAudience: string,
    platform: 'instagram' | 'twitter' | 'linkedin' | 'producthunt'
  ): Promise<string | null> {
    const platformSpecs: Record<string, { width: number; height: number; style: any }> = {
      instagram: { width: 1080, height: 1080, style: 'digital-art' },
      twitter: { width: 1200, height: 675, style: 'digital-art' },
      linkedin: { width: 1200, height: 627, style: 'photorealistic' },
      producthunt: { width: 1270, height: 760, style: '3d-render' }
    };

    const specs = platformSpecs[platform];
    
    const prompt = `Marketing visual for: ${productDescription}. 
      Target audience: ${targetAudience}. 
      Platform-optimized for ${platform}.
      Professional, engaging, shareable content.`;

    return this.generateImage(prompt, specs);
  }

  private enhancePrompt(prompt: string, style?: string): string {
    const styleModifiers: Record<string, string> = {
      'photorealistic': 'highly detailed, photorealistic, 8k quality, professional photography',
      'digital-art': 'digital art, vibrant colors, modern aesthetic, clean composition',
      'sketch': 'hand-drawn sketch, artistic, pencil/ink style, conceptual',
      '3d-render': '3D render, cinematic lighting, professional visualization, polished'
    };

    const modifier = style ? styleModifiers[style] : styleModifiers['digital-art'];
    return `${prompt}. ${modifier}. No text, no watermarks, high quality.`;
  }

  private getPlaceholderImage(type: string): string {
    // Return colored placeholder SVG for demo
    const colors: Record<string, string> = {
      hero: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      instagram: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      twitter: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      logo: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
    };

    const color = colors[type] || colors.hero;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${color.includes('667eea') ? '#667eea' : color.includes('f093fb') ? '#f093fb' : color.includes('4facfe') ? '#4facfe' : '#43e97b'};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${color.includes('764ba2') ? '#764ba2' : color.includes('f5576c') ? '#f5576c' : color.includes('00f2fe') ? '#00f2fe' : '#38f9d7'};stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
        <text x="50%" y="50%" font-family="Arial" font-size="24" fill="white" text-anchor="middle" dy=".3em">
          ${type.toUpperCase()} IMAGE
        </text>
        <text x="50%" y="65%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" opacity="0.8">
          Configure Gemini API for actual generation
        </text>
      </svg>
    `)}`;
  }
}

export const geminiService = new GeminiService();
