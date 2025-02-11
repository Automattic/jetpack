export declare global {
	interface Window {
		translation?: {
			canTranslate: ( options: {
				sourceLanguage: string;
				targetLanguage: string;
			} ) => Promise< 'no' | 'yes' | string >;
			createTranslator: ( options: {
				sourceLanguage: string;
				targetLanguage: string;
			} ) => Promise< {
				translate: ( text: string ) => Promise< string >;
			} >;
		};
		ai?: {
			languageDetector: {
				create: () => Promise< {
					detect: ( text: string ) => Promise<
						{
							detectedLanguage: string;
							confidence: number;
						}[]
					>;
				} >;
			};
		};
	}
}
