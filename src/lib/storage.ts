import type { EventSet } from '@/types/event';

const STORAGE_KEY = 'promolingo_events';

export function getEventSets(): EventSet[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

export function getEventSet(id: string): EventSet | null {
  const sets = getEventSets();
  return sets.find((s) => s.id === id) || null;
}

export function saveEventSet(eventSet: EventSet): void {
  const sets = getEventSets();
  const index = sets.findIndex((s) => s.id === eventSet.id);
  if (index >= 0) {
    sets[index] = { ...eventSet, updatedAt: new Date().toISOString() };
  } else {
    sets.push(eventSet);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function deleteEventSet(id: string): void {
  const sets = getEventSets().filter((s) => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
