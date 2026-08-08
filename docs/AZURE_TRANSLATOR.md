# Azure Translator setup

Add these backend environment variables in Vercel Project Settings → Environment Variables:

- `AZURE_TRANSLATOR_KEY` — your Azure Translator resource key.
- `AZURE_TRANSLATOR_REGION` — the Azure resource region. Leave blank only when your Azure resource is global.
- `AZURE_TRANSLATOR_ENDPOINT` — normally `https://api.cognitive.microsofttranslator.com`.

The secret key is used only by the backend route `/api/translator/translate`; it is never exposed in frontend JavaScript.

The selector offers 240 country/language locale choices. Several countries may map to the same Azure translation language. The exact translation languages available are controlled by the Azure Translator service.
