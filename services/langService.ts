import * as OpenCC from 'opencc-js';

export type Language = '繁體' | '簡體';

class LangService {
  private converterToSimplified = OpenCC.Converter({ from: 'tw', to: 'cn' });
  private converterToTraditional = OpenCC.Converter({ from: 'cn', to: 'tw' });

  getLanguage(): Language {
    return (localStorage.getItem('language') as Language) || '繁體';
  }

  setLanguage(lang: Language) {
    localStorage.setItem('language', lang);
    console.log("Language switched to " + lang);
  }

  t(text: string | undefined | null): string {
    if (!text) return '';
    const currentLang = this.getLanguage();
    if (currentLang === '簡體') {
      return this.converterToSimplified(text);
    }
    // Assuming source strings in code are already Traditional
    return text;
  }
}

export const langService = new LangService();
