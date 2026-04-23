import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, FileText, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTranslation } from '../../hooks/useTranslation';
import { useAthleteNotes } from '../../hooks/useAthleteNotes';
import { getTodayDateString, parseDate } from '../../lib/utils';
import type { Goalkeeper, TrainingSession } from '../../types';

interface AthleteNotesProps {
  goalkeeper: Goalkeeper;
  sessions: TrainingSession[];
}

type NoteCategory = 'technical' | 'tactical' | 'behavioral' | 'medical';

interface FeedItem {
  id: string;
  type: 'note' | 'observation';
  date: string;
  category?: NoteCategory;
  text: string;
  interventionType?: string;
  sessionTitle?: string;
  createdAt: string;
}

const categoryConfig: Record<NoteCategory, { color: string; bg: string }> = {
  technical: { color: 'text-blue-700', bg: 'bg-blue-500/10' },
  tactical: { color: 'text-green-700', bg: 'bg-green-500/10' },
  behavioral: { color: 'text-amber-700', bg: 'bg-amber-500/10' },
  medical: { color: 'text-red-700', bg: 'bg-red-500/10' },
};

export const AthleteNotes: React.FC<AthleteNotesProps> = ({ goalkeeper, sessions }) => {
  const { t } = useTranslation();
  const { notes, loading, fetchNotes, addNote, deleteNote } = useAthleteNotes();

  // Form state
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState<NoteCategory>('technical');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchNotes(goalkeeper.id);
  }, [goalkeeper.id, fetchNotes]);

  // Merge notes + session observations into a single feed
  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    // Standalone notes
    notes.forEach(note => {
      items.push({
        id: note.id,
        type: 'note',
        date: note.date,
        category: note.category,
        text: note.text,
        createdAt: note.created_at,
      });
    });

    // Session athlete observations
    sessions.forEach(session => {
      if (!session.athleteObservations) return;
      session.athleteObservations
        .filter(obs => obs.athleteId === goalkeeper.id)
        .forEach((obs, i) => {
          items.push({
            id: `obs-${session.id}-${i}`,
            type: 'observation',
            date: session.date,
            text: obs.text,
            interventionType: obs.interventionType,
            sessionTitle: (session.titles || []).map(t_ => t(t_)).join(' + '),
            createdAt: session.date,
          });
        });
    });

    // Sort by date descending
    items.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
    return items;
  }, [notes, sessions, goalkeeper.id, t]);

  const handleSubmit = async () => {
    if (!noteText.trim()) return;
    await addNote({
      goalkeeper_id: goalkeeper.id,
      date: getTodayDateString(),
      category: noteCategory,
      text: noteText.trim(),
    });
    setNoteText('');
    setIsAdding(false);
  };

  const handleDelete = (noteId: string) => {
    if (window.confirm(t('deleteNoteConfirm') || 'Tem a certeza que quer apagar esta nota?')) {
      deleteNote(noteId);
    }
  };

  return (
    <div className="space-y-5">
      {/* Add note button / form */}
      {!isAdding ? (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full bg-surface rounded-xl border border-dashed border-black/[0.12] p-4 flex items-center justify-center gap-2 text-on-surface-variant hover:border-accent hover:text-accent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-semibold">{t('addNote') || 'Adicionar Nota'}</span>
        </button>
      ) : (
        <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
            <div className="w-1 h-5 rounded-full bg-accent" />
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('addNote') || 'Nova Nota'}</span>
          </div>
          <div className="p-5 space-y-3">
            {/* Category selector */}
            <div className="flex gap-2">
              {(['technical', 'tactical', 'behavioral', 'medical'] as NoteCategory[]).map(cat => (
                <button
                  key={cat}
                  onClick={() => setNoteCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                    noteCategory === cat
                      ? "bg-accent text-white"
                      : "bg-background border border-black/[0.08] text-on-surface-variant hover:border-black/[0.15]"
                  )}
                >
                  {t(cat)}
                </button>
              ))}
            </div>

            {/* Note text */}
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={t('notePlaceholder') || 'Escrever nota...'}
              className="w-full bg-background border border-black/[0.1] rounded-lg px-3 py-2.5 text-sm min-h-[80px] resize-none focus:border-accent outline-none"
              autoFocus
            />

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setIsAdding(false); setNoteText(''); }}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-on-surface-variant hover:bg-black/[0.03] transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={!noteText.trim()}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-accent text-white disabled:opacity-40 hover:brightness-110 transition-all"
              >
                {t('save') || 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feed */}
      <div className="bg-surface rounded-xl border border-black/[0.08] overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 bg-black/[0.02] border-b border-black/[0.06]">
          <div className="w-1 h-5 rounded-full bg-purple-500" />
          <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">{t('notes') || 'Notas'} ({feed.length})</span>
        </div>

        {feed.length > 0 ? (
          <div className="divide-y divide-black/[0.04]">
            {feed.map(item => (
              <div key={item.id} className="px-5 py-4 hover:bg-black/[0.01] transition-colors">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn(
                    "p-1.5 rounded-lg shrink-0 mt-0.5",
                    item.type === 'note' ? "bg-accent/10" : "bg-on-surface-variant/10"
                  )}>
                    {item.type === 'note' ? (
                      <FileText className="w-3.5 h-3.5 text-accent" />
                    ) : (
                      <MessageSquare className="w-3.5 h-3.5 text-on-surface-variant" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {/* Type label */}
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase">
                        {item.type === 'note' ? (t('coachNote') || 'Nota') : (t('sessionObservation') || 'Obs. Sessão')}
                      </span>

                      {/* Category badge */}
                      {item.category && (
                        <span className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full",
                          categoryConfig[item.category].bg,
                          categoryConfig[item.category].color
                        )}>
                          {t(item.category)}
                        </span>
                      )}

                      {/* Intervention type */}
                      {item.interventionType && (
                        <span className="text-[9px] font-medium text-on-surface-variant bg-background px-2 py-0.5 rounded">
                          {t(item.interventionType)}
                        </span>
                      )}

                      {/* Session title */}
                      {item.sessionTitle && (
                        <span className="text-[9px] text-on-surface-variant truncate">
                          — {item.sessionTitle}
                        </span>
                      )}

                      {/* Date */}
                      <span className="text-[10px] text-on-surface-variant/60 ml-auto shrink-0">
                        {parseDate(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                      </span>
                    </div>

                    <p className="text-sm text-on-surface leading-relaxed">{item.text}</p>
                  </div>

                  {/* Delete (only for standalone notes) */}
                  {item.type === 'note' && (
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 rounded-lg text-on-surface-variant/30 hover:text-error hover:bg-error/5 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-on-surface-variant">
            <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('noNotesYet') || 'Sem notas ainda.'}</p>
          </div>
        )}
      </div>
    </div>
  );
};
