export const PRIVACY_NOTICE_VERSION='2026-10-09'
export function hasPrivacyConsent(form:FormData){
 return form.get('privacy_consent')===PRIVACY_NOTICE_VERSION
}

