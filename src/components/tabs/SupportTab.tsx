import React, { useState } from 'react';
import { HelpCircle, ChevronDown, Mail, BookOpen, Shield } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';

export const SupportTab: React.FC = () => {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqItems = [
    { question: t('faq1Question'), answer: t('faq1Answer') },
    { question: t('faq2Question'), answer: t('faq2Answer') },
    { question: t('faq3Question'), answer: t('faq3Answer') },
    { question: t('faq4Question'), answer: t('faq4Answer') },
    { question: t('faq5Question'), answer: t('faq5Answer') },
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <HelpCircle className="w-7 h-7 text-primary" />
        <h1 className="font-headline text-2xl text-on-surface font-bold">
          {t('supportHelp')}
        </h1>
      </div>

      {/* FAQ Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-primary" />
          <h2 className="font-headline text-sm text-on-surface font-semibold uppercase tracking-wide">
            {t('frequentlyAskedQuestions')}
          </h2>
        </div>

        {faqItems.map((item, index) => (
          <div
            key={index}
            className="bg-surface-container rounded-xl border border-black/5 overflow-hidden"
          >
            <button
              onClick={() => toggleFaq(index)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-black/[0.02] transition-colors"
            >
              <span className="text-on-surface font-medium text-sm pr-4">
                {item.question}
              </span>
              <ChevronDown
                className={cn(
                  'w-4 h-4 text-on-surface/50 shrink-0 transition-transform duration-200',
                  openIndex === index && 'rotate-180'
                )}
              />
            </button>

            <div
              className={cn(
                'grid transition-all duration-200 ease-in-out',
                openIndex === index
                  ? 'grid-rows-[1fr] opacity-100'
                  : 'grid-rows-[0fr] opacity-0'
              )}
            >
              <div className="overflow-hidden">
                <p className="px-5 pb-4 text-on-surface/70 text-sm leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Contact Section */}
      <div className="bg-surface-container rounded-xl border border-black/5 p-6 space-y-3">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-primary" />
          <h2 className="font-headline text-sm text-on-surface font-semibold uppercase tracking-wide">
            {t('contactUs')}
          </h2>
        </div>
        <p className="text-on-surface/70 text-sm">
          {t('needMoreHelp')}{' '}
          <a
            href="mailto:support@gklab.app"
            className="text-primary font-medium hover:underline"
          >
            support@gklab.app
          </a>
        </p>
      </div>

      {/* Version Footer */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Shield className="w-3.5 h-3.5 text-on-surface/30" />
        <p className="text-on-surface/40 text-xs text-center">
          {t('versionFooter')}
        </p>
      </div>
    </div>
  );
};
