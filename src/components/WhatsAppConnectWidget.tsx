import React, { useState, useEffect } from 'react';
import { useSchool } from '../context/SchoolContext';
import {
  WhatsAppLogoIcon,
  PLATFORM_OWNER_WHATSAPP_RAW,
  PLATFORM_OWNER_WHATSAPP_DISPLAY,
  buildWhatsAppUrl,
  getSchoolWhatsAppContact,
} from '../utils/whatsapp';
import { X, ExternalLink, Building2, ShieldCheck } from 'lucide-react';

type RecipientTarget = 'platform_owner' | 'school_owner';

export const WhatsAppConnectWidget: React.FC = () => {
  const { school, schools, isAuthenticated } = useSchool();
  const [isOpen, setIsOpen] = useState(false);

  const hasSchools = schools.length > 0;
  const schoolContact = hasSchools
    ? getSchoolWhatsAppContact(school)
    : { enabled: false, rawNumber: '', digits: '' };
  const hasDistinctSchoolWhatsApp =
    schoolContact.enabled && schoolContact.digits !== '233207615941';

  const [recipient, setRecipient] = useState<RecipientTarget>('platform_owner');
  const [messageText, setMessageText] = useState<string>('');

  // Keep recipient valid if active school disables WhatsApp or no schools exist
  useEffect(() => {
    if (recipient === 'school_owner' && !schoolContact.enabled) {
      setRecipient('platform_owner');
    }
  }, [recipient, schoolContact.enabled]);

  const defaultMessage =
    recipient === 'platform_owner'
      ? hasSchools
        ? `Hello Platform Owner, I am visiting EduGhana SIS (${school.name}) and would like to inquire about onboarding or platform services.`
        : `Hello Platform Owner, I am visiting EduGhana SIS and would like to inquire about registering a school/institute or platform services.`
      : `Hello ${school.name} Administration, I am reaching out from your EduGhana SIS portal regarding admissions, programmes, or institutional inquiries.`;

  const activePhone =
    recipient === 'platform_owner' ? PLATFORM_OWNER_WHATSAPP_RAW : schoolContact.rawNumber;

  const finalMessage = messageText.trim() || defaultMessage;
  const whatsappHref = buildWhatsAppUrl(activePhone, finalMessage);

  const quickTopics =
    recipient === 'platform_owner'
      ? [
          'Register my school or institute',
          'Platform pricing & custom modules',
          'Technical support inquiry',
        ]
      : [
          `Admissions & enrollment at ${school.code}`,
          'Fee schedule & payment inquiry',
          'Certificate / transcript verification',
        ];

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end print:hidden">
      {/* Expanded WhatsApp Direct Connect Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Send WhatsApp Message"
          className="mb-3 w-[calc(100vw-2.5rem)] max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-xs text-slate-200"
        >
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3.5 flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-2.5 min-w-0">
              <WhatsAppLogoIcon className="w-5 h-5 text-[#25D366] shrink-0" />
              <div className="min-w-0">
                <h3 className="font-bold text-sm text-white truncate">WhatsApp Direct Desk</h3>
                <p className="text-[11px] text-emerald-100/90 truncate">
                  Message the Platform Owner or School Owner
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-emerald-100 hover:text-white hover:bg-black/20 transition cursor-pointer shrink-0"
              aria-label="Close WhatsApp Desk"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3.5">
            {/* Recipient Selector Tabs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                Choose Recipient
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setRecipient('platform_owner');
                    setMessageText('');
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-semibold transition cursor-pointer whitespace-nowrap ${
                    recipient === 'platform_owner'
                      ? 'bg-[#128C7E] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Platform Owner</span>
                </button>

                <button
                  type="button"
                  disabled={!schoolContact.enabled}
                  onClick={() => {
                    if (schoolContact.enabled) {
                      setRecipient('school_owner');
                      setMessageText('');
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-semibold transition whitespace-nowrap ${
                    !schoolContact.enabled
                      ? 'opacity-40 cursor-not-allowed text-slate-500'
                      : recipient === 'school_owner'
                      ? 'bg-[#128C7E] text-white cursor-pointer'
                      : 'text-slate-400 hover:text-white cursor-pointer'
                  }`}
                  title={
                    !hasSchools
                      ? 'No school registered yet'
                      : schoolContact.enabled
                      ? `Message ${school.name} Owner`
                      : 'This school has not enabled WhatsApp messaging'
                  }
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{hasSchools ? `${school.code} Owner` : 'School Owner'}</span>
                </button>
              </div>
            </div>

            {/* Active Contact Card with 1-Click Direct WhatsApp Logo Link */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-white truncate">
                  {recipient === 'platform_owner'
                    ? 'Platform Owner · EduGhana SIS'
                    : `${school.name}`}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {recipient === 'platform_owner'
                    ? 'School Onboarding & Platform Inquiries'
                    : `Owner / Head: ${school.headmasterName}`}
                </p>
                <p className="text-[11px] font-mono tabular-nums text-[#25D366] mt-0.5">
                  {recipient === 'platform_owner'
                    ? PLATFORM_OWNER_WHATSAPP_DISPLAY
                    : schoolContact.rawNumber}
                  {recipient === 'school_owner' && !hasDistinctSchoolWhatsApp && (
                    <span className="text-slate-500 font-sans"> · Direct Line</span>
                  )}
                </p>
              </div>

              <a
                href={buildWhatsAppUrl(activePhone)}
                target="_blank"
                rel="noopener noreferrer"
                title="Open WhatsApp Chat Directly"
                className="w-10 h-10 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 flex items-center justify-center transition shrink-0 shadow-sm"
              >
                <WhatsAppLogoIcon className="w-5 h-5" />
              </a>
            </div>

            {/* Quick Inquiry Starters */}
            <div className="space-y-1.5">
              <span className="block text-[11px] text-slate-400 font-medium">
                Quick message topic (optional):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {quickTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() =>
                      setMessageText(
                        recipient === 'platform_owner'
                          ? `Hello Platform Owner, I would like assistance with: ${topic}.`
                          : `Hello ${school.name}, I am inquiring about: ${topic}.`
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition cursor-pointer text-left"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Your WhatsApp Message
              </label>
              <textarea
                rows={3}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={defaultMessage}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#25D366] resize-none"
              />
            </div>

            {/* Primary Launch Link */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md whitespace-nowrap"
            >
              <WhatsAppLogoIcon className="w-4 h-4 shrink-0" />
              <span>
                {recipient === 'platform_owner'
                  ? `Send WhatsApp (${PLATFORM_OWNER_WHATSAPP_DISPLAY})`
                  : `WhatsApp ${school.code} Owner`}
              </span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>

            {isAuthenticated && (
              <p className="text-[10px] text-slate-500 text-center">
                School owners can customize their WhatsApp number in School Settings.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Floating WhatsApp Logo Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Contact on WhatsApp"
        title={
          hasSchools
            ? `WhatsApp Platform Owner (${PLATFORM_OWNER_WHATSAPP_DISPLAY}) or ${school.name}`
            : `WhatsApp Platform Owner (${PLATFORM_OWNER_WHATSAPP_DISPLAY})`
        }
        className="flex items-center gap-2.5 py-2.5 px-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-xs shadow-xl transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#25D366]"
      >
        <WhatsAppLogoIcon className="w-5 h-5 shrink-0" />
        <span className="whitespace-nowrap">WhatsApp Us</span>
      </button>
    </div>
  );
};
