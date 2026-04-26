import { describe, it, expect } from 'vitest';
import { translations } from '../translations';

const { en, pt } = translations;

describe('Translation keys', () => {
  describe('loadLabel key (fix: t("load") -> t("loadLabel"))', () => {
    it('exists in EN translations', () => {
      expect(en.loadLabel).toBeDefined();
      expect(typeof en.loadLabel).toBe('string');
      expect(en.loadLabel.length).toBeGreaterThan(0);
    });

    it('exists in PT translations', () => {
      expect(pt.loadLabel).toBeDefined();
      expect(typeof pt.loadLabel).toBe('string');
      expect(pt.loadLabel.length).toBeGreaterThan(0);
    });
  });

  describe('Physical capacity keys', () => {
    const capacityKeys = ['strength', 'velocity', 'reactionSpeed', 'endurance'] as const;

    capacityKeys.forEach(key => {
      it(`"${key}" exists in EN translations`, () => {
        expect((en as Record<string, string>)[key]).toBeDefined();
        expect((en as Record<string, string>)[key].length).toBeGreaterThan(0);
      });

      it(`"${key}" exists in PT translations`, () => {
        expect((pt as Record<string, string>)[key]).toBeDefined();
        expect((pt as Record<string, string>)[key].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Physical capacity UI keys', () => {
    const uiKeys = ['selectPhysicalCapacity', 'general'] as const;

    uiKeys.forEach(key => {
      it(`"${key}" exists in EN translations`, () => {
        expect((en as Record<string, string>)[key]).toBeDefined();
      });

      it(`"${key}" exists in PT translations`, () => {
        expect((pt as Record<string, string>)[key]).toBeDefined();
      });
    });
  });

  describe('EN and PT parity for key capacity/UI keys', () => {
    const allKeys = ['loadLabel', 'velocity', 'general', 'selectPhysicalCapacity', 'strength', 'reactionSpeed', 'endurance'] as const;

    allKeys.forEach(key => {
      it(`"${key}" is present in both EN and PT`, () => {
        expect((en as Record<string, string>)[key]).toBeDefined();
        expect((pt as Record<string, string>)[key]).toBeDefined();
      });
    });
  });
});
